import { VxCapabilitiesDetector } from './vx-capabilities';
import { VxTelemetry } from './vx-telemetry';
import type { VxCapabilities } from './vx-types';

/**
 * Phase 1 orchestration point. It is intentionally observation-only: the native
 * video path remains visible until a future processing stage has initialized.
 */
export class VxVideoEngine {
    private static instance?: VxVideoEngine;
    static getInstance = () => this.instance ?? (this.instance = new VxVideoEngine());

    private capabilities?: VxCapabilities;

    async initialize($video?: HTMLVideoElement) {
        this.capabilities = VxCapabilitiesDetector.detect();
        if (!this.capabilities.displayRefreshRate) {
            this.capabilities.displayRefreshRate = await VxCapabilitiesDetector.measureDisplayRefreshRate();
        }
        $video && VxTelemetry.getInstance().observeVideo($video);
    }

    observeRendererDuration(durationMs: number) {
        VxTelemetry.getInstance().recordRendererTime(durationMs);
    }

    getCapabilities(): VxCapabilities {
        return this.capabilities ?? VxCapabilitiesDetector.detect();
    }

    destroy($video?: HTMLVideoElement) {
        VxTelemetry.getInstance().stopVideoObservation($video);
        VxTelemetry.getInstance().reset();
    }
}
