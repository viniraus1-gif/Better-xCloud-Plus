import { isFullVersion } from "@macros/build" with { type: "macro" };

import { STATES } from "@utils/global";
import { createButton, ButtonStyle, CE } from "@utils/html";
import { BxIcon } from "@utils/bx-icon";
import { getPreferredServerRegion } from "@utils/region";
import { RemotePlayManager } from "@/modules/remote-play-manager";
import { t } from "@utils/translation";
import { SettingsDialog } from "./dialog/settings-dialog";
import { GlobalPref } from "@/enums/pref-keys";
import { getGlobalPref } from "@/utils/pref-utils";
import { BxLogger } from "@/utils/bx-logger";
import { BxEventBus } from "@/utils/bx-event-bus";
import { BlockFeature } from "@/enums/pref-values";
import { Toast } from "@/utils/toast";
import { BxEvent } from "@/utils/bx-event";

// Saved while the module loads, before the Remote Play compatibility patch
// replaces the Fullscreen API.
const nativeRequestFullscreen = HTMLElement.prototype.requestFullscreen;
const nativeExitFullscreen = Document.prototype.exitFullscreen;
const nativeFullscreenElementGetter = (() => {
    let prototype: object | null = document;
    while ((prototype = Object.getPrototypeOf(prototype))) {
        const descriptor = Object.getOwnPropertyDescriptor(prototype, 'fullscreenElement');
        if (descriptor?.get) {
            return descriptor.get;
        }
    }
})();

export class HeaderSection {
    private static instance: HeaderSection;
    public static getInstance = () => HeaderSection.instance ?? (HeaderSection.instance = new HeaderSection());
    private readonly LOG_TAG = 'HeaderSection';

    private $btnRemotePlay: HTMLElement | null;
    private $btnSettings: HTMLElement;
    private $btnFullscreen: HTMLElement;
    private $buttonsWrapper: HTMLElement;
    private $localeButton: HTMLElement | null = null;
    private headerRestoreTimers: number[] = [];
    private headerRestoreInterval: number | null = null;
    private headerObserver?: MutationObserver;
    private headerCheckQueued = false;

    constructor() {
        BxLogger.info(this.LOG_TAG, 'constructor()');

        if (isFullVersion()) {
            this.$btnRemotePlay = createButton({
                classes: ['bx-header-remote-play-button', 'bx-gone'],
                icon: BxIcon.REMOTE_PLAY,
                title: t('remote-play'),
                style: ButtonStyle.GHOST | ButtonStyle.FOCUSABLE | ButtonStyle.CIRCULAR,
                onClick: e => RemotePlayManager.getInstance()?.togglePopup(),
            });
        } else {
            this.$btnRemotePlay = null;
        }

        let $btnSettings = this.$btnSettings = createButton({
            classes: ['bx-header-settings-button', 'bx-gone'],
            label: t('better-xcloud'),
            style: ButtonStyle.FROSTED | ButtonStyle.DROP_SHADOW | ButtonStyle.FOCUSABLE | ButtonStyle.FULL_HEIGHT,
            onClick: e => SettingsDialog.getInstance().show(),
        });

        this.$btnFullscreen = createButton({
            classes: ['bx-hub-fullscreen-button'],
            icon: BxIcon.DISPLAY,
            title: t('fullscreen'),
            style: ButtonStyle.FROSTED | ButtonStyle.DROP_SHADOW | ButtonStyle.FOCUSABLE | ButtonStyle.NORMAL_CASE,
            onClick: this.onFullscreenClick,
        });

        document.addEventListener('fullscreenchange', this.syncFullscreenButton);
        // The patched history event fires immediately before the URL changes.
        // Deferring one task makes the visibility check use the new route.
        window.addEventListener(BxEvent.POPSTATE, () => window.setTimeout(this.updateFullscreenButton));
        window.addEventListener(BxEvent.POPSTATE, this.scheduleHeaderRestore);
        BxEventBus.Stream.on('state.stopped', this.scheduleHeaderRestore);

        this.$buttonsWrapper = CE('div', false,
            !getGlobalPref(GlobalPref.BLOCK_FEATURES).includes(BlockFeature.REMOTE_PLAY) ? this.$btnRemotePlay : null,
            this.$btnSettings,
        );
        this.observeHeaderReplacement();
        window.addEventListener('bx-server-region-changed', () => {
            this.updateServerButton();
            this.decorateLocaleButtons();
        });
        // The Xbox market button can mount before, after, or outside the
        // header we use to position Better xCloud controls. Scan once after
        // that mount so its flag does not depend on a class-name match.
        window.setTimeout(() => this.decorateLocaleButtons(), 500);

        BxEventBus.Script.on('xcloud.server', ({status}) => {
            if (status === 'ready') {
                STATES.isSignedIn = true;

                this.updateServerButton();
            } else if (status === 'error') {
                Toast.show(t('server-list-error'), '❌', { instant: true });
            } else if (status === 'unavailable') {
                STATES.supportedRegion = false;

                // Open Settings dialog on Unsupported page
                const $unsupportedPage = document.querySelector<HTMLElement>('div[class^=UnsupportedMarketPage-module__container]');
                if ($unsupportedPage) {
                    SettingsDialog.getInstance().show();
                }
            }

            $btnSettings.classList.remove('bx-gone');
        });
    }

