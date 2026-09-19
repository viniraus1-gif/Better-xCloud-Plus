import { StreamVideoProcessing, VxAntiAliasing, VxFrameGenerationMode, VxUpscaleAlgorithm, VxUpscaleTarget, type StreamPlayerType } from "@/enums/pref-values";
import type { StreamPlayerOptions } from "@/types/stream";
import { BxLogger } from "@/utils/bx-logger";

export const enum StreamPlayerElement {
    VIDEO = 'video',
    CANVAS = 'canvas',
}

export const enum StreamPlayerFilter {
    USM = 1,
    CAS = 2,
}

export abstract class BaseStreamPlayer {
    protected logTag: string;
    protected playerType: StreamPlayerType;
    protected elementType: StreamPlayerElement;
    protected $video: HTMLVideoElement;

    protected options: StreamPlayerOptions = {
        processing: StreamVideoProcessing.USM,
        sharpness: 0,
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        vxUpscaleTarget: VxUpscaleTarget.NATIVE,
        vxUpscaleAlgorithm: VxUpscaleAlgorithm.VX,
        vxAntiAliasing: VxAntiAliasing.OFF,
        vxArtifactReduction: 0,
        vxFrameGeneration: VxFrameGenerationMode.OFF,
        vxLatencyBudget: 5,
        vxAdaptiveSharpen: true,
        vxDynamicReconstruction: true,
        vxTemporalSuperResolution: false,
        vxHudProtection: true,
        vxFrameTargetFps: 120,
        vxFineDetailReconstruction: 25,
    };

    protected isStopped = false;

    constructor(playerType: StreamPlayerType, elementType: StreamPlayerElement, $video: HTMLVideoElement, logTag: string) {
        this.playerType = playerType;
        this.elementType = elementType;
        this.$video = $video;
        this.logTag = logTag;
    }

    init() {
        BxLogger.info(this.logTag, 'Initialize');
    }

    updateOptions(newOptions: Partial<StreamPlayerOptions>, refresh=false) {
        this.options = Object.assign(this.options, newOptions);
        refresh && this.refreshPlayer();
    }

    abstract refreshPlayer(): void;
}
