import { CE } from "@utils/html";
import { compressCss, isLiteVersion, renderStylus } from "@macros/build" with { type: "macro" };
import { BlockFeature, UiSection, UiTheme } from "@/enums/pref-values";
import { GlobalPref } from "@/enums/pref-keys";
import { getGlobalPref } from "./pref-utils";
import { containsAll } from "./utils";
import { BxEvent } from "./bx-event";


export function addCss() {
    const STYLUS_CSS = renderStylus() as unknown as string;
    let css = STYLUS_CSS;

    const PREF_HIDE_SECTIONS = getGlobalPref(GlobalPref.UI_HIDE_SECTIONS);
    const selectorToHide = [];

    if (isLiteVersion()) {
        // Hide Controller icon in Game tiles
        selectorToHide.push('div[role=img][class*=SupportedInputsBadge] svg:first-of-type');
        selectorToHide.push('div[role=img][class*=SupportedInputsBadge]:not(:has(:nth-child(2)))');
    }

    // Hide "News" section
    if (PREF_HIDE_SECTIONS.includes(UiSection.NEWS)) {
        selectorToHide.push('#BodyContent > div[class*=CarouselRow-module]');
    }

    // Hide BYOG section
    if (getGlobalPref(GlobalPref.UI_HIDE_SECTIONS).includes(UiSection.BOYG)) {
        selectorToHide.push('#BodyContent > div[class*=ShowcaseRow-module__container___]');
    }

    // Hide "All games" section
    if (PREF_HIDE_SECTIONS.includes(UiSection.ALL_GAMES)) {
        selectorToHide.push('#BodyContent div[class*=AllGamesRow-module__gridContainer]');
        selectorToHide.push('#BodyContent div[class*=AllGamesRow-module__rowHeader]');
    }

    // Hide "Most popular" section
    if (PREF_HIDE_SECTIONS.includes(UiSection.MOST_POPULAR)) {
        selectorToHide.push('#BodyContent div[class*=HomePage-module__bottomSpacing]:has(a[href="/play/gallery/popular"])');
    }

    // Hide "Play with touch" section
    if (PREF_HIDE_SECTIONS.includes(UiSection.TOUCH)) {
        selectorToHide.push('#BodyContent div[class*=HomePage-module__bottomSpacing]:has(a[href="/play/gallery/touch"])');
    }

    // Hide "Recently added" section
    if (PREF_HIDE_SECTIONS.includes(UiSection.RECENTLY_ADDED)) {
        selectorToHide.push('#BodyContent div[class*=HomePage-module__bottomSpacing]:has(a[href="/play/gallery/recently-added"])');
    }

    // Hide "Genres section"
    if (PREF_HIDE_SECTIONS.includes(UiSection.GENRES)) {
        selectorToHide.push('#BodyContent div[class*=HomePage-module__genresRow]');
    }

    // Hide "GamePassPromo"
    if (containsAll(PREF_HIDE_SECTIONS, [UiSection.RECENTLY_ADDED, UiSection.LEAVING_SOON, UiSection.GENRES, UiSection.ALL_GAMES])) {
        selectorToHide.push('#BodyContent div[class*=GamePassPromoSection-module__container]');
    }

   // Hide "Start a party" button in the Guide menu
    if (getGlobalPref(GlobalPref.BLOCK_FEATURES).includes(BlockFeature.FRIENDS)) {
        selectorToHide.push('#gamepass-dialog-root div[class^=AchievementsPreview-module__container] + button[class*=HomeLandingPage-module__button]');
    }

    if (selectorToHide) {
        css += selectorToHide.join(',') + '{ display: none; }';
    }

    // Change site's background
    if (getGlobalPref(GlobalPref.UI_THEME) === UiTheme.DARK_OLED) {
        css += compressCss(`
body[data-theme=dark] {
    --gds-containerSolidAppBackground: #000 !important;
    --gds-containerSolidBackground: #000 !important;
    --gds-containerSemitransparentBackground: #000 !important;
    --gds-containerAcrylicBackground: #000 !important;
}

/* The site token alone only changes the page behind the UI.  These are the
 * opaque surfaces used by the current Xbox shell and by VX's own settings. */
body[data-theme=dark] :is(
    .bx-settings-dialog,
    .bx-settings-tabs,
    .bx-settings-tabs-container,
    .bx-settings-tab-contents,
    .bx-settings-row,
    .bx-navigation-dialog,
    .bx-key-binding-dialog,
    .bx-toast,
    [class*=NavigationMenu-module__],
    [class*=ContextMenu-module__][class*=Dropdown-module__],
    [class*=Dialog-module__dialog],
    #gamepass-dialog-root [role=dialog]
) {
    background-color: #000 !important;
}

/* Preserve hierarchy on pure black displays without reintroducing gray
 * panels: borders and focused rows, rather than fills, separate controls. */
body[data-theme=dark] :is(.bx-settings-row, .bx-settings-tab, .bx-number-stepper, .bx-multiple-options) {
    box-shadow: inset 0 -1px #ffffff1f !important;
}

body[data-theme=dark] .bx-settings-tab:not(.selected):not(:hover),
body[data-theme=dark] .bx-number-stepper > div,
body[data-theme=dark] .bx-multiple-options {
    background-color: #000 !important;
}

body[data-theme=dark] :is(.bx-settings-tab:hover, .bx-settings-tab.selected, .bx-settings-row:focus-within) {
    background-color: #111 !important;
}

html:not([data-bx-product-details=true]) div[aria-hidden=true][class^=BackgroundImageAbsoluteContainer][class*=ProductDetailPage-module__backgroundImageGradient]:after {
    background: radial-gradient(ellipse 100% 100% at 50% 0, #1515178c 0, #1a1b1ea6 32%, #000000 100%) !important;
}

a[href="/play/gallery/all-games"][class*=AllGamesRow-module__seeAllCloudGames] {
    background: none !important;
}
`);
    }

    // Reduce animations
    if (getGlobalPref(GlobalPref.UI_REDUCE_ANIMATIONS)) {
        css += compressCss(`
/*div[class*=GameCard-module__card],*/
div[class^=GameCard-module__gameTitleInnerWrapper],
div[class^=ScrollArrows-module],
div[class^=ContextMenu-module__][class*=Dropdown-module__dropdownWrapper] {
    animation: none !important;
    transition: none !important;
}
`);
    }

    // Hub Plus customises the actual game rails on the home/gallery pages.
    // Keep this scoped to BodyContent so it can never affect the stream HUD.
    const hubCardSize = getGlobalPref(GlobalPref.UI_HUB_CARD_SIZE) / 100;
    const hubRounded = getGlobalPref(GlobalPref.UI_HUB_CARD_ROUNDED);
    const hubHover = getGlobalPref(GlobalPref.UI_HUB_HOVER_EFFECTS);
    const hubAnimations = getGlobalPref(GlobalPref.UI_HUB_ANIMATIONS);
    const hubCardWidth = Math.round(220 * hubCardSize);
    css += `
/* The current Xbox hub renders some rails outside #BodyContent (including
 * search and gallery).  Game URLs are the stable contract across all rails. */
:is(
    div[class*=GameCard-module__card],
    button[class*=MruGameCard],
    div[class*=MruGameCard],
    a[class*=GameCard],
    a[class*=GameItem],
    a[href*="/play/games/"]
) {
    flex: 0 0 ${hubCardWidth}px !important;
    width: ${hubCardWidth}px !important;
    max-width: ${hubCardWidth}px !important;
}

:is(button[class*=MruGameCard], div[class*=MruGameCard], a[class*=GameCard], a[class*=GameItem], a[href*="/play/games/"]) {
    display: block !important;
}

:is(
    div[class*=GameCard-module__card],
    button[class*=MruGameCard],
    div[class*=MruGameCard],
    a[class*=GameCard],
    a[class*=GameItem],
    a[href*="/play/games/"]
) {
    border-radius: ${hubRounded ? '12px' : '0'} !important;
    overflow: hidden !important;
    transition: ${hubAnimations ? 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease' : 'none'} !important;
    will-change: transform;
}

:is(div[class*=GameCard-module__card], button[class*=MruGameCard], div[class*=MruGameCard], a[class*=GameCard], a[class*=GameItem], a[href*="/play/games/"]):is(:hover, :focus, :focus-visible, :focus-within, .bx-hub-controller-focused) {
    transform: ${hubHover ? 'scale(1.045)' : 'none'} !important;
    box-shadow: ${hubHover ? '0 10px 24px #000b' : 'none'} !important;
    filter: ${hubHover ? 'brightness(1.08) saturate(1.08)' : 'none'} !important;
}

@keyframes bx-hub-game-launch {
    0% { transform: perspective(900px) translateZ(0) scale(1); filter: brightness(1); opacity: 1; }
    22% { transform: perspective(900px) translateZ(0) scale(0.955); filter: brightness(1.3) saturate(1.16); opacity: 1; }
    100% { transform: perspective(900px) translateZ(180px) scale(1.25); filter: brightness(1.18) saturate(1.1) blur(1px); opacity: 0; }
}

:is(button, a).bx-hub-game-launching {
    animation: bx-hub-game-launch 460ms cubic-bezier(.2,.78,.18,1) forwards !important;
    transform-origin: center !important;
    position: relative;
    z-index: 5;
}

`;

    // The navigation is owned by xCloud, so this is intentionally only a
    // visual acknowledgement that starts before its route transition.
    const hubLaunchListenerKey = '__bxHubLaunchListenerAttached';
    const windowWithHubListener = window as typeof window & Record<string, boolean>;
    // The dynamic hub backdrop was removed because the current Xbox "Voltar
    // a jogar" rail does not expose a stable selected-card API.
    if (false && !windowWithHubListener[hubLaunchListenerKey]) {
        windowWithHubListener[hubLaunchListenerKey] = true;
        let $backdrop: HTMLElement | null = null;
        let backdropImageUrl = '';
        let $activeHubCard: HTMLElement | null = null;

        const getBackdrop = () => {
            if ($backdrop?.isConnected) {
                return $backdrop;
            }

            $backdrop = CE('div', { class: 'bx-hub-selection-backdrop', 'aria-hidden': 'true' });
            document.body.prepend($backdrop);
            return $backdrop;
        };

        const getCardImageUrl = ($card: HTMLElement) => {
            const $image = $card?.querySelector<HTMLImageElement>('img');
            const imageUrl = $image?.currentSrc || $image?.src ||
                $card.querySelector<HTMLSourceElement>('source')?.srcset?.split(',')[0]?.trim().split(' ')[0];

            if (imageUrl) {
                return imageUrl;
            }

            // "Voltar a jogar" can render the cover through CSS instead of an
            // <img>. Find the first card child with a background image too.
            for (const $element of [$card, ...Array.from($card.querySelectorAll<HTMLElement>('*'))]) {
                const match = getComputedStyle($element).backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
                if (match?.[1]) {
                    return match[1];
                }
            }

            return '';
        };

        const updateHubBackdrop = ($card: HTMLElement | null) => {
            const imageUrl = $card && getCardImageUrl($card);
            if (!imageUrl || imageUrl === backdropImageUrl) {
                $card && ($activeHubCard = $card);
                return;
            }

            $activeHubCard = $card;
            backdropImageUrl = imageUrl;
            const image = new Image();
            image.onload = () => {
                // Ignore an image that finished after focus moved to another card.
                if (imageUrl !== backdropImageUrl) {
                    return;
                }

                const $layer = CE('div', {
                    class: 'bx-hub-selection-backdrop-image',
                    style: `background-image:url(${JSON.stringify(imageUrl)})`,
                });
                const $target = getBackdrop();
                $target.appendChild($layer);
                requestAnimationFrame(() => $layer.classList.add('bx-active'));

                window.setTimeout(() => {
                    $target.querySelectorAll('.bx-hub-selection-backdrop-image:not(:last-child)').forEach($oldLayer => $oldLayer.remove());
                }, 950);
            };
            image.src = imageUrl;
        };

        const gameCardSelector = ':is(button[class*=MruGameCard], div[class*=MruGameCard], a[class*=GameCard], a[class*=GameItem], a[href*="/play/games/"])';
        const findGameCard = (target: EventTarget | null) => {
            if (!(target instanceof Element)) {
                return null;
            }

            // Standard rails focus the link itself, while "Voltar a jogar"
            // focuses a wrapper around the card. Support both structures.
            return target.closest<HTMLElement>(gameCardSelector) || target.querySelector<HTMLElement>(gameCardSelector);
        };

        const syncFocusedHubCard = () => {
            const $focusedCard = findGameCard(document.activeElement) ||
                document.querySelector<HTMLElement>(`${gameCardSelector}[aria-selected="true"], ${gameCardSelector}[aria-current="true"], ${gameCardSelector}[data-selected="true"], ${gameCardSelector}[data-focused="true"]`);
            updateHubBackdrop($focusedCard);
        };

        const releaseHubHeader = () => {
            const $header = document.querySelector<HTMLElement>('#gamepass-root header[class*=Header-module__header]');
            let $element: HTMLElement | null = $header;
            // The Xbox website changes which header ancestor is sticky between
            // releases. Only unpin ancestors that are actually sticky/fixed.
            for (let i = 0; $element && i < 3; i++, $element = $element.parentElement) {
                const position = getComputedStyle($element).position;
                if (position === 'sticky' || position === 'fixed') {
                    $element.style.setProperty('position', 'static', 'important');
                    $element.style.setProperty('top', 'auto', 'important');
                    $element.style.setProperty('bottom', 'auto', 'important');
                }
            }
        };

        window.addEventListener(BxEvent.NAVIGATION_FOCUS_CHANGED, e => {
            document.querySelectorAll('.bx-hub-controller-focused').forEach($elm => {
                $elm.classList.remove('bx-hub-controller-focused');
            });

            const focusedElement = (e as any).element;
            if (!(focusedElement instanceof Element)) return;

            const $card = findGameCard(focusedElement);
            $card?.classList.add('bx-hub-controller-focused');
            updateHubBackdrop($card);
        });

        document.addEventListener('pointerover', e => updateHubBackdrop(findGameCard(e.target)), { passive: true });
        document.addEventListener('focusin', e => updateHubBackdrop(findGameCard(e.target)), { passive: true });

        // Xbox changes focus attributes on some Mru cards without moving DOM
        // focus. The user script can run before <body> exists, so defer this
        // observer instead of letting it abort the whole generated stylesheet.
        const observeHubSelection = () => {
            if (!document.body) {
                return;
            }

            new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    const $target = mutation.target as HTMLElement;
                    const className = typeof $target.className === 'string' ? $target.className : '';
                    const isSelected = $target.getAttribute('aria-selected') === 'true' ||
                        $target.getAttribute('aria-current') === 'true' ||
                        $target.dataset.selected === 'true' ||
                        $target.dataset.focused === 'true' ||
                        /(?:selected|focused|active)/i.test(className);

                    if (isSelected) {
                        updateHubBackdrop(findGameCard($target));
                    }
                }
            }).observe(document.body, {
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'aria-selected', 'aria-current', 'data-selected', 'data-focused', 'tabindex'],
            });
        };

        if (document.body) {
            observeHubSelection();
        } else {
            window.addEventListener('DOMContentLoaded', observeHubSelection, { once: true });
        }

        const getHubCards = () => Array.from(document.querySelectorAll<HTMLElement>(gameCardSelector))
            .filter($card => $card.isConnected && getCardImageUrl($card));

        const findAdjacentHubCard = (direction: 'up' | 'right' | 'down' | 'left') => {
            const cards = getHubCards();
            if (!cards.length) {
                return null;
            }

            const current = $activeHubCard && cards.find($card => $card === $activeHubCard || $card.contains($activeHubCard!));
            if (!current) {
                return cards[0];
            }

            const currentBox = current.getBoundingClientRect();
            const currentX = currentBox.left + currentBox.width / 2;
            const currentY = currentBox.top + currentBox.height / 2;
            const isHorizontal = direction === 'left' || direction === 'right';
            const candidates = cards.filter($card => {
                if ($card === current) return false;
                const box = $card.getBoundingClientRect();
                const x = box.left + box.width / 2;
                const y = box.top + box.height / 2;

                if (direction === 'left') return x < currentX - 4 && Math.abs(y - currentY) < Math.max(80, currentBox.height * .7);
                if (direction === 'right') return x > currentX + 4 && Math.abs(y - currentY) < Math.max(80, currentBox.height * .7);
                if (direction === 'up') return y < currentY - 4;
                return y > currentY + 4;
            });

            candidates.sort(($a, $b) => {
                const a = $a.getBoundingClientRect();
                const b = $b.getBoundingClientRect();
                const ax = a.left + a.width / 2;
                const ay = a.top + a.height / 2;
                const bx = b.left + b.width / 2;
                const by = b.top + b.height / 2;
                const distanceA = isHorizontal ? Math.abs(ax - currentX) + Math.abs(ay - currentY) * 2 : Math.abs(ay - currentY) + Math.abs(ax - currentX) * 2;
                const distanceB = isHorizontal ? Math.abs(bx - currentX) + Math.abs(by - currentY) * 2 : Math.abs(by - currentY) + Math.abs(bx - currentX) * 2;
                return distanceA - distanceB;
            });

            return candidates[0] || current;
        };

        // "Voltar a jogar" has no usable focus callback on the current Xbox
        // hub. Follow D-pad navigation there so its background remains in sync.
        const dpadStates: boolean[] = [];
        window.setInterval(() => {
            if (document.querySelector('.bx-navigation-dialog:not(.bx-gone)')) {
                return;
            }

            const gamepad = Array.from(navigator.getGamepads()).find($gamepad => $gamepad?.connected);
            if (!gamepad) {
                return;
            }

            const directionByButton: Record<number, 'up' | 'down' | 'left' | 'right'> = {
                12: 'up', 13: 'down', 14: 'left', 15: 'right',
            };
            for (const buttonIndex in directionByButton) {
                const index = Number(buttonIndex);
                const pressed = !!gamepad.buttons[index]?.pressed;
                if (pressed && !dpadStates[index]) {
                    updateHubBackdrop(findAdjacentHubCard(directionByButton[index]));
                }
                dpadStates[index] = pressed;
            }
        }, 50);

        // A few hub rails use a roving tabindex instead of emitting the
        // navigation event. This inexpensive check catches those cards too.
        window.setInterval(syncFocusedHubCard, 120);
        window.setInterval(releaseHubHeader, 1000);
        releaseHubHeader();

        document.addEventListener('click', e => {
            const target = e.target;
            if (!(target instanceof Element)) return;
            const $card = target.closest<HTMLElement>(':is(button[class*=MruGameCard], div[class*=MruGameCard], a[class*=GameCard], a[class*=GameItem], a[href*="/play/games/"])');
            if (!$card) return;
            if ($card.dataset.bxHubLaunchReady === 'true') {
                delete $card.dataset.bxHubLaunchReady;
                return;
            }

            const mouseEvent = e as MouseEvent;
            if (e instanceof MouseEvent && (mouseEvent.button !== 0 || mouseEvent.ctrlKey || mouseEvent.metaKey || mouseEvent.shiftKey || mouseEvent.altKey)) {
                return;
            }

            // xCloud changes routes in its own click handler. Intercept that
            // one click so a frame of the launch transition can be displayed,
            // then replay it for the original card.
            e.preventDefault();
            e.stopImmediatePropagation();

            $card.classList.remove('bx-hub-game-launching');
            // Restart the animation when the same game is opened again.
            void $card.offsetWidth;
            $card.classList.add('bx-hub-game-launching');

            window.setTimeout(() => {
                $card.dataset.bxHubLaunchReady = 'true';
                $card.click();
            }, 420);
        }, true);
    }

    // Hide the top-left dots icon while playing
    if (getGlobalPref(GlobalPref.UI_HIDE_SYSTEM_MENU_ICON)) {
        css += compressCss(`
#StreamHud div[class^=Grip-module__container] {
    visibility: hidden;
}

@media (hover: hover) {
    #StreamHud button[class^=GripHandle-module__container]:hover div[class^=Grip-module__container] {
        visibility: visible;
    }
}

#StreamHud button[class^=GripHandle-module__container][aria-expanded=true] div[class^=Grip-module__container] {
    visibility: visible;
}

#StreamHud button[class^=GripHandle-module__container][aria-expanded=false] {
    background-color: transparent !important;
}

#StreamHud div[class^=StreamHUD-module__buttonsContainer] {
    padding: 0px !important;
}
`);
    }

    css += compressCss(`
#game-stream div[class*=StreamMenu-module__menu] {
    min-width: 100vw !important;
}
`);

    // Simplify Stream's menu
    if (getGlobalPref(GlobalPref.UI_SIMPLIFY_STREAM_MENU)) {
        css += compressCss(`
#game-stream div[class*=Menu-module__scrollable] {
    --bxStreamMenuItemSize: 80px;
    --streamMenuItemSize: calc(var(--bxStreamMenuItemSize) + 40px) !important;
}

.bx-badges {
    top: calc(var(--streamMenuItemSize) - 20px);
}

body[data-media-type=tv] .bx-badges {
    top: calc(var(--streamMenuItemSize) - 10px) !important;
}

#game-stream button[class*=MenuItem-module__container] {
    min-width: auto !important;
    min-height: auto !important;
    width: var(--bxStreamMenuItemSize) !important;
    height: var(--bxStreamMenuItemSize) !important;
}

#game-stream div[class*=MenuItem-module__label] {
    display: none !important;
}

#game-stream svg[class*=MenuItem-module__icon] {
    width: 36px;
    height: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
}
`);
    } else {
        css += compressCss(`
body[data-media-type=tv] .bx-badges {
    top: calc(var(--streamMenuItemSize) + 30px);
}

body:not([data-media-type=tv]) .bx-badges {
    top: calc(var(--streamMenuItemSize) + 20px);
}

body:not([data-media-type=tv]) button[class*=MenuItem-module__container] {
    min-width: auto !important;
    width: 100px !important;
}

body:not([data-media-type=tv]) button[class*=MenuItem-module__container]:nth-child(n+2) {
    margin-left: 10px !important;
}

body:not([data-media-type=tv]) div[class*=MenuItem-module__label] {
    margin-left: 8px !important;
    margin-right: 8px !important;
}
`);
    }

    // Hide scrollbar
    if (getGlobalPref(GlobalPref.UI_SCROLLBAR_HIDE)) {
        css += compressCss(`
html {
    scrollbar-width: none;
}

body::-webkit-scrollbar {
    display: none;
}
`);
    }

    // Visual preferences are re-applied at runtime. Replace the previous
    // generated sheet instead of accumulating stale rules after each toggle.
    const existing = document.getElementById('bx-dynamic-css');
    if (existing) {
        existing.textContent = css;
    } else {
        const $style = CE('style', { id: 'bx-dynamic-css' }, css);
        document.documentElement.appendChild($style);
    }
}


export function preloadFonts() {
    const $link = CE('link', {
            rel: 'preload',
            href: 'https://redphx.github.io/better-xcloud/fonts/promptfont.otf',
            as: 'font',
            type: 'font/otf',
            crossorigin: '',
        });

    document.querySelector('head')?.appendChild($link);
}
