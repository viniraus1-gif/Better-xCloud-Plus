#version 300 es

precision mediump float;
uniform sampler2D data;
uniform sampler2D previousData;
uniform sampler2D historyData;
uniform vec2 iResolution;
uniform vec2 iSourceResolution;

const int FILTER_UNSHARP_MASKING = 1;
const int FILTER_CAS = 2;

// constrast = 0.8
const float CAS_CONTRAST_PEAK = 0.8 * -3.0 + 8.0;

// Luminosity factor: https://www.w3.org/TR/AERT/#color-contrast
const vec3 LUMINOSITY_FACTOR = vec3(0.299, 0.587, 0.114);

uniform int filterId;
uniform bool qualityMode;
uniform float sharpenFactor;
uniform float brightness;
uniform float contrast;
uniform float saturation;
uniform float artifactReduction;
uniform bool generateFrame;
uniform float interpolation;
uniform bool adaptiveSharpen;
uniform bool dynamicReconstruction;
uniform bool temporalSuperResolution;
uniform bool hudProtection;
uniform float fineDetailReconstruction;
uniform int upscaleAlgorithm;
uniform int antiAliasing;
uniform bool hasPreviousFrame;

out vec4 fragColor;

float luma(vec3 color);

vec3 clarityBoost(sampler2D tex, vec2 coord, vec3 e) {
    vec2 texelSize = 1.0 / iSourceResolution.xy;

    // Load a collection of samples in a 3x3 neighorhood, where e is the current pixel.
    // a b c
    // d e f
    // g h i
    vec3 b = texture(tex, coord + texelSize * vec2(0, 1)).rgb;
    vec3 d = texture(tex, coord + texelSize * vec2(-1, 0)).rgb;
    vec3 f = texture(tex, coord + texelSize * vec2(1, 0)).rgb;
    vec3 h = texture(tex, coord + texelSize * vec2(0, -1)).rgb;

    vec3 a;
    vec3 c;
    vec3 g;
    vec3 i;

    if (filterId == FILTER_UNSHARP_MASKING || qualityMode) {
        a = texture(tex, coord + texelSize * vec2(-1, 1)).rgb;
        c = texture(tex, coord + texelSize * vec2(1, 1)).rgb;
        g = texture(tex, coord + texelSize * vec2(-1, -1)).rgb;
        i = texture(tex, coord + texelSize * vec2(1, -1)).rgb;
    }

    // USM
    if (filterId == FILTER_UNSHARP_MASKING) {
        vec3 gaussianBlur = (a + c + g + i) * 1.0 + (b + d + f + h) * 2.0 + e * 4.0;
        gaussianBlur /= 16.0;

        // Return edge detection
        return e + (e - gaussianBlur) * sharpenFactor / 3.0;
    }

    // CAS
    // Soft min and max.
    //  a b c             b
    //  d e f * 0.5  +  d e f * 0.5
    //  g h i             h
    // These are 2.0x bigger (factored out the extra multiply).
    vec3 minRgb = min(min(min(d, e), min(f, b)), h);
    vec3 maxRgb = max(max(max(d, e), max(f, b)), h);

    if (qualityMode) {
        minRgb += min(min(a, c), min(g, i));
        maxRgb += max(max(a, c), max(g, i));
    }

    // Smooth minimum distance to signal limit divided by smooth max.
    vec3 reciprocalMaxRgb = 1.0 / maxRgb;
    vec3 amplifyRgb = clamp(min(minRgb, 2.0 - maxRgb) * reciprocalMaxRgb, 0.0, 1.0);

    // Shaping amount of sharpening.
    amplifyRgb = inversesqrt(amplifyRgb);

    vec3 weightRgb = -(1.0 / (amplifyRgb * CAS_CONTRAST_PEAK));
    vec3 reciprocalWeightRgb = 1.0 / (4.0 * weightRgb + 1.0);

    //                0 w 0
    // Filter shape:  w 1 w
    //                0 w 0
    vec3 window = b + d + f + h;
    vec3 outColor = clamp((window * weightRgb + e) * reciprocalWeightRgb, 0.0, 1.0);

    return mix(e, outColor, sharpenFactor / 2.0);
}

