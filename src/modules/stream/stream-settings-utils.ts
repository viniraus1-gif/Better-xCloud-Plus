import { STATES } from "@utils/global";
import { UserAgent } from "@utils/user-agent";
import { StreamPref } from "@/enums/pref-keys";
import { StreamVideoProcessing, StreamPlayerType, VxAntiAliasing, VxFrameGenerationMode, VxUpscaleAlgorithm, VxUpscaleTarget } from "@/enums/pref-values";
import { getStreamPref, setStreamPref } from "@/utils/pref-utils";
import { SettingsManager } from "../settings-manager";
import type { StreamPlayerOptions } from "@/types/stream";

export function onChangeVideoPlayerType() {
    const playerType = getStreamPref(StreamPref.VIDEO_PLAYER_TYPE);
    const processing = getStreamPref(StreamPref.VIDEO_PROCESSING);
    const settingsManager = SettingsManager.getInstance();
    if (!settingsManager.hasElement(StreamPref.VIDEO_PROCESSING)) {
        return;
    }

    let isDisabled = false;

    const $videoProcessing = settingsManager.getElement(StreamPref.VIDEO_PROCESSING) as HTMLSelectElement;
    const $videoProcessingMode = settingsManager.getElement(StreamPref.VIDEO_PROCESSING_MODE) as HTMLSelectElement;
    const $videoSharpness = settingsManager.getElement(StreamPref.VIDEO_SHARPNESS);
    const $videoPowerPreference = settingsManager.getElement(StreamPref.VIDEO_POWER_PREFERENCE);
    const $videoMaxFps = settingsManager.getElement(StreamPref.VIDEO_MAX_FPS);

    const $optCas = $videoProcessing.querySelector<HTMLOptionElement>(`option[value=${StreamVideoProcessing.CAS}]`);

    if (playerType === StreamPlayerType.VIDEO) {
        // Only allow USM when player type is Video
        $videoProcessing.value = StreamVideoProcessing.USM;
        setStreamPref(StreamPref.VIDEO_PROCESSING, StreamVideoProcessing.USM, 'direct');

        $optCas && ($optCas.disabled = true);

        if (UserAgent.isSafari()) {
            isDisabled = true;
        }
    } else {
        $optCas && ($optCas.disabled = false);
    }

    $videoProcessing.disabled = isDisabled;
    $videoSharpness.dataset.disabled = isDisabled.toString();

    // Hide Power Preference setting if renderer isn't WebGL2
    $videoProcessingMode.closest('.bx-settings-row')!.classList.toggle('bx-gone', !(playerType === StreamPlayerType.WEBGL2 && processing === StreamVideoProcessing.CAS));
    $videoPowerPreference.closest('.bx-settings-row')!.classList.toggle('bx-gone', playerType !== StreamPlayerType.WEBGL2);
    $videoMaxFps.closest('.bx-settings-row')!.classList.toggle('bx-gone', playerType === StreamPlayerType.VIDEO);
}

export function onChangeVxFrameGeneration() {
    const settingsManager = SettingsManager.getInstance();
    if (!settingsManager.hasElement(StreamPref.VX_FRAME_TARGET_FPS)) return;
    const $target = settingsManager.getElement(StreamPref.VX_FRAME_TARGET_FPS);
    // Keep the typed target visible. The value is consumed only in the
    // "Personalizado" mode, but hiding it made the option hard to discover
    // in the Xbox settings dialog lifecycle.
    $target.closest('.bx-settings-row')!.classList.remove('bx-gone');
}

const COMPETITIVE_DISABLED_PREFS: StreamPref[] = [
    StreamPref.VX_UPSCALE_TARGET,
    StreamPref.VX_UPSCALE_ALGORITHM,
    StreamPref.VX_ANTI_ALIASING,
    StreamPref.VX_ARTIFACT_REDUCTION,
    StreamPref.VX_FRAME_GENERATION,
    StreamPref.VX_ADAPTIVE_SHARPEN,
    StreamPref.VX_DYNAMIC_RECONSTRUCTION,
    StreamPref.VX_TEMPORAL_SUPER_RESOLUTION,
    StreamPref.VX_HUD_PROTECTION,
    StreamPref.VX_FRAME_TARGET_FPS,
    StreamPref.VX_FINE_DETAIL_RECONSTRUCTION,
];