    checkHeader = () => {
        this.decorateLocaleButtons();
        const $header = this.findHeader();
        if (!$header) {
            return;
        }

        // Xbox can render the market button outside the hub layout (for
        // example the compact "BR BRS" button). Decorate it here instead of
        // only while positioning the fullscreen button below.
        let $target = $header.querySelector<HTMLElement>('div[class*=EdgewaterHeader-module__rightSectionSpacing], div[class*=RemotePlayHeader-module__rightSectionSpacing]');
        if (!$target) {
            $target = document.querySelector<HTMLElement>('div[class^=UnsupportedMarketPage-module__buttons]');
        }

        // The hub header is rebuilt with different class names after a stream
        // ends. Its right-side buttons are stable, though, so use their parent
        // as a fallback instead of silently losing the Better xCloud menu.
        if (!$target) {
            const $lastHeaderButton = Array.from($header.querySelectorAll<HTMLElement>('button'))
                .filter($button => !$button.classList.contains('bx-header-settings-button'))
                .at(-1);
            $target = $lastHeaderButton?.parentElement
                || ($header.lastElementChild as HTMLElement | null)
                || $header;
        }

        // Add the Settings button to the web page
        $target?.appendChild(this.$buttonsWrapper);
        this.$btnSettings.classList.remove('bx-gone');

        if (!STATES.isSignedIn) {
            BxEventBus.Script.emit('xcloud.server', { status: 'signed-out' });
        }

        this.updateFullscreenButton();
    }

    private findHeader() {
        return document.querySelector<HTMLElement>('#gamepass-root header[class*=Header-module__header]')
            || document.querySelector<HTMLElement>('#gamepass-root header')
            || document.querySelector<HTMLElement>('header[class*=Header-module__header]')
            || document.querySelector<HTMLElement>('header[class*=RemotePlayHeader-module__header]');
    }

    private decorateLocaleButtons() {
        document.querySelectorAll<HTMLElement>('button').forEach($button => {
            if (/^[a-z]{2}\s[a-z]{3}$/i.test($button.textContent?.trim() || '')) {
                this.addLocaleFlag($button);
            }
        });
    }

    private getSelectedServerFlagCode(): string {
        const regionName = getPreferredServerRegion();
        const region = regionName ? STATES.serverRegions[regionName] : undefined;
        const code = region?.flagCode || [...(region?.flag || '')]
            .map(char => String.fromCharCode(char.codePointAt(0)! - 0x1F1E6 + 65))
            .join('')
            .toLowerCase();
        return code.length === 2 ? code : '';
    }

    private updateServerButton() {
        const regionName = getPreferredServerRegion();
        const region = regionName ? STATES.serverRegions[regionName] : undefined;
        const flagCode = this.getSelectedServerFlagCode();
        const serverName = region?.shortName.replace(region.flag || '', '').trim()
            || getPreferredServerRegion(true)
            || t('better-xcloud');
        const $serverLabel = this.$btnSettings.querySelector('span')!;

        $serverLabel.replaceChildren(
            flagCode ? CE('img', {
                class: 'bx-server-menu-flag',
                src: `https://flagcdn.com/w40/${flagCode}.png`,
                alt: '',
            }) : '',
            document.createTextNode(serverName),
        );
    }

    // xCloud removes and rebuilds its header after a stream ends. Re-attach
    // the existing Better xCloud controls once the replacement header arrives.
    private scheduleHeaderRestore = () => {
        this.headerRestoreTimers.forEach(timer => clearTimeout(timer));
        if (this.headerRestoreInterval !== null) {
            clearInterval(this.headerRestoreInterval);
        }

        this.headerRestoreTimers = [80, 350, 900].map(delay => window.setTimeout(() => {
            this.checkHeader();
        }, delay));

        // Leaving a game may replace the header more than once (loading shell
        // then signed-in hub). Keep reattaching for a short period so the menu
        // survives the final replacement too.
        let attempts = 0;
        this.headerRestoreInterval = window.setInterval(() => {
            this.checkHeader();
            attempts++;
            if (attempts >= 30) {
                clearInterval(this.headerRestoreInterval!);
                this.headerRestoreInterval = null;
            }
        }, 250);
    }

