import { StorageKey } from "@/enums/pref-keys";
import { GlobalPref, StreamPref, type AnyPref } from "@/enums/pref-keys";
import { SettingsDialog } from "@/modules/ui/dialog/settings-dialog";
import { t } from "@/utils/translation";
import { ButtonStyle, CE, createButton } from "@/utils/html";
import { PrompFont } from "@/enums/prompt-font";
import { BxEvent } from "@/utils/bx-event";

/** A small first-visit guide for the web version. It is intentionally not a
 * setting: completing or dismissing it records the choice in local storage. */
export class WelcomeTutorial {
    // Version the completion marker so this expanded guided tour is shown once
    // even to people who completed the earlier, text-only introduction.
    private static readonly STORAGE_VALUE = '12';
    private static replayListenerRegistered = false;
    private static lockedElements = new Map<HTMLElement, boolean>();

    static setup() {
        if (!WelcomeTutorial.replayListenerRegistered) {
            WelcomeTutorial.replayListenerRegistered = true;
            window.addEventListener(BxEvent.SHOW_WELCOME_TUTORIAL, () => {
                WelcomeTutorial.clearHighlightAndFocus();
                window.setTimeout(() => WelcomeTutorial.render(), 250);
            });
        }

        if (window.localStorage.getItem(StorageKey.TUTORIAL_DISMISSED) === WelcomeTutorial.STORAGE_VALUE) {
            return;
        }

        const show = () => window.setTimeout(() => WelcomeTutorial.render(), 350);
        if (document.body) {
            show();
        } else {
            window.addEventListener('DOMContentLoaded', show, { once: true });
        }
    }