/** Locks visual VX controls while competitive mode is active. Their stored
 * values are preserved and become usable again when the mode is disabled. */
export function onChangeCompetitiveMode() {
    const settingsManager = SettingsManager.getInstance();
    const isCompetitive = getStreamPref(StreamPref.VX_COMPETITIVE_MODE);

    for (const pref of COMPETITIVE_DISABLED_PREFS) {
        if (!settingsManager.hasElement(pref)) continue;
        const $control = settingsManager.getElement(pref) as HTMLElement & { disabled?: boolean };
        $control.disabled = isCompetitive;
        $control.closest('.bx-settings-row')?.classList.toggle('bx-vx-competitive-locked', isCompetitive);
    }
}


export function limitVideoPlayerFps(targetFps: number) {
    const streamPlayer = STATES.currentStream.streamPlayerManager;
    streamPlayer?.getCanvasPlayer()?.setTargetFps(targetFps);
}

/**
 * VX spatial effects run in the canvas shader.  Leaving the player on the
 * native <video> element is useful for an A/B comparison, but it cannot
 * apply upscale, artifact reduction or generated frames.  Resolve that
 * mismatch in one place so a saved "Padrão" player preference cannot make
 * the VX controls look as if they are broken.
 */
export function getEffectiveVideoPlayerType(): StreamPlayerType {
    if (getStreamPref(StreamPref.VX_COMPETITIVE_MODE)) {
        return StreamPlayerType.VIDEO;
    }
    const configuredType = getStreamPref(StreamPref.VIDEO_PLAYER_TYPE);
    const needsVxCanvas =
        getStreamPref(StreamPref.VX_UPSCALE_TARGET) !== VxUpscaleTarget.NATIVE ||
        getStreamPref(StreamPref.VX_ARTIFACT_REDUCTION) > 0 ||
        getStreamPref(StreamPref.VX_FRAME_GENERATION) === VxFrameGenerationMode.X2 ||
        getStreamPref(StreamPref.VX_FRAME_GENERATION) === VxFrameGenerationMode.X3 ||
        getStreamPref(StreamPref.VX_FRAME_GENERATION) === VxFrameGenerationMode.X4 ||
        getStreamPref(StreamPref.VX_FRAME_GENERATION) === VxFrameGenerationMode.CUSTOM ||
        getStreamPref(StreamPref.VX_TEMPORAL_SUPER_RESOLUTION) ||
        getStreamPref(StreamPref.VX_FINE_DETAIL_RECONSTRUCTION) > 0 ||
        getStreamPref(StreamPref.VX_ANTI_ALIASING) !== VxAntiAliasing.OFF ||
        (getStreamPref(StreamPref.VX_ADAPTIVE_SHARPEN) && getStreamPref(StreamPref.VIDEO_SHARPNESS) > 0);

    const requiresWebglHistory =
        getStreamPref(StreamPref.VX_TEMPORAL_SUPER_RESOLUTION) ||
        getStreamPref(StreamPref.VX_FRAME_GENERATION) === VxFrameGenerationMode.X2 ||
        getStreamPref(StreamPref.VX_FRAME_GENERATION) === VxFrameGenerationMode.X3 ||
        getStreamPref(StreamPref.VX_FRAME_GENERATION) === VxFrameGenerationMode.X4 ||
        getStreamPref(StreamPref.VX_FRAME_GENERATION) === VxFrameGenerationMode.CUSTOM;

    // WebGPU now has parity for spatial processing. Only the history-based
    // temporal and frame-generation features still require WebGL2.
    return requiresWebglHistory || (needsVxCanvas && configuredType === StreamPlayerType.VIDEO)
        ? StreamPlayerType.WEBGL2
        : configuredType;
}

