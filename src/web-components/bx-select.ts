import { GlobalPref } from "@/enums/pref-keys";
import type { NavigationElement } from "@/modules/ui/dialog/navigation-dialog";
import { BxEvent } from "@/utils/bx-event";
import { setNearby } from "@/utils/navigation-utils";
import { getGlobalPref } from "@/utils/pref-utils";
import { isAndroidAppBuild } from "@/build-config";
import { ButtonStyle, CE, clearDataSet, createButton } from "@utils/html";

export class BxSelectElement extends HTMLSelectElement {
    isControllerFriendly!: boolean;
    private optionsList!: HTMLOptionElement[];
    private indicatorsList!: HTMLElement[];
    private $indicators!: HTMLElement;
    private visibleIndex!: number;
    private isMultiple!: boolean;

    private $select!: HTMLSelectElement;
    private $btnNext!: HTMLButtonElement | undefined;
    private $btnPrev!: HTMLButtonElement | undefined;
    private $label!: HTMLSpanElement;
    private $checkBox!: HTMLInputElement;
    private $multipleDropdown: HTMLElement | null = null;
    private closeMultipleDropdown!: () => void;
    private $flagDropdown: HTMLElement | null = null;
    private closeFlagDropdown!: () => void;

    static create($select: HTMLSelectElement, forceFriendly=false, preserveNativeMultiple=false): BxSelectElement {
        const isControllerFriendly = !($select.multiple && preserveNativeMultiple)
            && (forceFriendly || getGlobalPref(GlobalPref.UI_CONTROLLER_FRIENDLY));

        // Return normal <select> if it's non-controller friendly <select multiple>
        if ($select.multiple && !isControllerFriendly) {
            $select.classList.add('bx-select');
            // @ts-ignore
            return $select;
        }

        // Remove "tabindex" attribute from <select>
        $select.removeAttribute('tabindex');

        const $wrapper = CE('div', {
            class: 'bx-select',
            _dataset: {
                controllerFriendly: isControllerFriendly,
            },
        }) as unknown as (BxSelectElement & NavigationElement);

        // Copy bx-full-width class
        if ($select.classList.contains('bx-full-width')) {
            $wrapper.classList.add('bx-full-width');
        }

        let $content;

        const self = $wrapper;
        self.isControllerFriendly = isControllerFriendly;
        self.isMultiple = $select.multiple;
        self.visibleIndex = $select.selectedIndex;

        // SettingsManager keeps a reference to the original <select> and can
        // update it through setValue() (for example after a preset change).
        // Keep the custom controller UI in sync with that original element.
        const originalSetValue = ($select as any).setValue as ((value: any) => void) | undefined;

        self.$select = $select;
        self.optionsList = Array.from($select.querySelectorAll<HTMLOptionElement>('option'));
        self.$indicators = CE('div', { class: 'bx-select-indicators' });
        self.indicatorsList = [];

        // Native Windows select menus cannot display images inside <option>.
        // Server regions carry a country flag, so open a custom menu for them
        // and keep the native select only as the value/form control.
        // Android already renders its native server selector correctly with
        // emoji/text. Keep the desktop-only image dropdown out of the APK.
        // Some Xbox responses arrive from cache before `flagCode` was added
        // to the region object. The emoji is still present, and is enough to
        // derive the ISO code used by the image-based desktop control.
        const hasFlagOptions = !isAndroidAppBuild && self.optionsList.some($option =>
            !!($option.dataset.flagCode || BxSelectElement.getFlagCode($option))
        );
        if (hasFlagOptions) {
            // Capture pointerdown before Chromium performs its native select
            // action. A bubbling mousedown listener is too late on some
            // Windows builds, which is why the text-only list was still
            // appearing in the supplied screenshots.
            $select.addEventListener('pointerdown', e => {
                e.preventDefault();
                e.stopImmediatePropagation();
                BxSelectElement.toggleFlagDropdown.call(self, self);
            }, true);

            $select.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    BxSelectElement.toggleFlagDropdown.call(self, self);
                }
            });
        }

        let $btnPrev;
        let $btnNext;
        if (isControllerFriendly) {
            // Setup prev/next buttons
            $btnPrev = createButton({
                label: '<',
                style: ButtonStyle.FOCUSABLE,
            });

            $btnNext = createButton({
                label: '>',
                style: ButtonStyle.FOCUSABLE,
            });

            setNearby($wrapper, {
                orientation: 'horizontal',
                focus: $btnNext,
            });

            self.$btnNext = $btnNext;
            self.$btnPrev = $btnPrev;

            const boundOnPrevNext = BxSelectElement.onPrevNext.bind(self);
            $btnPrev.addEventListener('click', boundOnPrevNext);
            $btnNext.addEventListener('click', boundOnPrevNext);
        } else {
            // Setup 'change' event for $select
            $select.addEventListener('change', e => {
                self.visibleIndex = $select.selectedIndex;
                // Re-render
                BxSelectElement.resetIndicators.call(self);
                BxSelectElement.render.call(self);
            });
        }

        if (self.isMultiple) {
            $content = CE('button', {
                class: 'bx-select-value bx-focusable',
                tabindex: 0,
            },
                CE('div', false,
                    self.$checkBox = CE('input', { type: 'checkbox' }),
                    self.$label = CE('span', false, ''),
                ),

                self.$indicators,
            );

            $content.addEventListener('click', e => {
                const isPointerClick = (e as MouseEvent).detail > 0;
                const isKeyboard = document.documentElement.dataset.activeInput === 'keyboard';
                if (isPointerClick || isKeyboard) {
                    e.preventDefault();
                    BxSelectElement.toggleMultipleDropdown.call(self, $content as HTMLElement);
                    return;
                }
                self.$checkBox.click();
            });

            self.$checkBox.addEventListener('input', e => {
                const $option = BxSelectElement.getOptionAtIndex.call(self, self.visibleIndex);
                $option && ($option.selected = (e.target as HTMLInputElement).checked);

                BxEvent.dispatch($select, 'input');
            });
        } else {
            $content = CE('div', false,
                self.$label = CE('label', { for: $select.id + '_checkbox' }, ''),
                self.$indicators,
            );

            // Controller-friendly selects keep the native control offscreen.
            // Make the visible value panel open the same flagged menu, instead
            // of relying on a hidden <select> to receive the pointer event.
            if (hasFlagOptions && isControllerFriendly) {
                $content.tabIndex = 0;
                $content.setAttribute('role', 'button');
                $content.addEventListener('pointerdown', e => {
                    e.preventDefault();
                    BxSelectElement.toggleFlagDropdown.call(self, $content as HTMLElement);
                });
                $content.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        BxSelectElement.toggleFlagDropdown.call(self, $content as HTMLElement);
                    }
                });
            }
        }

        $select.addEventListener('input', BxSelectElement.render.bind(self));

        const observer = new MutationObserver((mutationList, observer) => {
            mutationList.forEach(mutation => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    self.visibleIndex = $select.selectedIndex;
                    self.optionsList = Array.from($select.querySelectorAll<HTMLOptionElement>('option'));

                    BxSelectElement.resetIndicators.call(self);
                    BxSelectElement.render.call(self);
                }
            });
        });

        observer.observe($select, {
            subtree: true,
            childList: true,
            attributes: true,
        });

        self.append(
            $select,
            $btnPrev || '',
            $content,
            $btnNext || '',
        );

        BxSelectElement.resetIndicators.call(self);
        BxSelectElement.render.call(self);

        ($select as any).setValue = (value: any) => {
            if (originalSetValue) {
                originalSetValue(value);
            } else {
                $select.value = value;
            }

            self.visibleIndex = $select.selectedIndex;
            BxSelectElement.resetIndicators.call(self);
            BxSelectElement.render.call(self, { manualTrigger: true } as Event);
        };

        Object.defineProperty(self, 'value', {
            get() { return $select.value; },
            set(value) {
                self.optionsList = Array.from($select.querySelectorAll<HTMLOptionElement>('option'));

                $select.value = value;

                // Update visible index
                self.visibleIndex = $select.selectedIndex;
                // Re-render
                BxSelectElement.resetIndicators.call(self);
                BxSelectElement.render.call(self);
            },
        });

        Object.defineProperty(self, 'disabled', {
            get() { return $select.disabled; },
            set(value) { $select.disabled = value; },
        });

        self.addEventListener = function() {
            // @ts-ignore
            $select.addEventListener.apply($select, arguments);
        };

        self.removeEventListener = function() {
            // @ts-ignore
            $select.removeEventListener.apply($select, arguments);
        };

        self.dispatchEvent = function() {
            // @ts-ignore
            return $select.dispatchEvent.apply($select, arguments);
        };

        self.appendChild = function(node) {
            $select.appendChild(node);
            return node;
        };

        return self as BxSelectElement;
    }

    /** Native <select multiple> does not open a compact dropdown. Provide the
     * same compact list affordance for pointer/keyboard users, while leaving
     * controller A-button toggling untouched. */
    private static toggleMultipleDropdown(this: BxSelectElement, $anchor: HTMLElement) {
        if (this.$multipleDropdown) {
            this.closeMultipleDropdown();
            return;
        }

        const $dropdown = CE('div', { class: 'bx-select-multiple-dropdown' });
        const renderOptions = () => {
            $dropdown.replaceChildren(...this.optionsList.map(($option, index) => {
                const $item = CE('button', {
                    class: 'bx-select-multiple-dropdown-option',
                    type: 'button',
                    _dataset: { selected: $option.selected },
                    disabled: $option.disabled,
                },
                    CE('input', { type: 'checkbox', checked: $option.selected, tabindex: -1 }),
                    CE('span', false, $option.dataset.label || $option.textContent || ''),
                ) as HTMLButtonElement;

                $item.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    $option.selected = !$option.selected;
                    this.visibleIndex = index;
                    BxEvent.dispatch(this.$select, 'input');
                    BxSelectElement.resetIndicators.call(this);
                    BxSelectElement.render.call(this);
                    renderOptions();
                });
                return $item;
            }));
        };

        const bounds = $anchor.getBoundingClientRect();
        $dropdown.style.left = `${Math.max(8, bounds.left)}px`;
        $dropdown.style.top = `${Math.min(window.innerHeight - 8, bounds.bottom + 3)}px`;
        $dropdown.style.minWidth = `${Math.max(180, bounds.width)}px`;
        document.body.append($dropdown);
        this.$multipleDropdown = $dropdown;

        const closeOnOutside = (event: PointerEvent) => {
            if (event.target instanceof Node && $dropdown.contains(event.target)) {
                return;
            }
            this.closeMultipleDropdown();
        };
        this.closeMultipleDropdown = () => {
            document.removeEventListener('pointerdown', closeOnOutside, true);
            $dropdown.remove();
            this.$multipleDropdown = null;
        };

        renderOptions();
        window.setTimeout(() => document.addEventListener('pointerdown', closeOnOutside, true));
    }

    /** Render flagged options outside the native select, which only supports
     * text and turns regional-indicator flags into country letters on Windows. */
    private static toggleFlagDropdown(this: BxSelectElement, $anchor: HTMLElement) {
        if (this.$flagDropdown) {
            this.closeFlagDropdown();
            return;
        }

        const $dropdown = CE('div', { class: 'bx-select-flag-dropdown' });
        let currentGroup = '';
        for (const [$index, $option] of this.optionsList.entries()) {
            const $parent = $option.parentElement;
            const group = $parent instanceof HTMLOptGroupElement ? $parent.label : '';
            if (group && group !== currentGroup) {
                currentGroup = group;
                $dropdown.appendChild(CE('div', { class: 'bx-select-flag-dropdown-group' }, group));
            }

            const flagCode = BxSelectElement.getFlagCode($option);
            const $item = CE('button', {
                class: 'bx-select-flag-dropdown-option',
                type: 'button',
                _dataset: { selected: $option.selected },
                disabled: $option.disabled,
            },
                flagCode ? CE('img', {
                    class: 'bx-select-flag-image',
                    src: `https://flagcdn.com/w40/${flagCode}.png`,
                    alt: '',
                }) : '',
                CE('span', false, $option.dataset.label || $option.textContent || ''),
            ) as HTMLButtonElement;

            let selected = false;
            const selectOption = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                if (selected) {
                    return;
                }
                selected = true;

                // Use selectedIndex as well as value: this works for the
                // special "default" server option and mirrors a native pick.
                this.$select.selectedIndex = $index;
                this.$select.value = $option.value;
                this.visibleIndex = $index;
                this.$select.dispatchEvent(new Event('input', { bubbles: true }));
                this.$select.dispatchEvent(new Event('change', { bubbles: true }));
                BxSelectElement.resetIndicators.call(this);
                BxSelectElement.render.call(this);
                this.closeFlagDropdown();
            };
            // Pointerdown is intentional: the invisible native <select>
            // otherwise consumes the later click on some Windows browsers.
            $item.addEventListener('pointerdown', selectOption);
            $item.addEventListener('click', selectOption);
            $dropdown.appendChild($item);
        }

        const bounds = $anchor.getBoundingClientRect();
        $dropdown.style.minWidth = `${Math.max(220, bounds.width)}px`;
        // Keep it in the selector's scroll container so it moves with the
        // settings panel, exactly like the other settings lists.
        $anchor.append($dropdown);
        this.$flagDropdown = $dropdown;

        const closeOnOutside = (event: PointerEvent) => {
            if (event.target instanceof Node && $dropdown.contains(event.target)) {
                return;
            }
            this.closeFlagDropdown();
        };
        this.closeFlagDropdown = () => {
            document.removeEventListener('pointerdown', closeOnOutside, true);
            $dropdown.remove();
            this.$flagDropdown = null;
        };
        window.setTimeout(() => document.addEventListener('pointerdown', closeOnOutside, true));
    }

    private static resetIndicators(this: BxSelectElement) {
        const {
            optionsList,
            indicatorsList,
            $indicators,
        } = this;

        const targetSize = optionsList.length;

        if (indicatorsList.length > targetSize) {
            // Detach indicator from parent
            while (indicatorsList.length > targetSize) {
                indicatorsList.pop()?.remove();
            }
        } else if (indicatorsList.length < targetSize) {
            // Add empty indicators
            while (indicatorsList.length < targetSize) {
                const $indicator = CE('span', {});
                indicatorsList.push($indicator);

                $indicators.appendChild($indicator);
            }
        }

        // Reset dataset
        for (const $indicator of indicatorsList) {
            clearDataSet($indicator);
        }

        // Toggle visibility
        $indicators.classList.toggle('bx-invisible', targetSize <= 1);
    }

    private static getFlagCode($option: HTMLOptionElement): string {
        if ($option.dataset.flagCode) {
            return $option.dataset.flagCode;
        }

        const code = [...($option.dataset.flag || '')]
            .map(char => char.codePointAt(0)! - 0x1F1E6)
            .filter(value => value >= 0 && value < 26)
            .map(value => String.fromCharCode(value + 65))
            .join('')
            .toLowerCase();
        return code.length === 2 ? code : '';
    }

    private static getOptionAtIndex(this: BxSelectElement, index: number): HTMLOptionElement | undefined {
        return this.optionsList[index];
    }

    private static render(this: BxSelectElement, e?: Event) {
        const {
            $label,
            $btnNext,
            $btnPrev,
            $checkBox,
            optionsList,
            indicatorsList,
        } = this;

        // console.log('options', this.options, 'selectedIndices', this.selectedIndices, 'selectedOptions', this.selectedOptions);
        if (!this.isMultiple || (e && (e as any).manualTrigger)) {
            this.visibleIndex = this.$select.selectedIndex;
        }

        this.visibleIndex = BxSelectElement.normalizeIndex.call(this, this.visibleIndex);
        const $option = BxSelectElement.getOptionAtIndex.call(this, this.visibleIndex);
        let content = '';
        if ($option) {
            const $parent = $option.parentElement!;
            const hasLabel = $parent instanceof HTMLOptGroupElement || this.$select.querySelector('optgroup');

            content = $option.dataset.label || $option.textContent || '';
            const flag = $option.dataset.flag;
            const flagCode = BxSelectElement.getFlagCode($option);
            if (content && (hasLabel || flag || flagCode)) {
                const groupLabel = $parent instanceof HTMLOptGroupElement ? $parent.label : '';

                $label.innerHTML = '';
                const fragment = document.createDocumentFragment();
                if (hasLabel) {
                    fragment.appendChild(CE('span', false, groupLabel));
                }
                if (flagCode) {
                    // Regional-indicator emoji are displayed as "BR"/"US" on
                    // several Windows installations. A real image keeps the
                    // same flag appearance as Android on every desktop.
                    fragment.appendChild(CE('img', {
                        class: 'bx-select-flag-image',
                        src: `https://flagcdn.com/w40/${flagCode}.png`,
                        alt: '',
                    }));
                } else if (flag) {
                    fragment.appendChild(CE('span', { class: 'bx-select-flag' }, flag));
                }
                fragment.appendChild(document.createTextNode(content));

                $label.appendChild(fragment);
            } else {
                $label.textContent = content;
            }
        } else {
            $label.textContent = content;
        }

        // Add line-through on disabled option
        $label.classList.toggle('bx-line-through', $option && $option.disabled);

        // Hide checkbox when the selection is empty
        if (this.isMultiple) {
            $checkBox.checked = $option?.selected || false;
            $checkBox.classList.toggle('bx-gone', !content);
        }

        // Disable buttons when there is only one option or fewer
        const disableButtons = optionsList.length <= 1;
        $btnPrev?.classList.toggle('bx-gone', disableButtons);
        $btnNext?.classList.toggle('bx-gone', disableButtons);

        // Update indicators
        for (let i = 0; i < optionsList.length; i++) {
            const $option = optionsList[i];
            const $indicator = indicatorsList[i];
            if (!$option || !$indicator) {
                continue;
            }

            clearDataSet($indicator);
            if ($option.selected) {
                $indicator.dataset.selected = 'true';
            }

            if ($option.index === this.visibleIndex) {
                $indicator.dataset.highlighted = 'true';
            }
        }

    }

    private static normalizeIndex(this: BxSelectElement, index: number): number {
        return Math.min(Math.max(index, 0), this.optionsList.length - 1);
    }

    private static onPrevNext(this: BxSelectElement, e: Event) {
        if (!e.target) {
            return;
        }

        const {
            $btnNext,
            $select,
            isMultiple,
            visibleIndex: currentIndex,
        } = this;

        const goNext = (e.target as HTMLElement).closest('button') === $btnNext;

        let newIndex = goNext ? currentIndex + 1 : currentIndex - 1;
        if (newIndex > this.optionsList.length - 1) {
            newIndex = 0;
        } else if (newIndex < 0) {
            newIndex = this.optionsList.length - 1;
        }
        newIndex = BxSelectElement.normalizeIndex.call(this, newIndex);

        this.visibleIndex = newIndex;
        if (!isMultiple && newIndex !== currentIndex) {
            $select.selectedIndex = newIndex;
        }

        if (isMultiple) {
            BxSelectElement.render.call(this);
        } else {
            BxEvent.dispatch($select, 'input');
        }
    };
}