    private static render() {
        if (document.querySelector('.bx-welcome-tutorial')) {
            return;
        }

        const steps = [
            { title: 'tutorial-intro-title', body: 'tutorial-intro-body', showMenu: false },
            { title: 'tutorial-about-title', body: 'tutorial-about-body', tab: 'global', showMenu: true },
            { title: 'tutorial-server-title', body: 'tutorial-server-body', tab: 'global', pref: GlobalPref.SERVER_REGION },
            { title: 'tutorial-stream-title', body: 'tutorial-stream-body', tab: 'global', pref: GlobalPref.STREAM_RESOLUTION },
            { title: 'tutorial-image-title', body: 'tutorial-image-body', tab: 'stream', pref: StreamPref.VIDEO_SHARPNESS },
            { title: 'tutorial-vx-title', body: 'tutorial-vx-body', tab: 'vx', pref: StreamPref.VX_UPSCALE_TARGET },
            { title: 'tutorial-controls-title', body: 'tutorial-controls-body', tab: 'controller' },
            { title: 'tutorial-controller-navigation-title', body: 'tutorial-controller-navigation-body', tab: 'controller', controllerIcons: true },
            { title: 'tutorial-stats-title', body: 'tutorial-stats-body', tab: 'stats', pref: StreamPref.STATS_SHOW_WHEN_PLAYING },
            { title: 'tutorial-explore-title', body: 'tutorial-explore-body', showMenu: false },
        ] as const;
        let step = 0;
        let settingsShown = false;

        const $title = CE('h2', false, '');
        const $body = CE('p', false, '');
        const $progress = CE('div', { class: 'bx-welcome-tutorial-progress' });
        const $continue = createButton({
            label: t('tutorial-continue'),
            style: ButtonStyle.PRIMARY | ButtonStyle.FOCUSABLE | ButtonStyle.NORMAL_CASE,
        });
        const $back = createButton({
            label: t('tutorial-back'),
            style: ButtonStyle.FROSTED | ButtonStyle.FOCUSABLE | ButtonStyle.NORMAL_CASE,
        });
        const $backdrop = CE('div', { class: 'bx-welcome-tutorial-backdrop' });
        const $overlay = CE('div', { class: 'bx-welcome-tutorial' },
            CE('div', { class: 'bx-welcome-tutorial-card' },
                CE('span', { class: 'bx-welcome-tutorial-kicker' }, 'BETTER XCLOUD PLUS'),
                $title,
                $body,
                $progress,
                CE('div', { class: 'bx-welcome-tutorial-actions' },
                    createButton({
                        label: t('tutorial-skip'),
                        style: ButtonStyle.GHOST | ButtonStyle.FOCUSABLE | ButtonStyle.NORMAL_CASE,
                        onClick: () => WelcomeTutorial.dismiss($overlay, $backdrop, releaseInputLock),
                    }),
                    $back,
                    $continue,
                ),
            ),
        );
        const blockKeyboardOutsideTutorial = (event: KeyboardEvent) => {
            if ($overlay.contains(event.target as Node)) {
                // Keep the tutorial's buttons usable without allowing global
                // xCloud keyboard shortcuts to receive the same input.
                event.stopImmediatePropagation();
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();
        };
        const keepFocusInTutorial = (event: FocusEvent) => {
            if (!$overlay.contains(event.target as Node)) {
                $continue.focus();
            }
        };
        const releaseInputLock = () => {
            document.removeEventListener('keydown', blockKeyboardOutsideTutorial, true);
            document.removeEventListener('keyup', blockKeyboardOutsideTutorial, true);
            document.removeEventListener('keypress', blockKeyboardOutsideTutorial, true);
            document.removeEventListener('focusin', keepFocusInTutorial, true);
            WelcomeTutorial.unlockPage();
        };

        const update = () => {
            const currentStep = steps[step]!;
            $title.textContent = t(currentStep.title);
            if ('controllerIcons' in currentStep && currentStep.controllerIcons) {
                WelcomeTutorial.renderControllerIcons($body);
            } else {
                $body.textContent = t(currentStep.body);
            }
            $progress.replaceChildren(...steps.map((_, index) => CE('i', {
                _dataset: { active: index === step, complete: index < step },
            })));
            $back.toggleAttribute('disabled', step === 0);
            $continue.querySelector('span')!.textContent = t(step === steps.length - 1 ? 'tutorial-start' : 'tutorial-continue');
            // Only the introduction stays centered without the menu. Every
            // following step keeps the menu open and the card in its corner.
            const shouldShowMenu = currentStep.showMenu !== false;
            $overlay.classList.toggle('bx-welcome-tutorial-at-corner', shouldShowMenu);

            if (!shouldShowMenu) {
                WelcomeTutorial.clearHighlightAndFocus();
                if (settingsShown) {
                    settingsShown = false;
                    WelcomeTutorial.hideSettingsWithAnimation();
                    // Keep the elevated dialog layer until its exit animation
                    // finishes; otherwise the tutorial backdrop covers it.
                    window.setTimeout(() => document.body.classList.remove('bx-welcome-tutorial-active'), 230);
                } else {
                    document.body.classList.remove('bx-welcome-tutorial-active');
                }
                return;
            }

            if (!settingsShown) {
                settingsShown = true;
                document.body.classList.add('bx-welcome-tutorial-active');
                SettingsDialog.getInstance().show();
                window.setTimeout(() => {
                    const $dialog = document.querySelector<HTMLElement>('.bx-settings-dialog');
                    $dialog && WelcomeTutorial.lockElement($dialog);
                    WelcomeTutorial.highlight(currentStep.tab, currentStep.pref);
                }, 50);
                return;
            }

            WelcomeTutorial.highlight(currentStep.tab, currentStep.pref);
        };

        $continue.addEventListener('click', () => {
            if (step === steps.length - 1) {
                WelcomeTutorial.dismiss($overlay, $backdrop, releaseInputLock);
                return;
            }
            step++;
            update();
        });

        $back.addEventListener('click', () => {
            if (step === 0) {
                return;
            }

            step--;
            update();
        });

        document.body.append($backdrop, $overlay);
        WelcomeTutorial.lockPage($overlay, $backdrop);
        document.addEventListener('keydown', blockKeyboardOutsideTutorial, true);
        document.addEventListener('keyup', blockKeyboardOutsideTutorial, true);
        document.addEventListener('keypress', blockKeyboardOutsideTutorial, true);
        document.addEventListener('focusin', keepFocusInTutorial, true);
        $continue.focus();
        window.setTimeout(update, 50);
    }

    private static renderControllerIcons($body: HTMLElement) {
        const icon = (value: PrompFont) => CE('span', {
            class: 'bx-welcome-tutorial-gamepad-icon',
            ariaHidden: 'true',
        }, value);
        const row = (icons: HTMLElement[], label: string) => CE('span', {
            class: 'bx-welcome-tutorial-controller-row',
        },
            CE('span', { class: 'bx-welcome-tutorial-controller-icons' }, ...icons),
            CE('span', false, label),
        );

        $body.replaceChildren(
            row([
                icon(PrompFont.START),
                CE('span', { class: 'bx-welcome-tutorial-controller-plus' }, '+'),
                icon(PrompFont.SELECT),
            ], t('tutorial-controller-navigation-open-action')),
            row([
                icon(PrompFont.LEFT),
                icon(PrompFont.UP),
                icon(PrompFont.DOWN),
                icon(PrompFont.RIGHT),
                CE('span', { class: 'bx-welcome-tutorial-controller-or' }, '/'),
                icon(PrompFont.LS),
            ], t('tutorial-controller-navigation-move-action')),
            row([icon(PrompFont.A)], t('tutorial-controller-navigation-select-action')),
            row([icon(PrompFont.B)], t('tutorial-controller-navigation-back-action')),
            CE('span', { class: 'bx-welcome-tutorial-controller-note' }, t('tutorial-controller-navigation-shortcuts-note')),
        );
    }

    private static highlight(tab: string, pref?: AnyPref) {
        const $dialog = document.querySelector<HTMLElement>('.bx-settings-dialog');
        if (!$dialog) {
            return;
        }

        $dialog.querySelectorAll('.bx-tutorial-highlight').forEach($element => $element.classList.remove('bx-tutorial-highlight'));
        const $tab = $dialog.querySelector<HTMLElement>(`.bx-settings-tab[data-group=${tab}]`);
        $tab?.dispatchEvent(new Event('click'));
        $tab?.classList.add('bx-tutorial-highlight');

        if (!pref) {
            return;
        }

        const $row = Array.from($dialog.querySelectorAll<HTMLElement>('.bx-settings-row'))
            .find($element => ($element as any).prefKey === pref);
        if (!$row) {
            return;
        }

        $row.classList.add('bx-tutorial-highlight');
        $row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    private static hideSettingsWithAnimation() {
        const $dialog = document.querySelector<HTMLElement>('.bx-settings-dialog');
        if (!$dialog) {
            SettingsDialog.getInstance().hide();
            return;
        }

        $dialog.classList.add('bx-settings-menu-closing');
        window.setTimeout(() => SettingsDialog.getInstance().hide(), 220);
    }

    private static clearHighlightAndFocus() {
        document.querySelectorAll('.bx-tutorial-highlight')
            .forEach($element => $element.classList.remove('bx-tutorial-highlight'));

        const $activeElement = document.activeElement;
        if ($activeElement instanceof HTMLElement && $activeElement.closest('.bx-settings-dialog')) {
            $activeElement.blur();
        }
    }

    private static lockPage($overlay: HTMLElement, $backdrop: HTMLElement) {
        for (const $element of document.body.children) {
            if ($element !== $overlay && $element !== $backdrop) {
                WelcomeTutorial.lockElement($element as HTMLElement);
            }
        }
    }

    private static lockElement($element: HTMLElement) {
        if (!WelcomeTutorial.lockedElements.has($element)) {
            WelcomeTutorial.lockedElements.set($element, $element.hasAttribute('inert'));
            $element.setAttribute('inert', '');
        }
    }

    private static unlockPage() {
        for (const [$element, wasAlreadyInert] of WelcomeTutorial.lockedElements) {
            if (!wasAlreadyInert) {
                $element.removeAttribute('inert');
            }
        }
        WelcomeTutorial.lockedElements.clear();
    }

    private static dismiss($overlay: HTMLElement, $backdrop: HTMLElement, releaseInputLock: () => void) {
        window.localStorage.setItem(StorageKey.TUTORIAL_DISMISSED, WelcomeTutorial.STORAGE_VALUE);
        document.body.classList.remove('bx-welcome-tutorial-active');
        WelcomeTutorial.clearHighlightAndFocus();
        releaseInputLock();
        $overlay.classList.add('bx-welcome-tutorial-closing');
        $backdrop.classList.add('bx-welcome-tutorial-closing');
        window.setTimeout(() => {
            $overlay.remove();
            $backdrop.remove();
        }, 160);
    }
}