/** Applies the latency-first runtime profile without overwriting saved prefs. */
export function applyCompetitiveMode(options: StreamPlayerOptions): StreamPlayerOptions {
    if (!getStreamPref(StreamPref.VX_COMPETITIVE_MODE)) {
        return options;
    }

    return {
        ...options,
        processing: StreamVideoProcessing.USM,
        sharpness: 0,
        vxUpscaleTarget: VxUpscaleTarget.NATIVE,
        vxUpscaleAlgorithm: VxUpscaleAlgorithm.VX,
        vxAntiAliasing: VxAntiAliasing.OFF,
        vxArtifactReduction: 0,
        vxFrameGeneration: VxFrameGenerationMode.OFF,
        vxAdaptiveSharpen: false,
        vxDynamicReconstruction: false,
        vxTemporalSuperResolution: false,
        vxHudProtection: false,
        vxFineDetailReconstruction: 0,
    };
}


export function updateVideoPlayer() {
    const streamPlayerManager = STATES.currentStream.streamPlayerManager;
    if (!streamPlayerManager) {
        return;
    }

    let options = {
        processing: getStreamPref(StreamPref.VIDEO_PROCESSING),
        processingMode: getStreamPref(StreamPref.VIDEO_PROCESSING_MODE),
        sharpness: getStreamPref(StreamPref.VIDEO_SHARPNESS),
        saturation: getStreamPref(StreamPref.VIDEO_SATURATION),
        contrast: getStreamPref(StreamPref.VIDEO_CONTRAST),
        brightness: getStreamPref(StreamPref.VIDEO_BRIGHTNESS),
        vxUpscaleTarget: getStreamPref(StreamPref.VX_UPSCALE_TARGET),
        vxUpscaleAlgorithm: getStreamPref(StreamPref.VX_UPSCALE_ALGORITHM),
        vxAntiAliasing: getStreamPref(StreamPref.VX_ANTI_ALIASING),
        vxArtifactReduction: getStreamPref(StreamPref.VX_ARTIFACT_REDUCTION),
        vxFrameGeneration: getStreamPref(StreamPref.VX_FRAME_GENERATION),
        vxLatencyBudget: getStreamPref(StreamPref.VX_LATENCY_BUDGET),
        vxAdaptiveSharpen: getStreamPref(StreamPref.VX_ADAPTIVE_SHARPEN),
        vxDynamicReconstruction: getStreamPref(StreamPref.VX_DYNAMIC_RECONSTRUCTION),
        vxTemporalSuperResolution: getStreamPref(StreamPref.VX_TEMPORAL_SUPER_RESOLUTION),
        vxHudProtection: getStreamPref(StreamPref.VX_HUD_PROTECTION),
        vxFrameTargetFps: getStreamPref(StreamPref.VX_FRAME_TARGET_FPS),
        vxFineDetailReconstruction: getStreamPref(StreamPref.VX_FINE_DETAIL_RECONSTRUCTION),
    } satisfies StreamPlayerOptions;
    options = applyCompetitiveMode(options);

    streamPlayerManager.switchPlayerType(getEffectiveVideoPlayerType());
    streamPlayerManager.updateOptions(options);
    streamPlayerManager.refreshPlayer();

    // refreshPlayer can recreate the canvas player when VX frame generation
    // changes. Apply this after the refresh so the new player does not fall
    // back to BaseCanvasPlayer's default of 60 FPS.
    limitVideoPlayerFps(getStreamPref(StreamPref.VIDEO_MAX_FPS));
}

function resizeVideoPlayer() {
    const streamPlayerManager = STATES.currentStream.streamPlayerManager;
    streamPlayerManager?.resizePlayer();
}

window.addEventListener('resize', resizeVideoPlayer);
