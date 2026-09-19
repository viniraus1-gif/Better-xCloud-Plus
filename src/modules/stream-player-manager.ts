import { WebGL2Player } from "./player/webgl2/webgl2-player";
import { ScreenshotManager } from "@/utils/screenshot-manager";
import { STATES } from "@/utils/global";
import { StreamPref } from "@/enums/pref-keys";
import { BX_FLAGS } from "@/utils/bx-flags";
import { StreamPlayerType, VideoPosition } from "@/enums/pref-values";
import { getStreamPref } from "@/utils/pref-utils";
import type { BaseCanvasPlayer } from "./player/base-canvas-player";
import { VideoPlayer } from "./player/video/video-player";
import { StreamPlayerElement } from "./player/base-stream-player";
import { WebGPUPlayer } from "./player/webgpu/webgpu-player";
import type { StreamPlayerOptions } from "@/types/stream";


export class StreamPlayerManager {
    private static instance: StreamPlayerManager;
    public static getInstance = () => StreamPlayerManager.instance ?? (StreamPlayerManager.instance = new StreamPlayerManager());

    private $video!: HTMLVideoElement;
    private videoPlayer!: VideoPlayer;
    private canvasPlayer: BaseCanvasPlayer | null | undefined;
    private playerType: StreamPlayerType = StreamPlayerType.VIDEO;
    private canvasPlayerReady = false;
    private playerOptions: Partial<StreamPlayerOptions> = {};
    private canvasViewportRect: DOMRect | null = null;

    private constructor() {}

    setVideoElement($video: HTMLVideoElement) {
        this.$video = $video;
        this.videoPlayer = new VideoPlayer($video, 'VideoPlayer');
        this.videoPlayer.init();
    }

    resizePlayer() {
        const PREF_RATIO = getStreamPref(StreamPref.VIDEO_RATIO);
        const $video = this.$video;
        const isNativeTouchGame = STATES.currentStream.titleInfo?.details.hasNativeTouchSupport;

        let targetWidth;
        let targetHeight;
        let targetObjectFit;

        if (PREF_RATIO.includes(':')) {
            const tmp = PREF_RATIO.split(':');

            // Get preferred ratio
            const videoRatio = parseFloat(tmp[0]) / parseFloat(tmp[1]);

            let width = 0;
            let height = 0;

            // Get parent's ratio
            const parentRect = $video.parentElement!.getBoundingClientRect();
            const parentRatio = parentRect.width / parentRect.height;

            // Get target width & height
            if (parentRatio > videoRatio) {
                height = parentRect.height;
                width = height * videoRatio;
            } else {
                width = parentRect.width;
                height = width / videoRatio;
            }

            // Avoid floating points
            width = Math.ceil(Math.min(parentRect.width, width));
            height = Math.ceil(Math.min(parentRect.height, height));

            $video.dataset.width = width.toString();
            $video.dataset.height = height.toString();

            // Set position
            const $parent = $video.parentElement!;
            const position = getStreamPref(StreamPref.VIDEO_POSITION);
            $parent.style.removeProperty('padding-top');

            $parent.dataset.position = position;
            if (position === VideoPosition.TOP_HALF || position === VideoPosition.BOTTOM_HALF) {
                let padding = Math.floor((window.innerHeight - height) / 4);
                if (padding > 0) {
                    if (position === VideoPosition.BOTTOM_HALF) {
                        padding *= 3;
                    }

                    $parent.style.paddingTop = padding + 'px';
                }
            }

            // Update size
            targetWidth = `${width}px`;
            targetHeight = `${height}px`;
            targetObjectFit = PREF_RATIO === '16:9' ? 'contain' : 'fill';
        } else {
            targetWidth = '100%';
            targetHeight = '100%';
            targetObjectFit = PREF_RATIO;

            $video.dataset.width = window.innerWidth.toString();
            $video.dataset.height = window.innerHeight.toString();
        }

        $video.style.width = targetWidth;
        $video.style.height = targetHeight;
        $video.style.objectFit = targetObjectFit;

        if (this.canvasPlayer) {
            const $canvas = this.canvasPlayer.getCanvas();
            $canvas.style.width = targetWidth;
            $canvas.style.height = targetHeight;
            $canvas.style.objectFit = targetObjectFit;

            // xCloud may apply its own transform/inset rules to the <video>
            // on phones (safe areas, portrait-to-landscape transition, etc.).
            // A canvas is a sibling, so it does not inherit those rules and
            // used to drift away from the stream on Android. Mirror the visual
            // geometry while the native video is still measurable.
            this.syncCanvasLayoutFromVideo();

            $video.dispatchEvent(new Event('resize'));
        }

        // Update video dimensions
        if (isNativeTouchGame && this.playerType !== StreamPlayerType.VIDEO) {
            window.BX_EXPOSED.streamSession.updateDimensions();
        }
    }

