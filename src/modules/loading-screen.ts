import { CE } from "@utils/html";
import { getPreferredServerRegion } from "@utils/region";
import { t } from "@utils/translation";
import { STATES } from "@utils/global";
import { GlobalPref } from "@/enums/pref-keys";
import { getGlobalPref } from "@/utils/pref-utils";
import { compressCss } from "@macros/build" with { type: "macro" };
import { LoadingScreenRocket } from "@/enums/pref-values";

export class LoadingScreen {
    // This is the current first-party asset referenced by Xbox's own
    // `game-stream` bundle.  It deliberately stays remote: we do not bundle
    // or alter Microsoft's media, and a new Xbox build can update it normally.
    private static readonly ROCKET_VIDEO_URL = 'https://assets.play.xbox.com/playxbox/static/media/RocketAnimationVideo.3a70e3be.mp4';
    private static readonly XBOX_SPLASH_VIDEO_URL = 'https://assets.play.xbox.com/playxbox/static/media/XboxSplashScreen.417c50bc.mp4';
    private static $bgStyle: HTMLElement;
    private static $waitTimeBox: HTMLElement;
    private static $rocketVideo?: HTMLVideoElement;
    private static $xboxSplashVideo?: HTMLVideoElement;
    private static $leaveQueueButton?: HTMLButtonElement;
    private static rocketRequested = false;
    private static guideFallbackInstalled = false;

    private static waitTimeInterval?: number | null = null;
    private static orgWebTitle: string;

    private static secondsToString(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);

