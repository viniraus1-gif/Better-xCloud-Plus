import { compressCodeFile } from "@macros/build" with { type: "macro" };

import { StreamPref } from "@/enums/pref-keys";
import { getStreamPref } from "@/utils/pref-utils";
import { BaseCanvasPlayer } from "../base-canvas-player";
import { StreamPlayerType, StreamVideoProcessingMode, VxFrameGenerationMode, VxUpscaleAlgorithm } from "@/enums/pref-values";


export class WebGL2Player extends BaseCanvasPlayer {
    private gl: WebGL2RenderingContext | null = null;
    private resources: Array<WebGLBuffer | WebGLTexture | WebGLProgram | WebGLShader | WebGLFramebuffer> = [];
    private program: WebGLProgram | null = null;
    private currentTexture: WebGLTexture | null = null;
    private previousTexture: WebGLTexture | null = null;
    private historyTexture: WebGLTexture | null = null;
    private copyFramebuffer: WebGLFramebuffer | null = null;
    private hasPreviousFrame = false;
    private generatedFrameIds: number[] = [];
    private lastSourceFrameAt = 0;
    private estimatedSourceFps = 60;
    private renderedFrameTimes: number[] = [];
    private textureWidth = 0;
    private textureHeight = 0;

    constructor($video: HTMLVideoElement) {
        super(StreamPlayerType.WEBGL2, $video, 'WebGL2Player');
    }

    private updateCanvas() {
        const gl = this.gl!;
        const program = this.program!;
        const filterId = this.toFilterId(this.options.processing);
        const latencyOptions = this.getLatencyProtectedOptions();

        this.syncOutputResolution();
        gl.viewport(0, 0, this.$canvas.width, this.$canvas.height);
        gl.uniform2f(gl.getUniformLocation(program, 'iResolution'), this.$canvas.width, this.$canvas.height);
        gl.uniform2f(gl.getUniformLocation(program, 'iSourceResolution'), this.$video.videoWidth, this.$video.videoHeight);

        gl.uniform1i(gl.getUniformLocation(program, 'filterId'), filterId);
        gl.uniform1i(gl.getUniformLocation(program, 'qualityMode'), this.options.processingMode === StreamVideoProcessingMode.QUALITY ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(program, 'sharpenFactor'), this.options.sharpness / (this.options.processingMode === StreamVideoProcessingMode.QUALITY ? 1 : 1.2));
        gl.uniform1f(gl.getUniformLocation(program, 'brightness'), this.options.brightness / 100);
        gl.uniform1f(gl.getUniformLocation(program, 'contrast'), this.options.contrast / 100);
        gl.uniform1f(gl.getUniformLocation(program, 'saturation'), this.options.saturation / 100);
        gl.uniform1f(gl.getUniformLocation(program, 'artifactReduction'), latencyOptions.artifactReduction / 100);
        gl.uniform1i(gl.getUniformLocation(program, 'antiAliasing'), latencyOptions.antiAliasing === 'fxaa-strong' ? 3 : latencyOptions.antiAliasing === 'fxaa-quality' ? 2 : latencyOptions.antiAliasing === 'fxaa' ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(program, 'generateFrame'), 0);
        gl.uniform1f(gl.getUniformLocation(program, 'interpolation'), 1);
        gl.uniform1i(gl.getUniformLocation(program, 'adaptiveSharpen'), this.options.vxAdaptiveSharpen ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(program, 'dynamicReconstruction'), this.options.vxDynamicReconstruction ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(program, 'temporalSuperResolution'), latencyOptions.temporalSuperResolution ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(program, 'hudProtection'), this.options.vxHudProtection ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(program, 'fineDetailReconstruction'), latencyOptions.fineDetailReconstruction / 100);
        gl.uniform1i(gl.getUniformLocation(program, 'upscaleAlgorithm'), this.options.vxUpscaleAlgorithm === VxUpscaleAlgorithm.FSR1 ? 1 : this.options.vxUpscaleAlgorithm === VxUpscaleAlgorithm.NIS ? 2 : 0);
        gl.uniform1i(gl.getUniformLocation(program, 'hasPreviousFrame'), this.hasPreviousFrame ? 1 : 0);
    }

