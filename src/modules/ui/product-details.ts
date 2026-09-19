import { BX_FLAGS } from "@/utils/bx-flags";
import { BxIcon } from "@/utils/bx-icon";
import { AppInterface } from "@/utils/global";
import { ButtonStyle, CE, createButton, createSvgIcon } from "@/utils/html";
import { LocalCoOpManager } from "@/utils/local-co-op-manager";
import { t } from "@/utils/translation";
import { parseDetailsPath } from "@/utils/utils";

export class ProductDetailsPage {
    private static $btnShortcut = AppInterface && createButton({
        icon: BxIcon.CREATE_SHORTCUT,
        label: t('create-shortcut'),
        style: ButtonStyle.FOCUSABLE,
        onClick: e => {
            AppInterface.createShortcut(window.location.pathname.substring(6));
        },
    });

    private static $btnWallpaper = AppInterface && createButton({
        icon: BxIcon.DOWNLOAD,
        label: t('wallpaper'),
        style: ButtonStyle.FOCUSABLE,
        onClick: e => {
            const details = parseDetailsPath(window.location.pathname);
            details && AppInterface.downloadWallpapers(details.titleSlug, details.productId);
        },
    });

    private static injectTimeoutId: number | null = null;

    static injectButtons() {
        document.documentElement.dataset.bxProductDetails = 'true';
        ProductDetailsPage.injectTimeoutId && clearTimeout(ProductDetailsPage.injectTimeoutId);
        ProductDetailsPage.injectTimeoutId = window.setTimeout(() => {
            const { productId } = parseDetailsPath(window.location.pathname);
            // Inputs
            const $inputsContainer = document.querySelector<HTMLElement>('div[class*="Header-module__gamePassAndInputsContainer"]');
            if ($inputsContainer && !$inputsContainer.dataset.bxInjected) {
                $inputsContainer.dataset.bxInjected = 'true';

                if (LocalCoOpManager.getInstance().isSupported(productId || '')) {
                    $inputsContainer.insertAdjacentElement('afterend', CE('div', {
                        class: 'bx-product-details-icons bx-frosted',
                    }, createSvgIcon(BxIcon.LOCAL_CO_OP), t('local-co-op')));
                }
            }

            // Find the shared action area for browser and Android app.
            const $container = document.querySelector<HTMLElement>('div[class*=ActionButtons-module__container]');

            // Inject buttons for Android app
            if (AppInterface) {
                if ($container && $container.parentElement) {
                    $container.parentElement.appendChild(CE('div', {
                        class: 'bx-product-details-buttons',
                    },
                        ['android-handheld', 'android'].includes(BX_FLAGS.DeviceInfo.deviceType) && ProductDetailsPage.$btnShortcut,
                        ProductDetailsPage.$btnWallpaper,
                    ));
                }
            }
        }, 500);
    }
}
