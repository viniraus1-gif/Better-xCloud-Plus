export type VxBackend = 'webgpu' | 'webgl2' | 'none';

export type VxCapabilities = {
    webgpu: boolean;
    webgl2: boolean;
    videoFrameCallback: boolean;
    videoFrame: boolean;
    displayRefreshRate?: number;
};

export type VxTimingSample = {
    timestamp: number;
    rendererMs?: number;
    decodeMs?: number;
    presentedFrames?: number;
};

export type VxBenchmarkResult = {
    backend: VxBackend;
    averageFrameMs: number;
    rating: 'excellent' | 'good' | 'limited' | 'unavailable';
    measuredAt: number;
};