    updateFrame() {
        if (!this.ensureTextureStorage()) {
            // Android WebView can create the player before the WebRTC video
            // has metadata. Wait for a real frame instead of allocating 0×0
            // history textures, which permanently breaks frame generation.
            return;
        }

        const now = performance.now();
        if (this.lastSourceFrameAt) {
            const instantaneousFps = 1000 / Math.max(1, now - this.lastSourceFrameAt);
            this.estimatedSourceFps = Math.min(120, Math.max(15, this.estimatedSourceFps * 0.8 + instantaneousFps * 0.2));
        }
        this.lastSourceFrameAt = now;

        const gl = this.gl!;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.$video);

        const multiplier = this.getFrameGenerationMultiplier();
        const shouldGenerate = this.hasPreviousFrame && multiplier > 1;
        this.cancelGeneratedFrames();
        if (shouldGenerate) {
            // Keep `previousTexture` intact until the generated frames have
            // been presented. Copying it here made both samplers point to the
            // newest source frame, so interpolation had nothing to generate.
            this.presentGeneratedFrames(multiplier, () => this.copyCurrentFrame());
        } else {
            this.renderTextureFrame(false, 1);
            this.copyCurrentFrame();
        }
        this.hasPreviousFrame = true;
    }

    /** Allocate frame-history textures only after the stream reports a size. */
    private ensureTextureStorage(): boolean {
        const gl = this.gl;
        const width = this.$video.videoWidth;
        const height = this.$video.videoHeight;
        if (!gl || !width || !height || !this.currentTexture || !this.previousTexture || !this.historyTexture) {
            return false;
        }

        if (this.textureWidth === width && this.textureHeight === height) {
            return true;
        }

        const allocate = (unit: number, texture: WebGLTexture) => {
            gl.activeTexture(unit);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
        };

        allocate(gl.TEXTURE0, this.currentTexture);
        allocate(gl.TEXTURE1, this.previousTexture);
        allocate(gl.TEXTURE2, this.historyTexture);
        this.textureWidth = width;
        this.textureHeight = height;
        this.hasPreviousFrame = false;
        this.updateCanvas();
        return true;
    }

    private renderTextureFrame(generated: boolean, interpolation: number) {
        const gl = this.gl!;
        const program = this.program!;
        const latencyOptions = this.getLatencyProtectedOptions();
        gl.useProgram(program);
        gl.uniform1i(gl.getUniformLocation(program, 'generateFrame'), generated ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(program, 'interpolation'), interpolation);
        gl.uniform1i(gl.getUniformLocation(program, 'adaptiveSharpen'), this.options.vxAdaptiveSharpen ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(program, 'dynamicReconstruction'), this.options.vxDynamicReconstruction ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(program, 'temporalSuperResolution'), latencyOptions.temporalSuperResolution ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(program, 'hudProtection'), this.options.vxHudProtection ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(program, 'fineDetailReconstruction'), latencyOptions.fineDetailReconstruction / 100);
        gl.uniform1f(gl.getUniformLocation(program, 'artifactReduction'), latencyOptions.artifactReduction / 100);
        gl.uniform1i(gl.getUniformLocation(program, 'antiAliasing'), latencyOptions.antiAliasing === 'fxaa-strong' ? 3 : latencyOptions.antiAliasing === 'fxaa-quality' ? 2 : latencyOptions.antiAliasing === 'fxaa' ? 1 : 0);
        gl.uniform1i(gl.getUniformLocation(program, 'hasPreviousFrame'), this.hasPreviousFrame ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        this.recordLocalRender();
    }

    private recordLocalRender() {
        const now = performance.now();
        this.renderedFrameTimes.push(now);
        while (this.renderedFrameTimes[0] < now - 1000) {
            this.renderedFrameTimes.shift();
        }
    }

    getLocalRenderFps(): number | null {
        const now = performance.now();
        while (this.renderedFrameTimes[0] < now - 1000) {
            this.renderedFrameTimes.shift();
        }
        return this.renderedFrameTimes.length || null;
    }

    private getFrameGenerationMultiplier() {
        const maxMultiplier = this.options.vxFrameGeneration === VxFrameGenerationMode.X4 ? 4
            : this.options.vxFrameGeneration === VxFrameGenerationMode.X3 ? 3
            : this.options.vxFrameGeneration === VxFrameGenerationMode.X2 ? 2
            : this.options.vxFrameGeneration === VxFrameGenerationMode.CUSTOM ? 8 : 1;
        // VIDEO_MAX_FPS limits the base frames entering VX. Generated frames
        // are additional presentation frames, so 10 FPS + 2× should become
        // roughly 20 FPS, not be forced back to 10 FPS.
        const baseFps = this.targetFps > 0 && this.targetFps < 60
            ? this.targetFps
            : this.estimatedSourceFps;
        const targetMultiplier = Math.max(1, Math.ceil(this.options.vxFrameTargetFps / Math.max(1, baseFps)));
        const requestedMultiplier = this.options.vxFrameGeneration === VxFrameGenerationMode.CUSTOM
            ? Math.min(maxMultiplier, targetMultiplier)
            : maxMultiplier;

        return Math.min(requestedMultiplier, this.getLatencyProtectedOptions().frameGenerationLimit);
    }

    private presentGeneratedFrames(multiplier: number, onComplete: () => void) {
        let step = 1;
        // Frame generation has to occupy the time between two *received*
        // frames. The old logic used a zero interval whenever the configured
        // cap was 60, so a 24/30 FPS stream drew every synthetic frame during
        // one compositor refresh. That added GPU work but produced no visible
        // motion improvement, especially on Android.
        const sourceFps = this.targetFps > 0 && this.targetFps < 60
            ? this.targetFps
            : this.estimatedSourceFps;
        const baseFrameInterval = 1000 / Math.max(1, sourceFps);
        const presentationInterval = baseFrameInterval ? baseFrameInterval / multiplier : 0;
        const startedAt = performance.now();

        // Canvas updates are only visible on a compositor refresh. Align each
        // generated image to requestAnimationFrame instead of issuing a burst
        // of WebGL draws between two screen refreshes.
        const scheduleAt = (targetAt: number, callback: () => void) => {
            const waitForPresentation = () => {
                if (this.isStopped) return;
                if (performance.now() + 0.5 >= targetAt) {
                    callback();
                    return;
                }
                this.generatedFrameIds.push(requestAnimationFrame(waitForPresentation));
            };
            this.generatedFrameIds.push(requestAnimationFrame(waitForPresentation));
        };

        const presentNext = () => {
            if (this.isStopped) return;
            if (step < multiplier) {
                this.renderTextureFrame(true, step / multiplier);
                step++;
                scheduleAt(startedAt + presentationInterval * (step - 1), presentNext);
            } else {
                this.renderTextureFrame(false, 1);
                onComplete();
            }
        };
        presentNext();
    }

    private cancelGeneratedFrames() {
        this.generatedFrameIds.forEach(id => cancelAnimationFrame(id));
        this.generatedFrameIds = [];
    }

    private copyCurrentFrame() {
        const gl = this.gl!;
        if (!this.copyFramebuffer || !this.currentTexture || !this.previousTexture) return;
        const copyTexture = (source: WebGLTexture, destination: WebGLTexture) => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.copyFramebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, source, 0);
            gl.bindTexture(gl.TEXTURE_2D, destination);
            gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, this.$video.videoWidth, this.$video.videoHeight);
        };
        if (this.hasPreviousFrame && this.historyTexture) {
            copyTexture(this.previousTexture, this.historyTexture);
        }
        copyTexture(this.currentTexture, this.previousTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // copyTexSubImage2D binds the destination texture to unit 0. Restore
        // both sampler bindings before the scheduled presentation pass.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.previousTexture);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.historyTexture);
    }

    protected async setupShaders(): Promise<void> {
        const gl = this.$canvas.getContext('webgl2', {
            isBx: true,
            antialias: true,
            alpha: false,
            depth: false,
            preserveDrawingBuffer: false,
            stencil: false,
            powerPreference: getStreamPref(StreamPref.VIDEO_POWER_PREFERENCE),
        } as WebGLContextAttributes) as WebGL2RenderingContext;
        this.gl = gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        // Vertex shader: Identity map
        const vShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vShader, compressCodeFile('./src/modules/player/webgl2/shaders/clarity-boost.vert') as any as string);
        gl.compileShader(vShader);
        if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
            throw new Error(`Vertex shader VX inválido: ${gl.getShaderInfoLog(vShader) || 'erro desconhecido'}`);
        }

        const fShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fShader, compressCodeFile('./src/modules/player/webgl2/shaders/clarity-boost.fs') as any as string);
        gl.compileShader(fShader);
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
            throw new Error(`Shader de efeitos VX inválido: ${gl.getShaderInfoLog(fShader) || 'erro desconhecido'}`);
        }

        // Create and link program
        const program = gl.createProgram()!;
        this.program = program;

        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Programa VX não pôde ser iniciado: ${gl.getProgramInfoLog(program) || 'erro desconhecido'}`);
        }

        this.updateCanvas();

        // Vertices: A screen-filling quad made from two triangles
        const buffer = gl.createBuffer();
        this.resources.push(buffer);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0, // Bottom-left
            3.0, -1.0,  // Bottom-right
            -1.0, 3.0,  // Top-left
        ]), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // Texture to contain the video data
        const setupTexture = (texture: WebGLTexture) => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        };
        this.currentTexture = gl.createTexture();
        this.previousTexture = gl.createTexture();
        this.historyTexture = gl.createTexture();
        this.copyFramebuffer = gl.createFramebuffer();
        this.resources.push(this.currentTexture, this.previousTexture, this.historyTexture, this.copyFramebuffer);
        setupTexture(this.currentTexture);
        setupTexture(this.previousTexture);
        setupTexture(this.historyTexture);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);

        // Bind texture to the "data" argument to the fragment shader
        gl.uniform1i(gl.getUniformLocation(program, 'data'), 0);
        gl.uniform1i(gl.getUniformLocation(program, 'previousData'), 1);
        gl.uniform1i(gl.getUniformLocation(program, 'historyData'), 2);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.previousTexture);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.historyTexture);
    }

    destroy() {
        this.cancelGeneratedFrames();
        super.destroy();

        const gl = this.gl;
        if (!gl) {
            return;
        }

        gl.getExtension('WEBGL_lose_context')?.loseContext();
        gl.useProgram(null);

        for (const resource of this.resources) {
            if (resource instanceof WebGLProgram) {
                gl.deleteProgram(resource);
            } else if (resource instanceof WebGLShader) {
                gl.deleteShader(resource);
            } else if (resource instanceof WebGLTexture) {
                gl.deleteTexture(resource);
            } else if (resource instanceof WebGLBuffer) {
                gl.deleteBuffer(resource);
            } else if (resource instanceof WebGLFramebuffer) {
                gl.deleteFramebuffer(resource);
            }
        }

        this.gl = null;
        this.currentTexture = null;
        this.previousTexture = null;
        this.historyTexture = null;
        this.copyFramebuffer = null;
        this.renderedFrameTimes = [];
    }

    refreshPlayer(): void {
        this.updateCanvas();
    }
}
