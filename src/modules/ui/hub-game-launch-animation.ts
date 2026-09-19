/**
 * Gives hub game cards a short visual hand-off before xCloud changes route.
 * The event is replayed after the animation so it works for mouse, keyboard,
 * touch, and the synthetic click produced by controller navigation.
 */
export class HubGameLaunchAnimation {
    private static isReplayingClick = false;

    static setup() {
        document.addEventListener('click', HubGameLaunchAnimation.onGameCardClick, true);
    }

    private static onGameCardClick = (event: MouseEvent) => {
        if (HubGameLaunchAnimation.isReplayingClick || event.defaultPrevented || !HubGameLaunchAnimation.isHubPage()) {
            return;
        }

        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const $card = target.closest<HTMLElement>('button[class*="MruGameCard"], a[class*="GameCard"], a[class*="GameItem"]');
        if (!$card) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        $card.classList.add('bx-hub-game-launching');
        document.documentElement.dataset.bxGameLaunching = 'true';

        const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
        window.setTimeout(() => {
            document.documentElement.removeAttribute('data-bx-game-launching');
            HubGameLaunchAnimation.isReplayingClick = true;
            target.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
            }));
            HubGameLaunchAnimation.isReplayingClick = false;
        }, duration);
    };

    private static isHubPage() {
        return /\/play\/?$/i.test(window.location.pathname);
    }
}
