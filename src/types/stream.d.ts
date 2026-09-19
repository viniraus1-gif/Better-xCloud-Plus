import type { StreamVideoProcessing, StreamVideoProcessingMode, VxAntiAliasing, VxFrameGenerationMode, VxUpscaleAlgorithm, VxUpscaleTarget } from "@/enums/pref-values";

type StreamPlayerOptions = {
    processing: StreamVideoProcessing,
    processingMode: StreamVideoProcessingMode,
    sharpness: number,
    saturation: number,
    contrast: number,
    brightness: number,
    vxUpscaleTarget: VxUpscaleTarget,
    vxUpscaleAlgorithm: VxUpscaleAlgorithm,
    vxAntiAliasing: VxAntiAliasing,
    vxArtifactReduction: number,
    vxFrameGeneration: VxFrameGenerationMode,
    vxLatencyBudget: number,
    vxAdaptiveSharpen: boolean,
    vxDynamicReconstruction: boolean,
    vxTemporalSuperResolution: boolean,
    vxHudProtection: boolean,
    vxFrameTargetFps: number,
    vxFineDetailReconstruction: number,
};