// Spatial EASU/RCAS-style pass for the FSR 1 mode. It uses local luma
// gradients to steer reconstruction along edges, followed by conservative
// contrast restoration. It intentionally operates only on decoded video.
vec3 fsr1Upscale(sampler2D tex, vec2 uv) {
    vec2 t = 1.0 / iSourceResolution.xy;
    vec3 c = texture(tex, uv).rgb;
    vec3 n = texture(tex, uv + vec2(0.0, t.y)).rgb;
    vec3 s = texture(tex, uv - vec2(0.0, t.y)).rgb;
    vec3 e = texture(tex, uv + vec2(t.x, 0.0)).rgb;
    vec3 w = texture(tex, uv - vec2(t.x, 0.0)).rgb;
    float gx = abs(luma(e) - luma(w));
    float gy = abs(luma(n) - luma(s));
    vec3 directional = gx > gy ? (n + s) * 0.5 : (e + w) * 0.5;
    float edge = smoothstep(0.012, 0.14, max(gx, gy));
    vec3 easu = mix((n + s + e + w) * 0.25, directional, edge);
    vec3 rcas = c + (c - easu) * (0.22 + edge * 0.18);
    return clamp(mix(c, rcas, 0.82), 0.0, 1.0);
}

// Directional 6-tap reconstruction for the NIS mode. The strongest local
// gradient selects the tangent direction, avoiding blur across hard edges.
vec3 nisUpscale(sampler2D tex, vec2 uv) {
    vec2 t = 1.0 / iSourceResolution.xy;
    vec3 c = texture(tex, uv).rgb;
    vec3 n = texture(tex, uv + vec2(0.0, t.y)).rgb;
    vec3 s = texture(tex, uv - vec2(0.0, t.y)).rgb;
    vec3 e = texture(tex, uv + vec2(t.x, 0.0)).rgb;
    vec3 w = texture(tex, uv - vec2(t.x, 0.0)).rgb;
    vec3 ne = texture(tex, uv + t).rgb;
    vec3 sw = texture(tex, uv - t).rgb;
    float horizontalEdge = abs(luma(e) - luma(w));
    float verticalEdge = abs(luma(n) - luma(s));
    vec3 tangent = horizontalEdge > verticalEdge ? (n + s + ne + sw) * 0.25 : (e + w + ne + sw) * 0.25;
    float contrast = smoothstep(0.01, 0.16, max(horizontalEdge, verticalEdge));
    vec3 directional = mix((n + s + e + w) * 0.25, tangent, contrast);
    return clamp(c + (c - directional) * (0.42 + contrast * 0.32), 0.0, 1.0);
}

vec3 applyUpscaleAlgorithm(sampler2D tex, vec2 uv) {
    if (upscaleAlgorithm == 1) return fsr1Upscale(tex, uv);
    if (upscaleAlgorithm == 2) return nisUpscale(tex, uv);
    return texture(tex, uv).rgb;
}

// Small edge-aware spatial pass. It attenuates compression blocks in flat
// regions while preserving high-contrast edges; it is not temporal denoising.
vec3 reduceArtifacts(sampler2D tex, vec2 coord, vec3 center) {
    vec2 texel = 1.0 / iSourceResolution.xy;
    vec3 north = texture(tex, coord + vec2(0.0, texel.y)).rgb;
    vec3 south = texture(tex, coord - vec2(0.0, texel.y)).rgb;
    vec3 east = texture(tex, coord + vec2(texel.x, 0.0)).rgb;
    vec3 west = texture(tex, coord - vec2(texel.x, 0.0)).rgb;
    vec3 average = (north + south + east + west) * 0.25;
    float edge = length(center - average);
    float upscalePressure = max(iResolution.x / iSourceResolution.x, iResolution.y / iSourceResolution.y) - 1.0;
    float reconstructionBoost = dynamicReconstruction ? 1.0 + clamp(upscalePressure, 0.0, 2.0) * 0.35 : 1.0;
    float amount = artifactReduction * reconstructionBoost * (1.0 - smoothstep(0.025, 0.12, edge));
    return mix(center, average, amount * 0.45);
}

