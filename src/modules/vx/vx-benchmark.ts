import { VxCapabilitiesDetector } from './vx-capabilities';
import type { VxBenchmarkResult } from './vx-types';

/**
 * A short local presentation benchmark. It measures a real WebGL2 workload,
 * but deliberately does not infer GPU model, server FPS, or hardware decoding.
 */
export class VxBenchmark {
    static async run(): Promise<VxBenchmarkResult> {
        if (!VxCapabilitiesDetector.detect().webgl2) {
            return { backend: 'none', averageFrameMs: 0, rating: 'unavailable', measuredAt: Date.now() };
        }

        const $canvas = document.createElement('canvas');
        $canvas.width = 1280;
        $canvas.height = 720;
        const gl = $canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false });
        if (!gl) {
            return { backend: 'none', averageFrameMs: 0, rating: 'unavailable', measuredAt: Date.now() };
        }

        const frames = 45;
        const started = performance.now();
        for (let frame = 0; frame < frames; frame++) {
            gl.clearColor((frame % 10) / 10, 0.08, 0.12, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            // finish makes this a conservative completed-work measurement.
            gl.finish();
        }
        const averageFrameMs = (performance.now() - started) / frames;
        const rating = averageFrameMs <= 4 ? 'excellent' : averageFrameMs <= 8 ? 'good' : 'limited';
        return { backend: 'webgl2', averageFrameMs, rating, measuredAt: Date.now() };
    }
}
