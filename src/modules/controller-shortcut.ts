import { GamepadKey } from "@enums/gamepad";
import { ShortcutAction } from "@/enums/shortcut-actions";
import { ShortcutHandler } from "@/utils/shortcut-handler";


export class ControllerShortcut {
    private static buttonsCache: { [key: string]: boolean[] } = {};
    private static buttonsStatus: { [key: string]: boolean[] } = {};

    static reset(index: number) {
        ControllerShortcut.buttonsCache[index] = [];
        ControllerShortcut.buttonsStatus[index] = [];
    }

    static handle(gamepad: Gamepad): boolean {
        const controllerSettings = window.BX_STREAM_SETTINGS.controllers[gamepad.id];
        if (!controllerSettings) {
            return false;
        }

        const gamepadIndex = gamepad.index;

        // Move the buttons status from the previous frame to the cache
        ControllerShortcut.buttonsCache[gamepadIndex] = ControllerShortcut.buttonsStatus[gamepadIndex]?.slice(0) || [];
        // Clear the buttons status
        ControllerShortcut.buttonsStatus[gamepadIndex] = [];

        // Start + Select is reserved as a direct way to open Better xCloud
        // Plus. It avoids relying on the Xbox Guide, which can be unavailable
        // or delayed while a stream is active.
        const startAndSelectPressed = gamepad.buttons[GamepadKey.START]?.pressed && gamepad.buttons[GamepadKey.SELECT]?.pressed;
        if (startAndSelectPressed) {
            ControllerShortcut.buttonsStatus[gamepadIndex][GamepadKey.START] = true;
            ControllerShortcut.buttonsStatus[gamepadIndex][GamepadKey.SELECT] = true;

            const comboWasPressed = ControllerShortcut.buttonsCache[gamepadIndex][GamepadKey.START]
                && ControllerShortcut.buttonsCache[gamepadIndex][GamepadKey.SELECT];
            if (!comboWasPressed) {
                window.setTimeout(() => ShortcutHandler.runAction(ShortcutAction.BETTER_XCLOUD_SETTINGS_SHOW), 0);
            }

            return true;
        }

        const actions = controllerSettings.shortcuts;
        if (!actions) {
            return false;
        }

        const pressed: boolean[] = [];
        let otherButtonPressed = false;

        const entries = gamepad.buttons.entries();
        let index: GamepadKey;
        let button: GamepadButton;
        for ([index, button] of entries) {
            // Only add the newly pressed button to the array (holding doesn't count)
            if (button.pressed && index !== GamepadKey.HOME) {
                otherButtonPressed = true;
                pressed[index] = true;

                // If this is newly pressed button -> run action
                if (actions[index] && !ControllerShortcut.buttonsCache[gamepadIndex][index]) {
                    const idx = index;
                    setTimeout(() => ShortcutHandler.runAction(actions[idx]!), 0);
                }
            }
        };

        ControllerShortcut.buttonsStatus[gamepadIndex] = pressed;
        return otherButtonPressed;
    }
}