float luma(vec3 color) {
    return dot(color, LUMINOSITY_FACTOR);
}

// Fast local motion search. Keeping it to five candidates is intentional:
// generated frames must finish inside one refresh interval, otherwise an
// expensive per-pixel search causes the apparent FPS to stutter.
vec3 interpolateMotion(sampler2D previous, sampler2D current, vec2 uv) {
    vec2 texel = 2.0 / iSourceResolution.xy;
    float bestError = 1000.0;
    vec2 bestOffset = vec2(0.0);
    float currentCenter = luma(texture(current, uv).rgb);
    vec2 offsets[5] = vec2[5](vec2(0.0), vec2(-texel.x, 0.0), vec2(texel.x, 0.0), vec2(0.0, -texel.y), vec2(0.0, texel.y));
    for (int i = 0; i < 5; ++i) {
        vec2 offset = offsets[i];
        float error = abs(currentCenter - luma(texture(previous, uv + offset).rgb));
        if (error < bestError) {
            bestError = error;
            bestOffset = offset;
        }
    }
    vec3 previousWarped = texture(previous, uv + bestOffset * (1.0 - interpolation)).rgb;
    vec3 currentColor = texture(current, uv).rgb;
    // Reject unreliable matches (scene changes, HUD and fast/complex motion)
    // instead of blending them into visible double-image ghosting.
    float confidence = 1.0 - smoothstep(0.035, 0.12, bestError);
    vec3 interpolated = mix(previousWarped, currentColor, interpolation);
    // Optical-flow confidence can be low in compressed cloud-video frames.
    // Previously that case returned the newest frame unchanged, which made
    // every scheduled "generated" frame visually identical. Keep a temporal
    // blend as a fallback so each intermediate presentation has a distinct
    // position in time; the warped result takes over as confidence rises.
    vec3 temporalFallback = mix(texture(previous, uv).rgb, currentColor, interpolation);
    vec3 generatedColor = mix(temporalFallback, interpolated, confidence);
    vec2 hudTexel = 1.0 / iSourceResolution.xy;
    float localEdge = abs(luma(texture(current, uv + vec2(hudTexel.x, 0.0)).rgb) - luma(texture(current, uv - vec2(hudTexel.x, 0.0)).rgb))
        + abs(luma(texture(current, uv + vec2(0.0, hudTexel.y)).rgb) - luma(texture(current, uv - vec2(0.0, hudTexel.y)).rgb));
    float stableHud = hudProtection ? smoothstep(0.08, 0.22, localEdge) * (1.0 - smoothstep(0.01, 0.055, abs(luma(currentColor) - luma(texture(previous, uv).rgb)))) : 0.0;
    return mix(generatedColor, currentColor, stableHud);
}

// Two history frames are used only when their luminance agrees with the
// current frame. This is temporal stabilization, not a claim of server-side
// motion vectors or native-detail recovery.
vec3 temporalReconstruct(vec3 currentColor, vec2 uv) {
    if (!temporalSuperResolution || !hasPreviousFrame) return currentColor;
    vec3 previous = texture(previousData, uv).rgb;
    vec3 history = texture(historyData, uv).rgb;
    float delta = max(abs(luma(currentColor) - luma(previous)), abs(luma(currentColor) - luma(history)));
    float stability = 1.0 - smoothstep(0.018, 0.095, delta);
    vec3 temporalAverage = (currentColor * 0.65 + previous * 0.23 + history * 0.12);
    return mix(currentColor, temporalAverage, stability * 0.35);
}

