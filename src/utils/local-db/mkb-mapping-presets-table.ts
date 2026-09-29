import { LocalDb } from "./local-db";
import { BxLogger } from "../bx-logger";
import { BasePresetsTable } from "./base-presets-table";
import type { MkbPresetRecord, PresetRecords } from "@/types/presets";
import { MkbPresetKey, MouseMapTo, MouseButtonCode } from "@/enums/mkb";
import { GamepadKey } from "@/enums/gamepad";
import { t } from "../translation";

export const enum MkbMappingDefaultPresetId {
    OFF = 0,
    STANDARD = -1,
    SHOOTER = -2,
    RACING = -3,
    FIGHTING = -4,
    PLATFORMER = -5,
    RPG_ACTION = -6,
    SPORTS = -7,

    DEFAULT = STANDARD,
};

export type MkbPresetSuggestion = {
    id: MkbMappingDefaultPresetId;
    name: string;
};

/**
 * Suggests a keyboard/mouse layout from the game title only. It deliberately
 * never applies a preset: genres are often mixed and the player's layout is
 * more important than a heuristic.
 */
export function getSuggestedMkbPresetForTitle(title?: string): MkbPresetSuggestion | null {
    if (!title) return null;

    const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const matches = (pattern: RegExp) => pattern.test(normalized);

    if (matches(/forza|racing|rally|\bf1\b|nascar|wrc|motogp|dirt|burnout|carx/)) {
        return { id: MkbMappingDefaultPresetId.RACING, name: t('mkb-preset-racing') };
    }
    if (matches(/mortal kombat|street fighter|tekken|guilty gear|injustice|killer instinct|brawlhalla|dragon ball fighter|\bufc\b|\bwwe\b/)) {
        return { id: MkbMappingDefaultPresetId.FIGHTING, name: t('mkb-preset-fighting') };
    }
    if (matches(/ori and|hollow knight|celeste|sonic|rayman|shovel knight|super meat boy|cuphead|platformer/)) {
        return { id: MkbMappingDefaultPresetId.PLATFORMER, name: t('mkb-preset-platformer') };
    }
    if (matches(/\bfc\b|fifa|madden|\bnba\b|\bnhl\b|\bmlb\b|\bpga\b|efootball|football manager/)) {
        return { id: MkbMappingDefaultPresetId.SPORTS, name: t('mkb-preset-sports') };
    }
    if (matches(/call of duty|battlefield|\bhalo\b|\bdoom\b|\bquake\b|sniper|far cry|rainbow six|wolfenstein|overwatch|fortnite|gears of war|gears 5/)) {
        return { id: MkbMappingDefaultPresetId.SHOOTER, name: t('mkb-preset-shooter') };
    }
    if (matches(/elden ring|dark souls|assassin'?s creed|the witcher|monster hunter|diablo|skyrim|fallout|final fantasy|persona|yakuza|like a dragon/)) {
        return { id: MkbMappingDefaultPresetId.RPG_ACTION, name: t('mkb-preset-rpg-action') };
    }

    return null;
}

export class MkbMappingPresetsTable extends BasePresetsTable<MkbPresetRecord> {
    private static instance: MkbMappingPresetsTable;
    public static getInstance = () => MkbMappingPresetsTable.instance ?? (MkbMappingPresetsTable.instance = new MkbMappingPresetsTable());
    private readonly LOG_TAG = 'MkbMappingPresetsTable';

    protected readonly TABLE_PRESETS = LocalDb.TABLE_VIRTUAL_CONTROLLERS;
    protected readonly DEFAULT_PRESETS: PresetRecords<MkbPresetRecord> = {
        [MkbMappingDefaultPresetId.STANDARD]: {
            id: MkbMappingDefaultPresetId.STANDARD,
            name: t('standard'),
            data: {
                mapping: {
                    [GamepadKey.HOME]: ['Backquote'],

                    [GamepadKey.UP]: ['ArrowUp', 'Digit1'],
                    [GamepadKey.DOWN]: ['ArrowDown', 'Digit2'],
                    [GamepadKey.LEFT]: ['ArrowLeft', 'Digit3'],
                    [GamepadKey.RIGHT]: ['ArrowRight', 'Digit4'],

                    [GamepadKey.LS_UP]: ['KeyW'],
                    [GamepadKey.LS_DOWN]: ['KeyS'],
                    [GamepadKey.LS_LEFT]: ['KeyA'],
                    [GamepadKey.LS_RIGHT]: ['KeyD'],

                    [GamepadKey.RS_UP]: ['KeyU'],
                    [GamepadKey.RS_DOWN]: ['KeyJ'],
                    [GamepadKey.RS_LEFT]: ['KeyH'],
                    [GamepadKey.RS_RIGHT]: ['KeyK'],

                    [GamepadKey.A]: ['Space', 'KeyE'],
                    [GamepadKey.X]: ['KeyR'],
                    [GamepadKey.B]: ['KeyC', 'Backspace'],
                    [GamepadKey.Y]: ['KeyV'],

                    [GamepadKey.START]: ['Enter'],
                    [GamepadKey.SELECT]: ['Tab'],

                    [GamepadKey.LB]: ['KeyQ'],
                    [GamepadKey.RB]: ['KeyF'],

                    [GamepadKey.RT]: [MouseButtonCode.LEFT_CLICK],
                    [GamepadKey.LT]: [MouseButtonCode.RIGHT_CLICK],

                    [GamepadKey.L3]: ['KeyX'],
                    [GamepadKey.R3]: ['KeyZ'],
                },
                mouse: {
                    [MkbPresetKey.MOUSE_MAP_TO]: MouseMapTo.RS,
                    [MkbPresetKey.MOUSE_SENSITIVITY_X]: 100,
                    [MkbPresetKey.MOUSE_SENSITIVITY_Y]: 100,
                    [MkbPresetKey.MOUSE_DEADZONE_COUNTERWEIGHT]: 20,
                },
            },
        },

        [MkbMappingDefaultPresetId.SHOOTER]: {
            id: MkbMappingDefaultPresetId.SHOOTER,
            name: t('mkb-preset-shooter'),
            data: {
                mapping: {
                    [GamepadKey.HOME]: ['Backquote'],

                    [GamepadKey.UP]: ['ArrowUp'],
                    [GamepadKey.DOWN]: ['ArrowDown'],
                    [GamepadKey.LEFT]: ['ArrowLeft'],
                    [GamepadKey.RIGHT]: ['ArrowRight'],

                    [GamepadKey.LS_UP]: ['KeyW'],
                    [GamepadKey.LS_DOWN]: ['KeyS'],
                    [GamepadKey.LS_LEFT]: ['KeyA'],
                    [GamepadKey.LS_RIGHT]: ['KeyD'],

                    [GamepadKey.RS_UP]: ['KeyI'],
                    [GamepadKey.RS_DOWN]: ['KeyK'],
                    [GamepadKey.RS_LEFT]: ['KeyJ'],
                    [GamepadKey.RS_RIGHT]: ['KeyL'],

                    [GamepadKey.A]: ['Space', 'KeyE'],
                    [GamepadKey.X]: ['KeyR'],
                    [GamepadKey.B]: ['ControlLeft', 'Backspace'],
                    [GamepadKey.Y]: ['KeyV'],

                    [GamepadKey.START]: ['Enter'],
                    [GamepadKey.SELECT]: ['Tab'],

                    [GamepadKey.LB]: ['KeyC', 'KeyG'],
                    [GamepadKey.RB]: ['KeyQ'],

                    [GamepadKey.RT]: [MouseButtonCode.LEFT_CLICK],
                    [GamepadKey.LT]: [MouseButtonCode.RIGHT_CLICK],

                    [GamepadKey.L3]: ['ShiftLeft'],
                    [GamepadKey.R3]: ['KeyF'],
                },
                mouse: {
                    [MkbPresetKey.MOUSE_MAP_TO]: MouseMapTo.RS,
                    [MkbPresetKey.MOUSE_SENSITIVITY_X]: 100,
                    [MkbPresetKey.MOUSE_SENSITIVITY_Y]: 100,
                    [MkbPresetKey.MOUSE_DEADZONE_COUNTERWEIGHT]: 20,
                },
            },
        },

        [MkbMappingDefaultPresetId.RACING]: {
            id: MkbMappingDefaultPresetId.RACING,
            name: t('mkb-preset-racing'),
            data: {
                mapping: {
                    [GamepadKey.HOME]: ['Backquote'],
                    [GamepadKey.UP]: ['ArrowUp'], [GamepadKey.DOWN]: ['ArrowDown'],
                    [GamepadKey.LEFT]: ['ArrowLeft'], [GamepadKey.RIGHT]: ['ArrowRight'],
                    [GamepadKey.LS_LEFT]: ['KeyA'], [GamepadKey.LS_RIGHT]: ['KeyD'],
                    [GamepadKey.RS_UP]: ['KeyI'], [GamepadKey.RS_DOWN]: ['KeyK'],
                    [GamepadKey.RS_LEFT]: ['KeyJ'], [GamepadKey.RS_RIGHT]: ['KeyL'],
                    [GamepadKey.RT]: ['KeyW'], [GamepadKey.LT]: ['KeyS'],
                    [GamepadKey.RB]: ['KeyE'], [GamepadKey.LB]: ['KeyQ'],
                    [GamepadKey.A]: ['Space'], [GamepadKey.B]: ['ControlLeft'],
                    [GamepadKey.X]: ['KeyR'], [GamepadKey.Y]: ['KeyF'],
                    [GamepadKey.START]: ['Enter'], [GamepadKey.SELECT]: ['Tab'],
                },
                mouse: {
                    [MkbPresetKey.MOUSE_MAP_TO]: MouseMapTo.OFF,
                    [MkbPresetKey.MOUSE_SENSITIVITY_X]: 100,
                    [MkbPresetKey.MOUSE_SENSITIVITY_Y]: 100,
                    [MkbPresetKey.MOUSE_DEADZONE_COUNTERWEIGHT]: 20,
                },
            },
        },

        [MkbMappingDefaultPresetId.FIGHTING]: {
            id: MkbMappingDefaultPresetId.FIGHTING,
            name: t('mkb-preset-fighting'),
            data: {
                mapping: {
                    [GamepadKey.HOME]: ['Backquote'],
                    [GamepadKey.UP]: ['ArrowUp'], [GamepadKey.DOWN]: ['ArrowDown'],
                    [GamepadKey.LEFT]: ['ArrowLeft'], [GamepadKey.RIGHT]: ['ArrowRight'],
                    [GamepadKey.LS_UP]: ['KeyW'], [GamepadKey.LS_DOWN]: ['KeyS'],
                    [GamepadKey.LS_LEFT]: ['KeyA'], [GamepadKey.LS_RIGHT]: ['KeyD'],
                    [GamepadKey.A]: ['KeyJ'], [GamepadKey.B]: ['KeyK'],
                    [GamepadKey.X]: ['KeyU'], [GamepadKey.Y]: ['KeyI'],
                    [GamepadKey.LB]: ['KeyQ'], [GamepadKey.RB]: ['KeyE'],
                    [GamepadKey.LT]: ['KeyZ'], [GamepadKey.RT]: ['KeyC'],
                    [GamepadKey.START]: ['Enter'], [GamepadKey.SELECT]: ['Tab'],
                },
                mouse: {
                    [MkbPresetKey.MOUSE_MAP_TO]: MouseMapTo.OFF,
                    [MkbPresetKey.MOUSE_SENSITIVITY_X]: 100,
                    [MkbPresetKey.MOUSE_SENSITIVITY_Y]: 100,
                    [MkbPresetKey.MOUSE_DEADZONE_COUNTERWEIGHT]: 20,
                },
            },
        },

        [MkbMappingDefaultPresetId.PLATFORMER]: {
            id: MkbMappingDefaultPresetId.PLATFORMER,
            name: t('mkb-preset-platformer'),
            data: {
                mapping: {
                    [GamepadKey.HOME]: ['Backquote'],
                    [GamepadKey.UP]: ['ArrowUp'], [GamepadKey.DOWN]: ['ArrowDown'],
                    [GamepadKey.LEFT]: ['ArrowLeft'], [GamepadKey.RIGHT]: ['ArrowRight'],
                    [GamepadKey.LS_UP]: ['KeyW'], [GamepadKey.LS_DOWN]: ['KeyS'],
                    [GamepadKey.LS_LEFT]: ['KeyA'], [GamepadKey.LS_RIGHT]: ['KeyD'],
                    [GamepadKey.A]: ['Space'], [GamepadKey.B]: ['ControlLeft'],
                    [GamepadKey.X]: ['KeyJ'], [GamepadKey.Y]: ['KeyI'],
                    [GamepadKey.LB]: ['KeyQ'], [GamepadKey.RB]: ['KeyE'],
                    [GamepadKey.LT]: ['KeyZ'], [GamepadKey.RT]: ['KeyC'],
                    [GamepadKey.START]: ['Enter'], [GamepadKey.SELECT]: ['Tab'],
                },
                mouse: {
                    [MkbPresetKey.MOUSE_MAP_TO]: MouseMapTo.OFF,
                    [MkbPresetKey.MOUSE_SENSITIVITY_X]: 100,
                    [MkbPresetKey.MOUSE_SENSITIVITY_Y]: 100,
                    [MkbPresetKey.MOUSE_DEADZONE_COUNTERWEIGHT]: 20,
                },
            },
        },

        [MkbMappingDefaultPresetId.RPG_ACTION]: {
            id: MkbMappingDefaultPresetId.RPG_ACTION,
            name: t('mkb-preset-rpg-action'),
            data: {
                mapping: {
                    [GamepadKey.HOME]: ['Backquote'],
                    [GamepadKey.UP]: ['ArrowUp'], [GamepadKey.DOWN]: ['ArrowDown'],
                    [GamepadKey.LEFT]: ['ArrowLeft'], [GamepadKey.RIGHT]: ['ArrowRight'],
                    [GamepadKey.LS_UP]: ['KeyW'], [GamepadKey.LS_DOWN]: ['KeyS'],
                    [GamepadKey.LS_LEFT]: ['KeyA'], [GamepadKey.LS_RIGHT]: ['KeyD'],
                    [GamepadKey.A]: ['Space', 'KeyE'], [GamepadKey.B]: ['ControlLeft'],
                    [GamepadKey.X]: ['KeyR'], [GamepadKey.Y]: ['KeyF'],
                    [GamepadKey.LB]: ['KeyQ'], [GamepadKey.RB]: ['KeyC'],
                    [GamepadKey.LT]: [MouseButtonCode.RIGHT_CLICK], [GamepadKey.RT]: [MouseButtonCode.LEFT_CLICK],
                    [GamepadKey.L3]: ['ShiftLeft'], [GamepadKey.START]: ['Enter'], [GamepadKey.SELECT]: ['Tab'],
                },
                mouse: {
                    [MkbPresetKey.MOUSE_MAP_TO]: MouseMapTo.RS,
                    [MkbPresetKey.MOUSE_SENSITIVITY_X]: 85,
                    [MkbPresetKey.MOUSE_SENSITIVITY_Y]: 85,
                    [MkbPresetKey.MOUSE_DEADZONE_COUNTERWEIGHT]: 20,
                },
            },
        },

        [MkbMappingDefaultPresetId.SPORTS]: {
            id: MkbMappingDefaultPresetId.SPORTS,
            name: t('mkb-preset-sports'),
            data: {
                mapping: {
                    [GamepadKey.HOME]: ['Backquote'],
                    [GamepadKey.UP]: ['ArrowUp'], [GamepadKey.DOWN]: ['ArrowDown'],
                    [GamepadKey.LEFT]: ['ArrowLeft'], [GamepadKey.RIGHT]: ['ArrowRight'],
                    [GamepadKey.LS_UP]: ['KeyW'], [GamepadKey.LS_DOWN]: ['KeyS'],
                    [GamepadKey.LS_LEFT]: ['KeyA'], [GamepadKey.LS_RIGHT]: ['KeyD'],
                    [GamepadKey.RS_UP]: ['KeyI'], [GamepadKey.RS_DOWN]: ['KeyK'],
                    [GamepadKey.RS_LEFT]: ['KeyJ'], [GamepadKey.RS_RIGHT]: ['KeyL'],
                    [GamepadKey.A]: ['Space'], [GamepadKey.B]: ['ControlLeft'],
                    [GamepadKey.X]: ['KeyE'], [GamepadKey.Y]: ['KeyQ'],
                    [GamepadKey.LB]: ['KeyZ'], [GamepadKey.RB]: ['KeyC'],
                    [GamepadKey.LT]: ['KeyR'], [GamepadKey.RT]: ['KeyF'],
                    [GamepadKey.START]: ['Enter'], [GamepadKey.SELECT]: ['Tab'],
                },
                mouse: {
                    [MkbPresetKey.MOUSE_MAP_TO]: MouseMapTo.RS,
                    [MkbPresetKey.MOUSE_SENSITIVITY_X]: 70,
                    [MkbPresetKey.MOUSE_SENSITIVITY_Y]: 70,
                    [MkbPresetKey.MOUSE_DEADZONE_COUNTERWEIGHT]: 20,
                },
            },
        },
    };

    readonly BLANK_PRESET_DATA = {
        mapping: {},
        mouse: {
            [MkbPresetKey.MOUSE_MAP_TO]: MouseMapTo.RS,
            [MkbPresetKey.MOUSE_SENSITIVITY_X]: 100,
            [MkbPresetKey.MOUSE_SENSITIVITY_Y]: 100,
            [MkbPresetKey.MOUSE_DEADZONE_COUNTERWEIGHT]: 20,
        },
    };

    protected readonly DEFAULT_PRESET_ID = MkbMappingDefaultPresetId.DEFAULT;

    private constructor() {
        super(LocalDb.TABLE_VIRTUAL_CONTROLLERS);
        BxLogger.info(this.LOG_TAG, 'constructor()');
    }
}
