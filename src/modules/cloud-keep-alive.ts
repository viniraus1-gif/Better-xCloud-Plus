import { GlobalPref } from '@/enums/pref-keys';
import { getGlobalPref } from '@/utils/pref-utils';
import { Toast } from '@/utils/toast';
import { t } from '@/utils/translation';

/**
 * Handles the visible xCloud inactivity confirmation as a fallback for Xbox
 * builds that do not emit the older `WarningForBeingIdle` server message.
 */
export class CloudKeepAlive {
    private static observer?: MutationObserver;
    private static lastConfirmationAt = 0;

    static initialize() {
        if (CloudKeepAlive.observer) return;

        CloudKeepAlive.observer = new MutationObserver(() => CloudKeepAlive.confirmInactivityPrompt());
        CloudKeepAlive.observer.observe(document.documentElement, { childList: true, subtree: true });
        CloudKeepAlive.confirmInactivityPrompt();
    }

    private static confirmInactivityPrompt() {
        if (!getGlobalPref(GlobalPref.STREAM_CLOUD_KEEP_ALIVE)
            || !window.location.pathname.includes('/play/launch/')) {
            return;
        }

        // Xbox localizes this dialog, so match its affirmative action rather
        // than a fragile modal class name. The explicit text checks keep this
        // constrained to the inactivity confirmation.
        const $button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => {
            const text = button.textContent?.trim().toLocaleLowerCase() || '';
            return text === 'ainda estou aqui' || text === 'i\'m still here' || text === 'i am still here';
        });

        if (!$button || $button.disabled) return;

        const now = Date.now();
        if (now - CloudKeepAlive.lastConfirmationAt < 2_000) return;
        CloudKeepAlive.lastConfirmationAt = now;
        $button.click();
        Toast.show(t('cloud-session-kept-alive'), '✓', { instant: true });
    }
}
