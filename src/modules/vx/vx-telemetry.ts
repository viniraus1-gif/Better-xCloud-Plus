import type { VxTimingSample } from './vx-types';

/** Keeps a bounded, in-memory history. Values absent from browser APIs stay absent. */
export class VxTelemetry {
    private static instance?: VxTelemetry;
    static getInstance = () => this.instance ?? (this.instance = new VxTelemetry());

    private readonly maxSamples = 180;
    private samples: VxTimingSample[] = [];
    private videoCallbackId?: number;

    observeVideo($video: HTMLVideoElement) {
        this.stopVideoObservation($video);
        if (!('requestVideoFrameCallback' in $video)) {
            return;
        }

        const observe = (_now: number, metadata: VideoFrameCallbackMetadata) => {
            this.record({
                decodeMs: typeof metadata.processingDuration === 'number' ? metadata.processingDuration * 1000 : undefined,
                presentedFrames: metadata.presentedFrames,
            });
            this.videoCallbackId = $video.requestVideoFrameCallback(observe);
        };
        this.videoCallbackId = $video.requestVideoFrameCallback(observe);
    }

    recordRendererTime(rendererMs: number) {
        this.record({ rendererMs });
    }

    getRecentSamples(): readonly VxTimingSample[] {
        return this.samples;
    }

    getAverageRendererMs(): number | undefined {
        const values = this.samples.flatMap(sample => typeof sample.rendererMs === 'number' ? [sample.rendererMs] : []);
        return values.length ? values.reduce((total, value) => total + value, 0) / values.length : undefined;
    }

    reset() {
        this.samples = [];
    }

    stopVideoObservation($video?: HTMLVideoElement) {
        if (typeof this.videoCallbackId === 'number' && $video && 'cancelVideoFrameCallback' in $video) {
            $video.cancelVideoFrameCallback(this.videoCallbackId);
        }
        this.videoCallbackId = undefined;
    }

    private record(sample: Omit<VxTimingSample, 'timestamp'>) {
        this.samples.push({ ...sample, timestamp: performance.now() });
        if (this.samples.length > this.maxSamples) {
            this.samples.splice(0, this.samples.length - this.maxSamples);
        }
    }
}