        const mDisplay = m > 0 ? `${m}m`: '';
        const sDisplay = `${s}s`.padStart(s >=0 ? 3 : 4, '0');
        return mDisplay + sDisplay;
    }

    static setup() {
        LoadingScreen.rocketRequested = true;
        LoadingScreen.installLoadingGuideFallback();
        const titleInfo = STATES.currentStream.titleInfo;
        if (!titleInfo) {
            return;
        }

        if (!LoadingScreen.$bgStyle) {
            const $bgStyle = CE('style');
            document.documentElement.appendChild($bgStyle);
            LoadingScreen.$bgStyle = $bgStyle;
        }

        if (titleInfo.product) {
            LoadingScreen.setBackground(titleInfo.product.heroImageUrl || titleInfo.product.titledHeroImageUrl || titleInfo.product.tileImageUrl);
        }

        if (getGlobalPref(GlobalPref.LOADING_SCREEN_ROCKET) === LoadingScreenRocket.HIDE) {
            LoadingScreen.hideRocket();
        } else {
            LoadingScreen.showOriginalRocket();
        }
    }

    /** The refreshed loading screen can expose the Xbox guide button before
     * its normal handler is ready. Retry through the stream HUD only when the
     * native guide did not open; regular in-game guide behavior is untouched. */
    private static installLoadingGuideFallback() {
        if (LoadingScreen.guideFallbackInstalled) {
            return;
        }
        LoadingScreen.guideFallbackInstalled = true;

        document.addEventListener('click', event => {
            const $target = event.target as HTMLElement | null;
            if (!$target?.closest('button[class*=GuideButton-module__button]') || STATES.isPlaying) {
                return;
            }

            window.setTimeout(() => {
                const guideIsOpen = !!document.querySelector('#gamepass-dialog-root [role=dialog]');
                if (!guideIsOpen) {
                    window.BX_EXPOSED.showStreamMenu?.();
                }
            }, 250);
        }, true);
    }

    /**
     * Xbox's new provisioning screen no longer mounts its old rocket for the
     * queued state. Mount the exact video still shipped by Xbox only while
     * this loading screen is active.  It never receives pointer events, so
     * native queue controls remain usable above it.
     */
    private static showOriginalRocket(retry = 0) {
        const mount = document.querySelector<HTMLElement>('#game-stream');
        if (!LoadingScreen.rocketRequested || LoadingScreen.$rocketVideo?.isConnected) {
            return;
        }

        // On the refreshed Xbox page the stream root can be mounted a few
        // frames after titleInfo.ready. Retry briefly instead of silently
        // giving up, but never resurrect the animation after loading ends.
        const $screens = mount?.querySelector<HTMLElement>('[class*=PureScreens-module__screens]');
        const $heroArt = $screens?.querySelector<HTMLElement>('[class*=ConnectingHeroArtBackdrop-module__backdrop]');
        const needsHeroArt = getGlobalPref(GlobalPref.LOADING_SCREEN_GAME_ART);

        if (!mount || (needsHeroArt && (!$screens || !$heroArt))) {
            if (retry < 12) {
                window.setTimeout(() => LoadingScreen.showOriginalRocket(retry + 1), 100);
            }
            return;
        }

        const $video = CE('video', {
            class: 'bx-original-rocket-video',
            autoplay: true,
            loop: true,
            muted: true,
            playsinline: true,
            preload: 'auto',
            'aria-hidden': 'true',
        }) as HTMLVideoElement;
        $video.src = LoadingScreen.ROCKET_VIDEO_URL;
        $video.play().catch(() => {
            // Autoplay policies may defer playback until the page receives a
            // user gesture. The native loading flow must continue regardless.
        });
        // On the new page, hero art and queue controls are siblings. Insert
        // the rocket between them: it overlays only the art while the native
        // controls and guide stay above it and keep their focus behavior.
        if ($heroArt) {
            $heroArt.insertAdjacentElement('afterend', $video);
        } else {
            mount.prepend($video);
        }
        LoadingScreen.$rocketVideo = $video;
    }

    private static removeOriginalRocket() {
        LoadingScreen.rocketRequested = false;
        const $video = LoadingScreen.$rocketVideo;
        if (!$video) {
            return;
        }

        $video.pause();
        $video.removeAttribute('src');
        $video.load();
        $video.remove();
        LoadingScreen.$rocketVideo = undefined;
    }

    /** Restores the first-party Xbox logo clip omitted by the refreshed
     * connecting-hero-art route. */
    private static showXboxSplash() {
        if (getGlobalPref(GlobalPref.UI_SKIP_SPLASH_VIDEO) || LoadingScreen.$xboxSplashVideo?.isConnected) {
            return;
        }

        const mount = document.querySelector<HTMLElement>('#game-stream');
        if (!mount) {
            return;
        }

        const $video = CE('video', {
            class: 'bx-original-xbox-splash-video',
            playsinline: true,
            preload: 'auto',
            'aria-hidden': 'true',
        }) as HTMLVideoElement;
        const remove = () => {
            $video.pause();
            $video.removeAttribute('src');
            $video.load();
            $video.remove();
            if (LoadingScreen.$xboxSplashVideo === $video) {
                LoadingScreen.$xboxSplashVideo = undefined;
            }
        };

        $video.src = LoadingScreen.XBOX_SPLASH_VIDEO_URL;
        $video.addEventListener('ended', remove, { once: true });
        $video.addEventListener('error', remove, { once: true });
        mount.appendChild($video);
        LoadingScreen.$xboxSplashVideo = $video;

        // Xbox's own clip has audio. Try normal playback first and use the
        // muted autoplay fallback only when the browser requires it.
        $video.play().catch(() => {
            $video.muted = true;
            $video.play().catch(remove);
        });
    }

    private static hideRocket() {
        LoadingScreen.removeOriginalRocket();
        let $bgStyle = LoadingScreen.$bgStyle;

        $bgStyle.textContent! += compressCss(`
#game-stream div[class*=RocketAnimation-module__container] > svg {
    display: none;
}

#game-stream video[class*=RocketAnimationVideo-module__video] {
    display: none;
}
`);
    }

    private static setBackground(imageUrl: string) {
        // Setup style tag
        let $bgStyle = LoadingScreen.$bgStyle;

        // Limit max width to reduce image size
        imageUrl = imageUrl + '?w=1920';

        const imageQuality = getGlobalPref(GlobalPref.UI_IMAGE_QUALITY);
        if (imageQuality !== 90) {
            imageUrl += '&q=' + imageQuality;
        }

        $bgStyle.textContent! += compressCss(`
#game-stream {
    background-color: transparent !important;
    background-position: center center !important;
    background-repeat: no-repeat !important;
    background-size: cover !important;
}

#game-stream rect[width="800"] {
    transition: opacity 0.3s ease-in-out !important;
}
`) + `#game-stream {background-image: linear-gradient(#00000033, #000000e6), url(${imageUrl}) !important;}`;

        const bg = new Image();
        bg.onload = e => {
            $bgStyle.textContent += compressCss(`
#game-stream rect[width="800"] {
    opacity: 0 !important;
}
`);
        };
        bg.src = imageUrl;
    }

    static setupWaitTime(waitTime: number) {
        if (getGlobalPref(GlobalPref.LOADING_SCREEN_ROCKET) === LoadingScreenRocket.HIDE_QUEUE) {
            LoadingScreen.hideRocket();
        }
        LoadingScreen.showLeaveQueueButton();

        LoadingScreen.waitTimeInterval && clearInterval(LoadingScreen.waitTimeInterval);
        let secondsLeft = waitTime;
        let $countDown;
        let $estimated;

        LoadingScreen.orgWebTitle = document.title;

        // Date stores an absolute instant already. Adding the timezone offset
        // before formatting shifted the displayed completion time on every
        // non-UTC locale. Format the local end time directly instead.
        const endDate = new Date(Date.now() + waitTime * 1000);
        const pad = (value: number) => value.toString().padStart(2, '0');
        let endDateStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`
            + ` ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:${pad(endDate.getSeconds())}`;
        endDateStr += ` (${LoadingScreen.secondsToString(waitTime)})`;

        let $waitTimeBox = LoadingScreen.$waitTimeBox;
        if (!$waitTimeBox) {
            $waitTimeBox = CE('div', { class: 'bx-wait-time-box' },
                CE('label', false, t('server')),
                CE('span', false, getPreferredServerRegion()),
                CE('label', false, t('wait-time-estimated')),
                $estimated = CE('span', { class: 'bx-wait-time-estimated' }),
                CE('label', false, t('wait-time-countdown')),
                $countDown = CE('span', { class: 'bx-wait-time-countdown' }),
            );

            document.documentElement.appendChild($waitTimeBox);
            LoadingScreen.$waitTimeBox = $waitTimeBox;
        } else {
            $waitTimeBox.classList.remove('bx-gone');
            $estimated = $waitTimeBox.querySelector('.bx-wait-time-estimated')!;
            $countDown = $waitTimeBox.querySelector('.bx-wait-time-countdown')!;
        }

        $estimated.textContent = endDateStr;
        $countDown.textContent = LoadingScreen.secondsToString(secondsLeft);
        document.title = `[${$countDown.textContent}] ${LoadingScreen.orgWebTitle}`;

        LoadingScreen.waitTimeInterval = window.setInterval(() => {
            secondsLeft--;

            if (secondsLeft <= 0) {
                // This value comes from Xbox as an estimate. Do not pretend
                // the game is ready merely because that estimate elapsed.
                $countDown.textContent = 'Aguardando servidor';
                document.title = LoadingScreen.orgWebTitle;
                LoadingScreen.waitTimeInterval && clearInterval(LoadingScreen.waitTimeInterval);
                LoadingScreen.waitTimeInterval = null;
                return;
            }

            $countDown.textContent = LoadingScreen.secondsToString(secondsLeft);
            document.title = `[${$countDown.textContent}] ${LoadingScreen.orgWebTitle}`;
        }, 1000);
    }

    /** Lets the player abandon a long provisioning queue without needing to
     * wait for the stream UI (and its regular Leave game action) to mount. */
    private static showLeaveQueueButton() {
        let $button = LoadingScreen.$leaveQueueButton;
        if (!$button) {
            $button = CE('button', {
                class: 'bx-leave-queue-button',
                type: 'button',
            }, 'Sair da fila') as HTMLButtonElement;

            $button.addEventListener('click', () => {
                LoadingScreen.reset();
                const locale = window.location.pathname.match(/^\/([a-z]{2}-[a-z]{2})\//i)?.[1] || 'pt-BR';
                window.location.assign(`${window.location.origin}/${locale}/play`);
            });
            document.documentElement.appendChild($button);
            LoadingScreen.$leaveQueueButton = $button;
        }

        $button.classList.remove('bx-gone');
    }

    static hide() {
        LoadingScreen.removeOriginalRocket();
        LoadingScreen.showXboxSplash();
        LoadingScreen.orgWebTitle && (document.title = LoadingScreen.orgWebTitle);
        LoadingScreen.$waitTimeBox && LoadingScreen.$waitTimeBox.classList.add('bx-gone');
        LoadingScreen.$leaveQueueButton && LoadingScreen.$leaveQueueButton.classList.add('bx-gone');

        if (getGlobalPref(GlobalPref.LOADING_SCREEN_GAME_ART) && LoadingScreen.$bgStyle) {
            const $rocketBg = document.querySelector('#game-stream rect[width="800"]');
            $rocketBg && $rocketBg.addEventListener('transitionend', e => {
                LoadingScreen.$bgStyle.textContent += compressCss(`
#game-stream {
    background: #000 !important;
}
`);
            });

            LoadingScreen.$bgStyle.textContent += compressCss(`
#game-stream rect[width="800"] {
    opacity: 1 !important;
}
`);
        }

        setTimeout(LoadingScreen.reset, 2000);
    }

    static reset() {
        LoadingScreen.removeOriginalRocket();
        LoadingScreen.$bgStyle && (LoadingScreen.$bgStyle.textContent = '');

        LoadingScreen.$waitTimeBox && LoadingScreen.$waitTimeBox.classList.add('bx-gone');
        LoadingScreen.$leaveQueueButton && LoadingScreen.$leaveQueueButton.classList.add('bx-gone');
        LoadingScreen.waitTimeInterval && clearInterval(LoadingScreen.waitTimeInterval);
        LoadingScreen.waitTimeInterval = null;
    }
}