    /**
     * Stream exit can rebuild the hub header after its state event has already
     * fired. Watch for that replacement instead of relying solely on timed
     * retries, so the Better xCloud menu returns without a page refresh.
     */
    private observeHeaderReplacement() {
        if (this.headerObserver) return;

        this.headerObserver = new MutationObserver(() => {
            this.decorateLocaleButtons();
            const $header = this.findHeader();
            if (!$header) {
                return;
            }

            if ($header.contains(this.$buttonsWrapper) || this.headerCheckQueued) {
                return;
            }

            this.headerCheckQueued = true;
            window.setTimeout(() => {
                this.headerCheckQueued = false;
                this.checkHeader();
            }, 0);
        });
        this.headerObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    private isHubPage = () => /^\/[a-zA-Z]{2}-[a-zA-Z]{2}\/play\/?$/.test(window.location.pathname);

    private syncFullscreenButton = () => {
        const isFullscreen = nativeFullscreenElementGetter?.call(document) === document.documentElement;
        this.$btnFullscreen.title = t('fullscreen');
        this.$btnFullscreen.setAttribute('aria-label', t('fullscreen'));
        this.$btnFullscreen.classList.toggle('bx-hub-fullscreen-active', isFullscreen);
    }

    private onFullscreenClick = (e: Event) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        void this.toggleFullscreen();
    }

    private toggleFullscreen = async () => {
        try {
            if (nativeFullscreenElementGetter?.call(document) === document.documentElement) {
                await nativeExitFullscreen.call(document);
            } else {
                await nativeRequestFullscreen.call(document.documentElement);
            }
        } catch {
            // A browser can reject fullscreen because of its own policy.
        }

        this.syncFullscreenButton();
    }

    private updateFullscreenButton = () => {
        const $header = this.findHeader();
        if (!this.isHubPage() || !$header) {
            this.$btnFullscreen.remove();
            (window.BX_EXPOSED as any).hubFullscreenButton = null;
            return;
        }

        // Put the control immediately before Xbox's language/market picker
        // (for example, "BR BRS"), instead of floating over the content.
        const $localeButton = $header.querySelector<HTMLElement>(
            'button[class*=Locale], button[class*=locale], button[class*=Region], button[class*=region], button[class*=Market], button[class*=market]'
        ) || Array.from($header.querySelectorAll<HTMLElement>('button')).find($button =>
            /^[a-z]{2}\s[a-z]{3}$/i.test($button.textContent?.trim() || '')
        );

        if ($localeButton?.parentElement) {
            this.addLocaleFlag($localeButton);
            $localeButton.parentElement.insertBefore(this.$btnFullscreen, $localeButton);
            this.$localeButton = $localeButton;
        } else {
            $header.appendChild(this.$btnFullscreen);
            this.$localeButton = null;
        }

        // Expose the real target to xCloud's patched focus manager. When its
        // navigation reaches the adjacent native CTA, it redirects the focus
        // to this button and A activates it like any other xCloud control.
        (window.BX_EXPOSED as any).hubFullscreenButton = this.$btnFullscreen;

        const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find($button => {
            const text = normalize($button.textContent?.trim() || '');
            return text.includes('experimentar a nova experiencia') || text.includes('try the new experience');
        })?.classList.add('bx-hide-in-browser-fullscreen');

        this.syncFullscreenButton();
    }

    /** Add a real flag image to Xbox's own market button (for example BR BRS).
     * Emoji flags become plain letters in some Windows font installations. */
    private addLocaleFlag($button: HTMLElement) {
        const countryCode = this.getSelectedServerFlagCode()
            || $button.textContent?.trim().match(/^([a-z]{2})\s/i)?.[1]?.toLowerCase();
        if (!countryCode) {
            return;
        }

        const $existingFlag = $button.querySelector<HTMLImageElement>('.bx-locale-flag');
        if ($existingFlag) {
            $existingFlag.src = `https://flagcdn.com/w40/${countryCode}.png`;
        } else {
            $button.prepend(CE('img', {
                class: 'bx-locale-flag',
                src: `https://flagcdn.com/w40/${countryCode}.png`,
                alt: '',
            }));
        }
    }

    showRemotePlayButton() {
        this.$btnRemotePlay?.classList.remove('bx-gone');
    }
}