// Detail reconstruction is a conservative, edge-gated high-frequency pass.
// It enhances information already present in the decoded frame rather than
// inventing texture detail that the stream never delivered.
vec3 reconstructFineDetails(sampler2D tex, vec2 uv, vec3 center) {
    if (fineDetailReconstruction <= 0.0) return center;
    vec2 texel = 1.0 / iSourceResolution.xy;
    vec3 north = texture(tex, uv + vec2(0.0, texel.y)).rgb;
    vec3 south = texture(tex, uv - vec2(0.0, texel.y)).rgb;
    vec3 east = texture(tex, uv + vec2(texel.x, 0.0)).rgb;
    vec3 west = texture(tex, uv - vec2(texel.x, 0.0)).rgb;
    vec3 localAverage = (north + south + east + west) * 0.25;
    vec3 detail = center - localAverage;
    float edgeMask = smoothstep(0.012, 0.10, length(detail));
    // Avoid amplifying strong ringing/compression edges indefinitely.
    float haloGuard = 1.0 - smoothstep(0.22, 0.52, length(detail));
    return clamp(center + detail * fineDetailReconstruction * edgeMask * haloGuard * 0.65, 0.0, 1.0);
}

vec3 applyFxaa(sampler2D tex, vec2 uv, vec3 color) {
    if (antiAliasing == 0) return color;
    vec2 t = 1.0 / iSourceResolution.xy;
    vec3 rgbNW = texture(tex, uv + vec2(-t.x, t.y)).rgb;
    vec3 rgbNE = texture(tex, uv + vec2(t.x, t.y)).rgb;
    vec3 rgbSW = texture(tex, uv + vec2(-t.x, -t.y)).rgb;
    vec3 rgbSE = texture(tex, uv + vec2(t.x, -t.y)).rgb;
    float lumaNW = luma(rgbNW);
    float lumaNE = luma(rgbNE);
    float lumaSW = luma(rgbSW);
    float lumaSE = luma(rgbSE);
    float lumaM = luma(color);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    vec2 dir = vec2(-((lumaNW + lumaNE) - (lumaSW + lumaSE)), ((lumaNW + lumaSW) - (lumaNE + lumaSE)));
    float reduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * 0.03125, 0.0078125);
    float directionScale = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
    float span = antiAliasing == 1 ? 4.0 : antiAliasing == 2 ? 8.0 : 12.0;
    dir = clamp(dir * directionScale, vec2(-span), vec2(span)) * t;
    vec3 rgbA = 0.5 * (texture(tex, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(tex, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (texture(tex, uv + dir * -0.5).rgb + texture(tex, uv + dir * 0.5).rgb);
    vec3 fxaa = (luma(rgbB) < lumaMin || luma(rgbB) > lumaMax) ? rgbA : rgbB;
    float blend = antiAliasing == 1 ? 0.55 : antiAliasing == 2 ? 0.8 : 1.0;
    return mix(color, fxaa, blend);
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    // Get current pixel
    vec3 color = generateFrame ? interpolateMotion(previousData, data, uv) : applyUpscaleAlgorithm(data, uv);

    if (artifactReduction > 0.0) {
        color = reduceArtifacts(data, uv, color);
    }

    color = temporalReconstruct(color, uv);
    color = reconstructFineDetails(data, uv, color);
    color = applyFxaa(data, uv, color);

    // Clarity boost
    if (sharpenFactor > 0.0) {
        float motion = hasPreviousFrame ? abs(luma(texture(data, uv).rgb) - luma(texture(previousData, uv).rgb)) : 0.0;
        float motionFactor = adaptiveSharpen ? 1.0 - smoothstep(0.025, 0.18, motion) * 0.75 : 1.0;
        color = clarityBoost(data, uv, color) * motionFactor + color * (1.0 - motionFactor);
    }

    // Saturation
    color = mix(vec3(dot(color, LUMINOSITY_FACTOR)), color, saturation);

    // Contrast
    color = contrast * (color - 0.5) + 0.5;

    // Brightness
    color = brightness * color;

    fragColor = vec4(color, 1.0);
}
