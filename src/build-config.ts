const BuildConfig = {
    TARGET: Bun.env.BUILD_TARGET,
};

/**
 * This is a compile-time build target, not browser user-agent detection.
 * Android gets a dedicated bundle so Android-only behavior cannot leak into
 * the desktop userscript merely because the wrapper spoofs a desktop UA.
 */
export const isAndroidAppBuild = () => BuildConfig.TARGET === 'android-app';
export const isDesktopBuild = () => !isAndroidAppBuild();

export const getBuildConfig = () => {
    console.log(BuildConfig);
    return BuildConfig;
};
