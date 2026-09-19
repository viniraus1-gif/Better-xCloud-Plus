import { BxLogger } from "@/utils/bx-logger";
import { BaseStreamPlayer, StreamPlayerElement, StreamPlayerFilter } from "./base-stream-player";
import { StreamVideoProcessing, type StreamPlayerType } from "@/enums/pref-values";
import { VxVideoEngine } from "@/modules/vx/vx-video-engine";
import { VxUpscaleTarget } from "@/enums/pref-values";
import { VxFrameGenerationMode } from "@/enums/pref-values";

export abstract class BaseCanvasPlayer extends BaseStreamPlayer {
    protected $canvas: HTMLCanvasElement;

    protected targetFps = 60;
    protected frameInterval = 0;
    protected lastFrameTime = 0;
    protected animFrameId: number | null = null;
    protected frameCallback: any;
    private boundDrawFrame: () => void;

    constructor(playerType: StreamPlayerType, $video: HTMLVideoElement, logTag: string) {
        super(playerType, StreamPlayerElement.CANVAS, $video, logTag);

        const $canvas = document.createElement('canvas');
        $canvas.width = $video.videoWidth;
        $canvas.height = $video.videoHeight;
        this.$canvas = $canvas;

        $video.insertAdjacentElement('afterend', this.$canvas);

        let frameCallback: any;
        if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
            const $video = this.$video;
            frameCallback = $video.requestVideoFrameCallback.bind($video);
        } else {
            frameCallback = window.requestAnimationFrame.bind(window);
        }

        this.frameCallback = frameCallback;
        this.boundDrawFrame = this.drawFrame.bind(this);
    }

    async init(): Promise<void> {
        super.init();

        await this.setupShaders();
        this.setupRendering();
    }

    setTargetFps(target: number) {
        // Older Better xCloud builds stored `0` for "unlimited".  In a
        // canvas player, however, zero used to mean "never draw", which can
        // leave the game visibly frozen at 0 FPS after an upgrade.  Keep the
        // legacy meaning while retaining every explicit limit from 10–60.
        this.targetFps = Number.isFinite(target) && target > 0 ? target : 60;
        this.lastFrameTime = 0;
        this.frameInterval = Math.floor(1000 / this.targetFps);
    }

    getCanvas() {
        return this.$canvas;
    }

    /**
     * Canvas players that synthesize intermediate images can expose their
     * measured local render rate. `null` means that the player has no such
     * measurement; this must never be confused with the WebRTC stream FPS.
     */
    getLocalRenderFps(): number | null {
        return null;
    }

    /** Reallocates only when the requested output changes; source frames stay on GPU. */
    protected syncOutputResolution() {
        const sourceWidth = this.$video.videoWidth || 1920;
        const sourceHeight = this.$video.videoHeight || 1080;
        const target = this.options.vxUpscaleTarget;
        let height = sourceHeight;

        if (target === VxUpscaleTarget.QHD) {
            height = 1440;
        } else if (target === VxUpscaleTarget.UHD) {
            height = 2160;
        } else if (target === VxUpscaleTarget.AUTO) {
            height = Math.min(1440, Math.max(sourceHeight, Math.round(window.innerHeight * devicePixelRatio)));
        }

        // The first optical-flow implementation is deliberately capped at
        // 1080p output. A full-resolution search at 1440p/4K would add too
        // much latency on mid-range GPUs such as the GTX 1060.
        if (this.options.vxFrameGeneration !== VxFrameGenerationMode.OFF && this.options.vxFrameGeneration !== VxFrameGenerationMode.AUTO) {
            height = Math.min(height, 1080);
        }

        const width = Math.round(height * sourceWidth / sourceHeight);
        if (this.$canvas.width !== width || this.$canvas.height !== height) {
            this.$canvas.width = width;
            this.$canvas.height = height;
        }
    }

    destroy() {
        BxLogger.info(this.logTag, 'Destroy');

        this.isStopped = true;
        if (this.animFrameId) {
            if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
                this.$video.cancelVideoFrameCallback(this.animFrameId);
            } else {
                cancelAnimationFrame(this.animFrameId);
            }

            this.animFrameId = null;
        }

        if (this.$canvas.isConnected) {
            this.$canvas.remove();
        }

        this.$canvas.width = 1;
        this.$canvas.height = 1;
    }

    toFilterId(processing: StreamVideoProcessing) {
        return processing === StreamVideoProcessing.CAS ? StreamPlayerFilter.CAS : StreamPlayerFilter.USM;
    }

    protected shouldDraw() {
        if (this.targetFps >= 60) {
            // Always draw
            return true;
        } else if (this.targetFps === 0) {
            // Don't draw when FPS is 0
            return false;
        }

        const currentTime = performance.now();
        const timeSinceLastFrame = currentTime - this.lastFrameTime;
        if (timeSinceLastFrame < this.frameInterval) {
            // Skip frame to limit FPS
            return false;
        }

        this.lastFrameTime = currentTime;
        return true;
    }

    private drawFrame() {
        if (this.isStopped) {
            return;
        }

        this.animFrameId = this.frameCallback(this.boundDrawFrame);
        if (!this.shouldDraw()) {
            return;
        }

        const started = performance.now();
        this.updateFrame();
        // CPU submission time, not GPU completion time. WebGPU/WebGL do not expose
        // portable GPU timing without optional extensions.
        VxVideoEngine.getInstance().observeRendererDuration(performance.now() - started);
    }

    protected setupRendering(): void {
        this.animFrameId = this.frameCallback(this.boundDrawFrame);
    }

    protected abstract setupShaders(): void;
    abstract updateFrame(): void;
}
