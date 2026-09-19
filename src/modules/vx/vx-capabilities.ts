import type { VxBackend, VxCapabilities } from './vx-types';

/** Browser feature detection only. GPU model and hardware decode state are not exposed reliably. */
export class VxCapabilitiesDetector {
    private static cached?: VxCapabilities;

    static detect(): VxCapabilities {
        if (this.cached) {
            return this.cached;
        }

        const $canvas = document.createElement('canvas');
        const webgl2 = !!$canvas.getContext('webgl2');
        $canvas.width = 1;
        $canvas.height = 1;

        return this.cached = {
            webgpu: !!navigator.gpu,
            webgl2,
            videoFrameCallback: 'requestVideoFrameCallback' in HTMLVideoElement.prototype,
            videoFrame: typeof VideoFrame !== 'undefined',
        };
    }

    static preferredBackend(): VxBackend {
        const capabilities = this.detect();
        if (capabilities.webgpu) {
            return 'webgpu';
        }

        return capabilities.webgl2 ? 'webgl2' : 'none';
    }

    static async measureDisplayRefreshRate(): Promise<number | undefined> {
        const samples: number[] = [];
        let previous = performance.now();

        await new Promise<void>(resolve => {
            const sample = (now: number) => {
                const elapsed = now - previous;
                previous = now;
                if (elapsed > 2 && elapsed < 100) {
                    samples.push(elapsed);
                }

                if (samples.length >= 30) {
                    resolve();
                } else {
                    requestAnimationFrame(sample);
                }
            };
            requestAnimationFrame(sample);
        });

        if (!samples.length) {
            return undefined;
        }

        const average = samples.reduce((total, value) => total + value, 0) / samples.length;
        const rate = 1000 / average;
        const commonRates = [60, 75, 90, 120, 144, 165, 240];
        return commonRates.reduce((closest, candidate) => Math.abs(candidate - rate) < Math.abs(closest - rate) ? candidate : closest);
    }
}