    switchPlayerType(type: StreamPlayerType, refreshPlayer: boolean = false) {
        if (this.playerType !== type) {
            const videoClass = BX_FLAGS.DeviceInfo.deviceType === 'android-tv' ? 'bx-pixel' : 'bx-gone';

            // Destroy old player
            this.cleanUpCanvasPlayer();

            if (type === StreamPlayerType.VIDEO) {
                // Switch from Canvas -> Video
                this.$video.classList.remove(videoClass);
            } else {
                // Switch from Video -> Canvas
                if (BX_FLAGS.EnableWebGPURenderer && type === StreamPlayerType.WEBGPU) {
                    this.canvasPlayer = new WebGPUPlayer(this.$video);
                } else {
                    this.canvasPlayer = new WebGL2Player(this.$video);
                }
                const canvasPlayer = this.canvasPlayer;
                this.canvasPlayerReady = false;
                void canvasPlayer.init().then(() => {
                    // Do not hide the known-good stream until the processor initialized.
                    if (this.canvasPlayer === canvasPlayer) {
                        this.resizePlayer();
                        this.syncCanvasLayoutFromVideo();
                        this.canvasPlayerReady = true;
                        canvasPlayer.updateOptions(this.playerOptions, true);
                        this.videoPlayer.clearFilters();
                        this.$video.classList.add(videoClass);
                    }
                }).catch(error => {
                    // A shader/context failure must never leave the user with a black screen.
                    console.error('[Better xCloud VX] Canvas renderer disabled after initialization failure', error);
                    if (this.canvasPlayer === canvasPlayer) {
                        this.cleanUpCanvasPlayer();
                        this.playerType = StreamPlayerType.VIDEO;
                        this.$video.classList.remove(videoClass);
                    }
                });
            }

            this.playerType = type;
        }

        refreshPlayer && this.refreshPlayer();
    }

    updateOptions(options: StreamPlayerOptions, refreshPlayer: boolean = false) {
        Object.assign(this.playerOptions, options);
        if (this.canvasPlayer && !this.canvasPlayerReady) {
            return;
        }
        (this.canvasPlayer || this.videoPlayer).updateOptions(options, refreshPlayer);
    }

    getPlayerElement(elementType?: StreamPlayerElement) {
        if (typeof elementType === 'undefined') {
            elementType = this.playerType === StreamPlayerType.VIDEO ? StreamPlayerElement.VIDEO : StreamPlayerElement.CANVAS;
        }

        if (elementType !== StreamPlayerElement.VIDEO) {
            return this.canvasPlayer?.getCanvas();
        }

        return this.$video;
    }

    getCanvasPlayer() {
        return this.canvasPlayer;
    }

    refreshPlayer() {
        if (this.playerType === StreamPlayerType.VIDEO) {
            this.videoPlayer.refreshPlayer();
        } else if (this.canvasPlayerReady) {
            ScreenshotManager.getInstance().updateCanvasFilters('none');
            this.canvasPlayer?.refreshPlayer();
        }

        this.resizePlayer();
    }

    getVideoPlayerFilterStyle() {
        throw new Error("Method not implemented.");
    }

    /**
     * Keep the generated canvas in the same visual box as xCloud's video.
     * This is particularly important for Android WebView: the page can apply
     * transforms for the device safe area that are not shared by siblings.
     */
    private syncCanvasLayoutFromVideo() {
        const $canvas = this.canvasPlayer?.getCanvas();
        if (!$canvas || !this.$video.isConnected) {
            return;
        }

        const style = getComputedStyle(this.$video);

        // Android WebView lays out xCloud's native video in a page-sized
        // container even after the activity rotates. A sibling canvas must be
        // pinned to the final viewport rect, otherwise it can inherit the
        // desktop shell's offset while the touch layer stays correct.
        const rect = this.$video.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            this.canvasViewportRect = rect;
        }

        if (BX_FLAGS.DeviceInfo.deviceType === 'android-handheld' && this.canvasViewportRect) {
            const viewportRect = this.canvasViewportRect;
            $canvas.style.position = 'fixed';
            $canvas.style.left = `${viewportRect.left}px`;
            $canvas.style.top = `${viewportRect.top}px`;
            $canvas.style.right = 'auto';
            $canvas.style.bottom = 'auto';
            $canvas.style.width = `${viewportRect.width}px`;
            $canvas.style.height = `${viewportRect.height}px`;
            $canvas.style.margin = '0';
            $canvas.style.transform = 'none';
            $canvas.style.transformOrigin = 'center';
            $canvas.style.objectFit = style.objectFit;
            $canvas.style.zIndex = style.zIndex === 'auto' ? '0' : style.zIndex;
            $canvas.style.pointerEvents = 'none';
            return;
        }

        for (const property of ['position', 'top', 'right', 'bottom', 'left', 'transform', 'transform-origin', 'object-position', 'z-index'] as const) {
            $canvas.style.setProperty(property, style.getPropertyValue(property));
        }

        // The canvas displays the stream only; touch/gamepad input must keep
        // reaching the original xCloud controls positioned above it.
        $canvas.style.pointerEvents = 'none';
    }

    private cleanUpCanvasPlayer() {
        this.canvasPlayer?.destroy();
        this.canvasPlayer = null;
        this.canvasPlayerReady = false;
    }

    destroy() {
        this.cleanUpCanvasPlayer();
    }
}
