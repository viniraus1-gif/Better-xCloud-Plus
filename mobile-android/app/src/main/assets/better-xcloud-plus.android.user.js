// ==UserScript==
// @name         Better xCloud Plus
// @namespace    better-xcloud-plus
// @version      1.0.12
// @description  Improve Xbox Cloud Gaming (xCloud) experience
// @author       Better xCloud Plus contributors
// @license      MIT
// @match        https://www.xbox.com/*/play*
// @match        https://www.xbox.com/*/auth/msa?*loggedIn*
// @exclude      https://www.xbox.com/*/xbox-game-pass/play-day-one
// @run-at       document-start
// @grant        none
// ==/UserScript==
"use strict";
class BxLogger {
 static info = (tag, ...args) => BX_FLAGS.Debug && BxLogger.log("#008746", tag, ...args);
 static warning = (tag, ...args) => BX_FLAGS.Debug && BxLogger.log("#c1a404", tag, ...args);
 static error = (tag, ...args) => BxLogger.log("#c10404", tag, ...args);
 static log(color, tag, ...args) {
  console.log("%c[BxC]", `color:${color};font-weight:bold;`, tag, "//", ...args);
 }
}
window.BxLogger = BxLogger;
/* ADDITIONAL CODE */
var DEFAULT_FLAGS = {
 Debug: !1,
 CheckForUpdate: !0,
 EnableXcloudLogging: !1,
 SafariWorkaround: !0,
 EnableWebGPURenderer: !1,
 ForceNativeMkbTitles: [],
 FeatureGates: null,
 DeviceInfo: {
  deviceType: "unknown"
 }
}, BX_FLAGS = Object.assign(DEFAULT_FLAGS, window.BX_FLAGS || {});
try {
 delete window.BX_FLAGS;
} catch (e) {}
if (!BX_FLAGS.DeviceInfo.userAgent) BX_FLAGS.DeviceInfo.userAgent = window.navigator.userAgent;
BxLogger.info("BxFlags", BX_FLAGS);
var NATIVE_FETCH = window.fetch;
var BuildConfig = {
 TARGET: "android-app"
}, isAndroidAppBuild = () => BuildConfig.TARGET === "android-app";
var ALL_PREFS = {
 global: [
  "audio.mic.onPlaying",
  "audio.volume.booster.enabled",
  "block.features",
  "block.tracking",
  "gameBar.position",
  "game.fortnite.forceConsole",
  "loadingScreen.gameArt.show",
  "loadingScreen.rocket",
  "loadingScreen.waitTime.show",
  "mkb.enabled",
  "mkb.cursor.hideIdle",
  "nativeMkb.forcedGames",
  "nativeMkb.mode",
  "xhome.video.resolution",
  "xhome.ipv6.prefer",
  "screenshot.applyFilters",
  "server.bypassRestriction",
  "server.ipv6.prefer",
  "server.region",
  "stream.video.codecProfile",
  "stream.video.combineAudio",
  "stream.video.maxBitrate",
  "stream.locale",
  "stream.video.resolution",
  "stream.video.preventResolutionDrops",
  "stream.cloud.keepAlive",
  "touchController.autoOff",
  "touchController.opacity.default",
  "touchController.mode",
  "touchController.style.custom",
  "touchController.style.standard",
  "ui.controllerFriendly",
  "ui.controllerStatus.show",
  "ui.feedbackDialog.disabled",
  "ui.gameCard.waitTime.show",
  "ui.hideSections",
  "ui.systemMenu.hideHandle",
  "ui.imageQuality",
  "ui.layout",
  "ui.reduceAnimations",
  "ui.hideScrollbar",
  "ui.streamMenu.simplify",
  "ui.splashVideo.skip",
  "ui.theme",
  "ui.hub.cardSize",
  "ui.hub.cardRounded",
  "ui.hub.hoverEffects",
  "ui.hub.animations",
  "version.current",
  "version.lastCheck",
  "version.latest",
  "bx.locale",
  "userAgent.profile"
 ],
 stream: [
  "audio.volume",
  "controller.pollingRate",
  "controller.settings",
  "deviceVibration.intensity",
  "deviceVibration.mode",
  "keyboardShortcuts.preset.inGameId",
  "localCoOp.enabled",
  "mkb.p1.preset.mappingId",
  "mkb.p1.slot",
  "mkb.p2.preset.mappingId",
  "mkb.p2.slot",
  "nativeMkb.scroll.sensitivityX",
  "nativeMkb.scroll.sensitivityY",
  "stats.colors",
  "stats.items",
  "stats.opacity.all",
  "stats.opacity.background",
  "stats.position",
  "stats.quickGlance.enabled",
  "stats.showWhenPlaying",
  "stats.textSize",
  "video.brightness",
  "video.contrast",
  "video.maxFps",
  "video.player.type",
  "video.position",
  "video.player.powerPreference",
  "video.processing",
  "video.processing.mode",
  "video.ratio",
  "video.saturation",
  "video.processing.sharpness",
  "vx.upscale.target",
  "vx.upscale.algorithm",
  "vx.antiAliasing",
  "vx.artifactReduction",
  "vx.frameGeneration",
  "vx.latencyBudget",
  "vx.adaptiveSharpen",
  "vx.dynamicReconstruction",
  "vx.temporalSuperResolution",
  "vx.hudProtection",
  "vx.frameTargetFps",
  "vx.fineDetailReconstruction",
  "vx.competitiveMode",
  "vx.hotkey.preset",
  "vx.hotkey.compare",
  "vx.hotkey.metrics"
 ]
};
var SMART_TV_UNIQUE_ID = "FC4A1DA2-711C-4E9C-BC7F-047AF8A672EA", CHROMIUM_VERSION = "140.0.3485.54";
if (!!window.chrome || window.navigator.userAgent.includes("Chrome")) {
 let match = window.navigator.userAgent.match(/\s(?:Chrome|Edg)\/([\d\.]+)/);
 if (match) CHROMIUM_VERSION = match[1];
}
class UserAgent {
 static STORAGE_KEY = "BetterXcloud.UserAgent";
 static #config;
 static #isMobile = null;
 static #isSafari = null;
 static #isSafariMobile = null;
 static #USER_AGENTS = {
  "windows-edge": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_VERSION} Safari/537.36 Edg/${CHROMIUM_VERSION}`,
  "macos-safari": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.2 Safari/605.1.1",
  "smarttv-generic": `${window.navigator.userAgent} Smart-TV`,
  "smarttv-tizen": `Mozilla/5.0 (SMART-TV; LINUX; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) ${CHROMIUM_VERSION}/7.0 TV Safari/537.36 ${SMART_TV_UNIQUE_ID}`,
  "vr-oculus": window.navigator.userAgent + " OculusBrowser VR"
 };
 static init() {
  if (UserAgent.#config = JSON.parse(window.localStorage.getItem(UserAgent.STORAGE_KEY) || "{}"), !UserAgent.#config.profile) UserAgent.#config.profile = BX_FLAGS.DeviceInfo.deviceType === "android-tv" || BX_FLAGS.DeviceInfo.deviceType === "webos" ? "vr-oculus" : "default";
  if (!UserAgent.#config.custom) UserAgent.#config.custom = "";
  UserAgent.spoof();
 }
 static updateStorage(profile, custom) {
  let config = UserAgent.#config;
  if (config.profile = profile, profile === "custom" && typeof custom < "u") config.custom = custom;
  window.localStorage.setItem(UserAgent.STORAGE_KEY, JSON.stringify(config));
 }
 static getDefault() {
  return window.navigator.orgUserAgent || window.navigator.userAgent;
 }
 static get(profile) {
  let defaultUserAgent = window.navigator.userAgent;
  switch (profile) {
   case "default":
    return defaultUserAgent;
   case "custom":
    return UserAgent.#config.custom || defaultUserAgent;
   default:
    return UserAgent.#USER_AGENTS[profile] || defaultUserAgent;
  }
 }
 static isSafari() {
  if (this.#isSafari !== null) return this.#isSafari;
  let userAgent = UserAgent.getDefault().toLowerCase(), result = userAgent.includes("safari") && !userAgent.includes("chrom");
  return this.#isSafari = result, result;
 }
 static isSafariMobile() {
  if (this.#isSafariMobile !== null) return this.#isSafariMobile;
  let userAgent = UserAgent.getDefault().toLowerCase(), result = this.isSafari() && userAgent.includes("mobile");
  return this.#isSafariMobile = result, result;
 }
 static isMobile() {
  if (this.#isMobile !== null) return this.#isMobile;
  let userAgent = UserAgent.getDefault().toLowerCase(), result = /iphone|ipad|android/.test(userAgent);
  return this.#isMobile = result, result;
 }
 static isMobileDevice() {
  return isAndroidAppBuild() || BX_FLAGS.DeviceInfo.deviceType === "android-handheld" || this.isMobile();
 }
 static spoof() {
  let profile = UserAgent.#config.profile;
  if (profile === "default") return;
  let newUserAgent = UserAgent.get(profile);
  if ("userAgentData" in window.navigator) window.navigator.orgUserAgentData = window.navigator.userAgentData, Object.defineProperty(window.navigator, "userAgentData", {});
  window.navigator.orgUserAgent = window.navigator.userAgent, Object.defineProperty(window.navigator, "userAgent", {
   value: newUserAgent
  });
 }
}
var SCRIPT_VERSION = "1.0.12", SCRIPT_VARIANT = "full", AppInterface = window.AppInterface;
UserAgent.init();
var userAgent = window.navigator.userAgent.toLowerCase(), isTv = userAgent.includes("smart-tv") || userAgent.includes("smarttv") || /\baft.*\b/.test(userAgent), isVr = window.navigator.userAgent.includes("VR") && window.navigator.userAgent.includes("OculusBrowser"), browserHasTouchSupport = "ontouchstart" in window || navigator.maxTouchPoints > 0, userAgentHasTouchSupport = !isTv && !isVr && browserHasTouchSupport, STATES = {
 supportedRegion: !0,
 serverRegions: {},
 selectedRegion: {},
 gsToken: "",
 isSignedIn: !1,
 isPlaying: !1,
 browser: {
  capabilities: {
   touch: browserHasTouchSupport,
   batteryApi: "getBattery" in window.navigator,
   deviceVibration: !!window.navigator.vibrate,
   mkb: AppInterface || !UserAgent.getDefault().toLowerCase().match(/(android|iphone|ipad)/),
   emulatedNativeMkb: !!AppInterface
  }
 },
 userAgent: {
  isTv,
  capabilities: {
   touch: userAgentHasTouchSupport,
   mkb: AppInterface || !userAgent.match(/(android|iphone|ipad)/)
  }
 },
 currentStream: {},
 remotePlay: {},
 pointerServerPort: 9269
};
function deepClone(obj) {
 if (!obj) return {};
 if ("structuredClone" in window) return structuredClone(obj);
 return JSON.parse(JSON.stringify(obj));
}
var BxEvent;
((BxEvent) => {
 BxEvent.POPSTATE = "bx-popstate", BxEvent.OPEN_SETTINGS_MENU = "bx-open-settings-menu", BxEvent.SHOW_WELCOME_TUTORIAL = "bx-show-welcome-tutorial", BxEvent.STREAM_SESSION_READY = "bx-stream-session-ready", BxEvent.CUSTOM_TOUCH_LAYOUTS_LOADED = "bx-custom-touch-layouts-loaded", BxEvent.TOUCH_LAYOUT_MANAGER_READY = "bx-touch-layout-manager-ready", BxEvent.REMOTE_PLAY_READY = "bx-remote-play-ready", BxEvent.REMOTE_PLAY_FAILED = "bx-remote-play-failed", BxEvent.CAPTURE_SCREENSHOT = "bx-capture-screenshot", BxEvent.POINTER_LOCK_REQUESTED = "bx-pointer-lock-requested", BxEvent.POINTER_LOCK_EXITED = "bx-pointer-lock-exited", BxEvent.NAVIGATION_FOCUS_CHANGED = "bx-nav-focus-changed", BxEvent.XCLOUD_GUIDE_MENU_SHOWN = "bx-xcloud-guide-menu-shown", BxEvent.XCLOUD_POLLING_MODE_CHANGED = "bx-xcloud-polling-mode-changed", BxEvent.XCLOUD_RENDERING_COMPONENT = "bx-xcloud-rendering-component", BxEvent.XCLOUD_ROUTER_HISTORY_READY = "bx-xcloud-router-history-ready";
 function dispatch(target, eventName, data) {
  if (!target) return;
  if (!eventName) {
   alert("BxEvent.dispatch(): eventName is null");
   return;
  }
  let event = new Event(eventName);
  if (data) for (let key in data)
    event[key] = data[key];
  target.dispatchEvent(event), AppInterface && AppInterface.onEvent(eventName), BX_FLAGS.Debug && BxLogger.warning("BxEvent", "dispatch", target, eventName, data);
 }
 BxEvent.dispatch = dispatch;
})(BxEvent ||= {});
window.BxEvent = BxEvent;
var GamepadKeyName = {
 0: ["A", "⇓"],
 1: ["B", "⇒"],
 2: ["X", "⇐"],
 3: ["Y", "⇑"],
 4: ["LB", "↘"],
 5: ["RB", "↙"],
 6: ["LT", "↖"],
 7: ["RT", "↗"],
 8: ["Select", "⇺"],
 9: ["Start", "⇻"],
 16: ["Home", ""],
 12: ["D-Pad Up", "≻"],
 13: ["D-Pad Down", "≽"],
 14: ["D-Pad Left", "≺"],
 15: ["D-Pad Right", "≼"],
 10: ["L3", "↺"],
 100: ["Left Stick Up", "↾"],
 101: ["Left Stick Down", "⇂"],
 102: ["Left Stick Left", "↼"],
 103: ["Left Stick Right", "⇀"],
 104: ["Left Stick", "⇱"],
 11: ["R3", "↻"],
 200: ["Right Stick Up", "↿"],
 201: ["Right Stick Down", "⇃"],
 202: ["Right Stick Left", "↽"],
 203: ["Right Stick Right", "⇁"],
 204: ["Right Stick", "⇲"],
 17: ["Screenshot", "⇧"]
};
class BxEventBus {
 listeners = new Map;
 group;
 appJsInterfaces;
 static Script = new BxEventBus("script", {
  "dialog.shown": "onDialogShown",
  "dialog.dismissed": "onDialogDismissed"
 });
 static Stream = new BxEventBus("stream", {
  "state.loading": "onStreamPlaying",
  "state.playing": "onStreamPlaying",
  "state.stopped": "onStreamStopped"
 });
 constructor(group, appJsInterfaces) {
  this.group = group, this.appJsInterfaces = appJsInterfaces;
 }
 on(event, callback) {
  if (!this.listeners.has(event)) this.listeners.set(event, new Set);
  this.listeners.get(event).add(callback), BX_FLAGS.Debug && BxLogger.warning("EventBus", "on", event, callback);
 }
 once(event, callback) {
  let wrapper = (...args) => {
   callback(...args), this.off(event, wrapper);
  };
  this.on(event, wrapper);
 }
 off(event, callback) {
  if (BX_FLAGS.Debug && BxLogger.warning("EventBus", "off", event, callback), !callback) {
   this.listeners.delete(event);
   return;
  }
  let callbacks = this.listeners.get(event);
  if (!callbacks) return;
  if (callbacks.delete(callback), callbacks.size === 0) this.listeners.delete(event);
 }
 offAll() {
  this.listeners.clear();
 }
 emit(event, payload) {
  let callbacks = this.listeners.get(event) || [];
  for (let callback of callbacks)
   callback(payload);
  if (AppInterface) try {
    if (event in this.appJsInterfaces) {
     let method = this.appJsInterfaces[event];
     if (method && method in AppInterface) AppInterface[method]();
    } else AppInterface.onEventBus(this.group + "." + event);
   } catch (e) {
    console.log(e);
   }
  BX_FLAGS.Debug && BxLogger.warning("EventBus", "emit", `${this.group}.${event}`, payload);
 }
}
window.BxEventBus = BxEventBus;
class GhPagesUtils {
 static fetchLatestCommit() {
  NATIVE_FETCH("https://api.github.com/repos/redphx/better-xcloud/branches/gh-pages", {
   method: "GET",
   headers: {
    Accept: "application/vnd.github.v3+json"
   }
  }).then((response) => response.json()).then((data) => {
   let latestCommitHash = data.commit.sha;
   window.localStorage.setItem("BetterXcloud.GhPages.CommitHash", latestCommitHash);
  }).catch((error) => {
   BxLogger.error("GhPagesUtils", "Error fetching the latest commit:", error);
  });
 }
 static getUrl(path) {
  if (path[0] === "/") alert('`path` must not starts with "/"');
  let prefix = "https://raw.githubusercontent.com/redphx/better-xcloud", latestCommitHash = window.localStorage.getItem("BetterXcloud.GhPages.CommitHash");
  if (latestCommitHash) return `${prefix}/${latestCommitHash}/${path}`;
  else return `${prefix}/refs/heads/gh-pages/${path}`;
 }
 static getNativeMkbCustomList(update = !1) {
  let key = "BetterXcloud.GhPages.ForceNativeMkb";
  update && NATIVE_FETCH(GhPagesUtils.getUrl("native-mkb/ids.json")).then((response) => response.json()).then((json) => {
   if (json.$schemaVersion === 1) window.localStorage.setItem(key, JSON.stringify(json)), BxEventBus.Script.emit("list.forcedNativeMkb.updated", {
     data: json
    });
   else window.localStorage.removeItem(key);
  });
  let info = JSON.parse(window.localStorage.getItem(key) || "{}");
  if (info.$schemaVersion !== 1) return window.localStorage.removeItem(key), {};
  return info.data;
 }
 static getTouchControlCustomList() {
  let key = "BetterXcloud.GhPages.CustomTouchLayouts";
  return NATIVE_FETCH(GhPagesUtils.getUrl("touch-layouts/ids.json")).then((response) => response.json()).then((json) => {
   if (Array.isArray(json)) window.localStorage.setItem(key, JSON.stringify(json));
  }), JSON.parse(window.localStorage.getItem(key) || "[]");
 }
 static getLocalCoOpList() {
  let key = "BetterXcloud.GhPages.LocalCoOp";
  NATIVE_FETCH(GhPagesUtils.getUrl("local-co-op/ids.json")).then((response) => response.json()).then((json) => {
   if (json.$schemaVersion === 1) {
    window.localStorage.setItem(key, JSON.stringify(json));
    let ids = new Set(Object.keys(json.data));
    BxEventBus.Script.emit("list.localCoOp.updated", { ids });
   } else window.localStorage.removeItem(key), BxEventBus.Script.emit("list.localCoOp.updated", { ids: new Set });
  });
  let info = JSON.parse(window.localStorage.getItem(key) || "{}");
  if (info.$schemaVersion !== 1) return window.localStorage.removeItem(key), new Set;
  return new Set(Object.keys(info.data || {}));
 }
}
var SUPPORTED_LANGUAGES = {
 "en-US": "English (US)",
 "ca-CA": "Català",
 "cs-CZ": "čeština",
 "da-DK": "dansk",
 "de-DE": "Deutsch",
 "en-ID": "Bahasa Indonesia",
 "es-ES": "español (España)",
 "fr-FR": "français",
 "it-IT": "italiano",
 "ja-JP": "日本語",
 "ko-KR": "한국어",
 "pl-PL": "polski",
 "pt-BR": "português (Brasil)",
 "ru-RU": "русский",
 "th-TH": "ภาษาไทย",
 "tr-TR": "Türkçe",
 "uk-UA": "українська",
 "vi-VN": "Tiếng Việt",
 "zh-CN": "中文(简体)",
 "zh-TW": "中文(繁體)"
}, Texts = {
 achievements: "Achievements",
 activate: "Activate",
 activated: "Activated",
 active: "Active",
 advanced: "Advanced",
 "all-games": "All games",
 "always-off": "Always off",
 "always-on": "Always on",
 "amd-fidelity-cas": "AMD FidelityFX CAS",
 "app-settings": "App settings",
 apply: "Apply",
 "aspect-ratio": "Aspect ratio",
 "aspect-ratio-note": "Don't use with native touch games",
 audio: "Audio",
 auto: "Auto",
 availability: "Availability",
 "back-to-home": "Back to home",
 "back-to-home-confirm": "Do you want to go back to the home page (without disconnecting)?",
 "background-opacity": "Background opacity",
 battery: "Battery",
 "battery-saving": "Battery saving",
 "better-xcloud": "Better xCloud Plus",
 "bitrate-audio-maximum": "Maximum audio bitrate",
 "bitrate-video-maximum": "Maximum video bitrate",
 "bitrate-video-maximum-note": "Requests this cap from the server during WebRTC negotiation. Above 50 Mb/s, raise it again to use Unlimited (no local cap). The actual received value remains visible in Statistics and may be lower if xCloud limits the session.",
 bottom: "Bottom",
 "bottom-half": "Bottom half",
 "bottom-left": "Bottom-left",
 "bottom-right": "Bottom-right",
 brazil: "Brazil",
 brightness: "Brightness",
 "browser-unsupported-feature": "Your browser doesn't support this feature",
 "button-xbox": "Xbox button",
 "bypass-region-restriction": "Bypass region restriction",
 cancel: "Cancel",
 center: "Center",
 chat: "Chat",
 "clarity-boost": "Clarity boost",
 "clarity-boost-mode": "Clarity boost mode",
 "clarity-boost-warning": "These settings don't work when the Clarity Boost mode is ON",
 clear: "Clear",
 "clear-data": "Clear data",
 "clear-data-confirm": "Do you want to clear all Better xCloud settings and data?",
 "clear-data-success": "Data cleared! Refresh the page to apply the changes.",
 clock: "Clock",
 close: "Close",
 "close-app": "Close app",
 "combine-audio-video-streams": "Combine audio & video streams",
 "combine-audio-video-streams-summary": "May fix the laggy audio problem",
 "conditional-formatting": "Conditional formatting text color",
 "confirm-delete-preset": "Do you want to delete this preset?",
 "confirm-reload-stream": "Do you want to refresh the stream?",
 connected: "Connected",
 "console-connect": "Connect",
 "continent-asia": "Asia",
 "continent-australia": "Australia",
 "continent-europe": "Europe",
 "continent-north-america": "North America",
 "continent-south-america": "South America",
 contrast: "Contrast",
 controller: "Controller",
 "controller-customization": "Controller customization",
 "controller-customization-input-latency-note": "May slightly increase input latency",
 "controller-friendly-ui": "Controller-friendly UI",
 "controller-shortcuts": "Controller shortcuts",
 "controller-shortcuts-connect-note": "Connect a controller to use this feature",
 "controller-shortcuts-xbox-note": "Button to open the Guide menu",
 "controller-vibration": "Controller vibration",
 copy: "Copy",
 "create-shortcut": "Shortcut",
 custom: "Custom",
 "deadzone-counterweight": "Deadzone counterweight",
 "debug-info": "Debug info",
 decrease: "Decrease",
 default: "Default",
 "default-opacity": "Default opacity",
 "default-preset-note": "You can't modify default presets. Create a new one to customize it.",
 delete: "Delete",
 "detect-controller-button": "Detect controller button",
 device: "Device",
 "device-unsupported-touch": "Your device doesn't have touch support",
 "device-vibration": "Device vibration",
 "device-vibration-not-using-gamepad": "On when not using gamepad",
 disable: "Disable",
 "disable-features": "Disable features",
 "disable-home-context-menu": "Disable context menu in Home page",
 "disable-post-stream-feedback-dialog": "Disable post-stream feedback dialog",
 "disable-social-features": "Disable social features",
 "disable-xcloud-analytics": "Disable xCloud analytics",
 disabled: "Disabled",
 disconnected: "Disconnected",
 download: "Download",
 downloaded: "Downloaded",
 edit: "Edit",
 "enable-controller-shortcuts": "Enable controller shortcuts",
 "enable-local-co-op-support": "Enable local co-op support",
 "enable-local-co-op-support-note": "Only works with some games",
 "enable-mic-on-startup": "Enable microphone on game launch",
 "enable-mkb": "Emulate controller with Mouse & Keyboard",
 "enable-quick-glance-mode": 'Enable "Quick Glance" mode',
 "enable-remote-play-feature": 'Enable the "Remote Play" feature',
 "enable-volume-control": "Enable volume control feature",
 enabled: "Enabled",
 experimental: "Experimental",
 "exit-fullscreen": "Exit fullscreen",
 export: "Export",
 fast: "Fast",
 "force-native-mkb-games": "Force native Mouse & Keyboard for these games",
 "fortnite-allow-stw-mode": 'Allows playing "Save the World" mode on mobile',
 "fortnite-force-console-version": "Fortnite: force console version",
 fullscreen: "Fullscreen",
 "friends-followers": "Friends and followers",
 "game-bar": "Game Bar",
 general: "General",
 "getting-consoles-list": "Getting the list of consoles...",
 guide: "Guide",
 "open-project-on-github": "Open Better xCloud Plus on GitHub",
 help: "Help",
 hide: "Hide",
 "hide-idle-cursor": "Hide mouse cursor on idle",
 "hide-scrollbar": "Hide web page's scrollbar",
 "hide-sections": "Hide sections",
 "hide-system-menu-icon": "Hide System menu's icon",
 "hide-touch-controller": "Hide touch controller",
 "high-performance": "High performance",
 "highest-quality": "Highest quality",
 "highest-quality-note": "Your device may not be powerful enough to use these settings",
 "horizontal-scroll-sensitivity": "Horizontal scroll sensitivity",
 "horizontal-sensitivity": "Horizontal sensitivity",
 "how-to-fix": "How to fix",
 "how-to-improve-app-performance": "How to improve app's performance",
 ignore: "Ignore",
 "image-quality": "Website's image quality",
 "image-quality-note": "Requests higher quality for site artwork, covers, and backgrounds. Does not change the game stream.",
 "image-quality-maximum": "Maximum (100%)",
 "image-quality-ultra": "Ultra (95%)",
 image: "Image",
 import: "Import",
 "in-game-controller-customization": "In-game controller customization",
 "in-game-controller-shortcuts": "In-game controller shortcuts",
 "in-game-keyboard-shortcuts": "In-game keyboard shortcuts",
 "in-game-shortcuts": "In-game shortcuts",
 increase: "Increase",
 "install-android": "Better xCloud app for Android",
 invites: "Invites",
 japan: "Japan",
 jitter: "Jitter",
 "keyboard-key": "Keyboard key",
 "keyboard-shortcuts": "Keyboard shortcuts",
 korea: "Korea",
 language: "Language",
 "mapping-and-shortcuts": "Mapping & shortcuts",
 "keep-cloud-session-alive": "Keep cloud session active",
 "keep-cloud-session-alive-note": "When xCloud warns that the session is idle, sends a keep-alive to avoid disconnection due to inactivity. This does not prevent internet drops, service maintenance, or manual exit.",
 "cloud-session-kept-alive": "Cloud session kept active",
 "pc-only-not-supported-on-mobile": "PC only — not supported on mobile.",
 "pc-only": "PC only",
 "skip-session-rating": "Skip rating after session",
 "skip-session-rating-note": 'Automatically closes the "Did you enjoy your experience?" question and shows a brief notice.',
 "switch-server-to-bypass-queue": "To bypass the queue, switch servers.",
 "vx-mobile-warning-title": "Before enabling VX AI on mobile",
 "vx-mobile-warning-summary": "Experimental feature: depends on the device and Android System WebView.",
 "vx-mobile-warning-webgl": 'For VX effects to work, the phone needs WebGL2 in Android System WebView. Open "VX Diagnostics" below and confirm that the backend is WebGL2 or WebGPU.',
 "vx-mobile-warning-performance": "On less powerful devices, use only sharpening or low artifact reduction. Frame generation, temporal reconstruction, and strong upscaling can increase heat, battery use, and input lag.",
 "vx-mobile-warning-fallback": 'If diagnostics shows "none", set Video renderer to Default and keep frame generation off.',
 large: "Large",
 layout: "Layout",
 "left-stick": "Left stick",
 "left-stick-deadzone": "Left stick deadzone",
 "left-trigger-range": "Left trigger range",
 "limit-fps": "Limit FPS",
 "vx-tab": "VX AI",
 "vx-ai-and-reconstruction": "VX AI and reconstruction",
 "vx-target-fps": "Target FPS:",
 "remap-controller-buttons": "Remap controller buttons",
 "open-remapping": "Open remapping",
 "remap-controller-buttons-note": "Create or edit a profile to remap A, B, X, Y, triggers, and sticks.",
 "limit-fps-vx-note": 'Sets the base frames for VX. To simulate 20 → 60 FPS, choose 20 FPS here and 3× in VX frame generation. For 10 → 60 FPS, use "Custom (target FPS)" at 60. The result does not exceed the monitor refresh rate.',
 "vx-output-resolution": "VX output resolution",
 "vx-native-stream": "Native stream",
 "vx-auto-up-to-1440p": "Automatic (up to 1440p)",
 "vx-upscale-1440p": "1440p with upscaling",
 "vx-upscale-4k": "4K with upscaling",
 "vx-upscale-resolution-note": "Spatial upscaling only; this does not change the resolution sent by the server. Cannot be used together with VX frame generation.",
 "vx-upscale-algorithm": "VX upscaling algorithm",
 "vx-balanced": "VX default (balanced)",
 "vx-upscale-algorithm-note": "Choose only one. FSR 1 prioritizes natural edges; NIS prioritizes directional sharpness. Both work on the received frame.",
 "vx-anti-aliasing": "VX anti-aliasing",
 "vx-fxaa-fast": "Fast FXAA",
 "vx-fxaa-quality": "Quality FXAA",
 "vx-fxaa-strong": "Strong FXAA",
 "vx-anti-aliasing-note": 'Local FXAA post-processing on the received frame. Works in WebGL2; "Strong" smooths diagonals more, but may also soften text and fine details.',
 "vx-artifact-reduction": "VX artifact reduction",
 "vx-artifact-reduction-note": "Edge-preserving deblock/denoise. High values may soften fine details.",
 "vx-frame-generation": "VX frame generation",
 "vx-optical-flow": "optical flow (experimental)",
 "vx-custom-target-fps": "Custom (target FPS)",
 "vx-frame-generation-note": "Generates intermediate images through local optical flow. Example: a 20 FPS limit + 3× processes about 60 internal FPS. Above monitor refresh rate, extra frames are processed and counted, but cannot all be displayed. Cannot be used together with VX upscaling.",
 "vx-latency-budget": "VX latency budget",
 "vx-latency-budget-note": "Sets the maximum local VX processing time. If the renderer repeatedly exceeds it, it temporarily reduces the most expensive effects and frame generation; restores them when there is headroom. Does not change network latency.",
 "vx-adaptive-sharpness": "VX adaptive sharpness",
 "vx-adaptive-sharpness-note": "Reduces sharpness in moving areas to reduce halos and aliasing.",
 "vx-dynamic-reconstruction": "VX dynamic reconstruction",
 "vx-dynamic-reconstruction-note": "Increases reconstruction at larger scales, when the received image has less detail for the selected output.",
 "vx-temporal-super-resolution": "VX temporal super resolution",
 "vx-temporal-super-resolution-note": "Combines the previous frame only in stable regions. May reduce noise, but increases GPU cost.",
 "vx-hud-protection": "HUD protection during VX generation",
 "vx-hud-protection-note": "Preserves stable HUD text, icons, and edges to reduce duplication during interpolation.",
 "vx-custom-generation-fps": "Custom VX generation FPS",
 "vx-custom-generation-fps-note": 'Used when "Custom (target FPS)" is selected above. Above monitor refresh rate, VX keeps processing and counting internal frames, but the display can show only up to its physical refresh rate. High values increase GPU use.',
 "vx-fine-detail-reconstruction": "VX fine-detail reconstruction",
 "vx-fine-detail-reconstruction-note": "Enhances micro-details in textures and edges after artifact reduction. It does not create native detail; high values may create halos.",
 "vx-competitive-mode": "VX competitive mode",
 "vx-competitive-mode-note": "Prioritizes the lowest latency: uses native video and temporarily disables VX upscaling, frame generation, temporal reconstruction, artifacts, and sharpness. Your preferences are restored when it is turned off.",
 "restore-rocket-animation": "Restore rocket animation",
 "restore-rocket-animation-note": 'Uses the original Xbox animation during loading. With "Show game art" enabled, the rocket is slightly transparent over the cover without covering the menu. The final Xbox logo follows "Skip Xbox intro".',
 "hub-card-size": "Hub Plus: card size",
 "hub-card-size-note": "Changes the space used by each game in the home page rows.",
 "hub-rounded-cards": "Hub Plus: rounded cards",
 "hub-rounded-cards-note": "Rounds the game cards on the home page.",
 "hub-hover-effects": "Hub Plus: hover effects",
 "hub-hover-effects-note": "Adds a visual effect when the mouse is over a game card.",
 "hub-card-animations": "Hub Plus: card animations",
 "hub-card-animations-note": "Animates game cards as they appear and when you interact with them.",
 "vx-fps-base": "Base",
 "vx-fps-render": "VX",
 "vx-fps-base-title": "Base FPS used for local generation",
 "vx-fps-render-title": "Local VX render FPS",
 "suggested-control-profile": "Suggested profile for this game",
 "use-suggested-profile": "Use suggested profile",
 "suggested-profile-note": "Suggestion only; it does not change your selection automatically.",
 "mkb-preset-shooter": "Shooter",
 "mkb-preset-racing": "Racing",
 "mkb-preset-fighting": "Fighting",
 "mkb-preset-platformer": "Platformer",
 "mkb-preset-rpg-action": "RPG / Action",
 "mkb-preset-sports": "Sports",
 "vx-diagnostics": "VX Diagnostics",
 "vx-diagnostics-description": "Experimental diagnostics. Upscaling and artifact reduction work only through the selected WebGL2/WebGPU renderer. Local frame generation is capped at 1080p to protect latency.",
 "vx-diagnostics-backend": "Available backend",
 "vx-diagnostics-vfc": "requestVideoFrameCallback",
 "vx-diagnostics-video-frame": "VideoFrame",
 "vx-diagnostics-refresh-rate": "Estimated display refresh rate",
 "vx-diagnostics-renderer-time": "Renderer submission time",
 "vx-diagnostics-latency-protection": "VX latency protection",
 "vx-diagnostics-unavailable": "unavailable",
 "vx-diagnostics-measuring": "measuring",
 "vx-diagnostics-refresh": "Refresh status",
 "load-failed-message": "Failed to run Better xCloud",
 "loading-screen": "Loading screen",
 "local-co-op": "Local co-op",
 "lowest-quality": "Lowest quality",
 manage: "Manage",
 "map-mouse-to": "Map mouse to",
 "may-not-work-properly": "May not work properly!",
 menu: "Menu",
 microphone: "Microphone",
 "mkb-adjust-ingame-settings": "You may also need to adjust the in-game sensitivity & deadzone settings",
 "mkb-click-to-activate": "Click to activate",
 "mkb-disclaimer": "This could be viewed as cheating when playing online",
 "modifiers-note": "To use more than one key, include Ctrl, Alt or Shift in your shortcut. Command key is not allowed.",
 "mouse-and-keyboard": "Mouse & Keyboard",
 "original-creator-credits": "Credits to the original creator: redphx (Better xCloud).",
 "mouse-click": "Mouse click",
 "mouse-wheel": "Mouse wheel",
 muted: "Muted",
 name: "Name",
 "native-mkb": "Native Mouse & Keyboard",
 new: "New",
 "new-version-available": [
  e => `Version ${e.version} available`,
  e => `Versió ${e.version} disponible`,
  e => `Verze ${e.version} dostupná`,
  ,
  e => `Version ${e.version} verfügbar`,
  e => `Versi ${e.version} tersedia`,
  e => `Versión ${e.version} disponible`,
  e => `Version ${e.version} disponible`,
  e => `Disponibile la versione ${e.version}`,
  e => `Ver ${e.version} が利用可能です`,
  e => `${e.version} 버전 사용가능`,
  e => `Dostępna jest nowa wersja ${e.version}`,
  e => `Versão ${e.version} disponível`,
  e => `Версия ${e.version} доступна`,
  e => `เวอร์ชัน ${e.version} พร้อมใช้งานแล้ว`,
  e => `${e.version} sayılı yeni sürüm mevcut`,
  e => `Доступна версія ${e.version}`,
  e => `Đã có phiên bản ${e.version}`,
  e => `版本 ${e.version} 可供更新`,
  e => `已可更新為 ${e.version} 版`
 ],
 "no-consoles-found": "No consoles found",
 "no-controllers-connected": "No controllers connected",
 normal: "Normal",
 notifications: "Notifications",
 off: "Off",
 official: "Official",
 oled: "OLED",
 on: "On",
 "only-supports-some-games": "Only supports some games",
 opacity: "Opacity",
 other: "Other",
 performance: "Performance",
 playing: "Playing",
 playtime: "Playtime",
 poland: "Poland",
 "polling-rate": "Polling rate",
 position: "Position",
 "powered-off": "Powered off",
 "powered-on": "Powered on",
 "prefer-ipv6-server": "Prefer IPv6 server",
 "preferred-game-language": "Preferred game's language",
 preset: "Preset",
 press: "Press",
 "press-any-button": "Press any button...",
 "press-esc-to-cancel": "Press Esc to cancel",
 "press-key-to-toggle-mkb": [
  e => `Press ${e.key} to toggle this feature`,
  e => `Premeu ${e.key} per alternar aquesta funció`,
  e => `Zmáčknete ${e.key} pro přepnutí této funkce`,
  e => `Tryk på ${e.key} for at slå denne funktion til`,
  e => `${e.key}: Funktion an-/ausschalten`,
  e => `Tekan ${e.key} untuk mengaktifkan fitur ini`,
  e => `Pulsa ${e.key} para alternar esta función`,
  e => `Appuyez sur ${e.key} pour activer cette fonctionnalité`,
  e => `Premi ${e.key} per attivare questa funzionalità`,
  e => `${e.key} でこの機能を切替`,
  e => `${e.key} 키를 눌러 이 기능을 켜고 끄세요`,
  e => `Naciśnij ${e.key} aby przełączyć tę funkcję`,
  e => `Pressione ${e.key} para alternar este recurso`,
  e => `Нажмите ${e.key} для переключения этой функции`,
  e => `กด ${e.key} เพื่อสลับคุณสมบัตินี้`,
  e => `Etkinleştirmek için ${e.key} tuşuna basın`,
  e => `Натисніть ${e.key} щоб перемкнути цю функцію`,
  e => `Nhấn ${e.key} để bật/tắt tính năng này`,
  e => `按下 ${e.key} 来切换此功能`,
  e => `按下 ${e.key} 來啟用此功能`
 ],
 "press-to-bind": "Press a key or do a mouse click to bind...",
 "prevent-resolution-drops": "Prevent resolution drops",
 "prompt-preset-name": "Preset's name:",
 quality: "Quality",
 recommended: "Recommended",
 "recommended-settings-for-device": [
  e => `Recommended settings for ${e.device}`,
  e => `Configuració recomanada per a ${e.device}`,
  ,
  ,
  e => `Empfohlene Einstellungen für ${e.device}`,
  e => `Rekomendasi pengaturan untuk ${e.device}`,
  e => `Ajustes recomendados para ${e.device}`,
  e => `Paramètres recommandés pour ${e.device}`,
  e => `Configurazioni consigliate per ${e.device}`,
  e => `${e.device} の推奨設定`,
  e => `다음 기기에서 권장되는 설정: ${e.device}`,
  e => `Zalecane ustawienia dla ${e.device}`,
  e => `Configurações recomendadas para ${e.device}`,
  e => `Рекомендуемые настройки для ${e.device}`,
  e => `การตั้งค่าที่แนะนำสำหรับ ${e.device}`,
  e => `${e.device} için önerilen ayarlar`,
  e => `Рекомендовані налаштування для ${e.device}`,
  e => `Cấu hình được đề xuất cho ${e.device}`,
  e => `${e.device} 的推荐设置`,
  e => `${e.device} 推薦的設定`
 ],
 "reduce-animations": "Reduce UI animations",
 region: "Region",
 "reload-page": "Reload page",
 "remote-play": "Remote Play",
 rename: "Rename",
 renderer: "Renderer",
 "renderer-configuration": "Renderer configuration",
 "reset-highlighted-setting": "Reset highlighted setting",
 resolution: "Resolution",
 "right-click-to-unbind": "Right-click on a key to unbind it",
 "right-stick": "Right stick",
 "right-stick-deadzone": "Right stick deadzone",
 "right-trigger-range": "Right trigger range",
 "rocket-always-hide": "Always hide",
 "rocket-always-show": "Always show",
 "rocket-animation": "Rocket animation",
 "rocket-hide-queue": "Hide when queuing",
 saturation: "Saturation",
 save: "Save",
 screen: "Screen",
 "screenshot-apply-filters": "Apply video filters to screenshots",
 "section-all-games": "All games",
 "section-genres": "Genres",
 "section-leaving-soon": "Leaving soon",
 "section-most-popular": "Most popular",
 "section-native-mkb": "Play with mouse & keyboard",
 "section-news": "News",
 "section-play-with-friends": "Play with friends",
 "section-recently-added": "Recently added",
 "section-touch": "Play with touch",
 "separate-touch-controller": "Separate Touch controller & Controller #1",
 "separate-touch-controller-note": "Touch controller is Player 1, Controller #1 is Player 2",
 server: "Server",
 "server-list-error": "Can't get the server list",
 "server-locations": "Server locations",
 settings: "Settings",
 "settings-for": "Settings for",
 "settings-reload": "Reload page to reflect changes",
 "settings-reload-note": "Settings in this tab only go into effect on the next page load",
 "settings-reloading": "Reloading...",
 sharpness: "Sharpness",
 "shortcut-keys": "Shortcut keys",
 show: "Show",
 "show-controller-connection-status": "Show controller connection status",
 "show-game-art": "Show game art",
 "show-hide": "Show/hide",
 "show-stats-on-startup": "Show stats when starting the game",
 "show-touch-controller": "Show touch controller",
 "show-wait-time": "Show the estimated wait time",
 "show-wait-time-in-game-card": "Show wait time in game card",
 "simplify-stream-menu": "Simplify Stream's menu",
 "skip-splash-video": "Skip Xbox splash video",
 slow: "Slow",
 small: "Small",
 "smart-tv": "Smart TV",
 sound: "Sound",
 standard: "Standard",
 standby: "Standby",
 "stat-bitrate": "Bitrate",
 "stat-decode-time": "Decode time",
 "stat-fps": "FPS",
 "stat-frames-lost": "Frames lost",
 "stat-packets-lost": "Packets lost",
 "stat-ping": "Ping",
 stats: "Stats",
 "stick-decay-minimum": "Stick decay minimum",
 "stick-decay-strength": "Stick decay strength",
 stream: "Stream",
 "stream-settings": "Stream settings",
 "stream-stats": "Stream stats",
 "stream-your-own-game": "Stream your own game",
 stretch: "Stretch",
 "suggest-settings": "Suggest settings",
 "suggest-settings-link": "Suggest recommended settings for this device",
 "support-better-xcloud": "Support Better xCloud",
 "swap-buttons": "Swap buttons",
 "take-screenshot": "Take screenshot",
 "target-resolution": "Target resolution",
 "tc-all-white": "All white",
 "tc-auto-off": "Off when controller found",
 "tc-custom-layout-style": "Custom layout's button style",
 "tc-muted-colors": "Muted colors",
 "tc-standard-layout-style": "Standard layout's button style",
 "test-controller": "Test controller",
 "text-size": "Text size",
 theme: "Theme",
 toggle: "Toggle",
 top: "Top",
 "top-center": "Top-center",
 "top-half": "Top half",
 "top-left": "Top-left",
 "top-right": "Top-right",
 "touch-control-layout": "Touch control layout",
 "touch-control-layout-by": [
  e => `Touch control layout by ${e.name}`,
  e => `Format del control tàctil per ${e.name}`,
  e => `Rozložení dotykového ovládání ${e.name}`,
  e => `Touch-kontrol layout af ${e.name}`,
  e => `Touch-Steuerungslayout von ${e.name}`,
  e => `Tata letak Sentuhan layar oleh ${e.name}`,
  e => `Disposición del control táctil por ${e.nombre}`,
  e => `Disposition du contrôleur tactile par ${e.name}`,
  e => `Configurazione dei comandi su schermo creata da ${e.name}`,
  e => `タッチ操作レイアウト作成者: ${e.name}`,
  e => `${e.name} 제작, 터치 컨트롤 레이아웃`,
  e => `Układ sterowania dotykowego stworzony przez ${e.name}`,
  e => `Disposição de controle por toque feito por ${e.name}`,
  e => `Сенсорная раскладка по ${e.name}`,
  e => `รูปแบบการควบคุมแบบสัมผัสโดย ${e.name}`,
  e => `${e.name} kişisinin dokunmatik kontrolcü tuş şeması`,
  e => `Розташування сенсорного керування від ${e.name}`,
  e => `Bố cục điều khiển cảm ứng tạo bởi ${e.name}`,
  e => `由 ${e.name} 提供的虚拟按键样式`,
  e => `觸控遊玩佈局由 ${e.name} 提供`
 ],
 "touch-controller": "Touch controller",
 "true-achievements": "TrueAchievements",
 ui: "UI",
 "unexpected-behavior": "May cause unexpected behavior",
 "united-states": "United States",
 unknown: "Unknown",
 unlimited: "Unlimited",
 unmuted: "Unmuted",
 unofficial: "Unofficial",
 "unofficial-game-list": "Unofficial game list",
 "unsharp-masking": "Unsharp masking",
 upload: "Upload",
 uploaded: "Uploaded",
 "use-mouse-absolute-position": "Use mouse's absolute position",
 "use-this-at-your-own-risk": "Use this at your own risk",
 "user-agent-profile": "User-Agent profile",
 "vertical-scroll-sensitivity": "Vertical scroll sensitivity",
 "vertical-sensitivity": "Vertical sensitivity",
 "vibration-intensity": "Vibration intensity",
 "vibration-status": "Vibration",
 video: "Video",
 "virtual-controller": "Virtual controller",
 "virtual-controller-slot": "Virtual controller slot",
 "visual-quality": "Visual quality",
 "visual-quality-high": "High",
 "visual-quality-low": "Low",
 "visual-quality-normal": "Normal",
 volume: "Volume",
 "wait-time-countdown": "Countdown",
 "wait-time-estimated": "Estimated finish time",
 "waiting-for-input": "Waiting for input...",
 "tutorial-welcome-title": "Welcome to Better xCloud Plus",
 "tutorial-welcome-body": "This quick guide shows where the main controls are. You can change everything later in the menu.",
 "tutorial-intro-title": "Welcome",
 "tutorial-intro-body": "Get ready to make your xCloud experience more personal. This quick guide will show you the main features before you start playing.",
 "tutorial-about-title": "Meet Better xCloud Plus",
 "tutorial-about-body": "Better xCloud Plus adds practical controls to xCloud, such as server selection, visual settings, stream statistics, controller tools, and local VX effects.",
 "tutorial-menu-title": "Your Better xCloud Plus menu",
 "tutorial-menu-body": "The menu is now open. Its tabs organize the settings by category, and you can open it again from the button in the top bar.",
 "tutorial-server-title": "Choose the best server",
 "tutorial-server-body": "Choose a region close to you here. The best server usually gives you lower latency and a more stable stream.",
 "tutorial-stream-title": "Set quality and bitrate",
 "tutorial-stream-body": "Select the stream resolution and maximum bitrate here. Higher values need a faster, more stable connection.",
 "tutorial-image-title": "Adjust the image",
 "tutorial-image-body": "The Image tab has video options such as sharpness, colors, FPS limit, and local post-processing.",
 "tutorial-vx-title": "Customize your experience",
 "tutorial-vx-body": "VX AI has local upscale and frame-generation options. Try one change at a time, as these effects depend on your device.",
 "tutorial-controls-title": "Configure your controls",
 "tutorial-controls-body": "Use Controller to customize gamepad behavior. Mouse & Keyboard has profiles and mappings for games that support them.",
 "tutorial-controller-navigation-title": "Open the menu with a controller",
 "tutorial-controller-navigation-body": "While playing, press Start and Select together to open Better xCloud Plus. Use the D-pad or left stick to move, A to select, and B to close or go back. You can customize other shortcuts in Controller.",
 "tutorial-controller-navigation-open-action": "Open Better xCloud Plus while playing",
 "tutorial-controller-navigation-move-action": "Move through the menu",
 "tutorial-controller-navigation-select-action": "Select",
 "tutorial-controller-navigation-back-action": "Close or go back",
 "tutorial-controller-navigation-shortcuts-note": "You can customize other shortcuts in Controller.",
 "tutorial-stats-title": "Keep an eye on the stream",
 "tutorial-stats-body": "Statistics show FPS, latency, bitrate, and packet loss while you play, helping you find connection issues.",
 "tutorial-explore-title": "Explore the rest",
 "tutorial-explore-body": "There are more options to discover in every tab. Explore them at your own pace and adjust Better xCloud Plus the way you prefer.",
 "tutorial-skip": "Exit and don't show again",
 "tutorial-back": "Back",
 "tutorial-continue": "Continue",
 "tutorial-start": "Start",
 "show-tutorial-again": "View tutorial again",
 wallpaper: "Wallpaper",
 webgl2: "WebGL2",
 webgpu: "WebGPU",
 "xbox-360-games": "Xbox 360 games",
 "xbox-apps": "Xbox apps",
 "xcloud-website-version": "xCloud website version",
 "vx-upscale-pipeline": "Stream → VX spatial upscale → local output"
}, LOCAL_TRANSLATIONS = {
 "pt-BR": {
  "bitrate-video-maximum-note": "Solicita este teto ao servidor durante a negociação WebRTC. Depois de 50 Mb/s, aumente novamente para usar Ilimitado (sem teto local). O valor recebido de verdade continua visível nas Estatísticas e pode ficar menor se o xCloud limitar a sessão.",
  "keep-cloud-session-alive": "Manter sessão na nuvem ativa",
  "keep-cloud-session-alive-note": "Quando o xCloud avisar que a sessão está inativa, envia um keep-alive para evitar o desligamento por inatividade. Não evita quedas de internet, manutenção do serviço ou encerramento manual.",
  "cloud-session-kept-alive": "Sessão na nuvem mantida ativa",
  unlimited: "Ilimitado",
  "debug-info": "Informações de depuração",
  general: "Geral",
  image: "Imagem",
  controller: "Controle",
  "open-project-on-github": "Abrir Better xCloud Plus no GitHub",
  "mouse-and-keyboard": "Mouse e teclado",
  "stream-stats": "Estatísticas",
  "mapping-and-shortcuts": "Mapeamento e atalhos",
  fullscreen: "Tela cheia",
  "exit-fullscreen": "Sair da tela cheia",
  "xcloud-website-version": "Versão do site xCloud",
  "original-creator-credits": "Créditos ao criador original: redphx (Better xCloud).",
  "image-quality-note": "Aumenta a qualidade solicitada para as artes, capas e fundos do site. Não altera o stream do jogo.",
  "image-quality-maximum": "Máxima (100%)",
  "image-quality-ultra": "Ultra (95%)",
  "vx-upscale-pipeline": "Stream → upscale espacial VX → saída local",
  "tutorial-welcome-title": "Bem-vindo ao Better xCloud Plus",
  "tutorial-welcome-body": "Este guia rápido mostra onde ficam os controles principais. Você pode alterar tudo depois pelo menu.",
  "tutorial-intro-title": "Bem-vindo",
  "tutorial-intro-body": "Prepare-se para deixar sua experiência no xCloud mais personalizada. Este guia rápido mostra os recursos principais antes de você começar a jogar.",
  "tutorial-about-title": "Conheça o Better xCloud Plus",
  "tutorial-about-body": "O Better xCloud Plus adiciona controles práticos ao xCloud, como escolha de servidor, ajustes visuais, estatísticas do stream, ferramentas de controle e efeitos locais VX.",
  "tutorial-menu-title": "Seu menu do Better xCloud Plus",
  "tutorial-menu-body": "O menu foi aberto. As abas organizam as opções por categoria, e você pode abri-lo novamente pelo botão na barra superior.",
  "tutorial-server-title": "Escolha o melhor servidor",
  "tutorial-server-body": "Escolha aqui uma região próxima de você. O melhor servidor normalmente traz menos atraso e um stream mais estável.",
  "tutorial-stream-title": "Ajuste qualidade e bitrate",
  "tutorial-stream-body": "Selecione aqui a resolução do stream e a taxa máxima de bits. Valores maiores precisam de uma conexão mais rápida e estável.",
  "tutorial-image-title": "Ajuste a imagem",
  "tutorial-image-body": "A aba Imagem tem opções como nitidez, cores, limite de FPS e pós-processamento local.",
  "tutorial-vx-title": "Personalize sua experiência",
  "tutorial-vx-body": "A IA VX possui upscale local e geração de frames. Teste uma alteração por vez, pois esses efeitos dependem do aparelho.",
  "tutorial-controls-title": "Configure seus controles",
  "tutorial-controls-body": "Use Controle para personalizar o gamepad. Mouse e teclado possui perfis e mapeamentos para jogos compatíveis.",
  "tutorial-controller-navigation-title": "Abra o menu com o controle",
  "tutorial-controller-navigation-body": "Enquanto joga, pressione Start e Select juntos para abrir o Better xCloud Plus. Use o direcional ou analógico esquerdo para mover, A para selecionar e B para fechar ou voltar. Você pode personalizar os outros atalhos em Controle.",
  "tutorial-controller-navigation-open-action": "Abrir o Better xCloud Plus durante o jogo",
  "tutorial-controller-navigation-move-action": "Mover pelo menu",
  "tutorial-controller-navigation-select-action": "Selecionar",
  "tutorial-controller-navigation-back-action": "Fechar ou voltar",
  "tutorial-controller-navigation-shortcuts-note": "Você pode personalizar outros atalhos na aba Controle.",
  "tutorial-stats-title": "Acompanhe o stream",
  "tutorial-stats-body": "As estatísticas mostram FPS, latência, bitrate e perda de pacotes enquanto você joga, ajudando a encontrar problemas de conexão.",
  "tutorial-explore-title": "Explore o restante",
  "tutorial-explore-body": "Há mais opções para descobrir em todas as abas. Explore no seu ritmo e ajuste o Better xCloud Plus do jeito que preferir.",
  "tutorial-skip": "Sair e não mostrar novamente",
  "tutorial-back": "Voltar",
  "tutorial-continue": "Continuar",
  "tutorial-start": "Começar",
  "show-tutorial-again": "Ver o tutorial novamente",
  "pc-only-not-supported-on-mobile": "Exclusivo de PC — não suportado no celular.",
  "pc-only": "Exclusivo de PC",
  "skip-session-rating": "Pular avaliação após a sessão",
  "skip-session-rating-note": "Fecha automaticamente a pergunta “Você gostou da experiência?” e mostra um aviso curto.",
  "switch-server-to-bypass-queue": "Para “burlar” a fila, troque de servidor.",
  "vx-mobile-warning-title": "Antes de ativar IA VX no celular",
  "vx-mobile-warning-summary": "Recurso experimental: depende do aparelho e do Android System WebView.",
  "vx-mobile-warning-webgl": "Para os efeitos VX funcionarem, o celular precisa ter WebGL2 disponível no Android System WebView. Abra “Diagnóstico VX” abaixo e confirme que o backend é WebGL2 ou WebGPU.",
  "vx-mobile-warning-performance": "Em aparelhos mais simples, use apenas nitidez ou redução de artefatos em nível baixo. Geração de frames, reconstrução temporal e upscale forte podem aumentar o aquecimento, gastar bateria e adicionar atraso nos controles.",
  "vx-mobile-warning-fallback": "Se o diagnóstico mostrar “nenhum”, deixe o Renderizador de vídeo em Padrão e mantenha a geração de frames desligada.",
  "vx-tab": "IA VX",
  "vx-ai-and-reconstruction": "IA VX e reconstrução",
  "vx-target-fps": "FPS alvo:",
  "remap-controller-buttons": "Remapear botões do controle",
  "open-remapping": "Abrir remapeamento",
  "remap-controller-buttons-note": "Crie ou edite um perfil para trocar A, B, X, Y, gatilhos e analógicos.",
  "limit-fps-vx-note": "Define os frames-base da VX. Para simular 20 → 60 FPS, escolha 20 FPS aqui e 3× em Geração de frames VX. Para 10 → 60 FPS, use “Personalizado (FPS alvo)” em 60. O resultado não passa da taxa de atualização do monitor.",
  "vx-output-resolution": "Resolução de saída VX",
  "vx-native-stream": "Stream nativo",
  "vx-auto-up-to-1440p": "Automático (até 1440p)",
  "vx-upscale-1440p": "1440p com upscale",
  "vx-upscale-4k": "4K com upscale",
  "vx-upscale-resolution-note": "Apenas upscale espacial; isto não altera a resolução enviada pelo servidor. Não pode ser usado junto com geração de frames VX.",
  "vx-upscale-algorithm": "Algoritmo de upscale VX",
  "vx-balanced": "VX padrão (equilibrado)",
  "vx-upscale-algorithm-note": "Escolha apenas um. FSR 1 prioriza bordas naturais; NIS prioriza nitidez direcional. Ambos trabalham no frame recebido.",
  "vx-anti-aliasing": "Antisserrilhado VX",
  "vx-fxaa-fast": "FXAA rápido",
  "vx-fxaa-quality": "FXAA qualidade",
  "vx-fxaa-strong": "FXAA forte",
  "vx-anti-aliasing-note": "Pós-processamento FXAA local no frame recebido. Funciona no WebGL2; “Forte” suaviza mais as diagonais, mas também pode suavizar textos e detalhes finos.",
  "vx-artifact-reduction": "Redução de artefatos VX",
  "vx-artifact-reduction-note": "Deblock/denoise com preservação de bordas. Valores altos podem suavizar detalhes finos.",
  "vx-frame-generation": "Geração de frames VX",
  "vx-optical-flow": "fluxo óptico (experimental)",
  "vx-custom-target-fps": "Personalizado (FPS alvo)",
  "vx-frame-generation-note": "Gera imagens intermediárias por fluxo óptico local. Exemplo: limite de 20 FPS + 3× processa cerca de 60 FPS internos. Acima da taxa do monitor, os frames extras são processados e contabilizados, mas não podem ser todos exibidos. Não pode ser usada junto com upscale VX.",
  "vx-latency-budget": "Orçamento de latência VX",
  "vx-latency-budget-note": "Define o tempo máximo de processamento local VX. Se o renderizador ultrapassar esse valor repetidamente, reduz temporariamente os efeitos mais caros e a geração de frames; restaura quando houver folga. Não altera a latência da rede.",
  "vx-adaptive-sharpness": "Nitidez adaptativa VX",
  "vx-adaptive-sharpness-note": "Reduz a nitidez em áreas com movimento para diminuir halos e serrilhado.",
  "vx-dynamic-reconstruction": "Reconstrução dinâmica VX",
  "vx-dynamic-reconstruction-note": "Aumenta a reconstrução em ampliações maiores, quando a imagem recebida tem menos detalhes para a saída escolhida.",
  "vx-temporal-super-resolution": "Super-resolução temporal VX",
  "vx-temporal-super-resolution-note": "Combina o frame anterior apenas em regiões estáveis. Pode reduzir ruído, mas aumentará o custo da GPU.",
  "vx-hud-protection": "Proteção de HUD na geração VX",
  "vx-hud-protection-note": "Preserva texto, ícones e bordas estáveis do HUD para reduzir duplicação durante a interpolação.",
  "vx-custom-generation-fps": "FPS personalizado da geração VX",
  "vx-custom-generation-fps-note": "Usado quando “Personalizado (FPS alvo)” estiver selecionado acima. Acima da taxa do monitor, VX continua processando e contabilizando frames internos, mas a tela só pode exibir até a taxa de atualização física. Valores altos aumentam o uso da GPU.",
  "vx-fine-detail-reconstruction": "Reconstrução de detalhes finos VX",
  "vx-fine-detail-reconstruction-note": "Realça microdetalhes em texturas e contornos após a redução de artefatos. Não cria detalhes nativos; valores altos podem formar halos.",
  "vx-competitive-mode": "Modo competitivo VX",
  "vx-competitive-mode-note": "Prioriza a menor latência: usa o vídeo nativo e desliga temporariamente upscale, geração de frames, reconstrução temporal, artefatos e nitidez VX. Suas preferências são restauradas ao desligar.",
  "restore-rocket-animation": "Restaurar animação do foguete",
  "restore-rocket-animation-note": "Usa a animação original da Xbox durante o carregamento. Com “Mostrar arte do jogo” ativado, o foguete fica levemente transparente sobre a capa, sem cobrir o menu. A logo final do Xbox respeita “Pular introdução do Xbox”.",
  enabled: "Ativado",
  disabled: "Desativado",
  "hub-card-size": "Hub Plus: tamanho dos cards",
  "hub-card-size-note": "Muda o espaço ocupado por cada jogo nas fileiras da página inicial.",
  "hub-rounded-cards": "Hub Plus: cards arredondados",
  "hub-rounded-cards-note": "Arredonda os cards dos jogos na página inicial.",
  "hub-hover-effects": "Hub Plus: efeito ao passar o mouse",
  "hub-hover-effects-note": "Adiciona um efeito visual quando o mouse passa sobre um card de jogo.",
  "hub-card-animations": "Hub Plus: animações dos cards",
  "hub-card-animations-note": "Anima os cards dos jogos ao aparecerem e durante a interação.",
  "vx-fps-base": "Base",
  "vx-fps-render": "VX",
  "vx-fps-base-title": "FPS-base usado para a geração local",
  "vx-fps-render-title": "FPS de renderização local da VX",
  "suggested-control-profile": "Perfil sugerido para este jogo",
  "use-suggested-profile": "Usar perfil sugerido",
  "suggested-profile-note": "Apenas sugestão; sua seleção não é alterada automaticamente.",
  "mkb-preset-shooter": "Shooter",
  "mkb-preset-racing": "Corrida",
  "mkb-preset-fighting": "Luta",
  "mkb-preset-platformer": "Plataforma",
  "mkb-preset-rpg-action": "RPG / Ação",
  "mkb-preset-sports": "Esportes",
  "vx-diagnostics": "Diagnóstico VX",
  "vx-diagnostics-description": "Diagnósticos experimentais. O upscale e a redução de artefatos funcionam somente pelo renderizador WebGL2/WebGPU selecionado. A geração local de frames é limitada a 1080p para proteger a latência.",
  "vx-diagnostics-backend": "Backend disponível",
  "vx-diagnostics-vfc": "requestVideoFrameCallback",
  "vx-diagnostics-video-frame": "VideoFrame",
  "vx-diagnostics-refresh-rate": "Estimativa de atualização do monitor",
  "vx-diagnostics-renderer-time": "Tempo de submissão do renderizador",
  "vx-diagnostics-latency-protection": "Proteção de latência VX",
  "vx-diagnostics-unavailable": "indisponível",
  "vx-diagnostics-measuring": "medindo",
  "vx-diagnostics-refresh": "Atualizar status"
 }
};
class Translations {
 static EN_US = "en-US";
 static KEY_LOCALE = "BetterXcloud.Locale";
 static KEY_TRANSLATIONS = "BetterXcloud.Locale.Translations";
 static selectedLocaleIndex = -1;
 static selectedLocale = "en-US";
 static supportedLocales = Object.keys(SUPPORTED_LANGUAGES);
 static foreignTranslations = {};
 static enUsIndex = Translations.supportedLocales.indexOf(Translations.EN_US);
 static async init() {
  Translations.refreshLocale(), await Translations.loadTranslations();
 }
 static refreshLocale(newLocale) {
  let locale;
  if (newLocale) localStorage.setItem(Translations.KEY_LOCALE, newLocale), locale = newLocale;
  else locale = localStorage.getItem(Translations.KEY_LOCALE);
  let supportedLocales = Translations.supportedLocales;
  if (!locale) {
   if (locale = window.navigator.language || Translations.EN_US, supportedLocales.indexOf(locale) === -1) locale = Translations.EN_US;
   localStorage.setItem(Translations.KEY_LOCALE, locale);
  }
  Translations.selectedLocale = locale, Translations.selectedLocaleIndex = supportedLocales.indexOf(locale);
 }
 static get(key, values) {
  let text = null;
  if (Translations.foreignTranslations && Translations.selectedLocale !== Translations.EN_US) text = Translations.foreignTranslations[key];
  if (!text) text = LOCAL_TRANSLATIONS[Translations.selectedLocale]?.[key];
  if (!text) text = Texts[key] || alert(`Missing translation key: ${key}`);
  let translation;
  if (Array.isArray(text)) return translation = text[Translations.selectedLocaleIndex] || text[Translations.enUsIndex], translation(values);
  return translation = text, translation;
 }
 static async loadTranslations() {
  if (Translations.selectedLocale === Translations.EN_US) return;
  try {
   Translations.foreignTranslations = JSON.parse(window.localStorage.getItem(Translations.KEY_TRANSLATIONS));
  } catch (e) {}
  if (!Translations.foreignTranslations) await this.downloadTranslations(Translations.selectedLocale);
 }
 static async updateTranslations(async = !1) {
  if (Translations.selectedLocale === Translations.EN_US) {
   localStorage.removeItem(Translations.KEY_TRANSLATIONS);
   return;
  }
  if (async) Translations.downloadTranslationsAsync(Translations.selectedLocale);
  else await Translations.downloadTranslations(Translations.selectedLocale);
 }
 static async downloadTranslations(locale) {
  try {
   let translations = await (await NATIVE_FETCH(GhPagesUtils.getUrl(`translations/${locale}.json`))).json();
   if (localStorage.getItem(Translations.KEY_LOCALE) === locale) window.localStorage.setItem(Translations.KEY_TRANSLATIONS, JSON.stringify(translations)), Translations.foreignTranslations = translations;
   return !0;
  } catch (e) {
   debugger;
  }
  return !1;
 }
 static downloadTranslationsAsync(locale) {
  NATIVE_FETCH(GhPagesUtils.getUrl(`translations/${locale}.json`)).then((resp) => resp.json()).then((translations) => {
   window.localStorage.setItem(Translations.KEY_TRANSLATIONS, JSON.stringify(translations)), Translations.foreignTranslations = translations;
  });
 }
 static switchLocale(locale) {
  localStorage.setItem(Translations.KEY_LOCALE, locale);
 }
}
var t = Translations.get;
Translations.init();
class NavigationUtils {
 static setNearby($elm, nearby) {
  $elm.nearby = $elm.nearby || {};
  let key;
  for (key in nearby)
   $elm.nearby[key] = nearby[key];
 }
}
var setNearby = NavigationUtils.setNearby;
var ButtonStyleClass = {
 1: "bx-primary",
 2: "bx-warning",
 4: "bx-danger",
 8: "bx-ghost",
 16: "bx-frosted",
 32: "bx-drop-shadow",
 64: "bx-focusable",
 128: "bx-full-width",
 256: "bx-full-height",
 512: "bx-auto-height",
 1024: "bx-tall",
 2048: "bx-circular",
 4096: "bx-normal-case",
 8192: "bx-normal-link"
};
function createElement(elmName, props, ..._) {
 let $elm, hasNs = props && "xmlns" in props;
 if (hasNs) $elm = document.createElementNS(props.xmlns, elmName), delete props.xmlns;
 else $elm = document.createElement(elmName);
 if (props) {
  if (props._nearby) setNearby($elm, props._nearby), delete props._nearby;
  if (props._on) {
   for (let name in props._on)
    $elm.addEventListener(name, props._on[name]);
   delete props._on;
  }
  if (props._dataset) {
   for (let name in props._dataset)
    $elm.dataset[name] = props._dataset[name];
   delete props._dataset;
  }
  for (let key in props) {
   if ($elm.hasOwnProperty(key)) continue;
   let value = props[key];
   if (hasNs) $elm.setAttributeNS(null, key, value);
   else $elm.setAttribute(key, value);
  }
 }
 for (let i = 2, size = arguments.length;i < size; i++) {
  let arg = arguments[i];
  if (arg !== null && arg !== !1 && typeof arg < "u") $elm.append(arg);
 }
 return $elm;
}
var domParser = new DOMParser;
function createSvgIcon(icon) {
 return domParser.parseFromString(icon, "image/svg+xml").documentElement;
}
var ButtonStyleIndices = Object.keys(ButtonStyleClass).map((i) => parseInt(i));
function createButton(options) {
 let $btn;
 if (options.url) $btn = CE("a", {
   class: "bx-button",
   href: options.url,
   target: "_blank"
  });
 else $btn = CE("button", {
   class: "bx-button",
   type: "button"
  }), options.disabled && ($btn.disabled = !0);
 let style = options.style || 0;
 if (style) {
  let index;
  for (index of ButtonStyleIndices)
   style & index && $btn.classList.add(ButtonStyleClass[index]);
 }
 if (options.classes && $btn.classList.add(...options.classes), options.icon && $btn.appendChild(createSvgIcon(options.icon)), options.label && $btn.appendChild(CE("span", !1, options.label)), options.title && $btn.setAttribute("title", options.title), options.onClick && $btn.addEventListener("click", options.onClick), $btn.tabIndex = typeof options.tabIndex === "number" ? options.tabIndex : 0, options.secondaryText) $btn.classList.add("bx-button-multi-lines"), $btn.appendChild(CE("span", !1, options.secondaryText));
 for (let key in options.attributes)
  if (!$btn.hasOwnProperty(key)) $btn.setAttribute(key, options.attributes[key]);
 return $btn;
}
function createSettingRow(label, $control, options = {}) {
 let $label, $row = CE("label", {
  class: "bx-settings-row"
 }, $label = CE("span", { class: "bx-settings-label" }, options.icon && createSvgIcon(options.icon), label, options.$note), $control);
 if (options.pref) $row.prefKey = options.pref;
 if (options.onContextMenu) $row.addEventListener("contextmenu", options.onContextMenu);
 let $link = $label.querySelector("a");
 if ($link) $link.classList.add("bx-focusable"), setNearby($label, {
   focus: $link
  });
 if (setNearby($row, {
  orientation: options.multiLines ? "vertical" : "horizontal"
 }), options.multiLines)
  $row.dataset.multiLines = "true";
 if ($control instanceof HTMLElement && $control.id) $row.htmlFor = $control.id;
 return $row;
}
function getReactProps($elm) {
 for (let key in $elm)
  if (key.startsWith("__reactProps")) return $elm[key];
 return null;
}
function escapeHtml(html) {
 let text = document.createTextNode(html), $span = document.createElement("span");
 return $span.appendChild(text), $span.innerHTML;
}
function isElementVisible($elm) {
 let rect = $elm.getBoundingClientRect();
 return (rect.x >= 0 || rect.y >= 0) && !!rect.width && !!rect.height;
}
function removeChildElements($parent) {
 if ($parent instanceof HTMLDivElement && $parent.classList.contains("bx-select")) $parent = $parent.querySelector("select");
 while ($parent.firstElementChild)
  $parent.firstElementChild.remove();
}
function clearDataSet($elm) {
 Object.keys($elm.dataset).forEach((key) => {
  delete $elm.dataset[key];
 });
}
function renderPresetsList($select, allPresets, selectedValue, options = {}) {
 if (removeChildElements($select), options.addOffValue) {
  let $option = CE("option", { value: 0 }, t("off"));
  $option.selected = selectedValue === 0, $select.appendChild($option);
 }
 let groups = {
  default: t("default") + " 🔒",
  custom: t("custom")
 }, key;
 for (key in groups) {
  let $optGroup = CE("optgroup", { label: groups[key] });
  for (let id of allPresets[key]) {
   let record = allPresets.data[id], selected = selectedValue === record.id, name = options.selectedIndicator && selected ? "✅ " + record.name : record.name, $option = CE("option", { value: record.id }, name);
   if (selected) $option.selected = !0;
   $optGroup.appendChild($option);
  }
  if ($optGroup.hasChildNodes()) $select.appendChild($optGroup);
 }
}
function calculateSelectBoxes($root) {
 let selects = Array.from($root.querySelectorAll("div.bx-select:not([data-calculated]) select"));
 for (let $select of selects) {
  let $parent = $select.parentElement;
  if ($parent.classList.contains("bx-full-width")) {
   $parent.dataset.calculated = "true";
   continue;
  }
  let rect = $select.getBoundingClientRect(), $label, width = Math.ceil(rect.width);
  if (!width) continue;
  if ($label = $parent.querySelector($select.multiple ? ".bx-select-value" : "div"), $parent.isControllerFriendly) {
   if ($select.multiple) width += 20;
   if ($select.querySelector("optgroup")) width -= 15;
  } else width += 10;
  $select.style.left = "0", $label.style.minWidth = width + "px", $parent.dataset.calculated = "true";
 }
}
var FILE_SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"];
function humanFileSize(size) {
 let i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
 return (size / Math.pow(1024, i)).toFixed(1) + " " + FILE_SIZE_UNITS[i];
}
function secondsToHm(seconds) {
 let h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60) + 1;
 if (m === 60) h += 1, m = 0;
 let output = [];
 return h > 0 && output.push(`${h}h`), m > 0 && output.push(`${m}m`), output.join(" ");
}
function escapeCssSelector(name) {
 return name.replaceAll(".", "-");
}
var CE = createElement;
window.BX_CE = createElement;
class Toast {
 static instance;
 static getInstance = () => Toast.instance ?? (Toast.instance = new Toast);
 LOG_TAG = "Toast";
 $wrapper;
 $msg;
 $status;
 stack = [];
 isShowing = !1;
 timeoutId;
 DURATION = 3000;
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()"), this.$wrapper = CE("div", { class: "bx-toast bx-offscreen" }, this.$msg = CE("span", { class: "bx-toast-msg" }), this.$status = CE("span", { class: "bx-toast-status" })), this.$wrapper.addEventListener("transitionend", (e) => {
   let classList = this.$wrapper.classList;
   if (classList.contains("bx-hide")) classList.remove("bx-offscreen", "bx-hide"), classList.add("bx-offscreen"), this.showNext();
  }), document.documentElement.appendChild(this.$wrapper);
 }
 show(msg, status, options = {}) {
  options = options || {};
  let args = Array.from(arguments);
  if (options.instant) this.stack = [args], this.showNext();
  else this.stack.push(args), !this.isShowing && this.showNext();
 }
 showNext() {
  if (!this.stack.length) {
   this.isShowing = !1;
   return;
  }
  this.isShowing = !0, this.timeoutId && clearTimeout(this.timeoutId), this.timeoutId = window.setTimeout(this.hide, this.DURATION);
  let [msg, status, options] = this.stack.shift();
  if (options && options.html) this.$msg.innerHTML = msg;
  else this.$msg.textContent = msg;
  if (status) this.$status.classList.remove("bx-gone"), this.$status.textContent = status;
  else this.$status.classList.add("bx-gone");
  let classList = this.$wrapper.classList;
  classList.remove("bx-offscreen", "bx-hide"), classList.add("bx-show");
 }
 hide = () => {
  this.timeoutId = null;
  let classList = this.$wrapper.classList;
  classList.remove("bx-show"), classList.add("bx-hide");
 };
 static show(msg, status, options = {}) {
  Toast.getInstance().show(msg, status, options);
 }
 static showNext() {
  Toast.getInstance().showNext();
 }
}
class MicrophoneShortcut {
 static toggle(showToast = !0) {
  if (!window.BX_EXPOSED.streamSession) return !1;
  let enableMic = window.BX_EXPOSED.streamSession._microphoneState === "Enabled" ? !1 : !0;
  try {
   return window.BX_EXPOSED.streamSession.tryEnableChatAsync(enableMic), showToast && Toast.show(t("microphone"), t(enableMic ? "unmuted" : "muted"), { instant: !0 }), enableMic;
  } catch (e) {
   console.log(e);
  }
  return !1;
 }
}
class LocalDb {
 static instance;
 static getInstance = () => LocalDb.instance ?? (LocalDb.instance = new LocalDb);
 static DB_NAME = "BetterXcloud";
 static DB_VERSION = 4;
 static TABLE_VIRTUAL_CONTROLLERS = "virtual_controllers";
 static TABLE_CONTROLLER_SHORTCUTS = "controller_shortcuts";
 static TABLE_CONTROLLER_CUSTOMIZATIONS = "controller_customizations";
 static TABLE_CONTROLLER_SETTINGS = "controller_settings";
 static TABLE_KEYBOARD_SHORTCUTS = "keyboard_shortcuts";
 db;
 open() {
  return new Promise((resolve, reject) => {
   if (this.db) {
    resolve(this.db);
    return;
   }
   let request = window.indexedDB.open(LocalDb.DB_NAME, LocalDb.DB_VERSION);
   request.onupgradeneeded = (e) => {
    let db = e.target.result;
    if (db.objectStoreNames.contains("undefined")) db.deleteObjectStore("undefined");
    if (!db.objectStoreNames.contains(LocalDb.TABLE_VIRTUAL_CONTROLLERS)) db.createObjectStore(LocalDb.TABLE_VIRTUAL_CONTROLLERS, {
      keyPath: "id",
      autoIncrement: !0
     });
    if (!db.objectStoreNames.contains(LocalDb.TABLE_CONTROLLER_SHORTCUTS)) db.createObjectStore(LocalDb.TABLE_CONTROLLER_SHORTCUTS, {
      keyPath: "id",
      autoIncrement: !0
     });
    if (!db.objectStoreNames.contains(LocalDb.TABLE_CONTROLLER_SETTINGS)) db.createObjectStore(LocalDb.TABLE_CONTROLLER_SETTINGS, {
      keyPath: "id"
     });
    if (!db.objectStoreNames.contains(LocalDb.TABLE_CONTROLLER_CUSTOMIZATIONS)) db.createObjectStore(LocalDb.TABLE_CONTROLLER_CUSTOMIZATIONS, {
      keyPath: "id",
      autoIncrement: !0
     });
    if (!db.objectStoreNames.contains(LocalDb.TABLE_KEYBOARD_SHORTCUTS)) db.createObjectStore(LocalDb.TABLE_KEYBOARD_SHORTCUTS, {
      keyPath: "id",
      autoIncrement: !0
     });
   }, request.onerror = (e) => {
    console.log(e), alert(e.target.error.message), reject && reject();
   }, request.onsuccess = (e) => {
    this.db = e.target.result, resolve(this.db);
   };
  });
 }
}
var BypassServers = {
 br: "🇧🇷 " + t("brazil"),
 jp: "🇯🇵 " + t("japan"),
 kr: "🇰🇷 " + t("korea"),
 pl: "🇵🇱 " + t("poland"),
 us: "🇺🇸 " + t("united-states")
}, BypassServerIps = {
 br: "169.150.198.66",
 kr: "121.125.60.151",
 jp: "138.199.21.239",
 pl: "45.134.212.66",
 us: "143.244.47.65"
};
class BaseSettingsStorage {
 storage;
 storageKey;
 _settings;
 definitions;
 constructor(storageKey, definitions) {
  this.storage = window.localStorage, this.storageKey = storageKey;
  for (let [_, setting] of Object.entries(definitions)) {
   if (typeof setting.requiredVariants === "string") setting.requiredVariants = [setting.requiredVariants];
   if (setting.ready) setting.ready.call(this, setting), delete setting.ready;
  }
  this.definitions = definitions, this._settings = null;
 }
 get settings() {
  if (this._settings) return this._settings;
  let settings = JSON.parse(this.storage.getItem(this.storageKey) || "{}");
  for (let key in settings)
   settings[key] = this.validateValue("get", key, settings[key]);
  return this._settings = settings, settings;
 }
 getDefinition(key) {
  if (!this.definitions[key]) return alert("Request invalid definition: " + key), {};
  return this.definitions[key];
 }
 hasSetting(key) {
  return key in this.settings;
 }
 getSetting(key, checkUnsupported = !0) {
  let definition = this.definitions[key];
  if (definition.requiredVariants && !definition.requiredVariants.includes(SCRIPT_VARIANT)) return isPlainObject(definition.default) ? deepClone(definition.default) : definition.default;
  if (checkUnsupported && definition.unsupported) if ("unsupportedValue" in definition) return definition.unsupportedValue;
   else return isPlainObject(definition.default) ? deepClone(definition.default) : definition.default;
  if (!(key in this.settings)) this.settings[key] = this.validateValue("get", key, null);
  return isPlainObject(this.settings[key]) ? deepClone(this.settings[key]) : this.settings[key];
 }
 setSetting(key, value, origin) {
  if (value = this.validateValue("set", key, value), this.settings[key] = this.validateValue("get", key, value), this.saveSettings(), origin === "ui") if (isStreamPref(key)) BxEventBus.Stream.emit("setting.changed", {
     storageKey: this.storageKey,
     settingKey: key
    });
   else BxEventBus.Script.emit("setting.changed", {
     storageKey: this.storageKey,
     settingKey: key
    });
  return value;
 }
 saveSettings() {
  this.storage.setItem(this.storageKey, JSON.stringify(this.settings));
 }
 validateValue(action, key, value) {
  let def = this.definitions[key];
  if (!def) return value;
  if (typeof value > "u" || value === null) value = def.default;
  if (def.transformValue && action === "get") value = def.transformValue.get.call(def, value);
  if ("min" in def) value = Math.max(def.min, value);
  if ("max" in def) value = Math.min(def.max, value);
  if ("options" in def) {
   if (!(value in def.options)) value = def.default;
  } else if ("multipleOptions" in def) {
   if (value.length) {
    let validOptions = Object.keys(def.multipleOptions);
    value.forEach((item2, idx) => {
     validOptions.indexOf(item2) === -1 && value.splice(idx, 1);
    });
   }
   if (!value.length) value = def.default;
  }
  if (def.transformValue && action === "set") value = def.transformValue.set.call(def, value);
  return value;
 }
 getLabel(key) {
  return this.definitions[key].label || key;
 }
 getValueText(key, value) {
  let definition = this.definitions[key];
  if ("min" in definition) {
   let params = definition.params;
   if (params.customTextValue) {
    if (definition.transformValue) value = definition.transformValue.get.call(definition, value);
    let text = params.customTextValue(value, definition.min, definition.max);
    if (text) return text;
   }
   return value.toString();
  } else if ("options" in definition) {
   let options = definition.options;
   if (value in options) return options[value];
  } else if (typeof value === "boolean") return value ? t("on") : t("off");
  return value.toString();
 }
 deleteSetting(pref) {
  if (this.hasSetting(pref)) return delete this.settings[pref], this.saveSettings(), !0;
  return !1;
 }
}
function getSupportedCodecProfiles() {
 let options = {
  default: t("default")
 };
 if (!("getCapabilities" in RTCRtpReceiver)) return options;
 let hasLowCodec = !1, hasNormalCodec = !1, hasHighCodec = !1, codecs = RTCRtpReceiver.getCapabilities("video").codecs;
 for (let codec of codecs) {
  if (codec.mimeType.toLowerCase() !== "video/h264" || !codec.sdpFmtpLine) continue;
  let fmtp = codec.sdpFmtpLine.toLowerCase();
  if (fmtp.includes("profile-level-id=4d")) hasHighCodec = !0;
  else if (fmtp.includes("profile-level-id=42e")) hasNormalCodec = !0;
  else if (fmtp.includes("profile-level-id=420")) hasLowCodec = !0;
 }
 if (hasLowCodec) if (!hasNormalCodec && !hasHighCodec) options["default"] = `${t("visual-quality-low")} (${t("default")})`;
  else options["low"] = t("visual-quality-low");
 if (hasNormalCodec) if (!hasLowCodec && !hasHighCodec) options["default"] = `${t("visual-quality-normal")} (${t("default")})`;
  else options["normal"] = t("visual-quality-normal");
 if (hasHighCodec) if (!hasLowCodec && !hasNormalCodec) options["default"] = `${t("visual-quality-high")} (${t("default")})`;
  else options["high"] = t("visual-quality-high");
 return options;
}
class GlobalSettingsStorage extends BaseSettingsStorage {
 static DEFINITIONS = {
  "version.lastCheck": {
   default: 0
  },
  "version.latest": {
   default: ""
  },
  "version.current": {
   default: ""
  },
  "bx.locale": {
   label: t("language"),
   default: localStorage.getItem("BetterXcloud.Locale") || "en-US",
   options: SUPPORTED_LANGUAGES
  },
  "server.region": {
   label: t("region"),
   note: CE("div", !1, CE("a", { target: "_blank", href: "https://umap.openstreetmap.fr/en/map/xbox-cloud-gaming-servers_1135022" }, t("server-locations")), CE("span", { style: "display:block;margin-top:4px" }, t("switch-server-to-bypass-queue"))),
   default: "default"
  },
  "server.bypassRestriction": {
   label: t("bypass-region-restriction"),
   note: "⚠️ " + t("use-this-at-your-own-risk"),
   default: "off",
   optionsGroup: t("region"),
   options: Object.assign({
    off: t("off")
   }, BypassServers)
  },
  "stream.locale": {
   label: t("preferred-game-language"),
   default: "default",
   options: {
    default: t("default"),
    "ar-SA": "العربية",
    "bg-BG": "Български",
    "cs-CZ": "čeština",
    "da-DK": "dansk",
    "de-DE": "Deutsch",
    "el-GR": "Ελληνικά",
    "en-GB": "English (UK)",
    "en-US": "English (US)",
    "es-ES": "español (España)",
    "es-MX": "español (Latinoamérica)",
    "fi-FI": "suomi",
    "fr-FR": "français",
    "he-IL": "עברית",
    "hu-HU": "magyar",
    "it-IT": "italiano",
    "ja-JP": "日本語",
    "ko-KR": "한국어",
    "nb-NO": "norsk bokmål",
    "nl-NL": "Nederlands",
    "pl-PL": "polski",
    "pt-BR": "português (Brasil)",
    "pt-PT": "português (Portugal)",
    "ro-RO": "Română",
    "ru-RU": "русский",
    "sk-SK": "slovenčina",
    "sv-SE": "svenska",
    "th-TH": "ไทย",
    "tr-TR": "Türkçe",
    "zh-CN": "中文(简体)",
    "zh-TW": "中文 (繁體)"
   }
  },
  "stream.video.resolution": {
   label: t("target-resolution"),
   default: "auto",
   options: {
    auto: t("default"),
    "720p": "720p",
    "1080p": "1080p",
    "1080p-hq": "1080p (HQ)"
   },
   suggest: {
    lowest: "720p",
    highest: "1080p-hq"
   }
  },
  "stream.video.preventResolutionDrops": {
   label: t("prevent-resolution-drops"),
   default: !1,
   note: CE("a", { href: "https://github.com/redphx/better-xcloud/issues/791", target: "_blank" }, "⚠️ " + t("unexpected-behavior"))
  },
  "stream.cloud.keepAlive": {
   label: t("keep-cloud-session-alive"),
   default: !1,
   note: t("keep-cloud-session-alive-note")
  },
  "stream.video.codecProfile": {
   label: t("visual-quality"),
   default: "default",
   options: getSupportedCodecProfiles(),
   ready: (setting) => {
    let options = setting.options, keys = Object.keys(options);
    if (keys.length <= 1) setting.unsupported = !0, setting.unsupportedNote = "⚠️ " + t("browser-unsupported-feature");
    setting.suggest = {
     lowest: keys.length === 1 ? keys[0] : keys[1],
     highest: keys[keys.length - 1]
    };
   }
  },
  "server.ipv6.prefer": {
   label: t("prefer-ipv6-server"),
   default: !1
  },
  "screenshot.applyFilters": {
   requiredVariants: "full",
   label: t("screenshot-apply-filters"),
   default: !1
  },
  "ui.splashVideo.skip": {
   label: t("skip-splash-video"),
   default: !1
  },
  "ui.systemMenu.hideHandle": {
   label: "⣿ " + t("hide-system-menu-icon"),
   default: !1
  },
  "ui.imageQuality": {
   requiredVariants: "full",
   label: t("image-quality"),
   default: 90,
   min: 10,
   max: 100,
   note: t("image-quality-note"),
   params: {
    steps: 5,
    exactTicks: 20,
    hideSlider: !0,
    customTextValue(value, min, max) {
     if (value === 100) return t("image-quality-maximum");
     if (value === 95) return t("image-quality-ultra");
     if (value === 90) return t("default");
     return value + "%";
    }
   },
   suggest: {
    lowest: 50,
    highest: 100
   }
  },
  "ui.theme": {
   label: t("theme"),
   default: "default",
   options: {
    default: t("default"),
    "dark-oled": t("oled")
   }
  },
  "stream.video.combineAudio": {
   requiredVariants: "full",
   label: t("combine-audio-video-streams"),
   default: !1,
   experimental: !0,
   note: t("combine-audio-video-streams-summary")
  },
  "touchController.mode": {
   requiredVariants: "full",
   label: t("availability"),
   default: "all",
   options: {
    default: t("default"),
    off: t("off"),
    all: t("all-games")
   },
   unsupported: !STATES.userAgent.capabilities.touch,
   unsupportedValue: "default"
  },
  "touchController.autoOff": {
   requiredVariants: "full",
   label: t("tc-auto-off"),
   default: !1,
   unsupported: !STATES.userAgent.capabilities.touch
  },
  "touchController.opacity.default": {
   requiredVariants: "full",
   label: t("default-opacity"),
   default: 100,
   min: 10,
   max: 100,
   params: {
    steps: 10,
    suffix: "%",
    ticks: 10,
    hideSlider: !0
   },
   unsupported: !STATES.userAgent.capabilities.touch
  },
  "touchController.style.standard": {
   requiredVariants: "full",
   label: t("tc-standard-layout-style"),
   default: "default",
   options: {
    default: t("default"),
    white: t("tc-all-white"),
    muted: t("tc-muted-colors")
   },
   unsupported: !STATES.userAgent.capabilities.touch
  },
  "touchController.style.custom": {
   requiredVariants: "full",
   label: t("tc-custom-layout-style"),
   default: "default",
   options: {
    default: t("default"),
    muted: t("tc-muted-colors")
   },
   unsupported: !STATES.userAgent.capabilities.touch
  },
  "ui.streamMenu.simplify": {
   label: t("simplify-stream-menu"),
   default: !1
  },
  "mkb.cursor.hideIdle": {
   requiredVariants: "full",
   label: t("hide-idle-cursor"),
   default: !1,
   desktopOnly: !0,
   unsupported: UserAgent.isMobileDevice(),
   unsupportedNote: "⚠️ " + t("pc-only-not-supported-on-mobile")
  },
  "ui.feedbackDialog.disabled": {
   requiredVariants: "full",
   label: t("skip-session-rating"),
   default: !1,
   note: t("skip-session-rating-note")
  },
  "stream.video.maxBitrate": {
   requiredVariants: "full",
   label: t("bitrate-video-maximum"),
   note: t("bitrate-video-maximum-note"),
   default: 0,
   min: 1024000,
   max: 53248000,
   transformValue: {
    get(value) {
     return value === 0 ? this.max : value;
    },
    set(value) {
     return value > 51200000 ? this.max : value;
    }
   },
   params: {
    steps: 1024000,
    exactTicks: 5120000,
    normalizeValue(value, min, max) {
     return value > 51200000 ? max : value;
    },
    valueBeforeMaximum: 51200000,
    customTextValue: (value, min, max) => {
     if (value = parseInt(value), value > 51200000) return t("unlimited");
     return (value / 1024000).toFixed(1) + " Mb/s";
    }
   },
   suggest: {
    highest: 0
   }
  },
  "gameBar.position": {
   requiredVariants: "full",
   label: t("position"),
   default: "bottom-left",
   options: {
    off: t("off"),
    "bottom-left": t("bottom-left"),
    "bottom-right": t("bottom-right")
   }
  },
  "ui.controllerStatus.show": {
   label: t("show-controller-connection-status"),
   default: !0
  },
  "mkb.enabled": {
   requiredVariants: "full",
   label: t("enable-mkb"),
   default: !1,
   desktopOnly: !0,
   unsupported: UserAgent.isMobileDevice() || !STATES.userAgent.capabilities.mkb || !STATES.browser.capabilities.mkb,
   ready: (setting) => {
    let note;
    if (UserAgent.isMobileDevice()) note = t("pc-only-not-supported-on-mobile");
    else if (setting.unsupported) note = t("browser-unsupported-feature");
    else note = t("mkb-disclaimer");
    setting.unsupportedNote = () => CE("span", !1, "⚠️ " + note);
   }
  },
  "nativeMkb.mode": {
   requiredVariants: "full",
   label: t("native-mkb"),
   default: "default",
   desktopOnly: !0,
   options: {
    default: t("default"),
    off: t("off"),
    on: t("on")
   },
   ready: (setting) => {
    if (STATES.browser.capabilities.emulatedNativeMkb) ;
    else if (UserAgent.isMobile()) setting.unsupported = !0, setting.unsupportedValue = "off", delete setting.options["default"], delete setting.options["on"];
    else delete setting.options["on"];
    if (UserAgent.isMobileDevice()) setting.unsupported = !0, setting.unsupportedValue = "off", setting.unsupportedNote = "⚠️ " + t("pc-only-not-supported-on-mobile");
   }
  },
  "nativeMkb.forcedGames": {
   label: t("force-native-mkb-games"),
   default: [],
   desktopOnly: !0,
   unsupported: UserAgent.isMobileDevice(),
   unsupportedNote: "⚠️ " + t("pc-only-not-supported-on-mobile"),
   ready: (setting) => {
    if (!setting.unsupported) setting.multipleOptions = GhPagesUtils.getNativeMkbCustomList(!0), BxEventBus.Script.once("list.forcedNativeMkb.updated", (payload) => {
      setting.multipleOptions = payload.data.data;
     });
   },
   params: {
    size: 6
   }
  },
  "ui.reduceAnimations": {
   label: t("reduce-animations"),
   default: !1
  },
  "loadingScreen.gameArt.show": {
   requiredVariants: "full",
   label: t("show-game-art"),
   default: !0
  },
  "loadingScreen.waitTime.show": {
   label: t("show-wait-time"),
   default: !0
  },
  "loadingScreen.rocket": {
   label: t("restore-rocket-animation"),
   note: t("restore-rocket-animation-note"),
   default: !0,
   transformValue: {
    get(value) {
     if (value === "show") return !0;
     if (value === "hide") return !1;
     return !!value;
    },
    set(value) {
     return !!value;
    }
   }
  },
  "ui.controllerFriendly": {
   label: t("controller-friendly-ui"),
   default: BX_FLAGS.DeviceInfo.deviceType !== "unknown"
  },
  "ui.layout": {
   requiredVariants: "full",
   label: t("layout"),
   default: "default",
   options: {
    default: t("default"),
    normal: t("normal"),
    tv: t("smart-tv")
   }
  },
  "ui.hideScrollbar": {
   label: t("hide-scrollbar"),
   default: !1
  },
  "ui.hideSections": {
   requiredVariants: "full",
   label: t("hide-sections"),
   default: [],
   multipleOptions: {
    news: t("section-news"),
    friends: t("section-play-with-friends"),
    "native-mkb": t("section-native-mkb"),
    touch: t("section-touch"),
    "most-popular": t("section-most-popular"),
    byog: t("stream-your-own-game"),
    "recently-added": t("section-recently-added"),
    "leaving-soon": t("section-leaving-soon"),
    genres: t("section-genres"),
    "all-games": t("section-all-games")
   },
   params: {
    size: 0
   }
  },
  "ui.gameCard.waitTime.show": {
   requiredVariants: "full",
   default: !1
  },
  "ui.hub.cardSize": {
   label: t("hub-card-size"),
   default: 100,
   min: 75,
   max: 130,
   note: t("hub-card-size-note"),
   params: { steps: 5, suffix: "%", ticks: 25 }
  },
  "ui.hub.cardRounded": {
   label: t("hub-rounded-cards"),
   default: !0,
   note: t("hub-rounded-cards-note")
  },
  "ui.hub.hoverEffects": {
   label: t("hub-hover-effects"),
   default: !0,
   note: t("hub-hover-effects-note"),
   desktopOnly: !0,
   unsupported: UserAgent.isMobileDevice(),
   unsupportedValue: !1,
   unsupportedNote: "⚠️ " + t("pc-only-not-supported-on-mobile")
  },
  "ui.hub.animations": {
   label: t("hub-card-animations"),
   default: !0,
   note: t("hub-card-animations-note")
  },
  "block.tracking": {
   label: t("disable-xcloud-analytics"),
   default: !1
  },
  "block.features": {
   requiredVariants: "full",
   label: t("disable-features"),
   default: [],
   multipleOptions: {
    chat: t("chat"),
    friends: t("friends-followers"),
    "notifications-invites": t("notifications") + ": " + t("invites"),
    "notifications-achievements": t("notifications") + ": " + t("achievements"),
    "remote-play": t("remote-play")
   }
  },
  "userAgent.profile": {
   label: t("user-agent-profile"),
   note: "⚠️ " + t("unexpected-behavior"),
   default: BX_FLAGS.DeviceInfo.deviceType === "android-tv" || BX_FLAGS.DeviceInfo.deviceType === "webos" ? "vr-oculus" : "default",
   options: {
    default: t("default"),
    "windows-edge": "Edge + Windows",
    "macos-safari": "Safari + macOS",
    "vr-oculus": "Android TV",
    "smarttv-generic": "Smart TV",
    "smarttv-tizen": "Samsung Smart TV",
    custom: t("custom")
   }
  },
  "audio.mic.onPlaying": {
   label: t("enable-mic-on-startup"),
   default: !1
  },
  "audio.volume.booster.enabled": {
   requiredVariants: "full",
   label: t("enable-volume-control"),
   default: !1
  },
  "xhome.video.resolution": {
   requiredVariants: "full",
   default: "1080p",
   options: {
    "720p": "720p",
    "1080p": "1080p",
    "1080p-hq": "1080p (HQ)"
   }
  },
  "xhome.ipv6.prefer": {
   requiredVariants: "full",
   default: !1
  },
  "game.fortnite.forceConsole": {
   requiredVariants: "full",
   label: "🎮 " + t("fortnite-force-console-version"),
   default: !1,
   note: t("fortnite-allow-stw-mode")
  }
 };
 constructor() {
  super("BetterXcloud", GlobalSettingsStorage.DEFINITIONS);
 }
}
class BaseLocalTable {
 tableName;
 constructor(tableName) {
  this.tableName = tableName;
 }
 async prepareTable(type = "readonly") {
  return (await LocalDb.getInstance().open()).transaction(this.tableName, type).objectStore(this.tableName);
 }
 call(method) {
  return new Promise((resolve) => {
   let request = method.call(null, ...Array.from(arguments).slice(1));
   request.onsuccess = (e) => {
    resolve(e.target.result);
   };
  });
 }
 async count() {
  let table = await this.prepareTable();
  return this.call(table.count.bind(table));
 }
 async add(data) {
  let table = await this.prepareTable("readwrite");
  return this.call(table.add.bind(table), ...arguments);
 }
 async put(data) {
  let table = await this.prepareTable("readwrite");
  return this.call(table.put.bind(table), ...arguments);
 }
 async delete(id) {
  let table = await this.prepareTable("readwrite");
  return this.call(table.delete.bind(table), ...arguments);
 }
 async get(id) {
  let table = await this.prepareTable();
  return this.call(table.get.bind(table), ...arguments);
 }
 async getAll() {
  let table = await this.prepareTable(), all = await this.call(table.getAll.bind(table), ...arguments), results = {};
  return all.forEach((item2) => {
   results[item2.id] = item2;
  }), results;
 }
}
class BasePresetsTable extends BaseLocalTable {
 async newPreset(name, data) {
  let newRecord = { name, data };
  return await this.add(newRecord);
 }
 async updatePreset(preset) {
  return await this.put(preset);
 }
 async deletePreset(id) {
  return this.delete(id);
 }
 async getPreset(id) {
  if (id === 0) return null;
  if (id < 0) return this.DEFAULT_PRESETS[id];
  let preset = await this.get(id);
  if (!preset) preset = this.DEFAULT_PRESETS[this.DEFAULT_PRESET_ID];
  return preset;
 }
 async getPresets() {
  let all = deepClone(this.DEFAULT_PRESETS), presets = {
   default: Object.keys(this.DEFAULT_PRESETS).map((key) => parseInt(key)),
   custom: [],
   data: {}
  };
  if (await this.count() > 0) {
   let items = await this.getAll(), id;
   for (id in items) {
    let item2 = items[id];
    presets.custom.push(item2.id), all[item2.id] = item2;
   }
  }
  return presets.data = all, presets;
 }
 async getPresetsData() {
  let presetsData = {};
  for (let id in this.DEFAULT_PRESETS) {
   let preset = this.DEFAULT_PRESETS[id];
   presetsData[id] = deepClone(preset.data);
  }
  if (await this.count() > 0) {
   let items = await this.getAll(), id;
   for (id in items) {
    let item2 = items[id];
    presetsData[item2.id] = item2.data;
   }
  }
  return presetsData;
 }
}
class KeyboardShortcutsTable extends BasePresetsTable {
 static instance;
 static getInstance = () => KeyboardShortcutsTable.instance ?? (KeyboardShortcutsTable.instance = new KeyboardShortcutsTable);
 LOG_TAG = "KeyboardShortcutsTable";
 TABLE_PRESETS = LocalDb.TABLE_KEYBOARD_SHORTCUTS;
 DEFAULT_PRESETS = {
  [-1]: {
   id: -1,
   name: t("standard"),
   data: {
    mapping: {
     "mkb.toggle": {
      code: "F8"
     },
     "stream.screenshot.capture": {
      code: "Slash"
     }
    }
   }
  }
 };
 BLANK_PRESET_DATA = {
  mapping: {}
 };
 DEFAULT_PRESET_ID = -1;
 constructor() {
  super(LocalDb.TABLE_KEYBOARD_SHORTCUTS);
  BxLogger.info(this.LOG_TAG, "constructor()");
 }
}
function getSuggestedMkbPresetForTitle(title) {
 if (!title) return null;
 let normalized = title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(), matches = (pattern) => pattern.test(normalized);
 if (matches(/forza|racing|rally|\bf1\b|nascar|wrc|motogp|dirt|burnout|carx/)) return { id: -3, name: t("mkb-preset-racing") };
 if (matches(/mortal kombat|street fighter|tekken|guilty gear|injustice|killer instinct|brawlhalla|dragon ball fighter|\bufc\b|\bwwe\b/)) return { id: -4, name: t("mkb-preset-fighting") };
 if (matches(/ori and|hollow knight|celeste|sonic|rayman|shovel knight|super meat boy|cuphead|platformer/)) return { id: -5, name: t("mkb-preset-platformer") };
 if (matches(/\bfc\b|fifa|madden|\bnba\b|\bnhl\b|\bmlb\b|\bpga\b|efootball|football manager/)) return { id: -7, name: t("mkb-preset-sports") };
 if (matches(/call of duty|battlefield|\bhalo\b|\bdoom\b|\bquake\b|sniper|far cry|rainbow six|wolfenstein|overwatch|fortnite|gears of war|gears 5/)) return { id: -2, name: t("mkb-preset-shooter") };
 if (matches(/elden ring|dark souls|assassin'?s creed|the witcher|monster hunter|diablo|skyrim|fallout|final fantasy|persona|yakuza|like a dragon/)) return { id: -6, name: t("mkb-preset-rpg-action") };
 return null;
}
class MkbMappingPresetsTable extends BasePresetsTable {
 static instance;
 static getInstance = () => MkbMappingPresetsTable.instance ?? (MkbMappingPresetsTable.instance = new MkbMappingPresetsTable);
 LOG_TAG = "MkbMappingPresetsTable";
 TABLE_PRESETS = LocalDb.TABLE_VIRTUAL_CONTROLLERS;
 DEFAULT_PRESETS = {
  [-1]: {
   id: -1,
   name: t("standard"),
   data: {
    mapping: {
     16: ["Backquote"],
     12: ["ArrowUp", "Digit1"],
     13: ["ArrowDown", "Digit2"],
     14: ["ArrowLeft", "Digit3"],
     15: ["ArrowRight", "Digit4"],
     100: ["KeyW"],
     101: ["KeyS"],
     102: ["KeyA"],
     103: ["KeyD"],
     200: ["KeyU"],
     201: ["KeyJ"],
     202: ["KeyH"],
     203: ["KeyK"],
     0: ["Space", "KeyE"],
     2: ["KeyR"],
     1: ["KeyC", "Backspace"],
     3: ["KeyV"],
     9: ["Enter"],
     8: ["Tab"],
     4: ["KeyQ"],
     5: ["KeyF"],
     7: ["Mouse0"],
     6: ["Mouse2"],
     10: ["KeyX"],
     11: ["KeyZ"]
    },
    mouse: {
     mapTo: 2,
     sensitivityX: 100,
     sensitivityY: 100,
     deadzoneCounterweight: 20
    }
   }
  },
  [-2]: {
   id: -2,
   name: t("mkb-preset-shooter"),
   data: {
    mapping: {
     16: ["Backquote"],
     12: ["ArrowUp"],
     13: ["ArrowDown"],
     14: ["ArrowLeft"],
     15: ["ArrowRight"],
     100: ["KeyW"],
     101: ["KeyS"],
     102: ["KeyA"],
     103: ["KeyD"],
     200: ["KeyI"],
     201: ["KeyK"],
     202: ["KeyJ"],
     203: ["KeyL"],
     0: ["Space", "KeyE"],
     2: ["KeyR"],
     1: ["ControlLeft", "Backspace"],
     3: ["KeyV"],
     9: ["Enter"],
     8: ["Tab"],
     4: ["KeyC", "KeyG"],
     5: ["KeyQ"],
     7: ["Mouse0"],
     6: ["Mouse2"],
     10: ["ShiftLeft"],
     11: ["KeyF"]
    },
    mouse: {
     mapTo: 2,
     sensitivityX: 100,
     sensitivityY: 100,
     deadzoneCounterweight: 20
    }
   }
  },
  [-3]: {
   id: -3,
   name: t("mkb-preset-racing"),
   data: {
    mapping: {
     16: ["Backquote"],
     12: ["ArrowUp"],
     13: ["ArrowDown"],
     14: ["ArrowLeft"],
     15: ["ArrowRight"],
     102: ["KeyA"],
     103: ["KeyD"],
     200: ["KeyI"],
     201: ["KeyK"],
     202: ["KeyJ"],
     203: ["KeyL"],
     7: ["KeyW"],
     6: ["KeyS"],
     5: ["KeyE"],
     4: ["KeyQ"],
     0: ["Space"],
     1: ["ControlLeft"],
     2: ["KeyR"],
     3: ["KeyF"],
     9: ["Enter"],
     8: ["Tab"]
    },
    mouse: {
     mapTo: 0,
     sensitivityX: 100,
     sensitivityY: 100,
     deadzoneCounterweight: 20
    }
   }
  },
  [-4]: {
   id: -4,
   name: t("mkb-preset-fighting"),
   data: {
    mapping: {
     16: ["Backquote"],
     12: ["ArrowUp"],
     13: ["ArrowDown"],
     14: ["ArrowLeft"],
     15: ["ArrowRight"],
     100: ["KeyW"],
     101: ["KeyS"],
     102: ["KeyA"],
     103: ["KeyD"],
     0: ["KeyJ"],
     1: ["KeyK"],
     2: ["KeyU"],
     3: ["KeyI"],
     4: ["KeyQ"],
     5: ["KeyE"],
     6: ["KeyZ"],
     7: ["KeyC"],
     9: ["Enter"],
     8: ["Tab"]
    },
    mouse: {
     mapTo: 0,
     sensitivityX: 100,
     sensitivityY: 100,
     deadzoneCounterweight: 20
    }
   }
  },
  [-5]: {
   id: -5,
   name: t("mkb-preset-platformer"),
   data: {
    mapping: {
     16: ["Backquote"],
     12: ["ArrowUp"],
     13: ["ArrowDown"],
     14: ["ArrowLeft"],
     15: ["ArrowRight"],
     100: ["KeyW"],
     101: ["KeyS"],
     102: ["KeyA"],
     103: ["KeyD"],
     0: ["Space"],
     1: ["ControlLeft"],
     2: ["KeyJ"],
     3: ["KeyI"],
     4: ["KeyQ"],
     5: ["KeyE"],
     6: ["KeyZ"],
     7: ["KeyC"],
     9: ["Enter"],
     8: ["Tab"]
    },
    mouse: {
     mapTo: 0,
     sensitivityX: 100,
     sensitivityY: 100,
     deadzoneCounterweight: 20
    }
   }
  },
  [-6]: {
   id: -6,
   name: t("mkb-preset-rpg-action"),
   data: {
    mapping: {
     16: ["Backquote"],
     12: ["ArrowUp"],
     13: ["ArrowDown"],
     14: ["ArrowLeft"],
     15: ["ArrowRight"],
     100: ["KeyW"],
     101: ["KeyS"],
     102: ["KeyA"],
     103: ["KeyD"],
     0: ["Space", "KeyE"],
     1: ["ControlLeft"],
     2: ["KeyR"],
     3: ["KeyF"],
     4: ["KeyQ"],
     5: ["KeyC"],
     6: ["Mouse2"],
     7: ["Mouse0"],
     10: ["ShiftLeft"],
     9: ["Enter"],
     8: ["Tab"]
    },
    mouse: {
     mapTo: 2,
     sensitivityX: 85,
     sensitivityY: 85,
     deadzoneCounterweight: 20
    }
   }
  },
  [-7]: {
   id: -7,
   name: t("mkb-preset-sports"),
   data: {
    mapping: {
     16: ["Backquote"],
     12: ["ArrowUp"],
     13: ["ArrowDown"],
     14: ["ArrowLeft"],
     15: ["ArrowRight"],
     100: ["KeyW"],
     101: ["KeyS"],
     102: ["KeyA"],
     103: ["KeyD"],
     200: ["KeyI"],
     201: ["KeyK"],
     202: ["KeyJ"],
     203: ["KeyL"],
     0: ["Space"],
     1: ["ControlLeft"],
     2: ["KeyE"],
     3: ["KeyQ"],
     4: ["KeyZ"],
     5: ["KeyC"],
     6: ["KeyR"],
     7: ["KeyF"],
     9: ["Enter"],
     8: ["Tab"]
    },
    mouse: {
     mapTo: 2,
     sensitivityX: 70,
     sensitivityY: 70,
     deadzoneCounterweight: 20
    }
   }
  }
 };
 BLANK_PRESET_DATA = {
  mapping: {},
  mouse: {
   mapTo: 2,
   sensitivityX: 100,
   sensitivityY: 100,
   deadzoneCounterweight: 20
  }
 };
 DEFAULT_PRESET_ID = -1;
 constructor() {
  super(LocalDb.TABLE_VIRTUAL_CONTROLLERS);
  BxLogger.info(this.LOG_TAG, "constructor()");
 }
}
var BxIcon = {
 BETTER_XCLOUD: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='none' fill-rule='evenodd' viewBox='0 0 32 32'><clipPath id='svg-bx-logo'><path d='M0 0h32v32H0z'/></clipPath><g clip-path='url(#svg-bx-logo)'><path d='M19.959 18.286l3.959 2.285-3.959 2.286V32L16 29.714v-9.143l3.959-2.285zM16 16V6.857l3.959-2.286 3.959 2.286-3.959 2.286v9.143L16 16zm-3.959-2.286L16 16l-3.959 2.286v9.143l-3.959-2.286V16l3.959-2.286zM8.082 2.286L12.041 0 16 2.286l-3.959 2.285v9.143l-3.959-2.285V2.286zm8.846 19.535c-.171-.098-.309-.018-.309.179s.138.437.309.536.309.018.309-.179-.138-.437-.309-.536zm0-13.714c-.171-.098-.309-.018-.309.179s.138.437.309.535.309.019.309-.178-.138-.437-.309-.536zM9.01 17.25c-.171-.099-.309-.019-.309.179s.138.437.309.535.309.019.309-.178-.138-.437-.309-.536zm0-13.714c-.171-.099-.309-.019-.309.178s.138.437.309.536.309.019.309-.179-.138-.437-.309-.535z' fill='#fff'/></g></svg>",
 TRUE_ACHIEVEMENTS: "<svg xmlns='http://www.w3.org/2000/svg' fill='#fff' stroke='nons' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M2.497 14.127c.781-6.01 5.542-10.849 11.551-11.708V0C6.634.858.858 6.712 0 14.127h2.497zM17.952 2.419V0C25.366.858 31.142 6.712 32 14.127h-2.497c-.781-6.01-5.542-10.849-11.551-11.708zM2.497 17.873c.781 6.01 5.542 10.849 11.551 11.708V32C6.634 31.142.858 25.288 0 17.873h2.497zm27.006 0H32C31.142 25.288 25.366 31.142 17.952 32v-2.419c6.009-.859 10.77-5.698 11.551-11.708zm-19.2-4.527h2.028a.702.702 0 1 0 0-1.404h-2.107a1.37 1.37 0 0 1-1.326-1.327V9.21a.7.7 0 0 0-.703-.703c-.387 0-.703.316-.703.7v1.408c.079 1.483 1.25 2.731 2.811 2.731zm2.809 7.337h-2.888a1.37 1.37 0 0 1-1.326-1.327v-4.917c0-.387-.316-.703-.7-.703a.7.7 0 0 0-.706.703v4.917a2.77 2.77 0 0 0 2.732 2.732h2.81c.387 0 .702-.316.702-.7.078-.393-.234-.705-.624-.705zM25.6 19.2a.7.7 0 0 0-.702-.702c-.387 0-.703.316-.703.699v.081c0 .702-.546 1.326-1.248 1.326H19.98c-.702-.078-1.248-.624-1.248-1.326v-.312c0-.78.624-1.327 1.326-1.327h2.811a2.77 2.77 0 0 0 2.731-2.732v-.312a2.68 2.68 0 0 0-2.576-2.732h-4.76a.702.702 0 1 0 0 1.405h4.526a1.37 1.37 0 0 1 1.327 1.327v.234c0 .781-.624 1.327-1.327 1.327h-2.81a2.77 2.77 0 0 0-2.731 2.732v.312a2.77 2.77 0 0 0 2.731 2.732h2.967a2.74 2.74 0 0 0 2.575-2.732s.078.078.078 0z'/></svg>",
 STREAM_SETTINGS: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><g transform='matrix(.142357 0 0 .142357 -2.22021 -2.22164)' fill='none' stroke='#fff' stroke-width='16'><circle cx='128' cy='128' r='40'/><path d='M130.05 206.11h-4L94 224c-12.477-4.197-24.049-10.711-34.11-19.2l-.12-36c-.71-1.12-1.38-2.25-2-3.41L25.9 147.24a99.16 99.16 0 0 1 0-38.46l31.84-18.1c.65-1.15 1.32-2.29 2-3.41l.16-36C69.951 42.757 81.521 36.218 94 32l32 17.89h4L162 32c12.477 4.197 24.049 10.711 34.11 19.2l.12 36c.71 1.12 1.38 2.25 2 3.41l31.85 18.14a99.16 99.16 0 0 1 0 38.46l-31.84 18.1c-.65 1.15-1.32 2.29-2 3.41l-.16 36A104.59 104.59 0 0 1 162 224l-31.95-17.89z'/></g></svg>",
 STREAM_STATS: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M1.181 24.55v-3.259c0-8.19 6.576-14.952 14.767-14.98H16c8.13 0 14.819 6.69 14.819 14.819v3.42c0 .625-.515 1.14-1.14 1.14H2.321c-.625 0-1.14-.515-1.14-1.14z'/><path d='M16 6.311v4.56M12.58 25.69l9.12-12.54m4.559 5.7h4.386m-29.266 0H5.74'/></svg>",
 CLOSE: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M29.928,2.072L2.072,29.928'/><path d='M29.928,29.928L2.072,2.072'/></svg>",
 CONTROLLER: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M19.193 12.807h3.193m-13.836 0h4.257'/><path d='M10.678 10.678v4.257'/><path d='M13.061 19.193l-5.602 6.359c-.698.698-1.646 1.09-2.633 1.09-2.044 0-3.725-1.682-3.725-3.725a3.73 3.73 0 0 1 .056-.646l2.177-11.194a6.94 6.94 0 0 1 6.799-5.721h11.722c3.795 0 6.918 3.123 6.918 6.918s-3.123 6.918-6.918 6.918h-8.793z'/><path d='M18.939 19.193l5.602 6.359c.698.698 1.646 1.09 2.633 1.09 2.044 0 3.725-1.682 3.725-3.725a3.73 3.73 0 0 0-.056-.646l-2.177-11.194'/></svg>",
 CREATE_SHORTCUT: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M13.253 3.639c0-.758-.615-1.373-1.373-1.373H3.639c-.758 0-1.373.615-1.373 1.373v8.241c0 .758.615 1.373 1.373 1.373h8.241c.758 0 1.373-.615 1.373-1.373V3.639zm0 16.481c0-.758-.615-1.373-1.373-1.373H3.639c-.758 0-1.373.615-1.373 1.373v8.241c0 .758.615 1.373 1.373 1.373h8.241c.758 0 1.373-.615 1.373-1.373V20.12zm16.481 0c0-.758-.615-1.373-1.373-1.373H20.12c-.758 0-1.373.615-1.373 1.373v8.241c0 .758.615 1.373 1.373 1.373h8.241c.758 0 1.373-.615 1.373-1.373V20.12zM19.262 7.76h9.957'/><path d='M24.24 2.781v9.957'/></svg>",
 DISPLAY: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M1.238 21.119c0 1.928 1.565 3.493 3.493 3.493H27.27c1.928 0 3.493-1.565 3.493-3.493V5.961c0-1.928-1.565-3.493-3.493-3.493H4.731c-1.928 0-3.493 1.565-3.493 3.493v15.158zm19.683 8.413H11.08'/></svg>",
 EYE: "<svg xmlns='http://www.w3.org/2000/svg' fill='#fff' stroke='none ' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'>\r<clipPath id='bx-vx-eye-clip'>\r<path d='M0 0h32v32H0z'/>\r</clipPath>\r<g clip-path='url(#bx-vx-eye-clip)'>\r<path d='M31.908 15.568c-.047-.105-1.176-2.611-3.687-5.121C24.876 7.101 20.651 5.333 16 5.333S7.124 7.101 3.779 10.447c-2.511 2.51-3.646 5.02-3.687 5.121-.123.276-.123.591 0 .867.047.105 1.176 2.609 3.687 5.12 3.345 3.344 7.57 5.112 12.221 5.112s8.876-1.768 12.221-5.112c2.511-2.511 3.64-5.015 3.687-5.12.123-.276.123-.591 0-.867zM16 24.533c-4.104 0-7.689-1.492-10.657-4.433-1.218-1.211-2.254-2.592-3.076-4.1.822-1.508 1.858-2.889 3.076-4.1C8.311 8.959 11.896 7.467 16 7.467s7.689 1.492 10.657 4.433c1.221 1.211 2.259 2.592 3.083 4.1-.961 1.795-5.149 8.533-13.74 8.533zM16 9.6c-3.511 0-6.4 2.889-6.4 6.4s2.889 6.4 6.4 6.4 6.4-2.889 6.4-6.4A6.44 6.44 0 0 0 16 9.6zm0 10.667A4.29 4.29 0 0 1 11.733 16 4.29 4.29 0 0 1 16 11.733 4.29 4.29 0 0 1 20.267 16 4.29 4.29 0 0 1 16 20.267z' fill-rule='nonzero'/>\r</g>\r</svg>\r",
 EYE_SLASH: "<svg xmlns='http://www.w3.org/2000/svg' fill='#fff' stroke='none ' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><clipPath id='A'><path d='M0 0h32v32H0z'/></clipPath><g clip-path='url(#A)'><path d='M6.123 3.549a1.07 1.07 0 0 0-.798-.359c-.585 0-1.067.482-1.067 1.067 0 .27.102.53.286.727l2.565 2.823C2.267 10.779.184 15.36.092 15.568c-.123.276-.123.591 0 .867.047.105 1.176 2.609 3.687 5.12 3.345 3.344 7.57 5.112 12.221 5.112a16.97 16.97 0 0 0 6.943-1.444l2.933 3.228c.202.228.493.359.798.359.585 0 1.067-.482 1.067-1.067a1.07 1.07 0 0 0-.286-.727L6.123 3.549zm6.31 10.112l5.556 6.114c-.612.322-1.294.49-1.986.49a4.29 4.29 0 0 1-4.267-4.266c0-.831.242-1.643.697-2.338zM16 24.533c-4.104 0-7.689-1.492-10.657-4.433A17.73 17.73 0 0 1 2.267 16c.625-1.172 2.621-4.452 6.313-6.584l2.4 2.633c-.878 1.125-1.356 2.512-1.356 3.939 0 3.511 2.89 6.4 6.4 6.4 1.221 0 2.416-.349 3.444-1.005l1.964 2.16a14.92 14.92 0 0 1-5.432.99zm.8-12.724a1.07 1.07 0 0 1-.867-1.048c0-.585.482-1.067 1.067-1.067a1.12 1.12 0 0 1 .2.019c2.784.54 4.896 2.863 5.169 5.686a1.07 1.07 0 0 1-.962 1.161c-.034.002-.067.002-.1 0a1.07 1.07 0 0 1-1.067-.968 4.29 4.29 0 0 0-3.44-3.783zm15.104 4.626c-.056.125-1.407 3.116-4.448 5.84a1.07 1.07 0 0 1-.724.283c-.585 0-1.067-.482-1.067-1.067a1.07 1.07 0 0 1 .368-.806A17.7 17.7 0 0 0 29.74 16a17.73 17.73 0 0 0-3.083-4.103C23.689 8.959 20.104 7.467 16 7.467a15.82 15.82 0 0 0-2.581.209 1.06 1.06 0 0 1-.186.016 1.07 1.07 0 0 1-1.067-1.066 1.07 1.07 0 0 1 .901-1.054A17.89 17.89 0 0 1 16 5.333c4.651 0 8.876 1.768 12.221 5.114 2.511 2.51 3.64 5.016 3.687 5.121.123.276.123.591 0 .867h-.004z' fill-rule='nonzero'/></g></svg>",
 AI: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='#fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>\r<rect x='3.5' y='3.5' width='25' height='25' rx='3.5'/>\r<path d='M11 21l2.5-10h2L18 21M12 17h5'/>\r<path d='M21 11v10'/>\r</svg>\r",
 HOME: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M12.217 30.503V20.414h7.567v10.089h10.089V15.37a1.26 1.26 0 0 0-.369-.892L16.892 1.867a1.26 1.26 0 0 0-1.784 0L2.497 14.478a1.26 1.26 0 0 0-.369.892v15.133h10.089z'/></svg>",
 LOCAL_CO_OP: "<svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 32 32' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round'><g><path d='M24.272 11.165h-3.294l-3.14 3.564c-.391.391-.922.611-1.476.611a2.1 2.1 0 0 1-2.087-2.088 2.09 2.09 0 0 1 .031-.362l1.22-6.274a3.89 3.89 0 0 1 3.81-3.206h6.57c1.834 0 3.439 1.573 3.833 3.295l1.205 6.185a2.09 2.09 0 0 1 .031.362 2.1 2.1 0 0 1-2.087 2.088c-.554 0-1.085-.22-1.476-.611l-3.14-3.564' fill='none' stroke='#fff' stroke-width='2'/><circle cx='22.625' cy='5.874' r='.879'/><path d='M11.022 24.415H7.728l-3.14 3.564c-.391.391-.922.611-1.476.611a2.1 2.1 0 0 1-2.087-2.088 2.09 2.09 0 0 1 .031-.362l1.22-6.274a3.89 3.89 0 0 1 3.81-3.206h6.57c1.834 0 3.439 1.573 3.833 3.295l1.205 6.185a2.09 2.09 0 0 1 .031.362 2.1 2.1 0 0 1-2.087 2.088c-.554 0-1.085-.22-1.476-.611l-3.14-3.564' fill='none' stroke='#fff' stroke-width='2'/><circle cx='9.375' cy='19.124' r='.879'/></g></svg>",
 NATIVE_MKB: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><g stroke-width='2.1'><path d='m15.817 6h-10.604c-2.215 0-4.013 1.798-4.013 4.013v12.213c0 2.215 1.798 4.013 4.013 4.013h11.21'/><path d='m5.698 20.617h1.124m-1.124-4.517h7.9m-7.881-4.5h7.9m-2.3 9h2.2'/></g><g stroke-width='2.13'><path d='m30.805 13.1c0-3.919-3.181-7.1-7.1-7.1s-7.1 3.181-7.1 7.1v6.4c0 3.919 3.182 7.1 7.1 7.1s7.1-3.181 7.1-7.1z'/><path d='m23.705 14.715v-4.753'/></g></svg>",
 NEW: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='4' viewBox='0 0 32 32'><path d='M26.875 30.5H5.125c-.663 0-1.208-.545-1.208-1.208V2.708c0-.663.545-1.208 1.208-1.208h14.5l8.458 8.458v19.333c0 .663-.545 1.208-1.208 1.208z'/><path d='M19.625 1.5v8.458h8.458m-15.708 9.667h7.25'/><path d='M16 16v7.25'/></svg>",
 MANAGE: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' viewBox='0 0 32 32'><path d='M10.417 30.271H2.97a1.25 1.25 0 0 1-1.241-1.241v-6.933c.001-.329.131-.644.363-.877L21.223 2.09c.481-.481 1.273-.481 1.754 0l6.933 6.928a1.25 1.25 0 0 1 0 1.755L10.417 30.271z'/><path d='M29.032 30.271H10.417m6.205-23.58l8.687 8.687'/></svg>",
 COPY: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='4' viewBox='0 0 32 32'><path d='M1.498 6.772h23.73v23.73H1.498zm5.274-5.274h23.73v23.73'/></svg>",
 TRASH: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='4' viewBox='0 0 32 32'><path d='M29.5 6.182h-27m9.818 7.363v9.818m7.364-9.818v9.818'/><path d='M27.045 6.182V29.5c0 .673-.554 1.227-1.227 1.227H6.182c-.673 0-1.227-.554-1.227-1.227V6.182m17.181 0V3.727a2.47 2.47 0 0 0-2.455-2.455h-7.364a2.47 2.47 0 0 0-2.455 2.455v2.455'/></svg>",
 CURSOR_TEXT: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='4' viewBox='0 0 32 32'><path d='M16 7.3a5.83 5.83 0 0 1 5.8-5.8h2.9m0 29h-2.9a5.83 5.83 0 0 1-5.8-5.8'/><path d='M7.3 30.5h2.9a5.83 5.83 0 0 0 5.8-5.8V7.3a5.83 5.83 0 0 0-5.8-5.8H7.3'/><path d='M11.65 16h8.7'/></svg>",
 POWER: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M16 2.445v12.91m7.746-11.619C27.631 6.27 30.2 10.37 30.2 15.355c0 7.79-6.41 14.2-14.2 14.2s-14.2-6.41-14.2-14.2c0-4.985 2.569-9.085 6.454-11.619'/></svg>",
 QUESTION: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='4' viewBox='0 0 32 32'><g transform='matrix(.256867 0 0 .256867 -16.878964 -18.049342)'><circle cx='128' cy='180' r='12' fill='#fff'/><path d='M128 144v-8c17.67 0 32-12.54 32-28s-14.33-28-32-28-32 12.54-32 28v4' fill='none' stroke='#fff' stroke-width='16'/></g></svg>",
 REFRESH: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M23.247 12.377h7.247V5.13'/><path d='M23.911 25.663a13.29 13.29 0 0 1-9.119 3.623C7.504 29.286 1.506 23.289 1.506 16S7.504 2.713 14.792 2.713a13.29 13.29 0 0 1 9.395 3.891l6.307 5.772'/></svg>",
 REMOTE_PLAY: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='4' viewBox='0 0 32 32'><g transform='matrix(.492308 0 0 .581818 -14.7692 -11.6364)'><clipPath id='A'><path d='M30 20h65v55H30z'/></clipPath><g clip-path='url(#A)'><g transform='matrix(.395211 0 0 .334409 11.913 7.01124)'><g transform='matrix(.555556 0 0 .555556 57.8889 -20.2417)' fill='none' stroke='#fff' stroke-width='13.88'><path d='M200 140.564c-42.045-33.285-101.955-33.285-144 0M168 165c-23.783-17.3-56.217-17.3-80 0'/></g><g transform='matrix(-.555556 0 0 -.555556 200.111 262.393)'><g transform='matrix(1 0 0 1 0 11.5642)'><path d='M200 129c-17.342-13.728-37.723-21.795-58.636-24.198C111.574 101.378 80.703 109.444 56 129' fill='none' stroke='#fff' stroke-width='13.88'/></g><path d='M168 165c-23.783-17.3-56.217-17.3-80 0' fill='none' stroke='#fff' stroke-width='13.88'/></g><g transform='matrix(.75 0 0 .75 32 32)'><path d='M24 72h208v93.881H24z' fill='none' stroke='#fff' stroke-linejoin='miter' stroke-width='9.485'/><circle cx='188' cy='128' r='12' stroke-width='10' transform='matrix(.708333 0 0 .708333 71.8333 12.8333)'/><path d='M24.358 103.5h110' fill='none' stroke='#fff' stroke-linecap='butt' stroke-width='10.282'/></g></g></g></g></svg>",
 CARET_LEFT: "<svg xmlns='http://www.w3.org/2000/svg' width='100%' stroke='#fff' fill='#fff' height='100%' viewBox='0 0 32 32' fill-rule='evenodd' stroke-linejoin='round' stroke-miterlimit='2'><path d='M6.755 1.924l-6 13.649c-.119.27-.119.578 0 .849l6 13.649c.234.533.857.775 1.389.541s.775-.857.541-1.389L2.871 15.997 8.685 2.773c.234-.533-.008-1.155-.541-1.389s-1.155.008-1.389.541z'/></svg>",
 CARET_RIGHT: "<svg xmlns='http://www.w3.org/2000/svg' width='100%' stroke='#fff' fill='#fff' height='100%' viewBox='0 0 32 32' fill-rule='evenodd' stroke-linejoin='round' stroke-miterlimit='2'><path d='M2.685 1.924l6 13.649c.119.27.119.578 0 .849l-6 13.649c-.234.533-.857.775-1.389.541s-.775-.857-.541-1.389l5.813-13.225L.755 2.773c-.234-.533.008-1.155.541-1.389s1.155.008 1.389.541z'/></svg>",
 SCREENSHOT: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><g transform='matrix(.150985 0 0 .150985 -3.32603 -2.72209)' fill='none' stroke='#fff' stroke-width='16'><path d='M208 208H48c-8.777 0-16-7.223-16-16V80c0-8.777 7.223-16 16-16h32l16-24h64l16 24h32c8.777 0 16 7.223 16 16v112c0 8.777-7.223 16-16 16z'/><circle cx='128' cy='132' r='36'/></g></svg>",
 SPEAKER_MUTED: "<svg xmlns='http://www.w3.org/2000/svg' fill='#fff' stroke='none' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M5.462 3.4c-.205-.23-.499-.363-.808-.363-.592 0-1.079.488-1.079 1.08a1.08 1.08 0 0 0 .289.736l4.247 4.672H2.504a2.17 2.17 0 0 0-2.16 2.16v8.637a2.17 2.17 0 0 0 2.16 2.16h6.107l9.426 7.33a1.08 1.08 0 0 0 .662.227c.592 0 1.08-.487 1.08-1.079v-6.601l5.679 6.247a1.08 1.08 0 0 0 .808.363c.592 0 1.08-.487 1.08-1.079a1.08 1.08 0 0 0-.29-.736L5.462 3.4zm-2.958 8.285h5.398v8.637H2.504v-8.637zM17.62 26.752l-7.558-5.878V11.67l7.558 8.313v6.769zm5.668-8.607c1.072-1.218 1.072-3.063 0-4.281a1.08 1.08 0 0 1-.293-.74c0-.592.487-1.079 1.079-1.079a1.08 1.08 0 0 1 .834.393 5.42 5.42 0 0 1 0 7.137 1.08 1.08 0 0 1-.81.365c-.593 0-1.08-.488-1.08-1.08 0-.263.096-.517.27-.715zM12.469 7.888c-.147-.19-.228-.423-.228-.663a1.08 1.08 0 0 1 .417-.853l5.379-4.184a1.08 1.08 0 0 1 .662-.227c.593 0 1.08.488 1.08 1.08v10.105c0 .593-.487 1.08-1.08 1.08s-1.079-.487-1.079-1.08V5.255l-3.636 2.834c-.469.362-1.153.273-1.515-.196v-.005zm19.187 8.115a10.79 10.79 0 0 1-2.749 7.199 1.08 1.08 0 0 1-.793.347c-.593 0-1.08-.487-1.08-1.079 0-.26.094-.511.264-.708 2.918-3.262 2.918-8.253 0-11.516-.184-.2-.287-.461-.287-.733 0-.592.487-1.08 1.08-1.08a1.08 1.08 0 0 1 .816.373 10.78 10.78 0 0 1 2.749 7.197z' fill-rule='nonzero'/></svg>",
 TOUCH_CONTROL_ENABLE: "<svg xmlns='http://www.w3.org/2000/svg' fill='#fff' viewBox='0 0 32 32' fill-rule='evenodd' stroke-linejoin='round' stroke-miterlimit='2'><path d='M30.021 9.448a.89.89 0 0 0-.889-.889H2.909a.89.89 0 0 0-.889.889v13.146a.89.89 0 0 0 .889.888h26.223a.89.89 0 0 0 .889-.888V9.448z' fill='none' stroke='#fff' stroke-width='2.083'/><path d='M8.147 11.981l-.053-.001-.054.001c-.55.028-.988.483-.988 1.04v6c0 .575.467 1.042 1.042 1.042l.053-.001c.55-.028.988-.484.988-1.04v-6a1.04 1.04 0 0 0-.988-1.04z'/><path d='M11.147 14.981l-.054-.001h-6a1.04 1.04 0 1 0 0 2.083h6c.575 0 1.042-.467 1.042-1.042a1.04 1.04 0 0 0-.988-1.04z'/><circle cx='25.345' cy='18.582' r='2.561' fill='none' stroke='#fff' stroke-width='1.78' transform='matrix(1.17131 0 0 1.17131 -5.74235 -5.74456)'/></svg>",
 TOUCH_CONTROL_DISABLE: "<svg xmlns='http://www.w3.org/2000/svg' fill='#fff' viewBox='0 0 32 32' fill-rule='evenodd' stroke-linejoin='round' stroke-miterlimit='2'><g fill='none' stroke='#fff'><path d='M6.021 5.021l20 22' stroke-width='2'/><path d='M8.735 8.559H2.909a.89.89 0 0 0-.889.889v13.146a.89.89 0 0 0 .889.888h19.34m4.289 0h2.594a.89.89 0 0 0 .889-.888V9.448a.89.89 0 0 0-.889-.889H12.971' stroke-miterlimit='1.5' stroke-width='2.083'/></g><path d='M8.147 11.981l-.053-.001-.054.001c-.55.028-.988.483-.988 1.04v6c0 .575.467 1.042 1.042 1.042l.053-.001c.55-.028.988-.484.988-1.04v-6a1.04 1.04 0 0 0-.988-1.04z'/><path d='M11.147 14.981l-.054-.001h-6a1.04 1.04 0 1 0 0 2.083h6c.575 0 1.042-.467 1.042-1.042a1.04 1.04 0 0 0-.988-1.04z'/><circle cx='25.345' cy='18.582' r='2.561' fill='none' stroke='#fff' stroke-width='1.78' transform='matrix(1.17131 0 0 1.17131 -5.74235 -5.74456)'/></svg>",
 MICROPHONE: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M21.368 6.875A5.37 5.37 0 0 0 16 1.507a5.37 5.37 0 0 0-5.368 5.368v8.588A5.37 5.37 0 0 0 16 20.831a5.37 5.37 0 0 0 5.368-5.368V6.875zM16 25.125v5.368m9.662-15.03c0 5.3-4.362 9.662-9.662 9.662s-9.662-4.362-9.662-9.662'/></svg>",
 MICROPHONE_MUTED: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M16 25.125v5.368M5.265 4.728l21.471 23.618m-4.789-5.267c-1.698 1.326-3.793 2.047-5.947 2.047-5.3 0-9.662-4.362-9.662-9.662'/><path d='M25.662 15.463a9.62 9.62 0 0 1-.978 4.242m-5.64.187c-.895.616-1.957.943-3.043.939-2.945 0-5.368-2.423-5.368-5.368v-4.831m.442-5.896A5.38 5.38 0 0 1 16 1.507c2.945 0 5.368 2.423 5.368 5.368v8.588c0 .188-.01.375-.03.562'/></svg>",
 BATTERY: "<svg xmlns='http://www.w3.org/2000/svg' fill='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' stroke-miterlimit='2' viewBox='0 0 32 32'><path d='M24.774 6.71H3.097C1.398 6.71 0 8.108 0 9.806v12.387c0 1.699 1.398 3.097 3.097 3.097h21.677c1.699 0 3.097-1.398 3.097-3.097V9.806c0-1.699-1.398-3.097-3.097-3.097zm1.032 15.484a1.04 1.04 0 0 1-1.032 1.032H3.097a1.04 1.04 0 0 1-1.032-1.032V9.806a1.04 1.04 0 0 1 1.032-1.032h21.677a1.04 1.04 0 0 1 1.032 1.032v12.387zm-2.065-10.323v8.258a1.04 1.04 0 0 1-1.032 1.032H5.161a1.04 1.04 0 0 1-1.032-1.032v-8.258a1.04 1.04 0 0 1 1.032-1.032H22.71a1.04 1.04 0 0 1 1.032 1.032zm8.258 0v8.258a1.04 1.04 0 0 1-1.032 1.032 1.04 1.04 0 0 1-1.032-1.032v-8.258a1.04 1.04 0 0 1 1.032-1.032A1.04 1.04 0 0 1 32 11.871z' fill-rule='nonzero'/></svg>",
 PLAYTIME: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><g transform='matrix(.150026 0 0 .150026 -3.20332 -3.20332)' fill='none' stroke='#fff' stroke-width='16'><circle cx='128' cy='128' r='96'/><path d='M128 72v56h56'/></g></svg>",
 SERVER: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M9.773 16c0-5.694 4.685-10.379 10.379-10.379S30.53 10.306 30.53 16s-4.685 10.379-10.379 10.379H8.735c-3.982-.005-7.256-3.283-7.256-7.265s3.28-7.265 7.265-7.265c.606 0 1.21.076 1.797.226' fill='none' stroke='#fff' stroke-width='2.076'/></svg>",
 DOWNLOAD: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M16 19.955V1.5m14.5 18.455v9.227c0 .723-.595 1.318-1.318 1.318H2.818c-.723 0-1.318-.595-1.318-1.318v-9.227'/><path d='M22.591 13.364L16 19.955l-6.591-6.591'/></svg>",
 UPLOAD: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M16 19.905V1.682m14.318 18.223v9.112a1.31 1.31 0 0 1-1.302 1.302H2.983a1.31 1.31 0 0 1-1.302-1.302v-9.112'/><path d='M9.492 8.19L16 1.682l6.508 6.508'/></svg>",
 AUDIO: "<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='#fff' fill-rule='evenodd' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 32 32'><path d='M8.964 21.417h-6.5a1.09 1.09 0 0 1-1.083-1.083v-8.667a1.09 1.09 0 0 1 1.083-1.083h6.5L18.714 3v26l-9.75-7.583z'/><path d='M8.964 10.583v10.833m15.167-8.28a4.35 4.35 0 0 1 0 5.728M28.149 9.5a9.79 9.79 0 0 1 0 13'/></svg>"
};
class GameSettingsStorage extends BaseSettingsStorage {
 constructor(id) {
  super(`${"BetterXcloud.Stream"}.${id}`, StreamSettingsStorage.DEFINITIONS);
 }
 isEmpty() {
  return Object.keys(this.settings).length === 0;
 }
}
class ControllerCustomizationsTable extends BasePresetsTable {
 static instance;
 static getInstance = () => ControllerCustomizationsTable.instance ?? (ControllerCustomizationsTable.instance = new ControllerCustomizationsTable(LocalDb.TABLE_CONTROLLER_CUSTOMIZATIONS));
 TABLE_PRESETS = LocalDb.TABLE_CONTROLLER_CUSTOMIZATIONS;
 DEFAULT_PRESETS = {
  [-1]: {
   id: -1,
   name: "ABXY ⇄ BAYX",
   data: {
    mapping: {
     0: 1,
     1: 0,
     2: 3,
     3: 2
    },
    settings: {
     leftStickDeadzone: [0, 100],
     rightStickDeadzone: [0, 100],
     leftTriggerRange: [0, 100],
     rightTriggerRange: [0, 100],
     vibrationIntensity: 100
    }
   }
  }
 };
 BLANK_PRESET_DATA = {
  mapping: {},
  settings: {
   leftTriggerRange: [0, 100],
   rightTriggerRange: [0, 100],
   leftStickDeadzone: [0, 100],
   rightStickDeadzone: [0, 100],
   vibrationIntensity: 100
  }
 };
 DEFAULT_PRESET_ID = 0;
}
class ControllerShortcutsTable extends BasePresetsTable {
 static instance;
 static getInstance = () => ControllerShortcutsTable.instance ?? (ControllerShortcutsTable.instance = new ControllerShortcutsTable);
 LOG_TAG = "ControllerShortcutsTable";
 TABLE_PRESETS = LocalDb.TABLE_CONTROLLER_SHORTCUTS;
 DEFAULT_PRESETS = {
  [-1]: {
   id: -1,
   name: "Type A",
   data: {
    mapping: {
     3: AppInterface ? "device.volume.inc" : "stream.volume.inc",
     0: AppInterface ? "device.volume.dec" : "stream.volume.dec",
     2: "stream.stats.toggle",
     1: AppInterface ? "device.sound.toggle" : "stream.sound.toggle",
     5: "stream.screenshot.capture",
     9: "stream.menu.show"
    }
   }
  },
  [-2]: {
   id: -2,
   name: "Type B",
   data: {
    mapping: {
     12: AppInterface ? "device.volume.inc" : "stream.volume.inc",
     13: AppInterface ? "device.volume.dec" : "stream.volume.dec",
     15: "stream.stats.toggle",
     14: AppInterface ? "device.sound.toggle" : "stream.sound.toggle",
     4: "stream.screenshot.capture",
     8: "stream.menu.show"
    }
   }
  }
 };
 BLANK_PRESET_DATA = {
  mapping: {}
 };
 DEFAULT_PRESET_ID = -1;
 constructor() {
  super(LocalDb.TABLE_CONTROLLER_SHORTCUTS);
  BxLogger.info(this.LOG_TAG, "constructor()");
 }
}
class BaseStreamPlayer {
 logTag;
 playerType;
 elementType;
 $video;
 options = {
  processing: "usm",
  sharpness: 0,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  vxUpscaleTarget: "native",
  vxUpscaleAlgorithm: "vx",
  vxAntiAliasing: "off",
  vxArtifactReduction: 0,
  vxFrameGeneration: "off",
  vxLatencyBudget: 5,
  vxAdaptiveSharpen: !0,
  vxDynamicReconstruction: !0,
  vxTemporalSuperResolution: !1,
  vxHudProtection: !0,
  vxFrameTargetFps: 120,
  vxFineDetailReconstruction: 25
 };
 isStopped = !1;
 constructor(playerType, elementType, $video, logTag) {
  this.playerType = playerType, this.elementType = elementType, this.$video = $video, this.logTag = logTag;
 }
 init() {
  BxLogger.info(this.logTag, "Initialize");
 }
 updateOptions(newOptions, refresh = !1) {
  this.options = Object.assign(this.options, newOptions), refresh && this.refreshPlayer();
 }
}
class VxCapabilitiesDetector {
 static cached;
 static detect() {
  if (this.cached) return this.cached;
  let $canvas = document.createElement("canvas"), webgl2 = !!$canvas.getContext("webgl2");
  return $canvas.width = 1, $canvas.height = 1, this.cached = {
   webgpu: !!navigator.gpu,
   webgl2,
   videoFrameCallback: "requestVideoFrameCallback" in HTMLVideoElement.prototype,
   videoFrame: typeof VideoFrame < "u"
  };
 }
 static preferredBackend() {
  let capabilities = this.detect();
  if (capabilities.webgpu) return "webgpu";
  return capabilities.webgl2 ? "webgl2" : "none";
 }
 static async measureDisplayRefreshRate() {
  let samples = [], previous = performance.now();
  if (await new Promise((resolve) => {
   let sample = (now) => {
    let elapsed = now - previous;
    if (previous = now, elapsed > 2 && elapsed < 100) samples.push(elapsed);
    if (samples.length >= 30) resolve();
    else requestAnimationFrame(sample);
   };
   requestAnimationFrame(sample);
  }), !samples.length)
   return;
  let rate = 1000 / (samples.reduce((total, value) => total + value, 0) / samples.length);
  return [60, 75, 90, 120, 144, 165, 240].reduce((closest, candidate) => Math.abs(candidate - rate) < Math.abs(closest - rate) ? candidate : closest);
 }
}
class VxTelemetry {
 static instance;
 static getInstance = () => this.instance ?? (this.instance = new VxTelemetry);
 maxSamples = 180;
 samples = [];
 videoCallbackId;
 observeVideo($video) {
  if (this.stopVideoObservation($video), !("requestVideoFrameCallback" in $video)) return;
  let observe = (_now, metadata) => {
   this.record({
    decodeMs: typeof metadata.processingDuration === "number" ? metadata.processingDuration * 1000 : void 0,
    presentedFrames: metadata.presentedFrames
   }), this.videoCallbackId = $video.requestVideoFrameCallback(observe);
  };
  this.videoCallbackId = $video.requestVideoFrameCallback(observe);
 }
 recordRendererTime(rendererMs) {
  this.record({ rendererMs });
 }
 getRecentSamples() {
  return this.samples;
 }
 getAverageRendererMs() {
  let values = this.samples.flatMap((sample) => typeof sample.rendererMs === "number" ? [sample.rendererMs] : []);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : void 0;
 }
 reset() {
  this.samples = [];
 }
 stopVideoObservation($video) {
  if (typeof this.videoCallbackId === "number" && $video && "cancelVideoFrameCallback" in $video) $video.cancelVideoFrameCallback(this.videoCallbackId);
  this.videoCallbackId = void 0;
 }
 record(sample) {
  if (this.samples.push({ ...sample, timestamp: performance.now() }), this.samples.length > this.maxSamples) this.samples.splice(0, this.samples.length - this.maxSamples);
 }
}
class VxVideoEngine {
 static instance;
 static getInstance = () => this.instance ?? (this.instance = new VxVideoEngine);
 capabilities;
 async initialize($video) {
  if (this.capabilities = VxCapabilitiesDetector.detect(), !this.capabilities.displayRefreshRate) this.capabilities.displayRefreshRate = await VxCapabilitiesDetector.measureDisplayRefreshRate();
  $video && VxTelemetry.getInstance().observeVideo($video);
 }
 observeRendererDuration(durationMs) {
  VxTelemetry.getInstance().recordRendererTime(durationMs);
 }
 getCapabilities() {
  return this.capabilities ?? VxCapabilitiesDetector.detect();
 }
 destroy($video) {
  VxTelemetry.getInstance().stopVideoObservation($video), VxTelemetry.getInstance().reset();
 }
}
class BaseCanvasPlayer extends BaseStreamPlayer {
 $canvas;
 targetFps = 60;
 frameInterval = 0;
 lastFrameTime = 0;
 animFrameId = null;
 frameCallback;
 boundDrawFrame;
 latencyProtectionLevel = 0;
 rendererCostAverage = 0;
 overBudgetFrames = 0;
 underBudgetFrames = 0;
 constructor(playerType, $video, logTag) {
  super(playerType, "canvas", $video, logTag);
  let $canvas = document.createElement("canvas");
  $canvas.width = $video.videoWidth, $canvas.height = $video.videoHeight, this.$canvas = $canvas, $video.insertAdjacentElement("afterend", this.$canvas);
  let frameCallback;
  if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
   let $video = this.$video;
   frameCallback = $video.requestVideoFrameCallback.bind($video);
  } else frameCallback = window.requestAnimationFrame.bind(window);
  this.frameCallback = frameCallback, this.boundDrawFrame = this.drawFrame.bind(this);
 }
 async init() {
  super.init(), await this.setupShaders(), this.setupRendering();
 }
 setTargetFps(target) {
  this.targetFps = Number.isFinite(target) && target > 0 ? target : 60, this.lastFrameTime = 0, this.frameInterval = Math.floor(1000 / this.targetFps);
 }
 getCanvas() {
  return this.$canvas;
 }
 getLocalRenderFps() {
  return null;
 }
 getLatencyProtectedOptions() {
  let level = this.latencyProtectionLevel;
  return {
   artifactReduction: level >= 2 ? Math.min(this.options.vxArtifactReduction, 15) : level === 1 ? Math.min(this.options.vxArtifactReduction, 30) : this.options.vxArtifactReduction,
   fineDetailReconstruction: level >= 2 ? Math.min(this.options.vxFineDetailReconstruction, 15) : level === 1 ? Math.min(this.options.vxFineDetailReconstruction, 35) : this.options.vxFineDetailReconstruction,
   temporalSuperResolution: level === 0 && this.options.vxTemporalSuperResolution,
   antiAliasing: level >= 2 ? VxAntiAliasing.OFF : level === 1 && this.options.vxAntiAliasing === VxAntiAliasing.FXAA_STRONG ? VxAntiAliasing.FXAA_QUALITY : this.options.vxAntiAliasing,
   frameGenerationLimit: level >= 1 ? 2 : Number.POSITIVE_INFINITY
  };
 }
 getLatencyProtectionStatus() {
  let labels = ["Normal", "Reduzida", "Máxima"];
  return {
   level: this.latencyProtectionLevel,
   label: labels[this.latencyProtectionLevel],
   rendererMs: this.rendererCostAverage || void 0,
   budgetMs: this.options.vxLatencyBudget
  };
 }
 observeRendererCost(durationMs) {
  VxVideoEngine.getInstance().observeRendererDuration(durationMs), this.rendererCostAverage = this.rendererCostAverage ? this.rendererCostAverage * 0.85 + durationMs * 0.15 : durationMs;
  let budget = Math.max(1, this.options.vxLatencyBudget || 5);
  if (this.rendererCostAverage > budget * 0.9) {
   if (this.overBudgetFrames++, this.underBudgetFrames = 0, this.overBudgetFrames >= 8 && this.latencyProtectionLevel < 2) this.latencyProtectionLevel++, this.overBudgetFrames = 0;
  } else if (this.rendererCostAverage < budget * 0.45) {
   if (this.underBudgetFrames++, this.overBudgetFrames = 0, this.underBudgetFrames >= 90 && this.latencyProtectionLevel > 0) this.latencyProtectionLevel--, this.underBudgetFrames = 0;
  } else this.overBudgetFrames = 0, this.underBudgetFrames = 0;
 }
 syncOutputResolution() {
  let sourceWidth = this.$video.videoWidth || 1920, sourceHeight = this.$video.videoHeight || 1080, target = this.options.vxUpscaleTarget, height = sourceHeight;
  if (target === "1440p") height = 1440;
  else if (target === "4k") height = 2160;
  else if (target === "auto") height = Math.min(1440, Math.max(sourceHeight, Math.round(window.innerHeight * devicePixelRatio)));
  if (this.options.vxFrameGeneration !== "off" && this.options.vxFrameGeneration !== "auto") height = Math.min(height, 1080);
  let width = Math.round(height * sourceWidth / sourceHeight);
  if (this.$canvas.width !== width || this.$canvas.height !== height) this.$canvas.width = width, this.$canvas.height = height;
 }
 destroy() {
  if (BxLogger.info(this.logTag, "Destroy"), this.isStopped = !0, this.animFrameId) {
   if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) this.$video.cancelVideoFrameCallback(this.animFrameId);
   else cancelAnimationFrame(this.animFrameId);
   this.animFrameId = null;
  }
  if (this.$canvas.isConnected) this.$canvas.remove();
  this.$canvas.width = 1, this.$canvas.height = 1;
 }
 toFilterId(processing) {
  return processing === "cas" ? 2 : 1;
 }
 shouldDraw() {
  if (this.targetFps >= 60) return !0;
  else if (this.targetFps === 0) return !1;
  let currentTime = performance.now();
  if (currentTime - this.lastFrameTime < this.frameInterval) return !1;
  return this.lastFrameTime = currentTime, !0;
 }
 drawFrame() {
  if (this.isStopped) return;
  if (this.animFrameId = this.frameCallback(this.boundDrawFrame), !this.shouldDraw()) return;
  let started = performance.now();
  this.updateFrame(), this.observeRendererCost(performance.now() - started);
 }
 setupRendering() {
  this.animFrameId = this.frameCallback(this.boundDrawFrame);
 }
}
class WebGPUPlayer extends BaseCanvasPlayer {
 static device;
 context;
 pipeline;
 sampler;
 bindGroup;
 optionsUpdated = !1;
 latencyPolicyKey = "";
 paramsBuffer;
 vertexBuffer;
 static async prepare() {
  if (!BX_FLAGS.EnableWebGPURenderer || !navigator.gpu) {
   BxEventBus.Script.emit("webgpu.ready", {});
   return;
  }
  try {
   let adapter = await navigator.gpu.requestAdapter();
   if (adapter) WebGPUPlayer.device = await adapter.requestDevice(), WebGPUPlayer.device?.addEventListener("uncapturederror", (e) => {
     console.error(e.error.message);
    });
  } catch (ex) {
   alert(ex);
  }
  BxEventBus.Script.emit("webgpu.ready", {});
 }
 constructor($video) {
  super("webgpu", $video, "WebGPUPlayer");
 }
 setupShaders() {
  if (this.context = this.$canvas.getContext("webgpu"), !this.context) {
   alert("Can't initiate context");
   return;
  }
  let format = navigator.gpu.getPreferredCanvasFormat();
  this.context.configure({
   device: WebGPUPlayer.device,
   format,
   alphaMode: "opaque"
  }), this.vertexBuffer = WebGPUPlayer.device.createBuffer({
   label: "vertex buffer",
   size: 24,
   usage: GPUBufferUsage.VERTEX,
   mappedAtCreation: !0
  });
  let mappedRange = this.vertexBuffer.getMappedRange();
  new Float32Array(mappedRange).set([
   -1,
   3,
   -1,
   -1,
   3,
   -1
  ]), this.vertexBuffer.unmap();
  let shaderModule = WebGPUPlayer.device.createShaderModule({ code: `struct Params {filterId: f32,sharpness: f32,brightness: f32,contrast: f32,saturation: f32,artifactReduction: f32,fineDetailReconstruction: f32,upscaleAlgorithm: f32,dynamicReconstruction: f32,adaptiveSharpen: f32,outputWidth: f32,outputHeight: f32,};struct VertexOutput {@builtin(position) position: vec4<f32>,@location(0) uv: vec2<f32>,};@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var ourTexture: texture_external;
@group(0) @binding(2) var<uniform> ourParams: Params;
const FILTER_UNSHARP_MASKING: f32 = 1.0;const CAS_CONTRAST_PEAK: f32 = 0.8 * -3.0 + 8.0;const LUMINOSITY_FACTOR = vec3(0.299, 0.587, 0.114);@vertex
fn vsMain(@location(0) pos: vec2<f32>) -> VertexOutput {var out: VertexOutput;out.position = vec4(pos, 0.0, 1.0);out.uv = (vec2(pos.x, 1.0 - (pos.y + 1.0)) + vec2(1.0, 1.0)) * 0.5;return out;}fn clarityBoost(coord: vec2<f32>, texSize: vec2<f32>, e: vec3<f32>) -> vec3<f32> {let texelSize = 1.0 / texSize;let a = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2(-1.0,  1.0)).rgb;let b = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2( 0.0,  1.0)).rgb;let c = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2( 1.0,  1.0)).rgb;let d = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2(-1.0,  0.0)).rgb;let f = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2( 1.0,  0.0)).rgb;let g = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2(-1.0, -1.0)).rgb;let h = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2( 0.0, -1.0)).rgb;let i = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2( 1.0, -1.0)).rgb;if ourParams.filterId == FILTER_UNSHARP_MASKING {let gaussianBlur = (a + c + g + i) * 1.0 + (b + d + f + h) * 2.0 + e * 4.0;let blurred = gaussianBlur / 16.0;return e + (e - blurred) * (ourParams.sharpness / 3.0);}let minRgb = min(min(min(d, e), min(f, b)), h) + min(min(a, c), min(g, i));let maxRgb = max(max(max(d, e), max(f, b)), h) + max(max(a, c), max(g, i));let reciprocalMaxRgb = 1.0 / maxRgb;var amplifyRgb = clamp(min(minRgb, 2.0 - maxRgb) * reciprocalMaxRgb, vec3(0.0), vec3(1.0));amplifyRgb = 1.0 / sqrt(amplifyRgb);let weightRgb = -(1.0 / (amplifyRgb * CAS_CONTRAST_PEAK));let reciprocalWeightRgb = 1.0 / (4.0 * weightRgb + 1.0);let window = b + d + f + h;let outColor = clamp((window * weightRgb + e) * reciprocalWeightRgb, vec3(0.0), vec3(1.0));return mix(e, outColor, ourParams.sharpness / 2.0);}fn reduceArtifacts(coord: vec2<f32>, texSize: vec2<f32>, center: vec3<f32>) -> vec3<f32> {let texel = 1.0 / texSize;let north = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2(0.0, texel.y)).rgb;let south = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord - vec2(0.0, texel.y)).rgb;let east = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2(texel.x, 0.0)).rgb;let west = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord - vec2(texel.x, 0.0)).rgb;let average = (north + south + east + west) * 0.25;let edge = length(center - average);let upscalePressure = max(ourParams.outputWidth / max(1.0, texSize.x), ourParams.outputHeight / max(1.0, texSize.y)) - 1.0;let boost = select(1.0, 1.0 + clamp(upscalePressure, 0.0, 2.0) * 0.35, ourParams.dynamicReconstruction > 0.5);let amount = ourParams.artifactReduction * boost * (1.0 - smoothstep(0.025, 0.12, edge));return mix(center, average, amount * 0.45);}fn fsr1Upscale(coord: vec2<f32>, texSize: vec2<f32>, c: vec3<f32>) -> vec3<f32> {let t = 1.0 / texSize;let n = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2(0.0, t.y)).rgb;let s = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord - vec2(0.0, t.y)).rgb;let e = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2(t.x, 0.0)).rgb;let w = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord - vec2(t.x, 0.0)).rgb;let gx = abs(dot(e - w, LUMINOSITY_FACTOR));let gy = abs(dot(n - s, LUMINOSITY_FACTOR));let directional = select((e + w) * 0.5, (n + s) * 0.5, gx > gy);let edge = smoothstep(0.012, 0.14, max(gx, gy));return clamp(mix(c, c + (c - directional) * (0.22 + edge * 0.18), 0.82), vec3(0.0), vec3(1.0));}fn nisUpscale(coord: vec2<f32>, texSize: vec2<f32>, c: vec3<f32>) -> vec3<f32> {let t = 1.0 / texSize;let n = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2(0.0, t.y)).rgb;let s = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord - vec2(0.0, t.y)).rgb;let e = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2(t.x, 0.0)).rgb;let w = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord - vec2(t.x, 0.0)).rgb;let contrast = smoothstep(0.01, 0.16, max(abs(dot(e - w, LUMINOSITY_FACTOR)), abs(dot(n - s, LUMINOSITY_FACTOR))));let average = (n + s + e + w) * 0.25;return clamp(c + (c - average) * (0.42 + contrast * 0.32), vec3(0.0), vec3(1.0));}fn reconstructFineDetails(coord: vec2<f32>, texSize: vec2<f32>, c: vec3<f32>) -> vec3<f32> {let t = 1.0 / texSize;let average = (textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2(0.0, t.y)).rgb + textureSampleBaseClampToEdge(ourTexture, ourSampler, coord - vec2(0.0, t.y)).rgb + textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2(t.x, 0.0)).rgb + textureSampleBaseClampToEdge(ourTexture, ourSampler, coord - vec2(t.x, 0.0)).rgb) * 0.25;let detail = c - average;let mask = smoothstep(0.012, 0.10, length(detail)) * (1.0 - smoothstep(0.22, 0.52, length(detail)));return clamp(c + detail * ourParams.fineDetailReconstruction * mask * 0.65, vec3(0.0), vec3(1.0));}@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {let texSize = vec2<f32>(textureDimensions(ourTexture));let center = textureSampleBaseClampToEdge(ourTexture, ourSampler, input.uv);var adjustedRgb = select(center.rgb, fsr1Upscale(input.uv, texSize, center.rgb), ourParams.upscaleAlgorithm == 1.0);adjustedRgb = select(adjustedRgb, nisUpscale(input.uv, texSize, center.rgb), ourParams.upscaleAlgorithm == 2.0);adjustedRgb = reduceArtifacts(input.uv, texSize, adjustedRgb);adjustedRgb = reconstructFineDetails(input.uv, texSize, adjustedRgb);adjustedRgb = clarityBoost(input.uv, texSize, adjustedRgb);let gray = dot(adjustedRgb, LUMINOSITY_FACTOR);adjustedRgb = mix(vec3(gray), adjustedRgb, ourParams.saturation);adjustedRgb = (adjustedRgb - 0.5) * ourParams.contrast + 0.5;adjustedRgb *= ourParams.brightness;return vec4(adjustedRgb, 1.0);}` });
  this.pipeline = WebGPUPlayer.device.createRenderPipeline({
   layout: "auto",
   vertex: {
    module: shaderModule,
    entryPoint: "vsMain",
    buffers: [{
     arrayStride: 8,
     attributes: [{
      format: "float32x2",
      offset: 0,
      shaderLocation: 0
     }]
    }]
   },
   fragment: {
    module: shaderModule,
    entryPoint: "fsMain",
    targets: [{ format }]
   },
   primitive: { topology: "triangle-list" }
  }), this.sampler = WebGPUPlayer.device.createSampler({ magFilter: "linear", minFilter: "linear" }), this.updateCanvas();
 }
 prepareUniformBuffer(value, classType) {
  let uniform = new classType(value), uniformBuffer = WebGPUPlayer.device.createBuffer({
   size: uniform.byteLength,
   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  return WebGPUPlayer.device.queue.writeBuffer(uniformBuffer, 0, uniform), uniformBuffer;
 }
 updateCanvas() {
  this.syncOutputResolution();
  let externalTexture = WebGPUPlayer.device.importExternalTexture({ source: this.$video }), latencyOptions = this.getLatencyProtectedOptions(), uniformValues = [
   this.toFilterId(this.options.processing),
   this.options.sharpness,
   this.options.brightness / 100,
   this.options.contrast / 100,
   this.options.saturation / 100,
   latencyOptions.artifactReduction / 100,
   latencyOptions.fineDetailReconstruction / 100,
   this.options.vxUpscaleAlgorithm === "fsr1" ? 1 : this.options.vxUpscaleAlgorithm === "nis" ? 2 : 0,
   this.options.vxDynamicReconstruction ? 1 : 0,
   this.options.vxAdaptiveSharpen ? 1 : 0,
   this.$canvas.width,
   this.$canvas.height
  ], policyKey = uniformValues.join(",");
  if (!this.optionsUpdated || !this.paramsBuffer) this.paramsBuffer = this.prepareUniformBuffer(uniformValues, Float32Array), this.optionsUpdated = !0;
  else if (this.latencyPolicyKey !== policyKey) WebGPUPlayer.device.queue.writeBuffer(this.paramsBuffer, 0, new Float32Array(uniformValues));
  this.latencyPolicyKey = policyKey, this.bindGroup = WebGPUPlayer.device.createBindGroup({
   layout: this.pipeline.getBindGroupLayout(0),
   entries: [
    { binding: 0, resource: this.sampler },
    { binding: 1, resource: externalTexture },
    { binding: 2, resource: { buffer: this.paramsBuffer } }
   ]
  });
 }
 updateFrame() {
  this.updateCanvas();
  let commandEncoder = WebGPUPlayer.device.createCommandEncoder(), passEncoder = commandEncoder.beginRenderPass({
   colorAttachments: [{
    view: this.context.getCurrentTexture().createView(),
    loadOp: "clear",
    storeOp: "store",
    clearValue: [0, 0, 0, 1]
   }]
  });
  passEncoder.setPipeline(this.pipeline), passEncoder.setBindGroup(0, this.bindGroup), passEncoder.setVertexBuffer(0, this.vertexBuffer), passEncoder.draw(3), passEncoder.end(), WebGPUPlayer.device.queue.submit([commandEncoder.finish()]);
 }
 refreshPlayer() {
  this.optionsUpdated = !1, this.updateCanvas();
 }
 destroy() {
  if (super.destroy(), this.isStopped = !0, this.pipeline = null, this.bindGroup = null, this.sampler = null, this.paramsBuffer?.destroy(), this.paramsBuffer = null, this.vertexBuffer?.destroy(), this.vertexBuffer = null, this.context) this.context.unconfigure(), this.context = null;
  console.log("WebGPU context successfully freed.");
 }
}
class StreamSettingsStorage extends BaseSettingsStorage {
 static DEFINITIONS = {
  "deviceVibration.mode": {
   requiredVariants: "full",
   label: t("device-vibration"),
   default: "off",
   options: {
    off: t("off"),
    on: t("on"),
    auto: t("device-vibration-not-using-gamepad")
   }
  },
  "deviceVibration.intensity": {
   requiredVariants: "full",
   label: t("vibration-intensity"),
   default: 50,
   min: 10,
   max: 100,
   params: {
    steps: 10,
    suffix: "%",
    exactTicks: 20
   }
  },
  "controller.pollingRate": {
   requiredVariants: "full",
   label: t("polling-rate"),
   default: 4,
   min: 4,
   max: 60,
   params: {
    steps: 4,
    exactTicks: 20,
    reverse: !0,
    customTextValue(value) {
     value = parseInt(value);
     let text = +(1000 / value).toFixed(2) + " Hz";
     if (value === 4) text = `${text} (${t("default")})`;
     return text;
    }
   }
  },
  "controller.settings": {
   default: {}
  },
  "nativeMkb.scroll.sensitivityX": {
   requiredVariants: "full",
   label: t("horizontal-scroll-sensitivity"),
   default: 0,
   min: 0,
   max: 1e4,
   params: {
    steps: 10,
    exactTicks: 2000,
    customTextValue: (value) => {
     if (!value) return t("default");
     return (value / 100).toFixed(1) + "x";
    }
   }
  },
  "nativeMkb.scroll.sensitivityY": {
   requiredVariants: "full",
   label: t("vertical-scroll-sensitivity"),
   default: 0,
   min: 0,
   max: 1e4,
   params: {
    steps: 10,
    exactTicks: 2000,
    customTextValue: (value) => {
     if (!value) return t("default");
     return (value / 100).toFixed(1) + "x";
    }
   }
  },
  "mkb.p1.preset.mappingId": {
   requiredVariants: "full",
   default: -1
  },
  "mkb.p1.slot": {
   requiredVariants: "full",
   default: 1,
   min: 1,
   max: 4,
   params: {
    hideSlider: !0
   }
  },
  "mkb.p2.preset.mappingId": {
   requiredVariants: "full",
   default: 0
  },
  "mkb.p2.slot": {
   requiredVariants: "full",
   default: 0,
   min: 0,
   max: 4,
   params: {
    hideSlider: !0,
    customTextValue(value) {
     return value = parseInt(value), value === 0 ? t("off") : value.toString();
    }
   }
  },
  "keyboardShortcuts.preset.inGameId": {
   requiredVariants: "full",
   default: -1
  },
  "video.player.type": {
   label: t("renderer"),
   default: "default",
   options: {
    default: t("default"),
    webgl2: t("webgl2"),
    webgpu: `${t("webgpu")} (${t("experimental")})`
   },
   suggest: {
    lowest: "default",
    highest: "webgl2"
   },
   ready: (setting) => {
    BxEventBus.Script.on("webgpu.ready", () => {
     if (!WebGPUPlayer.device) delete setting.options["webgpu"];
    });
   }
  },
  "video.processing": {
   label: t("clarity-boost"),
   default: "usm",
   options: {
    usm: t("unsharp-masking"),
    cas: t("amd-fidelity-cas")
   },
   suggest: {
    lowest: "usm",
    highest: "cas"
   }
  },
  "video.processing.mode": {
   label: t("clarity-boost-mode"),
   default: "performance",
   options: {
    performance: t("performance"),
    quality: t("quality")
   },
   suggest: {
    lowest: "performance",
    highest: "quality"
   }
  },
  "video.player.powerPreference": {
   label: t("renderer-configuration"),
   default: "default",
   options: {
    default: t("default"),
    "low-power": t("battery-saving"),
    "high-performance": t("high-performance")
   },
   suggest: {
    highest: "low-power"
   }
  },
  "video.maxFps": {
   label: t("limit-fps"),
   note: t("limit-fps-vx-note"),
   default: 60,
   min: 10,
   max: 60,
   params: {
    steps: 10,
    exactTicks: 10,
    customTextValue: (value) => (value = parseInt(value), value === 60 ? t("unlimited") : value + "fps")
   }
  },
  "video.processing.sharpness": {
   label: t("sharpness"),
   default: 0,
   min: 0,
   max: 10,
   params: {
    exactTicks: 2,
    customTextValue: (value) => (value = parseInt(value), value === 0 ? t("off") : value.toString())
   },
   suggest: {
    lowest: 0,
    highest: 2
   }
  },
  "video.ratio": {
   label: t("aspect-ratio"),
   note: STATES.browser.capabilities.touch ? t("aspect-ratio-note") : void 0,
   default: "16:9",
   options: {
    "16:9": `16:9 (${t("default")})`,
    "16:10": "16:10",
    "18:9": "18:9",
    "20:9": "20:9",
    "21:9": "21:9",
    "3:2": "3:2",
    "4:3": "4:3",
    "5:4": "5:4",
    fill: t("stretch")
   }
  },
  "video.position": {
   label: t("position"),
   note: STATES.browser.capabilities.touch ? t("aspect-ratio-note") : void 0,
   default: "center",
   options: {
    top: t("top"),
    "top-half": t("top-half"),
    center: `${t("center")} (${t("default")})`,
    "bottom-half": t("bottom-half"),
    bottom: t("bottom")
   }
  },
  "video.saturation": {
   label: t("saturation"),
   default: 100,
   min: 50,
   max: 150,
   params: {
    suffix: "%",
    ticks: 25
   }
  },
  "video.contrast": {
   label: t("contrast"),
   default: 100,
   min: 50,
   max: 150,
   params: {
    suffix: "%",
    ticks: 25
   }
  },
  "video.brightness": {
   label: t("brightness"),
   default: 100,
   min: 50,
   max: 150,
   params: {
    suffix: "%",
    ticks: 25
   }
  },
  "vx.upscale.target": {
   label: t("vx-output-resolution"),
   default: "native",
   options: {
    native: t("vx-native-stream"),
    auto: t("vx-auto-up-to-1440p"),
    "1440p": t("vx-upscale-1440p"),
    "4k": t("vx-upscale-4k")
   },
   experimental: !0,
   note: t("vx-upscale-resolution-note"),
   suggest: {
    lowest: "native",
    highest: "1440p"
   }
  },
  "vx.upscale.algorithm": {
   label: t("vx-upscale-algorithm"),
   default: "vx",
   options: {
    vx: t("vx-balanced"),
    fsr1: "AMD FSR 1 — EASU/RCAS",
    nis: "NVIDIA Image Scaling — direcional"
   },
   experimental: !0,
   note: t("vx-upscale-algorithm-note")
  },
  "vx.antiAliasing": {
   label: t("vx-anti-aliasing"),
   default: "off",
   options: {
    off: t("off"),
    fxaa: t("vx-fxaa-fast"),
    "fxaa-quality": t("vx-fxaa-quality"),
    "fxaa-strong": t("vx-fxaa-strong")
   },
   experimental: !0,
   note: t("vx-anti-aliasing-note")
  },
  "vx.artifactReduction": {
   label: t("vx-artifact-reduction"),
   default: 0,
   min: 0,
   max: 100,
   experimental: !0,
   note: t("vx-artifact-reduction-note"),
   params: { steps: 10, suffix: "%", ticks: 10 },
   suggest: {
    lowest: 0,
    highest: 25
   }
  },
  "vx.frameGeneration": {
   label: t("vx-frame-generation"),
   default: "off",
   options: {
    off: t("off"),
    "2x": `2× ${t("vx-optical-flow")}`,
    "3x": `3× ${t("vx-optical-flow")}`,
    "4x": `4× ${t("vx-optical-flow")}`,
    custom: t("vx-custom-target-fps")
   },
   experimental: !0,
   note: t("vx-frame-generation-note")
  },
  "vx.latencyBudget": {
   label: t("vx-latency-budget"),
   default: 5,
   min: 1,
   max: 16,
   experimental: !0,
   note: t("vx-latency-budget-note"),
   params: { steps: 1, suffix: " ms", ticks: 15 }
  },
  "vx.adaptiveSharpen": {
   label: t("vx-adaptive-sharpness"),
   default: !0,
   experimental: !0,
   note: t("vx-adaptive-sharpness-note"),
   suggest: {
    lowest: !1,
    highest: !0
   }
  },
  "vx.dynamicReconstruction": {
   label: t("vx-dynamic-reconstruction"),
   default: !0,
   experimental: !0,
   note: t("vx-dynamic-reconstruction-note"),
   suggest: {
    lowest: !1,
    highest: !0
   }
  },
  "vx.temporalSuperResolution": {
   label: t("vx-temporal-super-resolution"),
   default: !1,
   experimental: !0,
   note: t("vx-temporal-super-resolution-note"),
   suggest: {
    lowest: !1,
    highest: !0
   }
  },
  "vx.hudProtection": {
   label: t("vx-hud-protection"),
   default: !0,
   experimental: !0,
   note: t("vx-hud-protection-note")
  },
  "vx.frameTargetFps": {
   label: t("vx-custom-generation-fps"),
   default: 120,
   min: 30,
   max: 240,
   experimental: !0,
   note: t("vx-custom-generation-fps-note"),
   params: { steps: 1, editable: !0, hideSlider: !0, hideButtons: !0 }
  },
  "vx.fineDetailReconstruction": {
   label: t("vx-fine-detail-reconstruction"),
   default: 25,
   min: 0,
   max: 100,
   experimental: !0,
   note: t("vx-fine-detail-reconstruction-note"),
   params: { steps: 5, suffix: "%", ticks: 25 },
   suggest: {
    lowest: 0,
    highest: 35
   }
  },
  "vx.competitiveMode": {
   label: t("vx-competitive-mode"),
   default: !1,
   note: t("vx-competitive-mode-note")
  },
  "audio.volume": {
   label: t("volume"),
   default: 100,
   min: 0,
   max: 600,
   params: {
    steps: 10,
    suffix: "%",
    ticks: 100
   }
  },
  "stats.items": {
   label: t("stats"),
   default: ["ping", "fps", "btr", "dt", "pl", "fl"],
   multipleOptions: {
    time: t("clock"),
    play: t("playtime"),
    batt: t("battery"),
    ping: t("stat-ping"),
    jit: t("jitter"),
    res: t("resolution"),
    fps: t("stat-fps"),
    btr: t("stat-bitrate"),
    dt: t("stat-decode-time"),
    pl: t("stat-packets-lost"),
    fl: t("stat-frames-lost"),
    dl: t("downloaded"),
    ul: t("uploaded")
   },
   params: {
    size: 0
   },
   ready: (setting) => {
    let multipleOptions = setting.multipleOptions;
    if (!STATES.browser.capabilities.batteryApi) delete multipleOptions["batt"];
    for (let key in multipleOptions)
     multipleOptions[key] = key.toUpperCase() + ": " + multipleOptions[key];
   }
  },
  "stats.showWhenPlaying": {
   label: t("show-stats-on-startup"),
   default: !1
  },
  "stats.quickGlance.enabled": {
   label: "👀 " + t("enable-quick-glance-mode"),
   default: !0
  },
  "stats.position": {
   label: t("position"),
   default: "top-right",
   options: {
    "top-left": t("top-left"),
    "top-center": t("top-center"),
    "top-right": t("top-right")
   }
  },
  "stats.textSize": {
   label: t("text-size"),
   default: "0.9rem",
   options: {
    "0.9rem": t("small"),
    "1.0rem": t("normal"),
    "1.1rem": t("large")
   }
  },
  "stats.opacity.all": {
   label: t("opacity"),
   default: 80,
   min: 50,
   max: 100,
   params: {
    steps: 10,
    suffix: "%",
    ticks: 10
   }
  },
  "stats.opacity.background": {
   label: t("background-opacity"),
   default: 100,
   min: 0,
   max: 100,
   params: {
    steps: 10,
    suffix: "%",
    ticks: 10
   }
  },
  "stats.colors": {
   label: t("conditional-formatting"),
   default: !1
  },
  "localCoOp.enabled": {
   requiredVariants: "full",
   label: t("enable-local-co-op-support"),
   labelIcon: BxIcon.LOCAL_CO_OP,
   default: !1,
   note: () => CE("div", !1, CE("a", {
    href: "https://github.com/redphx/better-xcloud/discussions/275",
    target: "_blank"
   }, t("enable-local-co-op-support-note")), CE("br"), "⚠️ " + t("unexpected-behavior"))
  }
 };
 gameSettings = {};
 xboxTitleId = -1;
 constructor() {
  super("BetterXcloud.Stream", StreamSettingsStorage.DEFINITIONS);
 }
 setGameId(id) {
  this.xboxTitleId = id;
 }
 getGameSettings(id) {
  if (id > -1) {
   if (!this.gameSettings[id]) {
    let gameStorage = new GameSettingsStorage(id);
    this.gameSettings[id] = gameStorage;
    for (let key in gameStorage.settings)
     this.getSettingByGame(id, key);
   }
   return this.gameSettings[id];
  }
  return null;
 }
 getSetting(key, checkUnsupported) {
  return this.getSettingByGame(this.xboxTitleId, key, checkUnsupported);
 }
 getSettingByGame(id, key, checkUnsupported) {
  let gameSettings = this.getGameSettings(id);
  if (gameSettings?.hasSetting(key)) {
   let gameValue = gameSettings.getSetting(key, checkUnsupported), globalValue = super.getSetting(key, checkUnsupported);
   if (globalValue === gameValue) this.deleteSettingByGame(id, key), gameValue = globalValue;
   return gameValue;
  }
  return super.getSetting(key, checkUnsupported);
 }
 setSetting(key, value, origin) {
  return this.setSettingByGame(this.xboxTitleId, key, value, origin);
 }
 setSettingByGame(id, key, value, origin) {
  let gameSettings = this.getGameSettings(id);
  if (gameSettings) return BxLogger.info("setSettingByGame", id, key, value), gameSettings.setSetting(key, value, origin);
  return BxLogger.info("setSettingByGame", id, key, value), super.setSetting(key, value, origin);
 }
 deleteSettingByGame(id, key) {
  let gameSettings = this.getGameSettings(id);
  if (gameSettings) return gameSettings.deleteSetting(key);
  return !1;
 }
 hasGameSetting(id, key) {
  let gameSettings = this.getGameSettings(id);
  return !!(gameSettings && gameSettings.hasSetting(key));
 }
 getControllerSetting(gamepadId) {
  let controllerSetting = this.getSetting("controller.settings")[gamepadId];
  if (!controllerSetting) controllerSetting = {};
  if (!controllerSetting.hasOwnProperty("shortcutPresetId")) controllerSetting.shortcutPresetId = -1;
  if (!controllerSetting.hasOwnProperty("customizationPresetId")) controllerSetting.customizationPresetId = 0;
  return controllerSetting;
 }
}
function migrateStreamSettings() {
 let storage = window.localStorage, globalSettings = JSON.parse(storage.getItem("BetterXcloud") || "{}"), streamSettings = JSON.parse(storage.getItem("BetterXcloud.Stream") || "{}"), modified2 = !1;
 for (let key in globalSettings)
  if (isStreamPref(key)) {
   if (!streamSettings.hasOwnProperty(key)) streamSettings[key] = globalSettings[key];
   delete globalSettings[key], modified2 = !0;
  }
 if (modified2) storage.setItem("BetterXcloud", JSON.stringify(globalSettings)), storage.setItem("BetterXcloud.Stream", JSON.stringify(streamSettings));
}
migrateStreamSettings();
var STORAGE = {
 Global: new GlobalSettingsStorage,
 Stream: new StreamSettingsStorage
}, streamSettingsStorage = STORAGE.Stream, getStreamPrefDefinition = streamSettingsStorage.getDefinition.bind(streamSettingsStorage), getStreamPref = streamSettingsStorage.getSetting.bind(streamSettingsStorage), setStreamPref = streamSettingsStorage.setSetting.bind(streamSettingsStorage), getGamePref = streamSettingsStorage.getSettingByGame.bind(streamSettingsStorage), setGamePref = streamSettingsStorage.setSettingByGame.bind(streamSettingsStorage), setGameIdPref = streamSettingsStorage.setGameId.bind(streamSettingsStorage), hasGamePref = streamSettingsStorage.hasGameSetting.bind(streamSettingsStorage);
STORAGE.Stream = streamSettingsStorage;
var globalSettingsStorage = STORAGE.Global, getGlobalPrefDefinition = globalSettingsStorage.getDefinition.bind(globalSettingsStorage), getGlobalPref = globalSettingsStorage.getSetting.bind(globalSettingsStorage), setGlobalPref = globalSettingsStorage.setSetting.bind(globalSettingsStorage);
function isGlobalPref(prefKey) {
 return ALL_PREFS.global.includes(prefKey);
}
function isStreamPref(prefKey) {
 return ALL_PREFS.stream.includes(prefKey);
}
function getPrefInfo(prefKey) {
 if (isGlobalPref(prefKey)) return {
   storage: STORAGE.Global,
   definition: getGlobalPrefDefinition(prefKey)
  };
 else if (isStreamPref(prefKey)) return {
   storage: STORAGE.Stream,
   definition: getStreamPrefDefinition(prefKey)
  };
 return alert("Missing pref definition: " + prefKey), {};
}
function setPref(prefKey, value, origin) {
 if (isGlobalPref(prefKey)) setGlobalPref(prefKey, value, origin);
 else if (isStreamPref(prefKey)) setStreamPref(prefKey, value, origin);
}
function disablePwa() {
 if (!(window.navigator.orgUserAgent || window.navigator.userAgent || "").toLowerCase()) return;
 if (!!AppInterface || UserAgent.isSafariMobile()) Object.defineProperty(window.navigator, "standalone", {
   value: !0
  });
}
function hashCode(str) {
 let hash = 0;
 for (let i = 0, len = str.length;i < len; i++) {
  let chr = str.charCodeAt(i);
  hash = (hash << 5) - hash + chr, hash |= 0;
 }
 return hash;
}
function renderString(str, obj) {
 return str.replace(/\$\{([A-Za-z0-9_$]+)\}|\$([A-Za-z0-9_$]+)\$/g, (match, p1, p2) => {
  let name = p1 || p2;
  return name in obj ? obj[name] : match;
 });
}
function ceilToNearest(value, interval) {
 return Math.ceil(value / interval) * interval;
}
function floorToNearest(value, interval) {
 return Math.floor(value / interval) * interval;
}
async function copyToClipboard(text, showToast = !0) {
 try {
  return await navigator.clipboard.writeText(text), showToast && Toast.show("Copied to clipboard", "", { instant: !0 }), !0;
 } catch (err) {
  console.error("Failed to copy: ", err), showToast && Toast.show("Failed to copy", "", { instant: !0 });
 }
 return !1;
}
function productTitleToSlug(title) {
 return title.replace(/[;,/?:@&=+_`~$%#^*()!^™\xae\xa9]/g, "").replace(/\|/g, "-").replace(/ {2,}/g, " ").trim().substr(0, 50).replace(/ /g, "-").toLowerCase();
}
function parseDetailsPath(path) {
 let matches = /\/games\/(?<titleSlug>[^\/]+)\/(?<productId>\w+)/.exec(path);
 if (!matches?.groups) return {};
 let titleSlug = matches.groups.titleSlug.replaceAll("|", "-"), productId = matches.groups.productId;
 return { titleSlug, productId };
}
function clearAllData() {
 for (let i = localStorage.length - 1;i >= 0; i--) {
  let key = localStorage.key(i);
  if (!key) continue;
  if (key.startsWith("BetterXcloud") || key.startsWith("better_xcloud")) localStorage.removeItem(key);
 }
 try {
  indexedDB.deleteDatabase(LocalDb.DB_NAME);
 } catch (e) {}
 alert(t("clear-data-success"));
}
function containsAll(arr, values) {
 return values.every((val) => arr.includes(val));
}
function blockAllNotifications() {
 let blockFeatures = getGlobalPref("block.features");
 return containsAll(blockFeatures, ["friends", "notifications-achievements", "notifications-invites"]);
}
function blockSomeNotifications() {
 let blockFeatures = getGlobalPref("block.features");
 if (blockAllNotifications()) return !1;
 return ["friends", "notifications-achievements", "notifications-invites"].some((value) => blockFeatures.includes(value));
}
function isPlainObject(input) {
 return typeof input === "object" && input !== null && input.constructor === Object;
}
class SoundShortcut {
 static adjustGainNodeVolume(amount) {
  if (!getGlobalPref("audio.volume.booster.enabled")) return 0;
  let currentValue = getStreamPref("audio.volume"), nearestValue;
  if (amount > 0) nearestValue = ceilToNearest(currentValue, amount);
  else nearestValue = floorToNearest(currentValue, -1 * amount);
  let newValue;
  if (currentValue !== nearestValue) newValue = nearestValue;
  else newValue = currentValue + amount;
  return newValue = setStreamPref("audio.volume", newValue, "direct"), SoundShortcut.setGainNodeVolume(newValue), Toast.show(`${t("stream")} ❯ ${t("volume")}`, newValue + "%", { instant: !0 }), newValue;
 }
 static setGainNodeVolume(value) {
  STATES.currentStream.audioGainNode && (STATES.currentStream.audioGainNode.gain.value = value / 100);
 }
 static muteUnmute() {
  if (getGlobalPref("audio.volume.booster.enabled") && STATES.currentStream.audioGainNode) {
   let gainValue = STATES.currentStream.audioGainNode.gain.value, settingValue = getStreamPref("audio.volume"), targetValue;
   if (settingValue === 0) targetValue = 100, setStreamPref("audio.volume", targetValue, "direct");
   else if (gainValue === 0) targetValue = settingValue;
   else targetValue = 0;
   let status;
   if (targetValue === 0) status = t("muted");
   else status = targetValue + "%";
   SoundShortcut.setGainNodeVolume(targetValue), Toast.show(`${t("stream")} ❯ ${t("volume")}`, status, { instant: !0 }), BxEventBus.Stream.emit("speaker.state.changed", {
    state: targetValue === 0 ? 1 : 0
   });
   return;
  }
  let $media = document.querySelector("div[data-testid=media-container] audio") ?? document.querySelector("div[data-testid=media-container] video");
  if ($media) {
   $media.muted = !$media.muted;
   let status = $media.muted ? t("muted") : t("unmuted");
   Toast.show(`${t("stream")} ❯ ${t("volume")}`, status, { instant: !0 }), BxEventBus.Stream.emit("speaker.state.changed", {
    state: $media.muted ? 1 : 0
   });
  }
 }
}
class StreamUiShortcut {
 static showHideStreamMenu() {
  window.BX_EXPOSED.showStreamMenu && window.BX_EXPOSED.showStreamMenu();
 }
}
class StreamStatsCollector {
 static instance;
 static getInstance = () => StreamStatsCollector.instance ?? (StreamStatsCollector.instance = new StreamStatsCollector);
 LOG_TAG = "StreamStatsCollector";
 static INTERVAL_BACKGROUND = 60000;
 calculateGrade(value, grades) {
  return value > grades[2] ? "bad" : value > grades[1] ? "ok" : value > grades[0] ? "good" : "";
 }
 currentStats = {
  ping: {
   current: -1,
   grades: [40, 75, 100],
   toString() {
    return this.current === -1 ? "???" : this.current.toString().padStart(3);
   }
  },
  jit: {
   current: 0,
   grades: [30, 40, 60],
   toString() {
    return `${this.current.toFixed(1)}ms`.padStart(6);
   }
  },
  res: {
   current: "",
   toString() {
    return this.current;
   }
  },
  fps: {
   current: 0,
   toString() {
    let maxFps = getStreamPref("video.maxFps");
    return maxFps < 60 ? `${maxFps}/${this.current}`.padStart(5) : this.current.toString();
   }
  },
  btr: {
   current: 0,
   toString() {
    return `${this.current.toFixed(1)} Mbps`.padStart(9);
   }
  },
  fl: {
   received: 0,
   dropped: 0,
   toString() {
    let percentage = (this.dropped * 100 / (this.dropped + this.received || 1)).toFixed(1);
    return percentage.startsWith("0.") ? this.dropped.toString() : `${this.dropped} (${percentage}%)`;
   }
  },
  pl: {
   received: 0,
   dropped: 0,
   toString() {
    let percentage = (this.dropped * 100 / (this.dropped + this.received || 1)).toFixed(1);
    return percentage.startsWith("0.") ? this.dropped.toString() : `${this.dropped} (${percentage}%)`;
   }
  },
  dt: {
   current: 0,
   total: 0,
   grades: [6, 9, 12],
   toString() {
    return isNaN(this.current) ? "??ms" : `${this.current.toFixed(1)}ms`.padStart(6);
   }
  },
  dl: {
   total: 0,
   toString() {
    return humanFileSize(this.total).padStart(8);
   }
  },
  ul: {
   total: 0,
   toString() {
    return humanFileSize(this.total);
   }
  },
  play: {
   seconds: 0,
   startTime: 0,
   toString() {
    return secondsToHm(this.seconds);
   }
  },
  batt: {
   current: 100,
   start: 100,
   isCharging: !1,
   toString() {
    let text = `${this.current}%`;
    if (this.current !== this.start) {
     let diffLevel = Math.round(this.current - this.start), sign = diffLevel > 0 ? "+" : "";
     text += ` (${sign}${diffLevel}%)`;
    }
    return text;
   }
  },
  time: {
   toString() {
    return (new Date()).toLocaleTimeString([], {
     hour: "2-digit",
     minute: "2-digit",
     hour12: !1
    });
   }
  }
 };
 lastVideoStat;
 selectedCandidatePairId = null;
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()");
 }
 async collect() {
  let stats = await STATES.currentStream.peerConnection?.getStats();
  if (!stats) return;
  if (!this.selectedCandidatePairId) {
   let found = !1;
   stats.forEach((stat) => {
    if (found || stat.type !== "transport") return;
    if (stat = stat, stat.iceState === "connected" && stat.selectedCandidatePairId) this.selectedCandidatePairId = stat.selectedCandidatePairId, found = !0;
   });
  }
  stats.forEach((stat) => {
   if (stat.type === "inbound-rtp" && stat.kind === "video") {
    let resolution = this.currentStats["res"];
    resolution.current = `${stat.frameHeight}p`;
    let fps = this.currentStats["fps"];
    fps.current = stat.framesPerSecond || 0;
    let pl = this.currentStats["pl"];
    pl.dropped = Math.max(0, stat.packetsLost), pl.received = stat.packetsReceived;
    let fl = this.currentStats["fl"];
    if (fl.dropped = stat.framesDropped, fl.received = stat.framesReceived, !this.lastVideoStat) {
     this.lastVideoStat = stat;
     return;
    }
    let lastStat = this.lastVideoStat, jit = this.currentStats["jit"], bufferDelayDiff = stat.jitterBufferDelay - lastStat.jitterBufferDelay, emittedCountDiff = stat.jitterBufferEmittedCount - lastStat.jitterBufferEmittedCount;
    if (emittedCountDiff > 0) jit.current = bufferDelayDiff / emittedCountDiff * 1000;
    let btr = this.currentStats["btr"], timeDiff = stat.timestamp - lastStat.timestamp;
    btr.current = 8 * (stat.bytesReceived - lastStat.bytesReceived) / timeDiff / 1000;
    let dt = this.currentStats["dt"];
    dt.total = stat.totalDecodeTime - lastStat.totalDecodeTime;
    let framesDecodedDiff = stat.framesDecoded - lastStat.framesDecoded;
    dt.current = dt.total / framesDecodedDiff * 1000, this.lastVideoStat = stat;
   } else if (this.selectedCandidatePairId && stat.type === "candidate-pair" && stat.id === this.selectedCandidatePairId) {
    let ping = this.currentStats["ping"];
    ping.current = stat.currentRoundTripTime ? stat.currentRoundTripTime * 1000 : -1;
    let dl = this.currentStats["dl"];
    dl.total = stat.bytesReceived;
    let ul = this.currentStats["ul"];
    ul.total = stat.bytesSent;
   }
  });
  let batteryLevel = 100, isCharging = !1;
  if (STATES.browser.capabilities.batteryApi) try {
    let bm = await navigator.getBattery();
    isCharging = bm.charging, batteryLevel = Math.round(bm.level * 100);
   } catch (e) {}
  let battery = this.currentStats["batt"];
  battery.current = batteryLevel, battery.isCharging = isCharging;
  let playTime = this.currentStats["play"], now = +new Date;
  playTime.seconds = Math.ceil((now - playTime.startTime) / 1000);
 }
 getStat(kind) {
  return this.currentStats[kind];
 }
 reset() {
  let playTime = this.currentStats["play"];
  playTime.seconds = 0, playTime.startTime = +new Date;
  try {
   STATES.browser.capabilities.batteryApi && navigator.getBattery().then((bm) => {
    this.currentStats["batt"].start = Math.round(bm.level * 100);
   });
  } catch (e) {}
 }
 static setupEvents() {
  BxEventBus.Stream.on("state.playing", () => {
   StreamStatsCollector.getInstance().reset();
  });
 }
}
class StreamStats {
 static instance;
 static getInstance = () => StreamStats.instance ?? (StreamStats.instance = new StreamStats);
 LOG_TAG = "StreamStats";
 isRunning = !1;
 intervalId;
 REFRESH_INTERVAL = 1000;
 stats = {
  time: {
   name: t("clock"),
   $element: CE("span")
  },
  play: {
   name: t("playtime"),
   $element: CE("span")
  },
  batt: {
   name: t("battery"),
   $element: CE("span")
  },
  ping: {
   name: t("stat-ping"),
   $element: CE("span")
  },
  jit: {
   name: t("jitter"),
   $element: CE("span")
  },
  res: {
   name: t("resolution"),
   $element: CE("span")
  },
  fps: {
   name: t("stat-fps"),
   $element: CE("span")
  },
  btr: {
   name: t("stat-bitrate"),
   $element: CE("span")
  },
  dt: {
   name: t("stat-decode-time"),
   $element: CE("span")
  },
  pl: {
   name: t("stat-packets-lost"),
   $element: CE("span")
  },
  fl: {
   name: t("stat-frames-lost"),
   $element: CE("span")
  },
  dl: {
   name: t("downloaded"),
   $element: CE("span")
  },
  ul: {
   name: t("uploaded"),
   $element: CE("span")
  }
 };
 $container;
 boundOnStreamHudStateChanged;
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()"), this.boundOnStreamHudStateChanged = this.onStreamHudStateChanged.bind(this), BxEventBus.Stream.on("ui.streamHud.rendered", this.boundOnStreamHudStateChanged), this.render();
 }
 async start(glancing = !1) {
  if (this.isRunning || !this.isHidden() || glancing && this.isGlancing()) return;
  this.isRunning = !0, this.intervalId && clearInterval(this.intervalId), await this.update(!0), this.$container.classList.remove("bx-gone"), this.$container.dataset.display = glancing ? "glancing" : "fixed", this.intervalId = window.setInterval(this.update, this.REFRESH_INTERVAL);
 }
 async stop(glancing = !1) {
  if (glancing && !this.isGlancing()) return;
  this.isRunning = !1, this.intervalId && clearInterval(this.intervalId), this.intervalId = null, this.$container.removeAttribute("data-display"), this.$container.classList.add("bx-gone");
 }
 async toggle() {
  if (this.isGlancing()) this.$container && (this.$container.dataset.display = "fixed");
  else this.isHidden() ? await this.start() : await this.stop();
 }
 destroy() {
  this.stop(), this.hideSettingsUi();
 }
 isHidden = () => this.$container.classList.contains("bx-gone");
 isGlancing = () => this.$container.dataset.display === "glancing";
 onStreamHudStateChanged({ expanded }) {
  if (!getStreamPref("stats.quickGlance.enabled")) return;
  if (expanded) this.isHidden() && this.start(!0);
  else this.stop(!0);
 }
 update = async (forceUpdate = !1) => {
  if (!forceUpdate && this.isHidden() || !STATES.currentStream.peerConnection) {
   this.destroy();
   return;
  }
  let PREF_STATS_CONDITIONAL_FORMATTING = getStreamPref("stats.colors"), grade = "", statsCollector = StreamStatsCollector.getInstance();
  await statsCollector.collect();
  let statKey;
  for (statKey in this.stats) {
   grade = "";
   let stat = this.stats[statKey], value = statsCollector.getStat(statKey), $element = stat.$element;
   if (statKey === "fps" && this.hasActiveFrameGeneration()) this.renderFrameGenerationFps($element, value.current);
   else if (statKey === "res") this.renderUpscaleResolution($element, value.current);
   else delete $element.dataset.vxFrameGeneration, delete $element.dataset.vxUpscale, $element.textContent = value.toString();
   if (PREF_STATS_CONDITIONAL_FORMATTING && "grades" in value) grade = statsCollector.calculateGrade(value.current, value.grades);
   if ($element.dataset.grade !== grade) $element.dataset.grade = grade;
  }
 };
 renderFrameGenerationFps($element, streamFps) {
  let localRenderFps = STATES.currentStream.streamPlayerManager?.getCanvasPlayer()?.getLocalRenderFps(), configuredBaseFps = getStreamPref("video.maxFps"), baseFps = configuredBaseFps > 0 && configuredBaseFps < 60 ? configuredBaseFps : Math.round(streamFps);
  $element.dataset.vxFrameGeneration = "true", $element.replaceChildren(CE("span", { class: "bx-vx-fps-base", title: t("vx-fps-base-title") }, `${t("vx-fps-base")} ${baseFps}`), CE("span", { class: "bx-vx-fps-bar", title: t("vx-fps-render-title") }, CE("i", { class: "bx-vx-fps-stream" }), CE("i", { class: "bx-vx-fps-generated" })), CE("span", { class: "bx-vx-fps-generated-value", title: t("vx-fps-render-title") }, localRenderFps ? `${t("vx-fps-render")} ${localRenderFps}` : `${t("vx-fps-render")} —`));
 }
 hasActiveFrameGeneration() {
  let mode = getStreamPref("vx.frameGeneration"), canvasPlayer = STATES.currentStream.streamPlayerManager?.getCanvasPlayer();
  return mode !== "off" && mode !== "auto" && !!canvasPlayer && canvasPlayer.getLocalRenderFps() !== null;
 }
 renderUpscaleResolution($element, sourceResolution) {
  let sourceHeight = Number.parseInt(sourceResolution, 10), outputHeight = STATES.currentStream.streamPlayerManager?.getCanvasPlayer()?.getCanvas().height || 0;
  if (!sourceHeight || outputHeight <= sourceHeight) {
   delete $element.dataset.vxUpscale, $element.textContent = sourceResolution;
   return;
  }
  let outputResolution = `${outputHeight}p`;
  $element.dataset.vxUpscale = "true", $element.replaceChildren(CE("span", { class: "bx-vx-resolution-source" }, `S ${sourceResolution}`), CE("span", { class: "bx-vx-resolution-bar", title: t("vx-upscale-pipeline") }, CE("i", { class: "bx-vx-resolution-stream" }), CE("i", { class: "bx-vx-resolution-output" })), CE("span", { class: "bx-vx-resolution-output-value" }, `U ${outputResolution}`));
 }
 refreshStyles() {
  let PREF_ITEMS = getStreamPref("stats.items"), PREF_OPACITY_BG = getStreamPref("stats.opacity.background"), $container = this.$container;
  if ($container.dataset.stats = "[" + PREF_ITEMS.join("][") + "]", $container.dataset.position = getStreamPref("stats.position"), PREF_OPACITY_BG === 0) $container.style.removeProperty("background-color"), $container.dataset.shadow = "true";
  else delete $container.dataset.shadow, $container.style.backgroundColor = `rgba(0, 0, 0, ${PREF_OPACITY_BG}%)`;
  $container.style.opacity = getStreamPref("stats.opacity.all") + "%", $container.style.fontSize = getStreamPref("stats.textSize");
 }
 hideSettingsUi() {
  if (this.isGlancing() && !getStreamPref("stats.quickGlance.enabled")) this.stop();
 }
 async render() {
  this.$container = CE("div", { class: "bx-stats-bar bx-gone" });
  let statKey;
  for (statKey in this.stats) {
   let stat = this.stats[statKey], $div = CE("div", {
    class: `bx-stat-${statKey}`,
    title: stat.name
   }, CE("label", !1, statKey.toUpperCase()), stat.$element);
   this.$container.appendChild($div);
  }
  this.refreshStyles(), document.documentElement.appendChild(this.$container);
 }
 static setupEvents() {
  BxEventBus.Stream.on("state.playing", () => {
   let PREF_STATS_QUICK_GLANCE = getStreamPref("stats.quickGlance.enabled"), PREF_STATS_SHOW_WHEN_PLAYING = getStreamPref("stats.showWhenPlaying"), streamStats = StreamStats.getInstance();
   if (PREF_STATS_SHOW_WHEN_PLAYING) streamStats.start();
   else if (PREF_STATS_QUICK_GLANCE) !PREF_STATS_SHOW_WHEN_PLAYING && streamStats.start(!0);
  });
 }
 static refreshStyles() {
  StreamStats.getInstance().refreshStyles();
 }
}
class KeyHelper {
 static NON_PRINTABLE_KEYS = {
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  NumpadMultiply: "Numpad *",
  NumpadAdd: "Numpad +",
  NumpadSubtract: "Numpad -",
  NumpadDecimal: "Numpad .",
  NumpadDivide: "Numpad /",
  NumpadEqual: "Numpad =",
  Mouse0: "Left Click",
  Mouse2: "Right Click",
  Mouse1: "Middle Click",
  ScrollUp: "Scroll Up",
  ScrollDown: "Scroll Down",
  ScrollLeft: "Scroll Left",
  ScrollRight: "Scroll Right"
 };
 static getKeyFromEvent(e) {
  let code = null, modifiers;
  if (e instanceof KeyboardEvent) code = e.code || e.key, modifiers = 0, modifiers ^= e.ctrlKey ? 1 : 0, modifiers ^= e.shiftKey ? 2 : 0, modifiers ^= e.altKey ? 4 : 0;
  else if (e instanceof WheelEvent) {
   if (e.deltaY < 0) code = "ScrollUp";
   else if (e.deltaY > 0) code = "ScrollDown";
   else if (e.deltaX < 0) code = "ScrollLeft";
   else if (e.deltaX > 0) code = "ScrollRight";
  } else if (e instanceof MouseEvent) code = "Mouse" + e.button;
  if (code) {
   let results = { code };
   if (modifiers) results.modifiers = modifiers;
   return results;
  }
  return null;
 }
 static getFullKeyCodeFromEvent(e) {
  let key = KeyHelper.getKeyFromEvent(e);
  return key ? `${key.code}:${key.modifiers || 0}` : "";
 }
 static parseFullKeyCode(str) {
  if (!str) return null;
  let tmp = str.split(":"), code = tmp[0], modifiers = parseInt(tmp[1]);
  return {
   code,
   modifiers
  };
 }
 static codeToKeyName(key) {
  let { code, modifiers } = key, text = [KeyHelper.NON_PRINTABLE_KEYS[code] || code.startsWith("Key") && code.substring(3) || code.startsWith("Digit") && code.substring(5) || code.startsWith("Numpad") && "Numpad " + code.substring(6) || code.startsWith("Arrow") && "Arrow " + code.substring(5) || code.endsWith("Lock") && code.replace("Lock", " Lock") || code.endsWith("Left") && "Left " + code.replace("Left", "") || code.endsWith("Right") && "Right " + code.replace("Right", "") || code];
  if (modifiers && modifiers !== 0) {
   if (!code.startsWith("Control") && !code.startsWith("Shift") && !code.startsWith("Alt")) {
    if (modifiers & 2) text.unshift("Shift");
    if (modifiers & 4) text.unshift("Alt");
    if (modifiers & 1) text.unshift("Ctrl");
   }
  }
  return text.join(" + ");
 }
}
class PointerClient {
 static instance;
 static getInstance = () => PointerClient.instance ?? (PointerClient.instance = new PointerClient);
 LOG_TAG = "PointerClient";
 REQUIRED_PROTOCOL_VERSION = 2;
 socket;
 mkbHandler;
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()");
 }
 start(port, mkbHandler) {
  if (!port) throw Error("PointerServer port is 0");
  this.mkbHandler = mkbHandler, this.socket = new WebSocket(`ws://localhost:${port}`), this.socket.binaryType = "arraybuffer", this.socket.addEventListener("open", (event) => {
   BxLogger.info(this.LOG_TAG, "connected");
  }), this.socket.addEventListener("error", (event) => {
   BxLogger.error(this.LOG_TAG, event), Toast.show("Cannot setup mouse: " + event);
  }), this.socket.addEventListener("close", (event) => {
   this.socket = null;
  }), this.socket.addEventListener("message", (event) => {
   let dataView = new DataView(event.data), messageType = dataView.getInt8(0), offset = Int8Array.BYTES_PER_ELEMENT;
   switch (messageType) {
    case 127:
     let protocolVersion = this.onProtocolVersion(dataView, offset);
     if (BxLogger.info(this.LOG_TAG, "Protocol version", protocolVersion), protocolVersion !== this.REQUIRED_PROTOCOL_VERSION) alert("Required MKB protocol: " + protocolVersion), this.stop();
     break;
    case 1:
     this.onMove(dataView, offset);
     break;
    case 2:
    case 3:
     this.onPress(messageType, dataView, offset);
     break;
    case 4:
     this.onScroll(dataView, offset);
     break;
    case 5:
     this.onPointerCaptureChanged(dataView, offset);
   }
  });
 }
 onProtocolVersion(dataView, offset) {
  return dataView.getUint16(offset);
 }
 onMove(dataView, offset) {
  let x = dataView.getInt16(offset);
  offset += Int16Array.BYTES_PER_ELEMENT;
  let y = dataView.getInt16(offset);
  this.mkbHandler?.handleMouseMove({
   movementX: x,
   movementY: y
  });
 }
 onPress(messageType, dataView, offset) {
  let button = dataView.getUint8(offset);
  this.mkbHandler?.handleMouseClick({
   pointerButton: button,
   pressed: messageType === 2
  });
 }
 onScroll(dataView, offset) {
  let vScroll = dataView.getInt16(offset);
  offset += Int16Array.BYTES_PER_ELEMENT;
  let hScroll = dataView.getInt16(offset);
  this.mkbHandler?.handleMouseWheel({
   vertical: vScroll,
   horizontal: hScroll
  });
 }
 onPointerCaptureChanged(dataView, offset) {
  dataView.getInt8(offset) !== 1 && this.mkbHandler?.stop();
 }
 stop() {
  try {
   this.socket?.close();
  } catch (e) {}
  this.socket = null;
 }
}
class MouseDataProvider {
 mkbHandler;
 constructor(handler) {
  this.mkbHandler = handler;
 }
 init() {}
 destroy() {}
}
class MkbHandler {}
class MkbPopup {
 static instance;
 static getInstance = () => MkbPopup.instance ?? (MkbPopup.instance = new MkbPopup);
 popupType;
 $popup;
 $title;
 $btnActivate;
 mkbHandler;
 constructor() {
  this.render(), BxEventBus.Stream.on("keyboardShortcuts.updated", () => {
   let $newButton = this.createActivateButton();
   this.$btnActivate.replaceWith($newButton), this.$btnActivate = $newButton;
  });
 }
 attachMkbHandler(handler) {
  this.mkbHandler = handler, this.popupType = handler instanceof NativeMkbHandler ? "native" : "virtual", this.$popup.dataset.type = this.popupType, this.$title.innerText = t(this.popupType === "native" ? "native-mkb" : "virtual-controller");
 }
 toggleVisibility(show) {
  this.$popup.classList.toggle("bx-gone", !show), show && this.moveOffscreen(!1);
 }
 moveOffscreen(doMove) {
  this.$popup.classList.toggle("bx-offscreen", doMove);
 }
 createActivateButton() {
  let options = {
   style: 1 | 1024 | 128,
   label: t("activate"),
   onClick: this.onActivate
  }, shortcutKey = StreamSettings.findKeyboardShortcut("mkb.toggle");
  if (shortcutKey) options.secondaryText = t("press-key-to-toggle-mkb", { key: KeyHelper.codeToKeyName(shortcutKey) });
  return createButton(options);
 }
 onActivate = (e) => {
  e.preventDefault(), this.mkbHandler.toggle(!0);
 };
 render() {
  this.$popup = CE("div", { class: "bx-mkb-pointer-lock-msg bx-gone" }, this.$title = CE("p"), this.$btnActivate = this.createActivateButton(), CE("div", !1, createButton({
   label: t("ignore"),
   style: 8,
   onClick: (e) => {
    e.preventDefault(), this.mkbHandler.toggle(!1), this.mkbHandler.waitForMouseData(!1);
   }
  }), createButton({
   label: t("manage"),
   icon: BxIcon.MANAGE,
   style: 64,
   onClick: () => {
    let dialog = SettingsDialog.getInstance();
    dialog.focusTab("mkb"), dialog.show();
   }
  }))), document.documentElement.appendChild(this.$popup);
 }
 reset() {
  this.toggleVisibility(!0), this.moveOffscreen(!1);
 }
}
class NativeMkbHandler extends MkbHandler {
 static instance;
 static getInstance() {
  if (typeof NativeMkbHandler.instance > "u") if (NativeMkbHandler.isAllowed()) NativeMkbHandler.instance = new NativeMkbHandler;
   else NativeMkbHandler.instance = null;
  return NativeMkbHandler.instance;
 }
 LOG_TAG = "NativeMkbHandler";
 static isAllowed = () => !UserAgent.isMobileDevice() && STATES.browser.capabilities.emulatedNativeMkb && getGlobalPref("nativeMkb.mode") === "on";
 pointerClient;
 enabled = !1;
 mouseButtonsPressed = 0;
 mouseVerticalMultiply = 0;
 mouseHorizontalMultiply = 0;
 inputChannel;
 popup;
 constructor() {
  super();
  BxLogger.info(this.LOG_TAG, "constructor()"), this.popup = MkbPopup.getInstance(), this.popup.attachMkbHandler(this);
 }
 onKeyboardEvent(e) {
  if (e.type === "keyup" && e.code === "F8") {
   e.preventDefault(), this.toggle();
   return;
  }
 }
 onPointerLockRequested(e) {
  AppInterface.requestPointerCapture(), this.start();
 }
 onPointerLockExited(e) {
  AppInterface.releasePointerCapture(), this.stop();
 }
 onPollingModeChanged = (e) => {
  let move = window.BX_STREAM_SETTINGS.xCloudPollingMode !== "none";
  this.popup.moveOffscreen(move);
 };
 onDialogShown = () => {
  document.pointerLockElement && document.exitPointerLock();
 };
 handleEvent(event) {
  switch (event.type) {
   case "keyup":
    this.onKeyboardEvent(event);
    break;
   case BxEvent.POINTER_LOCK_REQUESTED:
    this.onPointerLockRequested(event);
    break;
   case BxEvent.POINTER_LOCK_EXITED:
    this.onPointerLockExited(event);
    break;
   case BxEvent.XCLOUD_POLLING_MODE_CHANGED:
    this.onPollingModeChanged(event);
    break;
  }
 }
 init() {
  this.pointerClient = PointerClient.getInstance(), this.inputChannel = window.BX_EXPOSED.inputChannel, this.updateInputConfigurationAsync(!1);
  try {
   this.pointerClient.start(STATES.pointerServerPort, this);
  } catch (e) {
   Toast.show("Cannot enable Mouse & Keyboard feature");
  }
  this.mouseVerticalMultiply = getStreamPref("nativeMkb.scroll.sensitivityY"), this.mouseHorizontalMultiply = getStreamPref("nativeMkb.scroll.sensitivityX"), window.addEventListener("keyup", this), window.addEventListener(BxEvent.POINTER_LOCK_REQUESTED, this), window.addEventListener(BxEvent.POINTER_LOCK_EXITED, this), window.addEventListener(BxEvent.XCLOUD_POLLING_MODE_CHANGED, this), BxEventBus.Script.on("dialog.shown", this.onDialogShown);
  let shortcutKey = StreamSettings.findKeyboardShortcut("mkb.toggle");
  if (shortcutKey) {
   let msg = t("press-key-to-toggle-mkb", { key: `<b>${KeyHelper.codeToKeyName(shortcutKey)}</b>` });
   Toast.show(msg, t("native-mkb"), { html: !0 });
  }
  this.waitForMouseData(!1);
 }
 toggle(force) {
  let setEnable;
  if (typeof force < "u") setEnable = force;
  else setEnable = !this.enabled;
  if (setEnable) document.documentElement.requestPointerLock();
  else document.exitPointerLock();
 }
 updateInputConfigurationAsync(enabled) {
  window.BX_EXPOSED.streamSession.updateInputConfigurationAsync({
   enableKeyboardInput: enabled,
   enableMouseInput: enabled,
   enableAbsoluteMouse: !1,
   enableTouchInput: !1
  });
 }
 start() {
  this.resetMouseInput(), this.enabled = !0, this.updateInputConfigurationAsync(!0), window.BX_EXPOSED.stopTakRendering = !0, this.waitForMouseData(!1), Toast.show(t("native-mkb"), t("enabled"), { instant: !0 });
 }
 stop() {
  this.resetMouseInput(), this.enabled = !1, this.updateInputConfigurationAsync(!1), this.waitForMouseData(!0);
 }
 destroy() {
  this.pointerClient?.stop(), this.stop(), window.removeEventListener("keyup", this), window.removeEventListener(BxEvent.POINTER_LOCK_REQUESTED, this), window.removeEventListener(BxEvent.POINTER_LOCK_EXITED, this), window.removeEventListener(BxEvent.XCLOUD_POLLING_MODE_CHANGED, this), BxEventBus.Script.off("dialog.shown", this.onDialogShown), this.waitForMouseData(!1), document.exitPointerLock();
 }
 handleMouseMove(data) {
  this.sendMouseInput({
   X: data.movementX,
   Y: data.movementY,
   Buttons: this.mouseButtonsPressed,
   WheelX: 0,
   WheelY: 0
  });
 }
 handleMouseClick(data) {
  let { pointerButton, pressed } = data;
  if (pressed) this.mouseButtonsPressed |= pointerButton;
  else this.mouseButtonsPressed ^= pointerButton;
  this.mouseButtonsPressed = Math.max(0, this.mouseButtonsPressed), this.sendMouseInput({
   X: 0,
   Y: 0,
   Buttons: this.mouseButtonsPressed,
   WheelX: 0,
   WheelY: 0
  });
 }
 handleMouseWheel(data) {
  let { vertical, horizontal } = data, mouseWheelX = horizontal;
  if (this.mouseHorizontalMultiply && this.mouseHorizontalMultiply !== 1) mouseWheelX *= this.mouseHorizontalMultiply;
  let mouseWheelY = vertical;
  if (this.mouseVerticalMultiply && this.mouseVerticalMultiply !== 1) mouseWheelY *= this.mouseVerticalMultiply;
  return this.sendMouseInput({
   X: 0,
   Y: 0,
   Buttons: this.mouseButtonsPressed,
   WheelX: mouseWheelX,
   WheelY: mouseWheelY
  }), !0;
 }
 setVerticalScrollMultiplier(vertical) {
  this.mouseVerticalMultiply = vertical;
 }
 setHorizontalScrollMultiplier(horizontal) {
  this.mouseHorizontalMultiply = horizontal;
 }
 waitForMouseData(showPopup) {
  this.popup.toggleVisibility(showPopup);
 }
 isEnabled() {
  return this.enabled;
 }
 sendMouseInput(data) {
  data.Type = 0, this.inputChannel?.queueMouseInput(data);
 }
 resetMouseInput() {
  this.mouseButtonsPressed = 0, this.sendMouseInput({
   X: 0,
   Y: 0,
   Buttons: 0,
   WheelX: 0,
   WheelY: 0
  });
 }
}
function showGamepadToast(gamepad) {
 if (gamepad.id === VIRTUAL_GAMEPAD_ID) return;
 if (gamepad._noToast) return;
 BxLogger.info("Gamepad", gamepad);
 let text = "🎮";
 if (getStreamPref("localCoOp.enabled")) text += ` #${gamepad.index + 1}`;
 let gamepadId = gamepad.id.replace(/ \(.*?Vendor: \w+ Product: \w+\)$/, "");
 text += ` - ${gamepadId}`;
 let status;
 if (gamepad.connected) status = (gamepad.vibrationActuator ? "✅" : "❌") + " " + t("vibration-status");
 else status = t("disconnected");
 Toast.show(text, status, { instant: !1 });
}
function simplifyGamepadName(name) {
 return name.replace(/\s+\(.*Vendor: ([0-9a-f]{4}) Product: ([0-9a-f]{4})\)$/, " ($1-$2)");
}
function getUniqueGamepadNames() {
 let gamepads = window.navigator.getGamepads(), names = [];
 for (let gamepad of gamepads)
  if (gamepad?.connected && gamepad.id !== VIRTUAL_GAMEPAD_ID) !names.includes(gamepad.id) && names.push(gamepad.id);
 return names;
}
function hasGamepad() {
 let gamepads = window.navigator.getGamepads();
 for (let gamepad of gamepads)
  if (gamepad?.connected) return !0;
 return !1;
}
function generateVirtualControllerMapping(index, override = {}) {
 return Object.assign({}, {
  GamepadIndex: index,
  A: 0,
  B: 0,
  X: 0,
  Y: 0,
  LeftShoulder: 0,
  RightShoulder: 0,
  LeftTrigger: 0,
  RightTrigger: 0,
  View: 0,
  Menu: 0,
  LeftThumb: 0,
  RightThumb: 0,
  DPadUp: 0,
  DPadDown: 0,
  DPadLeft: 0,
  DPadRight: 0,
  Nexus: 0,
  LeftThumbXAxis: 0,
  LeftThumbYAxis: 0,
  RightThumbXAxis: 0,
  RightThumbYAxis: 0,
  PhysicalPhysicality: 0,
  VirtualPhysicality: 0,
  Dirty: !1,
  Virtual: !1
 }, override);
}
function getGamepadPrompt(gamepadKey) {
 return GamepadKeyName[gamepadKey][1];
}
var XCLOUD_GAMEPAD_KEY_MAPPING = {
 0: "A",
 1: "B",
 2: "X",
 3: "Y",
 12: "DPadUp",
 15: "DPadRight",
 13: "DPadDown",
 14: "DPadLeft",
 4: "LeftShoulder",
 5: "RightShoulder",
 6: "LeftTrigger",
 7: "RightTrigger",
 10: "LeftThumb",
 11: "RightThumb",
 104: "LeftStickAxes",
 204: "RightStickAxes",
 8: "View",
 9: "Menu",
 16: "Nexus",
 17: "Share",
 102: "LeftThumbXAxis",
 103: "LeftThumbXAxis",
 100: "LeftThumbYAxis",
 101: "LeftThumbYAxis",
 202: "RightThumbXAxis",
 203: "RightThumbXAxis",
 200: "RightThumbYAxis",
 201: "RightThumbYAxis"
};
function toXcloudGamepadKey(gamepadKey) {
 return XCLOUD_GAMEPAD_KEY_MAPPING[gamepadKey];
}
var PointerToMouseButton = {
 1: 0,
 2: 2,
 4: 1
}, VIRTUAL_GAMEPAD_ID = "Better xCloud Virtual Controller";
class WebSocketMouseDataProvider extends MouseDataProvider {
 pointerClient;
 isConnected = !1;
 init() {
  this.pointerClient = PointerClient.getInstance(), this.isConnected = !1;
  try {
   this.pointerClient.start(STATES.pointerServerPort, this.mkbHandler), this.isConnected = !0;
  } catch (e) {
   Toast.show("Cannot enable Mouse & Keyboard feature");
  }
 }
 start() {
  this.isConnected && AppInterface.requestPointerCapture();
 }
 stop() {
  this.isConnected && AppInterface.releasePointerCapture();
 }
 destroy() {
  this.isConnected && this.pointerClient?.stop();
 }
}
class PointerLockMouseDataProvider extends MouseDataProvider {
 start() {
  window.addEventListener("mousemove", this.onMouseMoveEvent), window.addEventListener("mousedown", this.onMouseEvent), window.addEventListener("mouseup", this.onMouseEvent), window.addEventListener("wheel", this.onWheelEvent, { passive: !1 }), window.addEventListener("contextmenu", this.disableContextMenu);
 }
 stop() {
  document.pointerLockElement && document.exitPointerLock(), window.removeEventListener("mousemove", this.onMouseMoveEvent), window.removeEventListener("mousedown", this.onMouseEvent), window.removeEventListener("mouseup", this.onMouseEvent), window.removeEventListener("wheel", this.onWheelEvent), window.removeEventListener("contextmenu", this.disableContextMenu);
 }
 onMouseMoveEvent = (e) => {
  this.mkbHandler.handleMouseMove({
   movementX: e.movementX,
   movementY: e.movementY
  });
 };
 onMouseEvent = (e) => {
  e.preventDefault();
  let data = {
   mouseButton: e.button,
   pressed: e.type === "mousedown"
  };
  this.mkbHandler.handleMouseClick(data);
 };
 onWheelEvent = (e) => {
  if (!KeyHelper.getKeyFromEvent(e)) return;
  let data = {
   vertical: e.deltaY,
   horizontal: e.deltaX
  };
  if (this.mkbHandler.handleMouseWheel(data)) e.preventDefault();
 };
 disableContextMenu = (e) => e.preventDefault();
}
class EmulatedMkbHandler extends MkbHandler {
 static instance;
 static getInstance() {
  if (typeof EmulatedMkbHandler.instance > "u") if (EmulatedMkbHandler.isAllowed()) EmulatedMkbHandler.instance = new EmulatedMkbHandler;
   else EmulatedMkbHandler.instance = null;
  return EmulatedMkbHandler.instance;
 }
 static LOG_TAG = "EmulatedMkbHandler";
 static isAllowed() {
  return getGlobalPref("mkb.enabled") && !UserAgent.isMobileDevice();
 }
 PRESET;
 VIRTUAL_GAMEPAD = {
  id: VIRTUAL_GAMEPAD_ID,
  index: 0,
  connected: !1,
  hapticActuators: null,
  mapping: "standard",
  axes: [0, 0, 0, 0],
  buttons: Array(17).fill(null).map(() => ({ pressed: !1, value: 0 })),
  timestamp: performance.now(),
  vibrationActuator: null
 };
 nativeGetGamepads;
 xCloudGamepad = generateVirtualControllerMapping(0);
 initialized = !1;
 enabled = !1;
 mouseDataProvider;
 isPolling = !1;
 prevWheelCode = null;
 wheelStoppedTimeoutId = null;
 detectMouseStoppedTimeoutId = null;
 escKeyDownTime = -1;
 LEFT_STICK_X = [];
 LEFT_STICK_Y = [];
 RIGHT_STICK_X = [];
 RIGHT_STICK_Y = [];
 popup;
 STICK_MAP = {
  102: [this.LEFT_STICK_X, -1],
  103: [this.LEFT_STICK_X, 1],
  100: [this.LEFT_STICK_Y, 1],
  101: [this.LEFT_STICK_Y, -1],
  202: [this.RIGHT_STICK_X, -1],
  203: [this.RIGHT_STICK_X, 1],
  200: [this.RIGHT_STICK_Y, 1],
  201: [this.RIGHT_STICK_Y, -1]
 };
 constructor() {
  super();
  BxLogger.info(EmulatedMkbHandler.LOG_TAG, "constructor()"), this.nativeGetGamepads = window.navigator.getGamepads.bind(window.navigator), this.popup = MkbPopup.getInstance(), this.popup.attachMkbHandler(this);
 }
 isEnabled = () => this.enabled;
 patchedGetGamepads = () => {
  let gamepads = this.nativeGetGamepads() || [];
  return gamepads[this.VIRTUAL_GAMEPAD.index] = this.VIRTUAL_GAMEPAD, gamepads;
 };
 getVirtualGamepad = () => this.VIRTUAL_GAMEPAD;
 updateStick(stick, x, y) {
  let gamepad = this.xCloudGamepad;
  if (stick === 0) gamepad.LeftThumbXAxis = x, gamepad.LeftThumbYAxis = -y;
  else gamepad.RightThumbXAxis = x, gamepad.RightThumbYAxis = -y;
  window.BX_EXPOSED.inputChannel?.sendGamepadInput(performance.now(), [this.xCloudGamepad]);
 }
 vectorLength = (x, y) => Math.sqrt(x ** 2 + y ** 2);
 resetXcloudGamepads() {
  let index = getStreamPref("mkb.p1.slot") - 1;
  this.xCloudGamepad = generateVirtualControllerMapping(0, {
   GamepadIndex: getStreamPref("localCoOp.enabled") ? index : 0,
   Dirty: !0
  }), this.VIRTUAL_GAMEPAD.index = index;
 }
 pressButton(buttonIndex, pressed) {
  let xCloudKey = toXcloudGamepadKey(buttonIndex);
  if (buttonIndex >= 100) {
   let [valueArr] = this.STICK_MAP[buttonIndex];
   for (let i = valueArr.length - 1;i >= 0; i--)
    if (valueArr[i] === buttonIndex) valueArr.splice(i, 1);
   pressed && valueArr.push(buttonIndex);
   let value;
   if (valueArr.length) value = this.STICK_MAP[valueArr[valueArr.length - 1]][1];
   else value = 0;
   this.xCloudGamepad[xCloudKey] = value;
  } else this.xCloudGamepad[xCloudKey] = pressed ? 1 : 0;
  window.BX_EXPOSED.inputChannel?.sendGamepadInput(performance.now(), [this.xCloudGamepad]);
 }
 onKeyboardEvent = (e) => {
  let isKeyDown = e.type === "keydown";
  if (e.code === "Escape") {
   if (e.preventDefault(), this.enabled && isKeyDown) {
    if (this.escKeyDownTime === -1) this.escKeyDownTime = performance.now();
    else if (performance.now() - this.escKeyDownTime >= 1000) this.stop();
   } else this.escKeyDownTime = -1;
   return;
  }
  if (!this.isPolling || !this.PRESET) return;
  if (window.BX_STREAM_SETTINGS.xCloudPollingMode !== "none") return;
  let buttonIndex = this.PRESET.mapping[e.code || e.key];
  if (typeof buttonIndex > "u") return;
  if (e.repeat) return;
  e.preventDefault(), this.pressButton(buttonIndex, isKeyDown);
 };
 onMouseStopped = () => {
  if (this.detectMouseStoppedTimeoutId = null, !this.PRESET) return;
  let analog = this.PRESET.mouse["mapTo"] === 1 ? 0 : 1;
  this.updateStick(analog, 0, 0);
 };
 handleMouseClick(data) {
  let mouseButton;
  if (typeof data.mouseButton < "u") mouseButton = data.mouseButton;
  else if (typeof data.pointerButton < "u") mouseButton = PointerToMouseButton[data.pointerButton];
  let key = {
   code: "Mouse" + mouseButton
  };
  if (!this.PRESET) return;
  let buttonIndex = this.PRESET.mapping[key.code];
  if (typeof buttonIndex > "u") return;
  this.pressButton(buttonIndex, data.pressed);
 }
 handleMouseMove(data) {
  let preset = this.PRESET;
  if (!preset) return;
  let mouseMapTo = preset.mouse["mapTo"];
  if (mouseMapTo === 0) return;
  this.detectMouseStoppedTimeoutId && clearTimeout(this.detectMouseStoppedTimeoutId), this.detectMouseStoppedTimeoutId = window.setTimeout(this.onMouseStopped, 50);
  let deadzoneCounterweight = preset.mouse["deadzoneCounterweight"], x = data.movementX * preset.mouse["sensitivityX"], y = data.movementY * preset.mouse["sensitivityY"], length = this.vectorLength(x, y);
  if (length !== 0 && length < deadzoneCounterweight) x *= deadzoneCounterweight / length, y *= deadzoneCounterweight / length;
  else if (length > 1.1) x *= 1.1 / length, y *= 1.1 / length;
  let analog = mouseMapTo === 1 ? 0 : 1;
  this.updateStick(analog, x, y);
 }
 handleMouseWheel(data) {
  let code = "";
  if (data.vertical < 0) code = "ScrollUp";
  else if (data.vertical > 0) code = "ScrollDown";
  else if (data.horizontal < 0) code = "ScrollLeft";
  else if (data.horizontal > 0) code = "ScrollRight";
  if (!code) return !1;
  if (!this.PRESET) return !1;
  let key = {
   code
  }, buttonIndex = this.PRESET.mapping[key.code];
  if (typeof buttonIndex > "u") return !1;
  if (this.prevWheelCode === null || this.prevWheelCode === key.code) this.wheelStoppedTimeoutId && clearTimeout(this.wheelStoppedTimeoutId), this.pressButton(buttonIndex, !0);
  return this.wheelStoppedTimeoutId = window.setTimeout(() => {
   this.prevWheelCode = null, this.pressButton(buttonIndex, !1);
  }, 20), !0;
 }
 async toggle(force) {
  if (!this.initialized) return;
  if (typeof force < "u") this.enabled = force;
  else this.enabled = !this.enabled;
  if (this.enabled) try {
    await document.body.requestPointerLock({ unadjustedMovement: !0 });
   } catch (e) {
    document.body.requestPointerLock(), console.log(e);
   }
  else document.pointerLockElement && document.exitPointerLock();
 }
 refreshPresetData() {
  this.PRESET = window.BX_STREAM_SETTINGS.mkbPreset, this.resetXcloudGamepads();
 }
 waitForMouseData(showPopup) {
  this.popup.toggleVisibility(showPopup);
 }
 onPollingModeChanged = (e) => {
  let move = window.BX_STREAM_SETTINGS.xCloudPollingMode !== "none";
  this.popup.moveOffscreen(move);
 };
 onDialogShown = () => {
  document.pointerLockElement && document.exitPointerLock();
 };
 onPointerLockChange = () => {
  if (document.pointerLockElement) this.start();
  else this.stop();
 };
 onPointerLockError = (e) => {
  console.log(e), this.stop();
 };
 onPointerLockRequested = () => {
  this.start();
 };
 onPointerLockExited = () => {
  this.mouseDataProvider?.stop();
 };
 handleEvent(event) {
  switch (event.type) {
   case BxEvent.POINTER_LOCK_REQUESTED:
    this.onPointerLockRequested();
    break;
   case BxEvent.POINTER_LOCK_EXITED:
    this.onPointerLockExited();
    break;
  }
 }
 init() {
  if (!STATES.browser.capabilities.mkb) {
   this.initialized = !1;
   return;
  }
  if (this.initialized = !0, this.refreshPresetData(), this.enabled = !1, AppInterface) this.mouseDataProvider = new WebSocketMouseDataProvider(this);
  else this.mouseDataProvider = new PointerLockMouseDataProvider(this);
  if (this.mouseDataProvider.init(), window.addEventListener("keydown", this.onKeyboardEvent), window.addEventListener("keyup", this.onKeyboardEvent), window.addEventListener(BxEvent.XCLOUD_POLLING_MODE_CHANGED, this.onPollingModeChanged), BxEventBus.Script.on("dialog.shown", this.onDialogShown), AppInterface) window.addEventListener(BxEvent.POINTER_LOCK_REQUESTED, this), window.addEventListener(BxEvent.POINTER_LOCK_EXITED, this);
  else document.addEventListener("pointerlockchange", this.onPointerLockChange), document.addEventListener("pointerlockerror", this.onPointerLockError);
  if (MkbPopup.getInstance().reset(), AppInterface) {
   let shortcutKey = StreamSettings.findKeyboardShortcut("mkb.toggle");
   if (shortcutKey) {
    let msg = t("press-key-to-toggle-mkb", { key: `<b>${KeyHelper.codeToKeyName(shortcutKey)}</b>` });
    Toast.show(msg, t("native-mkb"), { html: !0 });
   }
   this.waitForMouseData(!1);
  } else this.waitForMouseData(!0);
 }
 destroy() {
  if (!this.initialized) return;
  if (this.initialized = !1, this.isPolling = !1, this.enabled = !1, this.stop(), this.waitForMouseData(!1), document.exitPointerLock(), window.removeEventListener("keydown", this.onKeyboardEvent), window.removeEventListener("keyup", this.onKeyboardEvent), AppInterface) window.removeEventListener(BxEvent.POINTER_LOCK_REQUESTED, this), window.removeEventListener(BxEvent.POINTER_LOCK_EXITED, this);
  else document.removeEventListener("pointerlockchange", this.onPointerLockChange), document.removeEventListener("pointerlockerror", this.onPointerLockError);
  window.removeEventListener(BxEvent.XCLOUD_POLLING_MODE_CHANGED, this.onPollingModeChanged), BxEventBus.Script.off("dialog.shown", this.onDialogShown), this.mouseDataProvider?.destroy(), window.removeEventListener(BxEvent.XCLOUD_POLLING_MODE_CHANGED, this.onPollingModeChanged);
 }
 start() {
  if (!this.enabled) this.enabled = !0, Toast.show(t("virtual-controller"), t("enabled"), { instant: !0 });
  this.isPolling = !0, this.escKeyDownTime = -1, window.BX_EXPOSED.toggleLocalCoOp(getStreamPref("localCoOp.enabled")), this.resetXcloudGamepads(), window.navigator.getGamepads = this.patchedGetGamepads, this.waitForMouseData(!1), this.mouseDataProvider?.start();
  let virtualGamepad = this.getVirtualGamepad();
  virtualGamepad.connected = !0, virtualGamepad.timestamp = performance.now(), BxEvent.dispatch(window, "gamepadconnected", {
   gamepad: virtualGamepad
  }), window.BX_EXPOSED.stopTakRendering = !0, Toast.show(t("virtual-controller"), t("enabled"), { instant: !0 });
 }
 stop() {
  this.enabled = !1, this.isPolling = !1, this.escKeyDownTime = -1;
  let virtualGamepad = this.getVirtualGamepad();
  if (virtualGamepad.connected) this.resetXcloudGamepads(), virtualGamepad.connected = !1, virtualGamepad.timestamp = performance.now(), BxEvent.dispatch(window, "gamepaddisconnected", {
    gamepad: virtualGamepad
   }), window.navigator.getGamepads = this.nativeGetGamepads;
  this.waitForMouseData(!0), this.mouseDataProvider?.stop();
 }
 static setupEvents() {
  if (BxEventBus.Stream.on("state.playing", () => {
   if (STATES.currentStream.titleInfo?.details.hasMkbSupport) NativeMkbHandler.getInstance()?.init();
   else EmulatedMkbHandler.getInstance()?.init();
  }), EmulatedMkbHandler.isAllowed())
   BxEventBus.Stream.on("mkb.setting.updated", () => {
    EmulatedMkbHandler.getInstance()?.refreshPresetData();
   });
 }
}
class StreamSettings {
 static settings = {
  settings: {},
  xCloudPollingMode: "all",
  deviceVibrationIntensity: 0,
  controllerPollingRate: 4,
  controllers: {},
  mkbPreset: null,
  keyboardShortcuts: {}
 };
 static async refreshControllerSettings() {
  let settings = StreamSettings.settings, controllers = {}, shortcutsTable = ControllerShortcutsTable.getInstance(), mappingTable = ControllerCustomizationsTable.getInstance(), gamepads = window.navigator.getGamepads();
  for (let gamepad of gamepads) {
   if (!gamepad?.connected) continue;
   if (gamepad.id === VIRTUAL_GAMEPAD_ID) continue;
   let controllerSetting = STORAGE.Stream.getControllerSetting(gamepad.id), shortcutsPreset = await shortcutsTable.getPreset(controllerSetting.shortcutPresetId), shortcutsMapping = !shortcutsPreset ? null : shortcutsPreset.data.mapping, customizationPreset = await mappingTable.getPreset(controllerSetting.customizationPresetId), customizationData = StreamSettings.convertControllerCustomization(customizationPreset?.data);
   controllers[gamepad.id] = {
    shortcuts: shortcutsMapping,
    customization: customizationData
   };
  }
  settings.controllers = controllers, settings.controllerPollingRate = getStreamPref("controller.pollingRate"), await StreamSettings.refreshDeviceVibration();
 }
 static preCalculateControllerRange(obj, target, values) {
  if (values && Array.isArray(values)) {
   let [from, to] = values;
   if (from > 1 || to < 100) obj[target] = [from / 100, to / 100];
  }
 }
 static convertControllerCustomization(customization) {
  if (!customization) return null;
  let converted = {
   mapping: {},
   ranges: {},
   vibrationIntensity: 1
  }, gamepadKey;
  for (gamepadKey in customization.mapping) {
   let gamepadStr = toXcloudGamepadKey(gamepadKey);
   if (!gamepadStr) continue;
   let mappedKey = customization.mapping[gamepadKey];
   if (typeof mappedKey === "number") converted.mapping[gamepadStr] = toXcloudGamepadKey(mappedKey);
   else converted.mapping[gamepadStr] = !1;
  }
  return StreamSettings.preCalculateControllerRange(converted.ranges, "LeftTrigger", customization.settings.leftTriggerRange), StreamSettings.preCalculateControllerRange(converted.ranges, "RightTrigger", customization.settings.rightTriggerRange), StreamSettings.preCalculateControllerRange(converted.ranges, "LeftThumb", customization.settings.leftStickDeadzone), StreamSettings.preCalculateControllerRange(converted.ranges, "RightThumb", customization.settings.rightStickDeadzone), converted.vibrationIntensity = customization.settings.vibrationIntensity / 100, converted;
 }
 static async refreshDeviceVibration() {
  if (!STATES.browser.capabilities.deviceVibration) return;
  let mode = getStreamPref("deviceVibration.mode"), intensity = 0;
  if (mode === "on" || mode === "auto" && !hasGamepad()) intensity = getStreamPref("deviceVibration.intensity") / 100;
  StreamSettings.settings.deviceVibrationIntensity = intensity, BxEventBus.Stream.emit("deviceVibration.updated", {});
 }
 static async refreshMkbSettings() {
  let settings = StreamSettings.settings, presetId = getStreamPref("mkb.p1.preset.mappingId"), orgPresetData = (await MkbMappingPresetsTable.getInstance().getPreset(presetId)).data, converted = {
   mapping: {},
   mouse: Object.assign({}, orgPresetData.mouse)
  }, key;
  for (key in orgPresetData.mapping) {
   let buttonIndex = parseInt(key);
   if (!orgPresetData.mapping[buttonIndex]) continue;
   for (let keyName of orgPresetData.mapping[buttonIndex])
    if (typeof keyName === "string") converted.mapping[keyName] = buttonIndex;
  }
  let mouse = converted.mouse;
  mouse["sensitivityX"] *= 0.001, mouse["sensitivityY"] *= 0.001, mouse["deadzoneCounterweight"] *= 0.01, settings.mkbPreset = converted, BxEventBus.Stream.emit("mkb.setting.updated", {});
 }
 static async refreshKeyboardShortcuts() {
  let settings = StreamSettings.settings, presetId = getStreamPref("keyboardShortcuts.preset.inGameId");
  if (presetId === 0) {
   settings.keyboardShortcuts = null, BxEventBus.Stream.emit("keyboardShortcuts.updated", {});
   return;
  }
  let orgPresetData = (await KeyboardShortcutsTable.getInstance().getPreset(presetId)).data.mapping, converted = {}, action;
  for (action in orgPresetData) {
   let info = orgPresetData[action], key = `${info.code}:${info.modifiers || 0}`;
   converted[key] = action;
  }
  settings.keyboardShortcuts = converted, BxEventBus.Stream.emit("keyboardShortcuts.updated", {});
 }
 static async refreshAllSettings() {
  window.BX_STREAM_SETTINGS = StreamSettings.settings, await StreamSettings.refreshControllerSettings(), await StreamSettings.refreshMkbSettings(), await StreamSettings.refreshKeyboardShortcuts();
 }
 static findKeyboardShortcut(targetAction) {
  let shortcuts = StreamSettings.settings.keyboardShortcuts;
  for (let codeStr in shortcuts)
   if (shortcuts[codeStr] === targetAction) return KeyHelper.parseFullKeyCode(codeStr);
  return null;
 }
 static setup() {
  let listener = () => {
   StreamSettings.refreshControllerSettings();
  };
  window.addEventListener("gamepadconnected", listener), window.addEventListener("gamepaddisconnected", listener), StreamSettings.refreshAllSettings();
 }
}
class BxNumberStepper extends HTMLInputElement {
 intervalId = null;
 isHolding;
 controlValue;
 controlMin;
 controlMax;
 uiMin;
 uiMax;
 steps;
 options;
 onChange;
 $text;
 $btnInc;
 $btnDec;
 $range;
 onRangeInput;
 onClick;
 onPointerUp;
 onPointerDown;
 setValue;
 normalizeValue;
 static create(key, value, min, max, options = {}, onChange) {
  options = options || {}, options.suffix = options.suffix || "", options.disabled = !!options.disabled, options.hideSlider = !!options.hideSlider;
  let $text, $btnInc, $btnDec, $range, self = CE("div", {
   class: "bx-number-stepper",
   id: `bx_setting_${escapeCssSelector(key)}`
  }, CE("div", !1, $btnDec = CE("button", {
   _dataset: {
    type: "dec"
   },
   type: "button",
   class: options.hideSlider ? "bx-focusable" : "",
   tabindex: options.hideSlider ? 0 : -1
  }, "-"), $text = options.editable ? CE("input", { type: "number", min, max, step: options.steps || 1, class: "bx-number-stepper-input", tabindex: 0 }) : CE("span"), $btnInc = CE("button", {
   _dataset: {
    type: "inc"
   },
   type: "button",
   class: options.hideSlider ? "bx-focusable" : "",
   tabindex: options.hideSlider ? 0 : -1
  }, "+")));
  if (self.$text = $text, self.$btnInc = $btnInc, self.$btnDec = $btnDec, self.onChange = onChange, self.onRangeInput = BxNumberStepper.onRangeInput.bind(self), self.onClick = BxNumberStepper.onClick.bind(self), self.onPointerUp = BxNumberStepper.onPointerUp.bind(self), self.onPointerDown = BxNumberStepper.onPointerDown.bind(self), self.controlMin = min, self.controlMax = max, self.isHolding = !1, self.options = options, self.uiMin = options.reverse ? -max : min, self.uiMax = options.reverse ? -min : max, self.steps = Math.max(options.steps || 1, 1), BxNumberStepper.setValue.call(self, value), options.disabled) return $btnInc.disabled = !0, $btnInc.classList.add("bx-inactive"), $btnDec.disabled = !0, $btnDec.classList.add("bx-inactive"), self.disabled = !0, self;
  if ($range = CE("input", {
   id: `bx_inp_setting_${key}`,
   type: "range",
   min: self.uiMin,
   max: self.uiMax,
   value: options.reverse ? -value : value,
   step: self.steps,
   tabindex: 0
  }), self.$range = $range, options.hideSlider && $range.classList.add("bx-gone"), self.addEventListener("input", self.onRangeInput), $text instanceof HTMLInputElement)
   $text.addEventListener("change", self.onRangeInput);
  if (self.appendChild($range), options.ticks || options.exactTicks) {
   let markersId = `markers-${key}`, $markers = CE("datalist", { id: markersId });
   if ($range.setAttribute("list", markersId), options.exactTicks) {
    let start = Math.max(Math.floor(min / options.exactTicks), 1) * options.exactTicks;
    if (start === min) start += options.exactTicks;
    for (let i = start;i < max; i += options.exactTicks)
     $markers.appendChild(CE("option", {
      value: options.reverse ? -i : i
     }));
   } else for (let i = self.uiMin + options.ticks;i < self.uiMax; i += options.ticks)
     $markers.appendChild(CE("option", { value: i }));
   self.appendChild($markers);
  }
  if (BxNumberStepper.updateButtonsVisibility.call(self), options.hideButtons) $btnDec.classList.add("bx-gone"), $btnInc.classList.add("bx-gone");
  return self.addEventListener("click", self.onClick), self.addEventListener("pointerdown", self.onPointerDown), self.addEventListener("contextmenu", BxNumberStepper.onContextMenu), setNearby(self, {
   focus: options.hideButtons ? $text : options.hideSlider ? $btnInc : $range
  }), Object.defineProperty(self, "value", {
   get() {
    return self.controlValue;
   },
   set(value) {
    BxNumberStepper.setValue.call(self, value);
   }
  }), Object.defineProperty(self, "disabled", {
   get() {
    return $range.disabled;
   },
   set(value) {
    $btnDec.disabled = value, $btnInc.disabled = value, $range.disabled = value;
   }
  }), self;
 }
 static setValue(value) {
  if (this.controlValue = BxNumberStepper.normalizeValue.call(this, value), this.$text instanceof HTMLInputElement) this.$text.value = this.controlValue.toString();
  else this.$text.textContent = BxNumberStepper.updateTextValue.call(this);
  if (this.$range) this.$range.value = (this.options.reverse ? -this.controlValue : this.controlValue).toString();
  BxNumberStepper.updateButtonsVisibility.call(this);
 }
 static normalizeValue(value) {
  if (value = parseInt(value), value = Math.max(this.controlMin, value), value = Math.min(this.controlMax, value), this.options.normalizeValue) value = this.options.normalizeValue(value, this.controlMin, this.controlMax), value = Math.max(this.controlMin, Math.min(this.controlMax, value));
  return value;
 }
 static onRangeInput(e) {
  let $input = e.target;
  if ($input.classList.contains("bx-number-stepper-input") && e.type === "input") return;
  let value = parseInt($input.value);
  if (isNaN(value)) return;
  if (this.options.reverse) value *= -1;
  if (BxNumberStepper.setValue.call(this, value), BxNumberStepper.updateButtonsVisibility.call(this), !e.ignoreOnChange && this.onChange) this.onChange(e, value);
 }
 static onClick(e) {
  let $btn = e.target.closest("button");
  if (!$btn) return;
  if (e.preventDefault(), this.isHolding) return;
  BxNumberStepper.buttonPressed.call(this, e, $btn), BxNumberStepper.clearIntervalId.call(this), this.isHolding = !1;
 }
 static onPointerDown(e) {
  BxNumberStepper.clearIntervalId.call(this);
  let $btn = e.target.closest("button");
  if (!$btn) return;
  this.isHolding = !0, e.preventDefault(), this.intervalId = window.setInterval((e) => {
   BxNumberStepper.buttonPressed.call(this, e, $btn);
  }, 200), window.addEventListener("pointerup", this.onPointerUp, { once: !0 }), window.addEventListener("pointercancel", this.onPointerUp, { once: !0 });
 }
 static onPointerUp(e) {
  BxNumberStepper.clearIntervalId.call(this), this.isHolding = !1;
 }
 static onContextMenu(e) {
  e.preventDefault();
 }
 static updateTextValue() {
  let value = this.controlValue, textContent = null;
  if (this.options.customTextValue) textContent = this.options.customTextValue(value, this.controlMin, this.controlMax);
  if (textContent === null) textContent = value.toString() + this.options.suffix;
  return textContent;
 }
 static buttonPressed(e, $btn) {
  BxNumberStepper.change.call(this, $btn.dataset.type);
 }
 static change(direction) {
  let value = this.controlValue;
  if (value = this.options.reverse ? -value : value, direction === "dec" && this.controlValue === this.controlMax && typeof this.options.valueBeforeMaximum === "number") value = this.options.reverse ? -this.options.valueBeforeMaximum : this.options.valueBeforeMaximum;
  else if (direction === "dec") value = Math.max(this.uiMin, value - this.steps);
  else value = Math.min(this.uiMax, value + this.steps);
  value = this.options.reverse ? -value : value, BxNumberStepper.setValue.call(this, value), BxNumberStepper.updateButtonsVisibility.call(this), this.onChange && this.onChange(null, this.controlValue);
 }
 static clearIntervalId() {
  this.intervalId && clearInterval(this.intervalId), this.intervalId = null;
 }
 static updateButtonsVisibility() {
  if (this.$btnDec.classList.toggle("bx-inactive", this.controlValue === this.uiMin), this.$btnInc.classList.toggle("bx-inactive", this.controlValue === this.uiMax), this.controlValue === this.uiMin || this.controlValue === this.uiMax) BxNumberStepper.clearIntervalId.call(this);
 }
}
class SettingElement {
 static renderOptions(key, setting, currentValue, onChange) {
  let $control = CE("select", {
   tabindex: 0
  }), $parent;
  if (setting.optionsGroup) $parent = CE("optgroup", {
    label: setting.optionsGroup
   }), $control.appendChild($parent);
  else $parent = $control;
  for (let value in setting.options) {
   let label = setting.options[value], $option = CE("option", { value }, label);
   $parent.appendChild($option);
  }
  return $control.value = currentValue, onChange && $control.addEventListener("input", (e) => {
   let target = e.target, value = setting.type && setting.type === "number" ? parseInt(target.value) : target.value;
   !e.ignoreOnChange && onChange(e, value);
  }), $control.setValue = (value) => {
   $control.value = value;
  }, $control;
 }
 static renderMultipleOptions(key, setting, currentValue, onChange, params = {}) {
  let $control = CE("select", {
   multiple: !0,
   tabindex: 0
  }), totalOptions = Object.keys(setting.multipleOptions).length, size = params.size ? Math.min(params.size, totalOptions) : totalOptions;
  $control.setAttribute("size", size.toString());
  for (let value in setting.multipleOptions) {
   let label = setting.multipleOptions[value], $option = CE("option", { value }, label);
   $option.selected = currentValue.indexOf(value) > -1, $option.addEventListener("mousedown", function(e) {
    e.preventDefault();
    let target = e.target;
    target.selected = !target.selected;
    let $parent = target.parentElement;
    $parent.focus(), BxEvent.dispatch($parent, "input");
   }), $control.appendChild($option);
  }
  return $control.addEventListener("mousedown", function(e) {
   let self = this, orgScrollTop = self.scrollTop;
   window.setTimeout(() => self.scrollTop = orgScrollTop, 0);
  }), $control.addEventListener("mousemove", (e) => e.preventDefault()), onChange && $control.addEventListener("input", (e) => {
   let target = e.target, values = Array.from(target.selectedOptions).map((i) => i.value);
   !e.ignoreOnChange && onChange(e, values);
  }), Object.defineProperty($control, "value", {
   get() {
    return Array.from($control.options).filter((option) => option.selected).map((option) => option.value);
   },
   set(value) {
    let values = value.split(",");
    Array.from($control.options).forEach((option) => {
     option.selected = values.includes(option.value);
    });
   }
  }), $control;
 }
 static renderCheckbox(key, setting, currentValue, onChange) {
  let $control = CE("input", { type: "checkbox", tabindex: 0 });
  return $control.checked = currentValue, onChange && $control.addEventListener("input", (e) => {
   !e.ignoreOnChange && onChange(e, e.target.checked);
  }), $control.setValue = (value) => {
   $control.checked = !!value;
  }, $control;
 }
 static renderNumberStepper(key, setting, value, onChange, options = {}) {
  return BxNumberStepper.create(key, value, setting.min, setting.max, options, onChange);
 }
 static METHOD_MAP = {
  options: SettingElement.renderOptions,
  "multiple-options": SettingElement.renderMultipleOptions,
  "number-stepper": SettingElement.renderNumberStepper,
  checkbox: SettingElement.renderCheckbox
 };
 static render(type, key, setting, currentValue, onChange, options) {
  let method = SettingElement.METHOD_MAP[type], $control = method(...Array.from(arguments).slice(1));
  if (type !== "number-stepper") $control.id = `bx_setting_${escapeCssSelector(key)}`;
  if (type === "options" || type === "multiple-options") $control.name = $control.id;
  return $control;
 }
 static fromPref(key, onChange, overrideParams = {}) {
  let { definition, storage } = getPrefInfo(key);
  if (!definition) return null;
  let currentValue = storage.getSetting(key), type;
  if ("options" in definition) type = "options";
  else if ("multipleOptions" in definition) type = "multiple-options";
  else if (typeof definition.default === "number") type = "number-stepper";
  else type = "checkbox";
  let params = {};
  if ("params" in definition) params = Object.assign(overrideParams, definition.params || {});
  if (params.disabled) currentValue = definition.default;
  return SettingElement.render(type, key, definition, currentValue, (e, value) => {
   if (isGlobalPref(key)) setGlobalPref(key, value, "ui");
   else {
    let id = SettingsManager.getInstance().getTargetGameId();
    setGamePref(id, key, value, "ui");
   }
   onChange && onChange(e, value);
  }, params);
 }
}
class BxSelectElement extends HTMLSelectElement {
 isControllerFriendly;
 optionsList;
 indicatorsList;
 $indicators;
 visibleIndex;
 isMultiple;
 $select;
 $btnNext;
 $btnPrev;
 $label;
 $checkBox;
 $multipleDropdown = null;
 closeMultipleDropdown;
 $flagDropdown = null;
 closeFlagDropdown;
 static create($select, forceFriendly = !1, preserveNativeMultiple = !1) {
  let isControllerFriendly = !($select.multiple && preserveNativeMultiple) && (forceFriendly || getGlobalPref("ui.controllerFriendly"));
  if ($select.multiple && !isControllerFriendly) return $select.classList.add("bx-select"), $select;
  $select.removeAttribute("tabindex");
  let $wrapper = CE("div", {
   class: "bx-select",
   _dataset: {
    controllerFriendly: isControllerFriendly
   }
  });
  if ($select.classList.contains("bx-full-width")) $wrapper.classList.add("bx-full-width");
  let $content, self = $wrapper;
  self.isControllerFriendly = isControllerFriendly, self.isMultiple = $select.multiple, self.visibleIndex = $select.selectedIndex;
  let originalSetValue = $select.setValue;
  self.$select = $select, self.optionsList = Array.from($select.querySelectorAll("option")), self.$indicators = CE("div", { class: "bx-select-indicators" }), self.indicatorsList = [];
  let hasFlagOptions = !isAndroidAppBuild && ($select.dataset.serverRegion === "true" || self.optionsList.some(($option) => !!BxSelectElement.getFlagCode($option)));
  if (hasFlagOptions) {
   for (let [property, value] of [
    ["display", "none"],
    ["position", "absolute"],
    ["top", "-9999px"],
    ["left", "-9999px"],
    ["visibility", "hidden"],
    ["pointer-events", "none"]
   ])
    $select.style.setProperty(property, value, "important");
   $select.addEventListener("pointerdown", (e) => {
    e.preventDefault(), e.stopImmediatePropagation(), BxSelectElement.toggleFlagDropdown.call(self, self);
   }, !0), $select.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") e.preventDefault(), BxSelectElement.toggleFlagDropdown.call(self, self);
   });
  }
  let $btnPrev, $btnNext;
  if (isControllerFriendly) {
   $btnPrev = createButton({
    label: "<",
    style: 64
   }), $btnNext = createButton({
    label: ">",
    style: 64
   }), setNearby($wrapper, {
    orientation: "horizontal",
    focus: $btnNext
   }), self.$btnNext = $btnNext, self.$btnPrev = $btnPrev;
   let boundOnPrevNext = BxSelectElement.onPrevNext.bind(self);
   $btnPrev.addEventListener("click", boundOnPrevNext), $btnNext.addEventListener("click", boundOnPrevNext);
  } else $select.addEventListener("change", (e) => {
    self.visibleIndex = $select.selectedIndex, BxSelectElement.resetIndicators.call(self), BxSelectElement.render.call(self);
   });
  if (self.isMultiple) $content = CE("button", {
    class: "bx-select-value bx-focusable",
    tabindex: 0
   }, CE("div", !1, self.$checkBox = CE("input", { type: "checkbox" }), self.$label = CE("span", !1, "")), self.$indicators), $content.addEventListener("click", (e) => {
    let isPointerClick = e.detail > 0, isKeyboard = document.documentElement.dataset.activeInput === "keyboard";
    if (isPointerClick || isKeyboard) {
     e.preventDefault(), BxSelectElement.toggleMultipleDropdown.call(self, $content);
     return;
    }
    self.$checkBox.click();
   }), self.$checkBox.addEventListener("input", (e) => {
    let $option = BxSelectElement.getOptionAtIndex.call(self, self.visibleIndex);
    $option && ($option.selected = e.target.checked), BxEvent.dispatch($select, "input");
   });
  else if ($content = CE("div", !1, self.$label = CE("label", { for: $select.id + "_checkbox" }, ""), self.$indicators), hasFlagOptions) $content.tabIndex = 0, $content.setAttribute("role", "button"), $content.addEventListener("pointerdown", (e) => {
    e.preventDefault(), BxSelectElement.toggleFlagDropdown.call(self, $content);
   }), $content.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") e.preventDefault(), BxSelectElement.toggleFlagDropdown.call(self, $content);
   });
  if ($select.addEventListener("input", BxSelectElement.render.bind(self)), new MutationObserver((mutationList, observer) => {
   mutationList.forEach((mutation) => {
    if (mutation.type === "childList" || mutation.type === "attributes") self.visibleIndex = $select.selectedIndex, self.optionsList = Array.from($select.querySelectorAll("option")), BxSelectElement.resetIndicators.call(self), BxSelectElement.render.call(self);
   });
  }).observe($select, {
   subtree: !0,
   childList: !0,
   attributes: !0
  }), self.append($select, $btnPrev || "", $content, $btnNext || ""), hasFlagOptions)
   $select.remove();
  return BxSelectElement.resetIndicators.call(self), BxSelectElement.render.call(self), $select.setValue = (value) => {
   if (originalSetValue) originalSetValue(value);
   else $select.value = value;
   self.visibleIndex = $select.selectedIndex, BxSelectElement.resetIndicators.call(self), BxSelectElement.render.call(self, { manualTrigger: !0 });
  }, Object.defineProperty(self, "value", {
   get() {
    return $select.value;
   },
   set(value) {
    self.optionsList = Array.from($select.querySelectorAll("option")), $select.value = value, self.visibleIndex = $select.selectedIndex, BxSelectElement.resetIndicators.call(self), BxSelectElement.render.call(self);
   }
  }), Object.defineProperty(self, "disabled", {
   get() {
    return $select.disabled;
   },
   set(value) {
    $select.disabled = value;
   }
  }), self.addEventListener = function() {
   $select.addEventListener.apply($select, arguments);
  }, self.removeEventListener = function() {
   $select.removeEventListener.apply($select, arguments);
  }, self.dispatchEvent = function() {
   return $select.dispatchEvent.apply($select, arguments);
  }, self.appendChild = function(node) {
   return $select.appendChild(node), node;
  }, self;
 }
 static toggleMultipleDropdown($anchor) {
  if (this.$multipleDropdown) {
   this.closeMultipleDropdown();
   return;
  }
  let $dropdown = CE("div", { class: "bx-select-multiple-dropdown" }), renderOptions = () => {
   $dropdown.replaceChildren(...this.optionsList.map(($option, index) => {
    let $item = CE("button", {
     class: "bx-select-multiple-dropdown-option",
     type: "button",
     _dataset: { selected: $option.selected },
     disabled: $option.disabled
    }, CE("input", { type: "checkbox", checked: $option.selected, tabindex: -1 }), CE("span", !1, $option.dataset.label || $option.textContent || ""));
    return $item.addEventListener("click", (e) => {
     e.preventDefault(), e.stopPropagation(), $option.selected = !$option.selected, this.visibleIndex = index, BxEvent.dispatch(this.$select, "input"), BxSelectElement.resetIndicators.call(this), BxSelectElement.render.call(this), renderOptions();
    }), $item;
   }));
  }, bounds = $anchor.getBoundingClientRect();
  $dropdown.style.left = `${Math.max(8, bounds.left)}px`, $dropdown.style.top = `${Math.min(window.innerHeight - 8, bounds.bottom + 3)}px`, $dropdown.style.minWidth = `${Math.max(180, bounds.width)}px`, document.body.append($dropdown), this.$multipleDropdown = $dropdown;
  let closeOnOutside = (event) => {
   if (event.target instanceof Node && $dropdown.contains(event.target)) return;
   this.closeMultipleDropdown();
  };
  this.closeMultipleDropdown = () => {
   document.removeEventListener("pointerdown", closeOnOutside, !0), $dropdown.remove(), this.$multipleDropdown = null;
  }, renderOptions(), window.setTimeout(() => document.addEventListener("pointerdown", closeOnOutside, !0));
 }
 static toggleFlagDropdown($anchor) {
  if (this.$flagDropdown) {
   this.closeFlagDropdown();
   return;
  }
  let $dropdown = CE("div", { class: "bx-select-flag-dropdown" }), currentGroup = "";
  for (let [$index, $option] of this.optionsList.entries()) {
   let $parent = $option.parentElement, group = $parent instanceof HTMLOptGroupElement ? $parent.label : "";
   if (group && group !== currentGroup) currentGroup = group, $dropdown.appendChild(CE("div", { class: "bx-select-flag-dropdown-group" }, group));
   let flagCode = BxSelectElement.getFlagCode($option), $item = CE("button", {
    class: "bx-select-flag-dropdown-option",
    type: "button",
    _dataset: { selected: $option.selected },
    disabled: $option.disabled
   }, flagCode ? CE("img", {
    class: "bx-select-flag-image",
    src: `https://flagcdn.com/w40/${flagCode}.png`,
    alt: ""
   }) : "", CE("span", !1, $option.dataset.label || $option.textContent || "")), selected = !1, selectOption = (e) => {
    if (e.preventDefault(), e.stopPropagation(), selected) return;
    selected = !0, this.$select.selectedIndex = $index, this.$select.value = $option.value, this.visibleIndex = $index, this.$select.dispatchEvent(new Event("input", { bubbles: !0 })), this.$select.dispatchEvent(new Event("change", { bubbles: !0 })), BxSelectElement.resetIndicators.call(this), BxSelectElement.render.call(this), this.closeFlagDropdown();
   };
   $item.addEventListener("pointerdown", selectOption), $item.addEventListener("click", selectOption), $dropdown.appendChild($item);
  }
  let bounds = $anchor.getBoundingClientRect();
  $dropdown.style.minWidth = `${Math.max(220, bounds.width)}px`, $anchor.append($dropdown), this.$flagDropdown = $dropdown;
  let closeOnOutside = (event) => {
   if (event.target instanceof Node && $dropdown.contains(event.target)) return;
   this.closeFlagDropdown();
  };
  this.closeFlagDropdown = () => {
   document.removeEventListener("pointerdown", closeOnOutside, !0), $dropdown.remove(), this.$flagDropdown = null;
  }, window.setTimeout(() => document.addEventListener("pointerdown", closeOnOutside, !0));
 }
 static resetIndicators() {
  let {
   optionsList,
   indicatorsList,
   $indicators
  } = this, targetSize = optionsList.length;
  if (indicatorsList.length > targetSize) while (indicatorsList.length > targetSize)
    indicatorsList.pop()?.remove();
  else if (indicatorsList.length < targetSize) while (indicatorsList.length < targetSize) {
    let $indicator = CE("span", {});
    indicatorsList.push($indicator), $indicators.appendChild($indicator);
   }
  for (let $indicator of indicatorsList)
   clearDataSet($indicator);
  $indicators.classList.toggle("bx-invisible", targetSize <= 1);
 }
 static getFlagCode($option) {
  if ($option.dataset.flagCode) return $option.dataset.flagCode;
  let code = [...$option.dataset.flag || $option.textContent || ""].map((char) => char.codePointAt(0) - 127462).filter((value) => value >= 0 && value < 26).map((value) => String.fromCharCode(value + 65)).join("").toLowerCase();
  return code.length === 2 ? code : "";
 }
 static getOptionAtIndex(index) {
  return this.optionsList[index];
 }
 static render(e) {
  let {
   $label,
   $btnNext,
   $btnPrev,
   $checkBox,
   optionsList,
   indicatorsList
  } = this;
  if (!this.isMultiple || e && e.manualTrigger) this.visibleIndex = this.$select.selectedIndex;
  this.visibleIndex = BxSelectElement.normalizeIndex.call(this, this.visibleIndex);
  let $option = BxSelectElement.getOptionAtIndex.call(this, this.visibleIndex), content = "";
  if ($option) {
   let $parent = $option.parentElement, hasLabel = $parent instanceof HTMLOptGroupElement || this.$select.querySelector("optgroup");
   content = $option.dataset.label || $option.textContent || "";
   let flag = $option.dataset.flag, flagCode = BxSelectElement.getFlagCode($option);
   if (content && (hasLabel || flag || flagCode)) {
    let groupLabel = $parent instanceof HTMLOptGroupElement ? $parent.label : "";
    $label.innerHTML = "";
    let fragment = document.createDocumentFragment();
    if (hasLabel) fragment.appendChild(CE("span", !1, groupLabel));
    if (flagCode) fragment.appendChild(CE("img", {
      class: "bx-select-flag-image",
      src: `https://flagcdn.com/w40/${flagCode}.png`,
      alt: ""
     }));
    else if (flag) fragment.appendChild(CE("span", { class: "bx-select-flag" }, flag));
    fragment.appendChild(document.createTextNode(content)), $label.appendChild(fragment);
   } else $label.textContent = content;
  } else $label.textContent = content;
  if ($label.classList.toggle("bx-line-through", $option && $option.disabled), this.isMultiple) $checkBox.checked = $option?.selected || !1, $checkBox.classList.toggle("bx-gone", !content);
  let disableButtons = optionsList.length <= 1;
  $btnPrev?.classList.toggle("bx-gone", disableButtons), $btnNext?.classList.toggle("bx-gone", disableButtons);
  for (let i = 0;i < optionsList.length; i++) {
   let $option = optionsList[i], $indicator = indicatorsList[i];
   if (!$option || !$indicator) continue;
   if (clearDataSet($indicator), $option.selected) $indicator.dataset.selected = "true";
   if ($option.index === this.visibleIndex) $indicator.dataset.highlighted = "true";
  }
 }
 static normalizeIndex(index) {
  return Math.min(Math.max(index, 0), this.optionsList.length - 1);
 }
 static onPrevNext(e) {
  if (!e.target) return;
  let {
   $btnNext,
   $select,
   isMultiple,
   visibleIndex: currentIndex
  } = this, newIndex = e.target.closest("button") === $btnNext ? currentIndex + 1 : currentIndex - 1;
  if (newIndex > this.optionsList.length - 1) newIndex = 0;
  else if (newIndex < 0) newIndex = this.optionsList.length - 1;
  if (newIndex = BxSelectElement.normalizeIndex.call(this, newIndex), this.visibleIndex = newIndex, !isMultiple && newIndex !== currentIndex) $select.selectedIndex = newIndex;
  if (isMultiple) BxSelectElement.render.call(this);
  else BxEvent.dispatch($select, "input");
 }
}
class XboxApi {
 static CACHED_TITLES = {};
 static async getProductTitle(xboxTitleId) {
  if (xboxTitleId = xboxTitleId.toString(), XboxApi.CACHED_TITLES[xboxTitleId]) return XboxApi.CACHED_TITLES[xboxTitleId];
  let title;
  try {
   let url = `https://displaycatalog.mp.microsoft.com/v7.0/products/lookup?market=US&languages=en&value=${xboxTitleId}&alternateId=XboxTitleId&fieldsTemplate=browse`;
   title = (await (await NATIVE_FETCH(url)).json()).Products[0].LocalizedProperties[0].ProductTitle;
  } catch (e) {
   title = "Unknown Game #" + xboxTitleId;
  }
  return XboxApi.CACHED_TITLES[xboxTitleId] = title, title;
 }
}
function addCss() {
 let css = ':root{--bx-title-font:Bahnschrift,Arial,Helvetica,sans-serif;--bx-title-font-semibold:Bahnschrift Semibold,Arial,Helvetica,sans-serif;--bx-normal-font:"Segoe UI",Arial,Helvetica,sans-serif;--bx-monospaced-font:Consolas,"Courier New",Courier,monospace;--bx-promptfont-font:promptfont;--bx-button-height:40px;--bx-default-button-color:#2d3036;--bx-default-button-rgb:45,48,54;--bx-default-button-hover-color:#515863;--bx-default-button-hover-rgb:81,88,99;--bx-default-button-active-color:#222428;--bx-default-button-active-rgb:34,36,40;--bx-default-button-disabled-color:#8e8e8e;--bx-default-button-disabled-rgb:142,142,142;--bx-primary-button-color:#008746;--bx-primary-button-rgb:0,135,70;--bx-primary-button-hover-color:#04b358;--bx-primary-button-hover-rgb:4,179,88;--bx-primary-button-active-color:#044e2a;--bx-primary-button-active-rgb:4,78,42;--bx-primary-button-disabled-color:#448262;--bx-primary-button-disabled-rgb:68,130,98;--bx-warning-button-color:#c16e04;--bx-warning-button-rgb:193,110,4;--bx-warning-button-hover-color:#fa9005;--bx-warning-button-hover-rgb:250,144,5;--bx-warning-button-active-color:#965603;--bx-warning-button-active-rgb:150,86,3;--bx-warning-button-disabled-color:#a2816c;--bx-warning-button-disabled-rgb:162,129,108;--bx-danger-button-color:#c10404;--bx-danger-button-rgb:193,4,4;--bx-danger-button-hover-color:#e61d1d;--bx-danger-button-hover-rgb:230,29,29;--bx-danger-button-active-color:#a26c6c;--bx-danger-button-active-rgb:162,108,108;--bx-danger-button-disabled-color:#bd8282;--bx-danger-button-disabled-rgb:189,130,130;--bx-fullscreen-text-z-index:9999;--bx-toast-z-index:6000;--bx-key-binding-dialog-z-index:5010;--bx-key-binding-dialog-overlay-z-index:5000;--bx-stats-bar-z-index:4010;--bx-navigation-dialog-z-index:3010;--bx-navigation-dialog-overlay-z-index:3000;--bx-mkb-pointer-lock-msg-z-index:2000;--bx-game-bar-z-index:1000;--bx-screenshot-animation-z-index:200;--bx-wait-time-box-z-index:100}@font-face{font-family:\'promptfont\';src:url("https://redphx.github.io/better-xcloud/fonts/promptfont.otf");unicode-range:U+2196-E011,U+27F6,U+FF31}#StreamHud div[class^=HUDButton-module__hiddenContainer] ~ div:not([class^=HUDButton-module__hiddenContainer]){opacity:0;pointer-events:none !important;position:absolute;top:-9999px;left:-9999px}@media screen and (min-width:641px) and (max-width:767px){header button[class^="ExperienceDropdown-module__toggleButton"],header button[class^="XboxButton-module__headerXboxButton"]{margin-right:10px !important}header a[href="/play"] > div > div,header button[class^="ExperienceDropdown-module__toggleButton"] > div > div{font-size:12px}header a[href="/play"] > div > svg,header button[class^="ExperienceDropdown-module__toggleButton"] > div > svg{width:20px;height:20px}}@media screen and (max-width:640px){header a[href="/play"],header button[class^="ExperienceDropdown-module__toggleButton"]{display:none}}.bx-full-width{width:100% !important}.bx-full-height{height:100% !important}.bx-auto-height{height:auto !important}.bx-no-scroll{overflow:hidden !important}.bx-hide-scroll-bar{scrollbar-width:none}.bx-hide-scroll-bar::-webkit-scrollbar{display:none}.bx-gone{display:none !important}.bx-offscreen{position:absolute !important;top:-9999px !important;left:-9999px !important;visibility:hidden !important}.bx-hidden{visibility:hidden !important}.bx-invisible{opacity:0}.bx-unclickable{pointer-events:none}.bx-pixel{width:1px !important;height:1px !important}.bx-no-margin{margin:0 !important}.bx-no-padding{padding:0 !important}.bx-prompt{font-family:var(--bx-promptfont-font) !important}.bx-monospaced{font-family:var(--bx-monospaced-font) !important}.bx-line-through{text-decoration:line-through !important}.bx-normal-case{text-transform:none !important}.bx-normal-link{text-transform:none !important;text-align:left !important;font-weight:400 !important;font-family:var(--bx-normal-font) !important}.bx-frosted{backdrop-filter:blur(4px) brightness(1.5)}select[multiple],select[multiple]:focus{overflow:auto;border:none}select[multiple] option,select[multiple]:focus option{padding:4px 6px}select[multiple] option:checked,select[multiple]:focus option:checked{background:#1a7bc0 linear-gradient(0deg,#1a7bc0 0%,#1a7bc0 100%)}select[multiple] option:checked::before,select[multiple]:focus option:checked::before{content:\'☑️\';font-size:12px;display:inline-block;margin-right:6px;height:100%;line-height:100%;vertical-align:middle}#headerArea,#uhfSkipToMain,.uhf-footer{display:none}#game-stream div[class^=NotFocusedDialog]{position:absolute !important;top:-9999px !important;left:-9999px !important;width:0 !important;height:0 !important}#game-stream video:not([src]){visibility:hidden}.bx-game-tile-wait-time{display:none !important;position:absolute;top:0;left:0;z-index:1;background:rgba(0,0,0,0.5);display:flex;border-radius:4px 0 4px 0;align-items:center;padding:4px 8px}.bx-game-tile-wait-time svg{width:14px;height:16px;margin-right:2px}.bx-game-tile-wait-time span{display:inline-block;height:16px;line-height:16px;font-size:12px;font-weight:bold;margin-left:2px}.bx-game-tile-wait-time[data-duration=short]{background-color:rgba(0,133,133,0.75)}.bx-game-tile-wait-time[data-duration=medium]{background-color:rgba(213,133,0,0.75)}.bx-game-tile-wait-time[data-duration=long]{background-color:rgba(150,0,0,0.75)}html[data-bx-game-launching=true]::after{content:\'\';position:fixed;inset:0;z-index:2900;pointer-events:none;background:radial-gradient(circle at center,transparent 16%,rgba(0,0,0,0.78) 100%);animation:bx-hub-game-launch-overlay 220ms ease-out both}.bx-hub-game-launching{position:relative;z-index:2901;transform-origin:center;animation:bx-hub-game-launch-card 220ms cubic-bezier(.2,.8,.2,1) both}@media (prefers-reduced-motion:reduce){.bx-hub-game-launching{animation:none}}.bx-fullscreen-text{position:fixed;top:0;bottom:0;left:0;right:0;background:rgba(0,0,0,0.8);z-index:var(--bx-fullscreen-text-z-index);line-height:100vh;color:#fff;text-align:center;font-weight:400;font-family:var(--bx-normal-font);font-size:1.3rem;user-select:none;-webkit-user-select:none}#root section[class*=DeviceCodePage-module__page]{margin-left:20px !important;margin-right:20px !important;margin-top:20px !important;max-width:800px !important}#root div[class*=DeviceCodePage-module__back]{display:none}.bx-blink-me{animation:bx-blinker 1s linear infinite}.bx-horizontal-shaking{animation:bx-horizontal-shaking .4s ease-in-out 2}@-moz-keyframes bx-hub-game-launch-card{from{transform:scale(1);filter:brightness(1)}to{transform:scale(1.075);filter:brightness(1.18)}}@-webkit-keyframes bx-hub-game-launch-card{from{transform:scale(1);filter:brightness(1)}to{transform:scale(1.075);filter:brightness(1.18)}}@-o-keyframes bx-hub-game-launch-card{from{transform:scale(1);filter:brightness(1)}to{transform:scale(1.075);filter:brightness(1.18)}}@keyframes bx-hub-game-launch-card{from{transform:scale(1);filter:brightness(1)}to{transform:scale(1.075);filter:brightness(1.18)}}@-moz-keyframes bx-hub-game-launch-overlay{from{opacity:0}to{opacity:1}}@-webkit-keyframes bx-hub-game-launch-overlay{from{opacity:0}to{opacity:1}}@-o-keyframes bx-hub-game-launch-overlay{from{opacity:0}to{opacity:1}}@keyframes bx-hub-game-launch-overlay{from{opacity:0}to{opacity:1}}@-moz-keyframes bx-blinker{100%{opacity:0}}@-webkit-keyframes bx-blinker{100%{opacity:0}}@-o-keyframes bx-blinker{100%{opacity:0}}@keyframes bx-blinker{100%{opacity:0}}@-moz-keyframes bx-horizontal-shaking{0%{transform:translateX(0)}25%{transform:translateX(5px)}50%{transform:translateX(-5px)}75%{transform:translateX(5px)}100%{transform:translateX(0)}}@-webkit-keyframes bx-horizontal-shaking{0%{transform:translateX(0)}25%{transform:translateX(5px)}50%{transform:translateX(-5px)}75%{transform:translateX(5px)}100%{transform:translateX(0)}}@-o-keyframes bx-horizontal-shaking{0%{transform:translateX(0)}25%{transform:translateX(5px)}50%{transform:translateX(-5px)}75%{transform:translateX(5px)}100%{transform:translateX(0)}}@keyframes bx-horizontal-shaking{0%{transform:translateX(0)}25%{transform:translateX(5px)}50%{transform:translateX(-5px)}75%{transform:translateX(5px)}100%{transform:translateX(0)}}.bx-button{--button-rgb:var(--bx-default-button-rgb);--button-hover-rgb:var(--bx-default-button-hover-rgb);--button-active-rgb:var(--bx-default-button-active-rgb);--button-disabled-rgb:var(--bx-default-button-disabled-rgb);background-color:rgb(var(--button-rgb));user-select:none;-webkit-user-select:none;color:#fff;font-family:var(--bx-title-font-semibold);font-size:14px;border:none;font-weight:400;height:var(--bx-button-height);border-radius:4px;padding:0 8px;text-transform:uppercase;cursor:pointer;overflow:hidden}.bx-button:not([disabled]):active{background-color:rgb(var(--button-active-rgb))}.bx-button:focus{outline:none !important}.bx-button:not([disabled]):not(:active):hover,.bx-button:not([disabled]):not(:active).bx-focusable:focus{background-color:rgb(var(--button-hover-rgb))}.bx-button:disabled{cursor:default;background-color:rgb(var(--button-disabled-rgb));opacity:.5}.bx-button.bx-ghost{background-color:transparent}.bx-button.bx-ghost:not([disabled]):not(:active):hover,.bx-button.bx-ghost:not([disabled]):not(:active).bx-focusable:focus{background-color:rgb(var(--button-hover-rgb))}.bx-button.bx-primary{--button-rgb:var(--bx-primary-button-rgb)}.bx-button.bx-primary:not([disabled]):active{--button-active-rgb:var(--bx-primary-button-active-rgb)}.bx-button.bx-primary:not([disabled]):not(:active):hover,.bx-button.bx-primary:not([disabled]):not(:active).bx-focusable:focus{--button-hover-rgb:var(--bx-primary-button-hover-rgb)}.bx-button.bx-primary:disabled{--button-disabled-rgb:var(--bx-primary-button-disabled-rgb)}.bx-button.bx-warning{--button-rgb:var(--bx-warning-button-rgb)}.bx-button.bx-warning:not([disabled]):active{--button-active-rgb:var(--bx-warning-button-active-rgb)}.bx-button.bx-warning:not([disabled]):not(:active):hover,.bx-button.bx-warning:not([disabled]):not(:active).bx-focusable:focus{--button-hover-rgb:var(--bx-warning-button-hover-rgb)}.bx-button.bx-warning:disabled{--button-disabled-rgb:var(--bx-warning-button-disabled-rgb)}.bx-button.bx-danger{--button-rgb:var(--bx-danger-button-rgb)}.bx-button.bx-danger:not([disabled]):active{--button-active-rgb:var(--bx-danger-button-active-rgb)}.bx-button.bx-danger:not([disabled]):not(:active):hover,.bx-button.bx-danger:not([disabled]):not(:active).bx-focusable:focus{--button-hover-rgb:var(--bx-danger-button-hover-rgb)}.bx-button.bx-danger:disabled{--button-disabled-rgb:var(--bx-danger-button-disabled-rgb)}.bx-button.bx-frosted{--button-alpha:.2;background-color:rgba(var(--button-rgb), var(--button-alpha))}.bx-button.bx-frosted:not([disabled]):not(:active):hover,.bx-button.bx-frosted:not([disabled]):not(:active).bx-focusable:focus{background-color:rgba(var(--button-hover-rgb), var(--button-alpha))}.bx-button.bx-drop-shadow{box-shadow:0 0 4px rgba(0,0,0,0.502)}.bx-button.bx-tall{height:calc(var(--bx-button-height) * 1.5) !important}.bx-button.bx-circular{border-radius:var(--bx-button-height);width:var(--bx-button-height);height:var(--bx-button-height)}.bx-button svg{display:inline-block;width:16px;height:var(--bx-button-height)}.bx-button span{display:inline-block;line-height:var(--bx-button-height);vertical-align:middle;color:#fff;overflow:hidden;white-space:nowrap}.bx-button span:not(:only-child){margin-inline-start:8px}.bx-button.bx-button-multi-lines{height:auto;text-align:left;padding:10px}.bx-button.bx-button-multi-lines span{line-height:unset;display:block}.bx-button.bx-button-multi-lines span:last-of-type{text-transform:none;font-weight:normal;font-family:"Segoe Sans Variable Text";font-size:12px;margin-top:4px}.bx-focusable{position:relative;overflow:visible}.bx-focusable::after{border:2px solid transparent;border-radius:10px}.bx-focusable:focus::after{content:\'\';border-color:#62e878;box-shadow:0 0 12px rgba(40,184,74,0.6);position:absolute;top:-6px;left:-6px;right:-6px;bottom:-6px}html[data-active-input=touch] .bx-focusable:focus::after,html[data-active-input=mouse] .bx-focusable:focus::after{border-color:transparent !important}.bx-focusable.bx-circular::after{border-radius:var(--bx-button-height)}a.bx-button{display:inline-block}a.bx-button.bx-full-width{text-align:center}button.bx-inactive{pointer-events:none;opacity:.2;background:transparent !important}.bx-header-remote-play-button{height:auto;margin-right:8px !important}.bx-header-remote-play-button svg{width:24px;height:24px}.bx-header-settings-button{line-height:30px;font-size:14px;text-transform:uppercase;position:relative}.bx-header-settings-button[data-update-available]::before{content:\'🌟\' !important;line-height:var(--bx-button-height);display:inline-block;margin-left:4px}.bx-key-binding-dialog-overlay{position:fixed;inset:0;z-index:var(--bx-key-binding-dialog-overlay-z-index);background:#000;opacity:50%}.bx-key-binding-dialog{display:flex;flex-flow:column;max-height:90vh;position:fixed;top:50%;left:50%;margin-right:-50%;transform:translate(-50%,-50%);min-width:420px;padding:16px;border-radius:8px;z-index:var(--bx-key-binding-dialog-z-index);background:#1a1b1e;color:#fff;font-weight:400;font-size:16px;font-family:var(--bx-normal-font);box-shadow:0 0 6px #000;user-select:none;-webkit-user-select:none}.bx-key-binding-dialog *:focus{outline:none !important}.bx-key-binding-dialog h2{margin-bottom:12px;color:#fff;display:block;font-family:var(--bx-title-font);font-size:32px;font-weight:400;line-height:var(--bx-button-height)}.bx-key-binding-dialog > div{overflow:auto;padding:2px 0}.bx-key-binding-dialog > button{padding:8px 32px;margin:10px auto 0;border:none;border-radius:4px;display:block;background-color:#2d3036;text-align:center;color:#fff;text-transform:uppercase;font-family:var(--bx-title-font);font-weight:400;line-height:18px;font-size:14px}@media (hover:hover){.bx-key-binding-dialog > button:hover{background-color:#515863}}.bx-key-binding-dialog > button:focus{background-color:#515863}.bx-key-binding-dialog ul{margin-bottom:1rem}.bx-key-binding-dialog ul li{display:none}.bx-key-binding-dialog ul[data-flags*="[1]"] > li[data-flag="1"],.bx-key-binding-dialog ul[data-flags*="[2]"] > li[data-flag="2"],.bx-key-binding-dialog ul[data-flags*="[4]"] > li[data-flag="4"],.bx-key-binding-dialog ul[data-flags*="[8]"] > li[data-flag="8"]{display:list-item}@media screen and (max-width:450px){.bx-key-binding-dialog{min-width:100%}}.bx-navigation-dialog{position:absolute;z-index:var(--bx-navigation-dialog-z-index);font-family:var(--bx-title-font)}.bx-navigation-dialog *:focus{outline:none !important}.bx-navigation-dialog select:disabled{-webkit-appearance:none;text-align-last:right;text-align:right;color:#fff;background:#131416;border:none;border-radius:4px;padding:0 5px}.bx-navigation-dialog .bx-focusable::after{border-radius:4px}.bx-navigation-dialog .bx-focusable:focus::after{top:0;left:0;right:0;bottom:0}.bx-navigation-dialog-overlay{position:fixed;background:rgba(11,11,11,0.68);top:0;left:0;right:0;bottom:0;z-index:var(--bx-navigation-dialog-overlay-z-index)}.bx-navigation-dialog-overlay[data-is-playing="true"]{background:transparent}.bx-centered-dialog{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;background:#1a1b1e;border-radius:10px;min-width:min(calc(100vw - 20px), 500px);max-width:calc(100vw - 20px);margin:0 0 0 auto;padding:16px;max-height:95vh;flex-direction:column;overflow:hidden;display:flex;flex-direction:column}.bx-centered-dialog .bx-dialog-title{display:flex;flex-direction:row;align-items:center;margin-bottom:10px}.bx-centered-dialog .bx-dialog-title p{padding:0;margin:0;flex:1;font-size:1.5rem;font-weight:bold}.bx-centered-dialog .bx-dialog-title button{flex-shrink:0}.bx-centered-dialog .bx-dialog-content{flex:1;padding:6px;overflow:auto;overflow-x:hidden}.bx-centered-dialog .bx-dialog-preset-tools{display:flex;margin-bottom:12px;gap:6px}.bx-centered-dialog .bx-dialog-preset-tools button{align-self:center;min-height:50px}.bx-centered-dialog .bx-default-preset-note{font-size:12px;font-style:italic;text-align:center;margin-bottom:10px}.bx-centered-dialog input,.bx-settings-dialog input{accent-color:var(--bx-primary-button-color)}.bx-centered-dialog input:focus,.bx-settings-dialog input:focus{accent-color:var(--bx-danger-button-color)}.bx-centered-dialog select:disabled,.bx-settings-dialog select:disabled{-webkit-appearance:none;background:transparent;text-align-last:right;border:none;color:#fff}.bx-centered-dialog select option:disabled,.bx-settings-dialog select option:disabled{display:none}.bx-centered-dialog input[type=checkbox]:focus,.bx-settings-dialog input[type=checkbox]:focus,.bx-centered-dialog select:focus,.bx-settings-dialog select:focus{filter:drop-shadow(1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow(0 1px 0 #fff) drop-shadow(0 -1px 0 #fff)}.bx-centered-dialog a,.bx-settings-dialog a{color:#1c9d1c;text-decoration:none}.bx-centered-dialog a:hover,.bx-settings-dialog a:hover,.bx-centered-dialog a:focus,.bx-settings-dialog a:focus{color:#5dc21e}.bx-centered-dialog label,.bx-settings-dialog label{margin:0}.bx-controller-shortcuts-manager-container .bx-shortcut-note{margin-top:10px;font-size:14px;text-align:center}.bx-controller-shortcuts-manager-container .bx-shortcut-row{display:flex;gap:10px;margin-bottom:10px;align-items:center}.bx-controller-shortcuts-manager-container .bx-shortcut-row label.bx-prompt{flex-shrink:0;font-size:32px;margin:0}.bx-controller-shortcuts-manager-container .bx-shortcut-row label.bx-prompt::first-letter{letter-spacing:6px}.bx-controller-shortcuts-manager-container select:disabled{text-align:left;text-align-last:left}.bx-keyboard-shortcuts-manager-container{display:flex;flex-direction:column;gap:16px}.bx-keyboard-shortcuts-manager-container fieldset{background:#2a2a2a;border:1px solid #2a2a2a;border-radius:4px;padding:4px}.bx-keyboard-shortcuts-manager-container legend{width:auto;padding:4px 8px;margin:0 4px 4px;background:#004f87;box-shadow:0 2px 0 #071e3d;border-radius:4px;font-size:14px;font-weight:bold;text-transform:uppercase}.bx-keyboard-shortcuts-manager-container .bx-settings-row{background:none;padding:10px}.bx-settings-dialog{display:flex;position:fixed;top:0;right:0;bottom:0;transform-origin:right center;animation:bx-settings-menu-open 220ms cubic-bezier(.18,.8,.22,1) both;opacity:.98;user-select:none;-webkit-user-select:none}.bx-settings-dialog .bx-settings-reload-note{font-size:.8rem;display:block;padding:8px;font-style:italic;font-weight:normal;height:var(--bx-button-height)}.bx-settings-dialog.bx-settings-menu-closing{pointer-events:none;animation:bx-settings-menu-close 220ms cubic-bezier(.55,.05,.78,.2) both}@media (prefers-reduced-motion:reduce){.bx-settings-dialog{animation-duration:1ms}}.bx-vx-labs p{font-size:.85rem}.bx-vx-labs .bx-vx-status{white-space:pre-wrap;user-select:text;-webkit-user-select:text;line-height:1.5}.bx-vx-labs .bx-vx-actions{display:flex;gap:8px;margin-top:8px}.bx-vx-overlay{position:fixed;right:16px;bottom:16px;z-index:10001;font-size:12px}.bx-vx-overlay .bx-vx-controls{display:flex;justify-content:flex-end;gap:6px}.bx-vx-overlay .bx-vx-button{min-height:30px;padding:4px 8px;font-size:11px}.bx-vx-overlay .bx-vx-performance{margin:7px 0 0;padding:9px;border-radius:4px;background:rgba(0,0,0,0.8);color:#fff;line-height:1.45;white-space:pre-wrap}.bx-settings-tabs-container{position:fixed;width:156px;max-height:100vh;display:flex;flex-direction:column}.bx-settings-tabs-container > div:last-of-type{display:flex;flex-direction:column;align-items:end}.bx-settings-tabs-container > div:last-of-type button{flex-shrink:0;border-top-right-radius:0;border-bottom-right-radius:0;margin-top:8px;height:unset;padding:8px 10px}.bx-settings-tabs-container > div:last-of-type button svg{width:16px;height:16px}.bx-settings-tabs{display:flex;flex-direction:column;border-radius:0 0 0 8px;box-shadow:0 0 6px #000;overflow:overlay;flex:1}.bx-settings-tabs .bx-settings-tab{display:flex;width:100%;min-height:44px;padding:8px 12px 8px 8px;border:0;color:#d7d7d7;font-family:var(--bx-normal-font);font-size:13px;font-weight:600;line-height:1;text-align:left;align-items:center;gap:10px;flex-shrink:0;background:#131313;cursor:pointer;border-left:4px solid #1e1e1e}.bx-settings-tabs .bx-settings-tab svg{width:22px;height:22px;flex:0 0 22px}.bx-settings-tabs .bx-settings-tab .bx-settings-tab-ai-icon{display:inline-grid;width:22px;height:22px;flex:0 0 22px;place-items:center;border:1px solid currentColor;border-radius:5px;font-size:10px;font-weight:800;letter-spacing:-.5px}.bx-settings-tabs .bx-settings-tab.bx-active{background:#222;border-color:#008746;color:#fff}.bx-settings-tabs .bx-settings-tab:not(.bx-active):hover{background:#2f2f2f;border-color:#484848}.bx-settings-tabs .bx-settings-tab:focus{border-color:#62e878;box-shadow:inset 3px 0 0 #62e878,0 0 10px rgba(40,184,74,0.4)}.bx-settings-tabs .bx-settings-tab[data-group=global][data-need-refresh=true]{background:var(--bx-danger-button-color) !important}.bx-settings-tabs .bx-settings-tab[data-group=global][data-need-refresh=true]:hover{background:var(--bx-danger-button-hover-color) !important}.bx-settings-tab-contents{flex-direction:column;margin-left:156px;width:450px;background:#1a1b1e;color:#fff;font-weight:400;font-size:16px;font-family:var(--bx-title-font);text-align:center;box-shadow:0 0 6px #000;overflow:overlay;z-index:1}.bx-settings-tab-contents .bx-top-buttons{display:flex;flex-direction:column;gap:8px;margin-bottom:8px}.bx-settings-tab-contents .bx-top-buttons .bx-button{display:block}.bx-settings-tab-contents h2{margin:16px 0 8px 0;display:flex;align-items:center}.bx-settings-tab-contents h2:first-of-type{margin-top:0}.bx-settings-tab-contents h2 span{display:inline-block;font-size:20px;font-weight:bold;text-align:left;flex:1;text-overflow:ellipsis;overflow:hidden;white-space:nowrap;min-height:var(--bx-button-height);align-content:center}.bx-settings-tab-contents h2 .bx-settings-project-link{flex:1;height:var(--bx-button-height);padding:0 12px;text-align:left;text-transform:none;text-decoration:none}.bx-settings-tab-contents h2 .bx-settings-project-link span{font-size:20px;font-weight:bold;text-align:left}@media (max-width:620px){.bx-settings-tabs-container{width:48px}.bx-settings-tabs .bx-settings-tab{padding:10px}.bx-settings-tabs .bx-settings-tab span{display:none}.bx-settings-tab-contents{width:calc(100vw - 48px);margin-left:48px}}.bx-settings-row{display:flex;gap:10px;padding:16px 10px;background:#2a2a2a;border-bottom:1px solid #343434}.bx-settings-row:hover,.bx-settings-row:focus-within{background-color:#242424}.bx-settings-row:focus-within{position:relative;z-index:1;box-shadow:inset 0 0 0 2px #62e878,0 0 12px rgba(40,184,74,0.4)}.bx-settings-row:not(:has(> input[type=checkbox])){flex-wrap:wrap}.bx-settings-row > span.bx-settings-label{font-size:14px;display:block;text-align:left;align-self:center;margin-bottom:0 !important;flex:1}.bx-settings-row > span.bx-settings-label svg{width:20px;height:20px;margin-inline-end:8px}.bx-settings-row > span.bx-settings-label + *{margin:0 0 0 auto}.bx-settings-row[data-multi-lines="true"]{flex-direction:column}.bx-settings-row[data-multi-lines="true"] > span.bx-settings-label{align-self:start}.bx-settings-row[data-multi-lines="true"] > span.bx-settings-label + *{margin:unset}.bx-settings-row.bx-settings-important-row{background:#733b00}.bx-settings-dialog-note{display:block;color:#afafb0;font-size:12px;font-weight:lighter;font-style:italic}.bx-settings-dialog-note:not(:has(a)){margin-top:4px}.bx-settings-dialog-note a{display:inline-block;padding:4px}.bx-vx-frame-target-input{display:flex;align-items:center;gap:8px;width:100%;padding-top:6px;border-top:1px solid #343434}.bx-vx-frame-target-input > span{color:#afafb0;font-size:12px}.bx-vx-frame-target-input .bx-number-stepper{margin-left:auto}.bx-settings-custom-user-agent{display:block;width:100%;padding:6px}.bx-settings-dialog input:not([type=checkbox]):focus,.bx-settings-dialog select:focus,.bx-settings-dialog textarea:focus{outline:2px solid #62e878 !important;outline-offset:2px;box-shadow:0 0 10px rgba(40,184,74,0.502)}.bx-donation-link{display:block;text-align:center;text-decoration:none;height:20px;line-height:20px;font-size:14px;margin-top:10px;margin-bottom:10px}.bx-original-credits{margin:4px 0 12px;color:#8f9693;font-size:12px;font-style:italic;text-align:center}.bx-debug-info button{margin-top:10px}.bx-debug-info pre{margin-top:10px;cursor:copy;color:#fff;padding:8px;border:1px solid #2d2d2d;background:#212121;white-space:break-spaces;text-align:left}.bx-debug-info pre:hover{background:#272727}.bx-settings-app-version{margin-top:10px;text-align:center;color:#747474;font-size:12px}.bx-note-unsupported{display:block;font-size:12px;font-style:italic;font-weight:normal;color:#828282}.bx-settings-tab-content{padding:10px}.bx-settings-tab-content > div *:not(.bx-settings-row):has(+ .bx-settings-row) + .bx-settings-row:has(+ .bx-settings-row){border-top-left-radius:6px;border-top-right-radius:6px}.bx-settings-tab-content > div .bx-settings-row:not(:has(+ .bx-settings-row)){border:none;border-bottom-left-radius:6px;border-bottom-right-radius:6px}.bx-settings-tab-content > div *:not(.bx-settings-row):has(+ .bx-settings-row) + .bx-settings-row:not(:has(+ .bx-settings-row)){border:none;border-radius:6px}.bx-settings-tab-content:not([data-game-id="-1"]) .bx-settings-row[data-override=true],.bx-settings-tab-content:not([data-game-id="-1"]) .bx-settings-row:has(*[data-override=true]){border-left:4px solid #ffa500 !important;border-top-left-radius:0 !important;border-bottom-left-radius:0 !important;padding-left:6px !important}.bx-suggest-toggler{text-align:left;display:flex;border-radius:4px;overflow:hidden;background:#003861;height:45px;align-items:center}.bx-suggest-toggler label{flex:1;align-content:center;padding:0 10px;background:#004f87;height:100%}.bx-suggest-toggler span{display:inline-block;align-self:center;padding:10px;width:45px;text-align:center}.bx-suggest-toggler:hover,.bx-suggest-toggler:focus{cursor:pointer;background:#005da1}.bx-suggest-toggler:hover label,.bx-suggest-toggler:focus label{background:#006fbe}.bx-suggest-toggler[bx-open] span{transform:rotate(90deg)}.bx-suggest-toggler[bx-open]+ .bx-suggest-box{display:block}.bx-suggest-box{display:none}.bx-suggest-wrapper{display:flex;flex-direction:column;gap:10px;margin:10px}.bx-suggest-note{font-size:11px;color:#8c8c8c;font-style:italic;font-weight:100}.bx-suggest-link{font-size:14px;display:inline-block;margin-top:4px;padding:4px}.bx-suggest-row{display:flex;flex-direction:row;gap:10px}.bx-suggest-row label{flex:1;overflow:overlay;border-radius:4px}.bx-suggest-row label .bx-suggest-label{background:#323232;padding:4px 10px;font-size:12px;text-align:left}.bx-suggest-row label .bx-suggest-value{padding:6px;font-size:14px}.bx-suggest-row label .bx-suggest-value.bx-suggest-change{background-color:var(--bx-warning-color)}.bx-suggest-row.bx-suggest-ok input{visibility:hidden}.bx-suggest-row.bx-suggest-ok .bx-suggest-label{background-color:#008114}.bx-suggest-row.bx-suggest-ok .bx-suggest-value{background-color:#13a72a}.bx-suggest-row.bx-suggest-change .bx-suggest-label{background-color:#a65e08}.bx-suggest-row.bx-suggest-change .bx-suggest-value{background-color:#d57f18}.bx-suggest-row.bx-suggest-change:hover label{cursor:pointer}.bx-suggest-row.bx-suggest-change:hover .bx-suggest-label{background-color:#995707}.bx-suggest-row.bx-suggest-change:hover .bx-suggest-value{background-color:#bd7115}.bx-suggest-row.bx-suggest-change input:not(:checked) + label{opacity:.5}.bx-suggest-row.bx-suggest-change input:not(:checked) + label .bx-suggest-label{background-color:#2a2a2a}.bx-suggest-row.bx-suggest-change input:not(:checked) + label .bx-suggest-value{background-color:#393939}.bx-suggest-row.bx-suggest-change:hover input:not(:checked) + label{opacity:1}.bx-suggest-row.bx-suggest-change:hover input:not(:checked) + label .bx-suggest-label{background-color:#202020}.bx-suggest-row.bx-suggest-change:hover input:not(:checked) + label .bx-suggest-value{background-color:#303030}.bx-sub-content-box{background:#161616;padding:10px;box-shadow:0 0 12px #0f0f0f inset;border-radius:10px}.bx-settings-row .bx-sub-content-box{background:#202020;padding:12px;box-shadow:0 0 4px #000 inset;border-radius:6px}.bx-controller-extra-settings[data-has-gamepad=true] > :first-child{display:none}.bx-controller-extra-settings[data-has-gamepad=true] > :last-child{display:block}.bx-controller-extra-settings[data-has-gamepad=false] > :first-child{display:block}.bx-controller-extra-settings[data-has-gamepad=false] > :last-child{display:none}.bx-controller-extra-settings .bx-controller-extra-wrapper{flex:1;min-width:1px}.bx-controller-extra-settings .bx-sub-content-box{flex:1;text-align:left;display:flex;flex-direction:column;margin-top:10px}.bx-controller-extra-settings .bx-sub-content-box > label{font-size:14px}.bx-preset-row{display:flex;gap:8px}.bx-preset-row .bx-select{flex:1}.bx-stream-settings-selection{margin-bottom:8px;position:sticky;z-index:1000;top:0}.bx-stream-settings-selection > div{display:flex;gap:8px;background:#222;padding:10px;border-bottom:4px solid #353638;box-shadow:0 0 6px #000;position:relative;z-index:1}.bx-stream-settings-selection > div .bx-select{flex:1}.bx-stream-settings-selection > div .bx-select label{font-weight:bold;font-size:1.1rem;line-height:initial}.bx-stream-settings-selection > div .bx-select label span{line-height:initial}.bx-stream-settings-selection > div .bx-select .bx-select-indicators{display:none}.bx-stream-settings-selection p{font-family:var(--bx-promptfont-font),var(--bx-normal-font);margin:0;font-size:13px;background:rgba(80,80,80,0.949);height:25px;line-height:23px;position:absolute;bottom:-25px;left:0;right:0;text-shadow:0 1px #000}@-moz-keyframes bx-settings-menu-open{from{opacity:0;transform:translateX(28px) scale(.985)}to{opacity:1;transform:translateX(0) scale(1)}}@-webkit-keyframes bx-settings-menu-open{from{opacity:0;transform:translateX(28px) scale(.985)}to{opacity:1;transform:translateX(0) scale(1)}}@-o-keyframes bx-settings-menu-open{from{opacity:0;transform:translateX(28px) scale(.985)}to{opacity:1;transform:translateX(0) scale(1)}}@keyframes bx-settings-menu-open{from{opacity:0;transform:translateX(28px) scale(.985)}to{opacity:1;transform:translateX(0) scale(1)}}@-moz-keyframes bx-settings-menu-close{from{opacity:.98;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(32px) scale(.985)}}@-webkit-keyframes bx-settings-menu-close{from{opacity:.98;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(32px) scale(.985)}}@-o-keyframes bx-settings-menu-close{from{opacity:.98;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(32px) scale(.985)}}@keyframes bx-settings-menu-close{from{opacity:.98;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(32px) scale(.985)}}.bx-toast{user-select:none;-webkit-user-select:none;position:fixed;left:50%;top:24px;transform:translate(-50%,0);background:#212121;border-radius:10px;color:#fff;z-index:var(--bx-toast-z-index);font-family:var(--bx-normal-font);border:2px solid #fff;display:flex;align-items:center;opacity:0;overflow:clip;transition:opacity .2s ease-in;box-shadow:0 0 6px #000}.bx-toast.bx-show{opacity:.95}.bx-toast.bx-hide{opacity:0;pointer-events:none}.bx-toast-msg{font-size:14px;display:inline-block;padding:12px 16px;white-space:pre}.bx-toast-status{font-weight:bold;font-size:14px;text-transform:uppercase;display:inline-block;background:#fff;padding:12px 16px;color:#212121;white-space:pre}.bx-welcome-tutorial-backdrop{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,0.42);pointer-events:auto;animation:bx-welcome-tutorial-fade-in 180ms ease-out both}.bx-welcome-tutorial{position:fixed;z-index:10060;top:50%;left:50%;width:430px;max-width:calc(100vw - 36px);pointer-events:auto;transform:translate(-50%,-50%);transition:top 360ms cubic-bezier(.18,.8,.22,1),left 360ms cubic-bezier(.18,.8,.22,1),bottom 360ms cubic-bezier(.18,.8,.22,1),transform 360ms cubic-bezier(.18,.8,.22,1);animation:bx-welcome-tutorial-fade-in 180ms ease-out both}.bx-welcome-tutorial.bx-welcome-tutorial-at-corner{top:auto;bottom:28px;left:28px;transform:translate(0,0)}body.bx-welcome-tutorial-active .bx-navigation-dialog{z-index:10055;pointer-events:none}body.bx-welcome-tutorial-active .bx-navigation-dialog-overlay{z-index:10054;background:rgba(11,11,11,0.12)}.bx-welcome-tutorial-card{width:100%;padding:24px;border:1px solid rgba(98,232,120,0.55);border-radius:10px;background:linear-gradient(145deg,#1f2523,#121513 72%);box-shadow:0 20px 60px rgba(0,0,0,0.8);color:#fff;font-family:var(--bx-normal-font);animation:bx-welcome-tutorial-card-in 230ms cubic-bezier(.18,.8,.22,1) both}.bx-welcome-tutorial-card h2{margin:7px 0 10px;font-family:var(--bx-title-font);font-size:25px}.bx-welcome-tutorial-card p{min-height:50px;margin:0;color:#d0d4d1;font-size:15px;line-height:1.45}.bx-welcome-tutorial-controller-row{display:flex;align-items:center;gap:12px;min-height:34px}.bx-welcome-tutorial-controller-icons{display:inline-flex;align-items:center;justify-content:center;gap:3px;min-width:116px;color:#fff}.bx-welcome-tutorial-gamepad-icon{font-family:var(--bx-promptfont-font) !important;font-size:27px;line-height:1}.bx-welcome-tutorial-controller-plus,.bx-welcome-tutorial-controller-or{color:#9da6a1;font-size:12px;font-weight:bold}.bx-welcome-tutorial-controller-note{display:block;margin-top:8px;color:#aeb5b1;font-size:12px}.bx-welcome-tutorial-kicker{color:#72ed8c;font-size:11px;font-weight:bold;letter-spacing:1.4px}.bx-welcome-tutorial-progress{display:flex;gap:6px;margin:22px 0}.bx-welcome-tutorial-progress i{width:100%;height:4px;border-radius:99px;background:#505553}.bx-welcome-tutorial-progress i[data-active=true],.bx-welcome-tutorial-progress i[data-complete=true]{background:#00a850}.bx-welcome-tutorial-actions{display:flex;justify-content:space-between;gap:10px}.bx-welcome-tutorial-actions .bx-button{min-height:40px;text-transform:none}.bx-welcome-tutorial-closing{animation:bx-welcome-tutorial-fade-out 160ms ease-in both}.bx-tutorial-highlight{position:relative;z-index:2;outline:2px solid #62e878 !important;outline-offset:3px;border-radius:5px;box-shadow:0 0 0 5px rgba(19,203,92,0.2),0 0 24px rgba(40,216,102,0.55);animation:bx-tutorial-highlight-pulse 1.5s ease-in-out infinite}@media (max-width:460px){.bx-welcome-tutorial{left:50%;top:50%;bottom:auto;width:calc(100vw - 36px)}.bx-welcome-tutorial.bx-welcome-tutorial-at-corner{top:auto;bottom:18px;left:18px}.bx-welcome-tutorial-card{padding:20px}.bx-welcome-tutorial-card h2{font-size:22px}.bx-welcome-tutorial-actions{flex-direction:column-reverse}.bx-welcome-tutorial-actions .bx-button{width:100%}}@-moz-keyframes bx-tutorial-highlight-pulse{50%{box-shadow:0 0 0 8px rgba(19,203,92,0.1),0 0 30px rgba(40,216,102,0.7)}}@-webkit-keyframes bx-tutorial-highlight-pulse{50%{box-shadow:0 0 0 8px rgba(19,203,92,0.1),0 0 30px rgba(40,216,102,0.7)}}@-o-keyframes bx-tutorial-highlight-pulse{50%{box-shadow:0 0 0 8px rgba(19,203,92,0.1),0 0 30px rgba(40,216,102,0.7)}}@keyframes bx-tutorial-highlight-pulse{50%{box-shadow:0 0 0 8px rgba(19,203,92,0.1),0 0 30px rgba(40,216,102,0.7)}}@-moz-keyframes bx-welcome-tutorial-fade-in{from{opacity:0}to{opacity:1}}@-webkit-keyframes bx-welcome-tutorial-fade-in{from{opacity:0}to{opacity:1}}@-o-keyframes bx-welcome-tutorial-fade-in{from{opacity:0}to{opacity:1}}@keyframes bx-welcome-tutorial-fade-in{from{opacity:0}to{opacity:1}}@-moz-keyframes bx-welcome-tutorial-fade-out{from{opacity:1}to{opacity:0}}@-webkit-keyframes bx-welcome-tutorial-fade-out{from{opacity:1}to{opacity:0}}@-o-keyframes bx-welcome-tutorial-fade-out{from{opacity:1}to{opacity:0}}@keyframes bx-welcome-tutorial-fade-out{from{opacity:1}to{opacity:0}}@-moz-keyframes bx-welcome-tutorial-card-in{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@-webkit-keyframes bx-welcome-tutorial-card-in{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@-o-keyframes bx-welcome-tutorial-card-in{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes bx-welcome-tutorial-card-in{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}.bx-original-rocket-video{position:absolute;z-index:1;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;mix-blend-mode:screen;opacity:.88}.bx-original-xbox-splash-video{position:absolute;z-index:10;inset:0;width:100%;height:100%;object-fit:cover;background:#000;pointer-events:none}#game-stream:has(.bx-original-rocket-video) [class*=PureScreens-module__screens]{z-index:2}.bx-wait-time-box{position:fixed;top:0;right:0;background-color:rgba(0,0,0,0.8);color:#fff;z-index:var(--bx-wait-time-box-z-index);padding:12px;border-radius:0 0 0 8px}.bx-wait-time-box label{display:block;text-transform:uppercase;text-align:right;font-size:12px;font-weight:bold;margin:0}.bx-wait-time-box span{display:block;font-family:var(--bx-monospaced-font);text-align:right;font-size:16px;margin-bottom:10px}.bx-wait-time-box span:last-of-type{margin-bottom:0}.bx-leave-queue-button{position:fixed;z-index:calc(var(--bx-wait-time-box-z-index) + 1);left:50%;bottom:82px;transform:translateX(-50%);min-height:42px;padding:0 18px;border:1px solid #ffb3b3;border-radius:4px;background:#c50f1f;color:#fff;font:600 15px var(--bx-generic-font);cursor:pointer}.bx-leave-queue-button:hover,.bx-leave-queue-button:focus-visible{background:#e81123;border-color:#fff}.bx-leave-queue-button:focus-visible{outline:2px solid #8bd3ff;outline-offset:2px}.bx-remote-play-settings{margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #2d2d2d;display:flex;flex-direction:column;gap:10px}.bx-remote-play-settings > div{display:flex;min-height:30px}.bx-remote-play-settings > div > label{flex:1;font-size:14px;align-self:center}.bx-remote-play-settings > div > label p{margin:4px 0 0;padding:0;color:#888;font-size:12px}.bx-remote-play-resolution{display:block}.bx-remote-play-resolution input[type="radio"]{accent-color:var(--bx-primary-button-color);margin-right:6px}.bx-remote-play-resolution input[type="radio"]:focus{accent-color:var(--bx-primary-button-hover-color)}.bx-remote-play-device-wrapper{display:flex;margin-bottom:12px;gap:10px}.bx-remote-play-device-wrapper:last-child{margin-bottom:2px}.bx-remote-play-device-info{flex:1;align-self:center}.bx-remote-play-device-name{font-size:14px;font-weight:bold;display:inline-block;vertical-align:middle}.bx-remote-play-console-type{font-size:8px;background:#004c87;color:#fff;display:inline-block;border-radius:8px;padding:2px 6px;margin-left:8px;vertical-align:middle}.bx-remote-play-power-state{color:#888;font-size:12px}.bx-remote-play-connect-button{min-height:100%}.bx-remote-play-buttons{display:flex;justify-content:space-between}select.bx-select{min-height:30px}div.bx-select{display:flex;position:relative;align-items:center;flex:0 1 auto;gap:8px}div.bx-select select:disabled ~ button{display:none}div.bx-select select:disabled ~ div{background:#131416;color:#fff;pointer-events:none}div.bx-select select:disabled ~ div .bx-select-indicators{visibility:hidden}div.bx-select > div,div.bx-select button.bx-select-value{min-width:120px;text-align:left;line-height:24px;vertical-align:middle;background:#fff;color:#000;border-radius:4px;padding:2px 8px;display:flex;flex:1;flex-direction:column}div.bx-select > div{min-height:24px}div.bx-select > div input{display:inline-block;margin-right:8px}div.bx-select > div label{margin-bottom:0;font-size:14px;width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-height:15px}div.bx-select > div label span{display:block;font-size:10px;font-weight:bold;text-align:left;line-height:20px;white-space:pre;min-height:15px;align-content:center}div.bx-select button.bx-select-value{border:none;cursor:pointer;min-height:30px;font-size:.9rem;align-items:center}div.bx-select button.bx-select-value > div{display:flex;width:100%}div.bx-select button.bx-select-value span{flex:1;text-align:left;display:inline-block}div.bx-select button.bx-select-value input{margin:0 4px;accent-color:var(--bx-primary-button-color);pointer-events:none}div.bx-select button.bx-select-value:hover input,div.bx-select button.bx-select-value:focus input{accent-color:var(--bx-danger-button-color)}div.bx-select button.bx-select-value:hover::after,div.bx-select button.bx-select-value:focus::after{border-color:#4d4d4d !important}div.bx-select button.bx-button{border:none;width:24px;height:auto;padding:0;color:#fff;border-radius:4px;font-weight:bold;font-size:12px;font-family:var(--bx-monospaced-font);flex-shrink:0}div.bx-select button.bx-button span{line-height:unset}div.bx-select[data-controller-friendly=true] > div{box-sizing:content-box}div.bx-select[data-controller-friendly=true] select{position:absolute !important;top:-9999px !important;left:-9999px !important;visibility:hidden !important}div.bx-select[data-controller-friendly=false]{position:relative}div.bx-select[data-controller-friendly=false] > div{box-sizing:border-box}div.bx-select[data-controller-friendly=false] > div label{margin-right:24px}div.bx-select[data-controller-friendly=false] select:disabled{display:none}div.bx-select[data-controller-friendly=false] select:not(:disabled){cursor:pointer;position:absolute;top:0;right:0;bottom:0;display:block;opacity:0;z-index:calc(var(--bx-settings-z-index) + 1)}div.bx-select[data-controller-friendly=false] select:not(:disabled):hover + div{background:#f0f0f0}div.bx-select[data-controller-friendly=false] select:not(:disabled) + div label::after{content:\'▾\';font-size:14px;position:absolute;right:8px;pointer-events:none}.bx-settings-dialog .bx-select label{font-family:var(--bx-normal-font),"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif}.bx-select-flag{display:inline-block;margin:0 6px 0 2px;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif !important;line-height:inherit}.bx-select-flag-image{display:inline-block;width:20px;height:15px;margin:0 6px 0 2px;object-fit:cover;vertical-align:-2px;border-radius:1px;box-shadow:0 0 0 1px rgba(255,255,255,0.2)}.bx-locale-flag{display:inline-block;width:18px;height:13px;margin-right:5px;object-fit:cover;vertical-align:-1px;border-radius:1px}.bx-server-menu-flag{display:inline-block;width:18px;height:13px;margin-right:5px;object-fit:cover;vertical-align:-2px;border-radius:1px}html[data-active-input=mouse] .bx-navigation-dialog div.bx-select[data-controller-friendly=true],html[data-active-input=keyboard] .bx-navigation-dialog div.bx-select[data-controller-friendly=true]{position:relative}html[data-active-input=mouse] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] > button.bx-button,html[data-active-input=keyboard] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] > button.bx-button{display:none}html[data-active-input=mouse] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] > div,html[data-active-input=keyboard] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] > div{box-sizing:border-box}html[data-active-input=mouse] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] > div label,html[data-active-input=keyboard] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] > div label{margin-right:24px}html[data-active-input=mouse] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] > div label::after,html[data-active-input=keyboard] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] > div label::after{content:\'▾\';font-size:14px;position:absolute;right:8px;pointer-events:none}html[data-active-input=mouse] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] select:not(:disabled),html[data-active-input=keyboard] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] select:not(:disabled){cursor:pointer;position:absolute !important;top:0 !important;right:0 !important;bottom:0 !important;left:0 !important;display:block !important;visibility:visible !important;opacity:0;z-index:2}html[data-active-input=mouse] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] select:not(:disabled):hover + div,html[data-active-input=keyboard] .bx-navigation-dialog div.bx-select[data-controller-friendly=true] select:not(:disabled):hover + div{background:#f0f0f0}.bx-select-indicators{display:flex;height:4px;gap:2px;margin-bottom:2px}.bx-select-indicators span{content:\' \';display:inline-block;flex:1;background:#cfcfcf;border-radius:4px;min-width:1px}.bx-select-indicators span[data-highlighted]{background:#9c9c9c;min-width:6px}.bx-select-indicators span[data-selected]{background:#aacfe7}.bx-select-indicators span[data-highlighted][data-selected]{background:#5fa3d0}.bx-select-multiple-dropdown{position:fixed;z-index:2147483647;max-height:260px;overflow-y:auto;padding:0;border:1px solid #3f3f3f;background:#393939;box-shadow:0 8px 18px rgba(0,0,0,0.8)}.bx-select-multiple-dropdown-option{display:flex;align-items:center;gap:6px;width:100%;min-height:27px;padding:3px 8px;border:0;background:#393939;color:#fff;font:inherit;text-align:left;cursor:pointer}.bx-select-multiple-dropdown-option input{margin:0;accent-color:var(--bx-primary-button-color);pointer-events:none}.bx-select-multiple-dropdown-option:hover,.bx-select-multiple-dropdown-option:focus{background:#4b4b4b;color:#fff}.bx-select-multiple-dropdown-option[data-selected=true]{background:#176fa9;color:#fff}.bx-select-flag-dropdown{position:absolute;top:calc(100% + 3px);left:0;z-index:2147483647;max-height:360px;overflow-y:auto;padding:4px 0;border:1px solid #3f3f3f;background:#393939;box-shadow:0 8px 18px rgba(0,0,0,0.8)}.bx-select-flag-dropdown-group{padding:5px 10px 2px;color:#fff;font-size:12px;font-weight:bold}.bx-select-flag-dropdown-option{display:flex;align-items:center;width:100%;min-height:30px;padding:4px 10px;border:0;background:transparent;color:#fff;font:inherit;text-align:left;cursor:pointer}.bx-select-flag-dropdown-option .bx-select-flag-image{flex:0 0 auto}.bx-select-flag-dropdown-option:hover,.bx-select-flag-dropdown-option:focus,.bx-select-flag-dropdown-option[data-selected=true]{background:#176fa9;color:#fff}.bx-server-region-picker{position:relative;min-width:220px;flex:1}.bx-server-region-picker-trigger,.bx-server-region-picker-option{font:inherit}.bx-server-region-picker-trigger{display:flex;align-items:center;width:100%;min-height:30px;padding:4px 8px;border:0;border-radius:4px;background:#fff;color:#000;text-align:left;cursor:pointer}.bx-server-region-picker-trigger > span:not(.bx-server-region-picker-arrow){flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bx-server-region-picker-arrow{margin-left:auto;padding-left:8px}.bx-server-region-picker-menu{position:absolute;z-index:2147483647;top:auto;bottom:calc(100% + 3px);left:0;right:0;max-height:360px;overflow-y:auto;padding:4px 0;border:1px solid #767676;background:#fff;color:#000;box-shadow:0 -8px 18px rgba(0,0,0,0.533)}.bx-server-region-picker-group{padding:5px 10px 2px;color:#000;font-size:12px;font-weight:bold}.bx-server-region-picker-option{display:flex;align-items:center;width:100%;min-height:30px;padding:4px 10px;border:0;background:transparent;color:#000;text-align:left;cursor:pointer}.bx-server-region-picker-option:hover,.bx-server-region-picker-option:focus,.bx-server-region-picker-option[data-selected=true]{background:#196fd0;color:#fff}div.bx-select[data-controller-friendly=true] button.bx-select-value{position:relative;padding-right:28px}div.bx-select[data-controller-friendly=true] button.bx-select-value::before{content:\'▾\';position:absolute;top:50%;right:9px;transform:translateY(-50%);color:#f5f5f5;font-size:12px;pointer-events:none}html[data-active-input=mouse] .bx-navigation-dialog div.bx-select[data-controller-friendly=true]:has(button.bx-select-value) > button.bx-select-value,html[data-active-input=keyboard] .bx-navigation-dialog div.bx-select[data-controller-friendly=true]:has(button.bx-select-value) > button.bx-select-value{display:none}html[data-active-input=mouse] .bx-navigation-dialog div.bx-select[data-controller-friendly=true]:has(button.bx-select-value) select:not(:disabled),html[data-active-input=keyboard] .bx-navigation-dialog div.bx-select[data-controller-friendly=true]:has(button.bx-select-value) select:not(:disabled){pointer-events:auto !important;position:relative !important;top:auto !important;right:auto !important;bottom:auto !important;left:auto !important;width:100%;min-height:28px;visibility:visible !important;opacity:1;z-index:2;color:#fff;background:#171819;border:1px solid #4b4f51;border-radius:2px}.bx-guide-home-achievements-progress{display:flex;gap:10px;flex-direction:row}.bx-guide-home-achievements-progress .bx-button{margin-bottom:0 !important}body[data-bx-media-type=tv] .bx-guide-home-achievements-progress{flex-direction:column}body:not([data-bx-media-type=tv]) .bx-guide-home-achievements-progress{flex-direction:row}body:not([data-bx-media-type=tv]) .bx-guide-home-achievements-progress > button:first-of-type{flex:1}body:not([data-bx-media-type=tv]) .bx-guide-home-achievements-progress > button:last-of-type{width:40px}body:not([data-bx-media-type=tv]) .bx-guide-home-achievements-progress > button:last-of-type span{display:none}.bx-guide-home-buttons > div{display:flex;flex-direction:row;gap:12px}body[data-bx-media-type=tv] .bx-guide-home-buttons > div{flex-direction:column}body[data-bx-media-type=tv] .bx-guide-home-buttons > div button{margin-bottom:0 !important}body:not([data-bx-media-type=tv]) .bx-guide-home-buttons > div button span{display:none}.bx-guide-home-buttons[data-is-playing="true"] button[data-state=\'normal\']{display:none}.bx-guide-home-buttons[data-is-playing="false"] button[data-state=\'playing\']{display:none}#game-stream div[class^=StreamMenu-module__menuContainer] > div[class^=Menu-module]{overflow:visible}.bx-stream-menu-button-on{fill:#000 !important;background-color:#2d2d2d !important;color:#000 !important}.bx-stream-refresh-button{top:calc(env(safe-area-inset-top, 0px) + 10px + 50px) !important}body[data-media-type=default] .bx-stream-refresh-button{left:calc(env(safe-area-inset-left, 0px) + 11px) !important}body[data-media-type=tv] .bx-stream-refresh-button{top:calc(var(--gds-focus-borderSize) + 80px) !important}.bx-stream-home-button{top:calc(env(safe-area-inset-top, 0px) + 10px + 50px * 2) !important}body[data-media-type=default] .bx-stream-home-button{left:calc(env(safe-area-inset-left, 0px) + 12px) !important}body[data-media-type=tv] .bx-stream-home-button{top:calc(var(--gds-focus-borderSize) + 80px * 2) !important}div[data-testid=media-container][data-position=center]{display:flex}div[data-testid=media-container][data-position=top] video,div[data-testid=media-container][data-position=top] canvas{top:0}div[data-testid=media-container][data-position=bottom] video,div[data-testid=media-container][data-position=bottom] canvas{bottom:0}#game-stream video{margin:auto;align-self:center;background:#000;position:absolute;left:0;right:0}#game-stream canvas{align-self:center;margin:auto;position:absolute;left:0;right:0}#game-stream.bx-taking-screenshot:before{animation:bx-anim-taking-screenshot .5s ease;content:\' \';position:absolute;width:100%;height:100%;z-index:var(--bx-screenshot-animation-z-index)}#gamepass-dialog-root div[class^=Guide-module__guide] .bx-button{overflow:visible;margin-bottom:12px}@-moz-keyframes bx-anim-taking-screenshot{0%{border:0 solid rgba(255,255,255,0.502)}50%{border:8px solid rgba(255,255,255,0.502)}100%{border:0 solid rgba(255,255,255,0.502)}}@-webkit-keyframes bx-anim-taking-screenshot{0%{border:0 solid rgba(255,255,255,0.502)}50%{border:8px solid rgba(255,255,255,0.502)}100%{border:0 solid rgba(255,255,255,0.502)}}@-o-keyframes bx-anim-taking-screenshot{0%{border:0 solid rgba(255,255,255,0.502)}50%{border:8px solid rgba(255,255,255,0.502)}100%{border:0 solid rgba(255,255,255,0.502)}}@keyframes bx-anim-taking-screenshot{0%{border:0 solid rgba(255,255,255,0.502)}50%{border:8px solid rgba(255,255,255,0.502)}100%{border:0 solid rgba(255,255,255,0.502)}}.bx-number-stepper{text-align:center}.bx-number-stepper > div{display:flex;align-items:center}.bx-number-stepper > div span{flex:1;display:inline-block;min-width:40px;font-family:var(--bx-monospaced-font);white-space:pre;font-size:13px;margin:0 4px}.bx-number-stepper > div button{flex-shrink:0;border:none;width:24px;height:24px;margin:0;line-height:24px;background-color:var(--bx-default-button-color);color:#fff;border-radius:4px;font-weight:bold;font-size:14px;font-family:var(--bx-monospaced-font)}@media (hover:hover){.bx-number-stepper > div button:hover{background-color:var(--bx-default-button-hover-color)}}.bx-number-stepper > div button:active{background-color:var(--bx-default-button-hover-color)}.bx-number-stepper > div button:disabled + span{font-family:var(--bx-title-font)}.bx-number-stepper input[type=range]{display:block;margin:8px 0 2px auto;min-width:180px;width:100%;color:#959595 !important}.bx-number-stepper input[type=range]:disabled,.bx-number-stepper button:disabled{display:none}.bx-number-stepper[data-disabled=true] input[type=range],.bx-number-stepper[disabled=true] input[type=range],.bx-number-stepper[data-disabled=true] button,.bx-number-stepper[disabled=true] button{display:none}.bx-number-stepper-input{width:72px;text-align:center}.bx-dual-number-stepper > span{display:block;font-family:var(--bx-monospaced-font);font-size:13px;white-space:pre;margin:0 4px;text-align:center}.bx-dual-number-stepper > div input[type=range]{display:block;width:100%;min-width:180px;background:transparent;color:#959595 !important;appearance:none;padding:8px 0}.bx-dual-number-stepper > div input[type=range]::-webkit-slider-runnable-track{background:linear-gradient(90deg,#fff var(--from),var(--bx-primary-button-color) var(--from) var(--to),#fff var(--to) 100%);height:8px;border-radius:2px}.bx-dual-number-stepper > div input[type=range]::-moz-range-track{background:linear-gradient(90deg,#fff var(--from),var(--bx-primary-button-color) var(--from) var(--to),#fff var(--to) 100%);height:8px;border-radius:2px}.bx-dual-number-stepper > div input[type=range]::-webkit-slider-thumb{margin-top:-4px;appearance:none;width:4px;height:16px;background:#00b85f;border:none;border-radius:2px}.bx-dual-number-stepper > div input[type=range]::-moz-range-thumb{margin-top:-4px;appearance:none;width:4px;height:16px;background:#00b85f;border:none;border-radius:2px}.bx-dual-number-stepper > div input[type=range]:hover::-webkit-slider-runnable-track,.bx-dual-number-stepper > div input[type=range].bx-dual-number-stepper > div input[type=range]:active::-webkit-slider-runnable-track,.bx-dual-number-stepper > div input[type=range]:focus::-webkit-slider-runnable-track{background:linear-gradient(90deg,#fff var(--from),#006635 var(--from) var(--to),#fff var(--to) 100%)}.bx-dual-number-stepper > div input[type=range]:hover::-moz-range-track,.bx-dual-number-stepper > div input[type=range].bx-dual-number-stepper > div input[type=range]:active::-moz-range-track,.bx-dual-number-stepper > div input[type=range]:focus::-moz-range-track{background:linear-gradient(90deg,#fff var(--from),#006635 var(--from) var(--to),#fff var(--to) 100%)}.bx-dual-number-stepper > div input[type=range]:hover::-webkit-slider-thumb,.bx-dual-number-stepper > div input[type=range].bx-dual-number-stepper > div input[type=range]:active::-webkit-slider-thumb,.bx-dual-number-stepper > div input[type=range]:focus::-webkit-slider-thumb{background:#fb3232}.bx-dual-number-stepper > div input[type=range]:hover::-moz-range-thumb,.bx-dual-number-stepper > div input[type=range].bx-dual-number-stepper > div input[type=range]:active::-moz-range-thumb,.bx-dual-number-stepper > div input[type=range]:focus::-moz-range-thumb{background:#fb3232}.bx-dual-number-stepper[data-disabled=true] input[type=range],.bx-dual-number-stepper[disabled=true] input[type=range]{display:none}#bx-game-bar{z-index:var(--bx-game-bar-z-index);position:fixed;bottom:0;width:40px;height:90px;overflow:visible;cursor:pointer}#bx-game-bar > svg{display:none;pointer-events:none;position:absolute;height:28px;margin-top:16px}@media (hover:hover){#bx-game-bar:hover > svg{display:block}}#bx-game-bar .bx-game-bar-container{opacity:0;position:absolute;display:flex;overflow:hidden;background:rgba(26,27,30,0.91);box-shadow:0 0 6px #1c1c1c;transition:opacity .1s ease-in}#bx-game-bar .bx-game-bar-container.bx-show{opacity:.9}#bx-game-bar .bx-game-bar-container.bx-show + svg{display:none !important}#bx-game-bar .bx-game-bar-container.bx-hide{opacity:0;pointer-events:none}#bx-game-bar .bx-game-bar-container button{width:60px;height:60px;border-radius:0}#bx-game-bar .bx-game-bar-container button svg{width:28px;height:28px;transition:transform .08s ease 0s}#bx-game-bar .bx-game-bar-container button:hover{border-radius:0}#bx-game-bar .bx-game-bar-container button:active svg{transform:scale(.75)}#bx-game-bar .bx-game-bar-container button.bx-activated{background-color:#fff}#bx-game-bar .bx-game-bar-container button.bx-activated svg{filter:invert(1)}#bx-game-bar .bx-game-bar-container div[data-activated] button{display:none}#bx-game-bar .bx-game-bar-container div[data-activated=\'false\'] button:first-of-type{display:block}#bx-game-bar .bx-game-bar-container div[data-activated=\'true\'] button:last-of-type{display:block}#bx-game-bar[data-position="bottom-left"]{left:0;direction:ltr}#bx-game-bar[data-position="bottom-left"] .bx-game-bar-container{border-radius:0 10px 10px 0}#bx-game-bar[data-position="bottom-right"]{right:0;direction:rtl}#bx-game-bar[data-position="bottom-right"] .bx-game-bar-container{direction:ltr;border-radius:10px 0 0 10px}.bx-badges{margin-left:0;user-select:none;-webkit-user-select:none}.bx-badge{border:none;display:inline-block;line-height:24px;color:#fff;font-family:var(--bx-title-font-semibold);font-size:14px;font-weight:400;margin:0 8px 8px 0;box-shadow:0 0 6px #000;border-radius:4px}.bx-badge-name{background-color:#2d3036;border-radius:4px 0 0 4px}.bx-badge-name svg{width:16px;height:16px}.bx-badge-value{background-color:#808080;border-radius:0 4px 4px 0}.bx-badge-name,.bx-badge-value{display:inline-block;padding:0 8px;line-height:30px;vertical-align:bottom}.bx-badge-battery[data-charging=true] span:first-of-type::after{content:\' ⚡️\'}div[class^=StreamMenu-module__container] .bx-badges{position:absolute;max-width:500px}#gamepass-dialog-root .bx-badges{position:fixed;top:60px;left:460px;max-width:500px}@media (min-width:568px) and (max-height:480px){#gamepass-dialog-root .bx-badges{position:unset;top:unset;left:unset;margin:8px 0}}.bx-stats-bar{display:flex;flex-direction:row;gap:8px;user-select:none;-webkit-user-select:none;position:fixed;top:0;background-color:#000;color:#fff;font-family:var(--bx-monospaced-font);font-size:.9rem;padding-left:8px;z-index:var(--bx-stats-bar-z-index);text-wrap:nowrap}.bx-stats-bar[data-stats*="[time]"] > .bx-stat-time,.bx-stats-bar[data-stats*="[play]"] > .bx-stat-play,.bx-stats-bar[data-stats*="[batt]"] > .bx-stat-batt,.bx-stats-bar[data-stats*="[res]"] > .bx-stat-res,.bx-stats-bar[data-stats*="[fps]"] > .bx-stat-fps,.bx-stats-bar[data-stats*="[ping]"] > .bx-stat-ping,.bx-stats-bar[data-stats*="[jit]"] > .bx-stat-jit,.bx-stats-bar[data-stats*="[btr]"] > .bx-stat-btr,.bx-stats-bar[data-stats*="[dt]"] > .bx-stat-dt,.bx-stats-bar[data-stats*="[pl]"] > .bx-stat-pl,.bx-stats-bar[data-stats*="[fl]"] > .bx-stat-fl,.bx-stats-bar[data-stats*="[dl]"] > .bx-stat-dl,.bx-stats-bar[data-stats*="[ul]"] > .bx-stat-ul{display:inline-flex;align-items:baseline}.bx-stats-bar[data-stats$="[time]"] > .bx-stat-time,.bx-stats-bar[data-stats$="[play]"] > .bx-stat-play,.bx-stats-bar[data-stats$="[batt]"] > .bx-stat-batt,.bx-stats-bar[data-stats$="[res]"] > .bx-stat-res,.bx-stats-bar[data-stats$="[fps]"] > .bx-stat-fps,.bx-stats-bar[data-stats$="[ping]"] > .bx-stat-ping,.bx-stats-bar[data-stats$="[jit]"] > .bx-stat-jit,.bx-stats-bar[data-stats$="[btr]"] > .bx-stat-btr,.bx-stats-bar[data-stats$="[dt]"] > .bx-stat-dt,.bx-stats-bar[data-stats$="[pl]"] > .bx-stat-pl,.bx-stats-bar[data-stats$="[fl]"] > .bx-stat-fl,.bx-stats-bar[data-stats$="[dl]"] > .bx-stat-dl,.bx-stats-bar[data-stats$="[ul]"] > .bx-stat-ul{border-right:none}.bx-stats-bar::before{display:none;content:\'👀\';vertical-align:middle;margin-right:8px}.bx-stats-bar[data-display=glancing]::before{display:inline-block}.bx-stats-bar[data-position=top-left]{left:0;border-radius:0 0 4px 0}.bx-stats-bar[data-position=top-right]{right:0;border-radius:0 0 0 4px}.bx-stats-bar[data-position=top-center]{transform:translate(-50%,0);left:50%;border-radius:0 0 4px 4px}.bx-stats-bar[data-shadow=true]{background:none;filter:drop-shadow(1px 0 0 rgba(0,0,0,0.941)) drop-shadow(-1px 0 0 rgba(0,0,0,0.941)) drop-shadow(0 1px 0 rgba(0,0,0,0.941)) drop-shadow(0 -1px 0 rgba(0,0,0,0.941))}.bx-stats-bar > div{display:none;border-right:1px solid #fff;padding-right:8px}.bx-stats-bar label{margin:0 8px 0 0;font-family:var(--bx-title-font);font-size:70%;font-weight:bold;vertical-align:middle;cursor:help}.bx-stats-bar span{display:inline-block;text-align:right;vertical-align:middle;white-space:pre}.bx-stats-bar span[data-grade=good]{color:#6bffff}.bx-stats-bar span[data-grade=ok]{color:#fff16b}.bx-stats-bar span[data-grade=bad]{color:#ff5f5f}.bx-stats-bar .bx-stat-fps > span[data-vx-frame-generation=true]{display:inline-flex;align-items:center;gap:5px;text-align:left}.bx-stats-bar .bx-stat-fps > span[data-vx-frame-generation=true] .bx-vx-fps-bar{display:inline-flex;width:28px;height:5px;overflow:hidden;border-radius:3px;background:#3c3c3c;vertical-align:middle}.bx-stats-bar .bx-stat-fps > span[data-vx-frame-generation=true] .bx-vx-fps-bar i{display:block;height:100%}.bx-stats-bar .bx-stat-fps > span[data-vx-frame-generation=true] .bx-vx-fps-stream{width:50%;background:#6bffff}.bx-stats-bar .bx-stat-fps > span[data-vx-frame-generation=true] .bx-vx-fps-generated{width:50%;background:#77d970}.bx-stats-bar .bx-stat-res > span[data-vx-upscale=true]{display:inline-flex;align-items:center;gap:5px;text-align:left}.bx-stats-bar .bx-stat-res > span[data-vx-upscale=true] .bx-vx-resolution-bar{display:inline-flex;width:28px;height:5px;overflow:hidden;border-radius:3px;background:#3c3c3c;vertical-align:middle}.bx-stats-bar .bx-stat-res > span[data-vx-upscale=true] .bx-vx-resolution-bar i{display:block;height:100%}.bx-stats-bar .bx-stat-res > span[data-vx-upscale=true] .bx-vx-resolution-stream{width:50%;background:#6bffff}.bx-stats-bar .bx-stat-res > span[data-vx-upscale=true] .bx-vx-resolution-output{width:50%;background:#b78cff}.bx-mkb-settings{display:flex;flex-direction:column;flex:1;padding-bottom:10px;overflow:hidden}.bx-mkb-pointer-lock-msg{user-select:none;-webkit-user-select:none;position:fixed;left:50%;bottom:40px;transform:translateX(-50%);margin:auto;background:#151515;z-index:var(--bx-mkb-pointer-lock-msg-z-index);color:#fff;font-weight:400;font-family:"Segoe UI",Arial,Helvetica,sans-serif;font-size:1.3rem;padding:12px;border-radius:8px;align-items:center;box-shadow:0 0 6px #000;min-width:300px;opacity:.9;display:flex;flex-direction:column;gap:10px}.bx-mkb-pointer-lock-msg:hover{opacity:1}.bx-mkb-pointer-lock-msg > p{margin:0;width:100%;font-size:22px;margin-bottom:4px;font-weight:bold;text-align:left}.bx-mkb-pointer-lock-msg > div{width:100%;display:flex;flex-direction:row;gap:10px}.bx-mkb-pointer-lock-msg > div button:first-of-type{flex-shrink:1}.bx-mkb-pointer-lock-msg > div button:last-of-type{flex-grow:1}.bx-mkb-key-row{display:flex;margin-bottom:10px;align-items:center;gap:20px}.bx-mkb-key-row label{margin-bottom:0;font-family:var(--bx-promptfont-font);font-size:32px;text-align:center}.bx-mkb-settings.bx-editing .bx-mkb-key-row button{background:#393939;border-radius:4px;border:none}.bx-mkb-settings.bx-editing .bx-mkb-key-row button:hover{background:#333;cursor:pointer}.bx-mkb-action-buttons > div{text-align:right;display:none}.bx-mkb-action-buttons button{margin-left:8px}.bx-mkb-settings:not(.bx-editing) .bx-mkb-action-buttons > div:first-child{display:block}.bx-mkb-settings.bx-editing .bx-mkb-action-buttons > div:last-child{display:block}.bx-mkb-note{display:block;margin:0 0 10px;font-size:12px;text-align:center}button.bx-binding-button{flex:1;min-height:38px;border:none;border-radius:4px;font-size:14px;color:#fff;display:flex;align-items:center;align-self:center;padding:0 6px}button.bx-binding-button:disabled{background:#131416;padding:0 8px}button.bx-binding-button:not(:disabled){border:2px solid transparent;border-top:none;border-bottom:4px solid #252525;background:#3b3b3b;cursor:pointer}button.bx-binding-button:not(:disabled):hover,button.bx-binding-button:not(:disabled).bx-focusable:focus{background:#20b217;border-bottom-color:#186c13}button.bx-binding-button:not(:disabled):active{background:#16900f;border-bottom:3px solid #0c4e08;border-left-width:2px;border-right-width:2px}button.bx-binding-button:not(:disabled).bx-focusable:focus::after{top:-6px;left:-8px;right:-8px;bottom:-10px}.bx-settings-row .bx-binding-button-wrapper button.bx-binding-button{min-width:60px}.bx-controller-customizations-container .bx-btn-detect{display:block;margin-bottom:20px}.bx-controller-customizations-container .bx-btn-detect.bx-monospaced{background:none;font-weight:bold;font-size:12px}.bx-controller-customizations-container .bx-buttons-grid{display:grid;grid-template-columns:auto auto;column-gap:20px;row-gap:10px;margin-bottom:20px}.bx-controller-key-row{display:flex;align-items:stretch}.bx-controller-key-row > label{margin-bottom:0;font-family:var(--bx-promptfont-font);font-size:32px;text-align:center;min-width:50px;flex-shrink:0;display:flex;align-self:center}.bx-controller-key-row > label::after{content:\'❯\';margin:0 12px;font-size:16px;align-self:center}.bx-controller-key-row .bx-select{width:100% !important}.bx-controller-key-row .bx-select > div{min-width:50px}.bx-controller-key-row .bx-select label{font-family:var(--bx-promptfont-font),var(--bx-normal-font);font-size:32px;text-align:center;margin-bottom:6px;height:40px;line-height:40px}.bx-controller-key-row:hover > label{color:#ffe64b}.bx-controller-key-row:hover > label::after{color:#fff}.bx-controller-customization-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.bx-controller-customization-summary span{font-family:var(--bx-promptfont);font-size:24px;border-radius:6px;background:#131313;color:#fff;display:inline-block;padding:2px;text-align:center}.bx-product-details-icons{padding:8px;border-radius:4px}.bx-product-details-icons svg{margin-right:8px}.bx-product-details-buttons{display:flex;gap:10px;flex-direction:row}.bx-product-details-buttons button{max-width:max-content;margin:10px 0 0 0;display:flex}html[data-bx-product-details=true] div[class*=ProductDetailPage-module__backgroundImageGradient]::after{background:linear-gradient(90deg,rgba(3,7,10,0.94) 0%,rgba(4,10,14,0.76) 38%,rgba(3,7,10,0.22) 72%,rgba(3,7,10,0.62) 100%),linear-gradient(0deg,#050708 0%,transparent 58%) !important}html[data-bx-product-details=true] div[class*=ProductDetailPage-module__content],html[data-bx-product-details=true] div[class*=ProductDetailPage-module__productDetail]{border-left:3px solid #39d878;padding-left:20px;text-shadow:0 2px 18px #000}html[data-bx-product-details=true] div[class*=ProductDetailPage-module] div[class*=Header-module__gamePassAndInputsContainer]{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid rgba(111,255,171,0.18);border-radius:10px;background:linear-gradient(135deg,rgba(25,38,35,0.78),rgba(8,12,14,0.66));box-shadow:0 12px 34px rgba(0,0,0,0.28);backdrop-filter:blur(12px)}html[data-bx-product-details=true] div[class*=ProductDetailPage-module] div[class*=ActionButtons-module__container]{display:inline-flex;align-items:stretch;gap:10px;padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:12px;background:rgba(9,14,16,0.7);box-shadow:0 16px 42px rgba(0,0,0,0.34);backdrop-filter:blur(14px)}html[data-bx-product-details=true] div[class*=ProductDetailPage-module] div[class*=ActionButtons-module__container] button:first-child{min-height:58px;padding-inline:22px;border:1px solid rgba(174,255,199,0.3);border-radius:8px;background:linear-gradient(135deg,#087d41,#14ae61) !important;box-shadow:0 8px 20px rgba(14,174,91,0.28);letter-spacing:.2px}html[data-bx-product-details=true] div[class*=ProductDetailPage-module] div[class*=ActionButtons-module__container] button:first-child:hover,html[data-bx-product-details=true] div[class*=ProductDetailPage-module] div[class*=ActionButtons-module__container] button:first-child:focus{background:linear-gradient(135deg,#0b9950,#22c770) !important;box-shadow:0 10px 26px rgba(25,210,111,0.42)}html[data-bx-product-details=true] div[class*=ProductDetailPage-module] div[class*=ActionButtons-module__container] button:not(:first-child){border-radius:8px;background:rgba(255,255,255,0.07) !important}html[data-bx-product-details=true] div[class*=ProductDetailPage-module] div[class*=Header-module__header] h1,html[data-bx-product-details=true] div[class*=ProductDetailPage-module] div[class*=Header-module__header] h2{letter-spacing:-.4px;text-shadow:0 3px 22px #000}@media (min-width:568px) and (max-height:480px){.bx-product-details-buttons{flex-direction:column}.bx-product-details-buttons button{margin:8px 0 0 10px}}.bx-hub-fullscreen-button{display:inline-flex;align-self:center;align-items:center;justify-content:center;box-sizing:border-box;flex:0 0 auto;width:40px;min-width:40px;height:40px;margin-right:0;margin-left:18px;padding:0;border:1px solid rgba(255,255,255,0.169);border-radius:4px;opacity:.9;transition:transform 160ms ease,opacity 160ms ease,background-color 160ms ease}.bx-hub-fullscreen-button svg{width:19px;height:19px;margin:0}.bx-hub-fullscreen-button:hover,.bx-hub-fullscreen-button:focus-visible,.bx-hub-fullscreen-button.bx-hub-controller-focused{opacity:1;transform:scale(1.06);border-color:#62e878;box-shadow:0 0 0 2px #62e878,0 0 12px rgba(40,184,74,0.4)}.bx-hub-fullscreen-button.bx-hub-fullscreen-active{opacity:1;background-color:#107c10}:fullscreen .bx-hide-in-browser-fullscreen{display:none !important}', PREF_HIDE_SECTIONS = getGlobalPref("ui.hideSections"), selectorToHide = [];
 if (PREF_HIDE_SECTIONS.includes("news")) selectorToHide.push("#BodyContent > div[class*=CarouselRow-module]");
 if (getGlobalPref("ui.hideSections").includes("byog")) selectorToHide.push("#BodyContent > div[class*=ShowcaseRow-module__container___]");
 if (PREF_HIDE_SECTIONS.includes("all-games")) selectorToHide.push("#BodyContent div[class*=AllGamesRow-module__gridContainer]"), selectorToHide.push("#BodyContent div[class*=AllGamesRow-module__rowHeader]");
 if (PREF_HIDE_SECTIONS.includes("most-popular")) selectorToHide.push('#BodyContent div[class*=HomePage-module__bottomSpacing]:has(a[href="/play/gallery/popular"])');
 if (PREF_HIDE_SECTIONS.includes("touch")) selectorToHide.push('#BodyContent div[class*=HomePage-module__bottomSpacing]:has(a[href="/play/gallery/touch"])');
 if (PREF_HIDE_SECTIONS.includes("recently-added")) selectorToHide.push('#BodyContent div[class*=HomePage-module__bottomSpacing]:has(a[href="/play/gallery/recently-added"])');
 if (PREF_HIDE_SECTIONS.includes("genres")) selectorToHide.push("#BodyContent div[class*=HomePage-module__genresRow]");
 if (containsAll(PREF_HIDE_SECTIONS, ["recently-added", "leaving-soon", "genres", "all-games"])) selectorToHide.push("#BodyContent div[class*=GamePassPromoSection-module__container]");
 if (getGlobalPref("block.features").includes("friends")) selectorToHide.push("#gamepass-dialog-root div[class^=AchievementsPreview-module__container] + button[class*=HomeLandingPage-module__button]");
 if (selectorToHide) css += selectorToHide.join(",") + "{ display: none; }";
 if (getGlobalPref("ui.theme") === "dark-oled") css += "body[data-theme=dark]{--gds-containerSolidAppBackground:#000 !important;--gds-containerSolidBackground:#000 !important;--gds-containerSemitransparentBackground:#000 !important;--gds-containerAcrylicBackground:#000 !important}body[data-theme=dark] :is(.bx-settings-dialog,.bx-settings-tabs,.bx-settings-tabs-container,.bx-settings-tab-contents,.bx-settings-row,.bx-navigation-dialog,.bx-key-binding-dialog,.bx-toast,[class*=NavigationMenu-module__],[class*=ContextMenu-module__][class*=Dropdown-module__],[class*=Dialog-module__dialog],gamepass-dialog-root [role=dialog]){background-color:#000 !important}body[data-theme=dark] :is(.bx-settings-row,.bx-settings-tab,.bx-number-stepper,.bx-multiple-options){box-shadow:inset 0 -1px rgba(255,255,255,0.122) !important}body[data-theme=dark] .bx-settings-tab:not(.selected):not(:hover),body[data-theme=dark] .bx-number-stepper > div,body[data-theme=dark] .bx-multiple-options{background-color:#000 !important}body[data-theme=dark] :is(.bx-settings-tab:hover,.bx-settings-tab.selected,.bx-settings-row:focus-within){background-color:#111 !important}html:not([data-bx-product-details=true]) div[aria-hidden=true][class^=BackgroundImageAbsoluteContainer][class*=ProductDetailPage-module__backgroundImageGradient]:after{background:radial-gradient(ellipse 100% 100% at 50% 0,rgba(21,21,23,0.549) 0,rgba(26,27,30,0.651) 32%,#000 100%) !important}a[href=\"/play/gallery/all-games\"][class*=AllGamesRow-module__seeAllCloudGames]{background:none !important}";
 if (getGlobalPref("ui.reduceAnimations")) css += "div[class^=GameCard-module__gameTitleInnerWrapper],div[class^=ScrollArrows-module],div[class^=ContextMenu-module__][class*=Dropdown-module__dropdownWrapper]{animation:none !important;transition:none !important}";
 let hubCardSize = getGlobalPref("ui.hub.cardSize") / 100, hubRounded = getGlobalPref("ui.hub.cardRounded"), hubHover = getGlobalPref("ui.hub.hoverEffects"), hubAnimations = getGlobalPref("ui.hub.animations"), hubCardWidth = Math.round(220 * hubCardSize);
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
  border-radius: ${hubRounded ? "12px" : "0"} !important;
  overflow: hidden !important;
  transition: ${hubAnimations ? "transform 160ms ease, box-shadow 160ms ease, filter 160ms ease" : "none"} !important;
  will-change: transform;
}
:is(div[class*=GameCard-module__card], button[class*=MruGameCard], div[class*=MruGameCard], a[class*=GameCard], a[class*=GameItem], a[href*="/play/games/"]):is(:hover, :focus, :focus-visible, :focus-within, .bx-hub-controller-focused) {
  transform: ${hubHover ? "scale(1.045)" : "none"} !important;
  box-shadow: ${hubHover ? "0 10px 24px #000b" : "none"} !important;
  filter: ${hubHover ? "brightness(1.08) saturate(1.08)" : "none"} !important;
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
 let hubLaunchListenerKey = "__bxHubLaunchListenerAttached", windowWithHubListener = window;
 if (getGlobalPref("ui.systemMenu.hideHandle")) css += "#StreamHud div[class^=Grip-module__container]{visibility:hidden}@media (hover:hover){#StreamHud button[class^=GripHandle-module__container]:hover div[class^=Grip-module__container]{visibility:visible}}#StreamHud button[class^=GripHandle-module__container][aria-expanded=true] div[class^=Grip-module__container]{visibility:visible}#StreamHud button[class^=GripHandle-module__container][aria-expanded=false]{background-color:transparent !important}#StreamHud div[class^=StreamHUD-module__buttonsContainer]{padding:0 !important}";
 if (css += "#game-stream div[class*=StreamMenu-module__menu]{min-width:100vw !important}", getGlobalPref("ui.streamMenu.simplify")) css += "#game-stream div[class*=Menu-module__scrollable]{--bxStreamMenuItemSize:80px;--streamMenuItemSize:calc(var(--bxStreamMenuItemSize) + 40px) !important}.bx-badges{top:calc(var(--streamMenuItemSize) - 20px)}body[data-media-type=tv] .bx-badges{top:calc(var(--streamMenuItemSize) - 10px) !important}#game-stream button[class*=MenuItem-module__container]{min-width:auto !important;min-height:auto !important;width:var(--bxStreamMenuItemSize) !important;height:var(--bxStreamMenuItemSize) !important}#game-stream div[class*=MenuItem-module__label]{display:none !important}#game-stream svg[class*=MenuItem-module__icon]{width:36px;height:100% !important;padding:0 !important;margin:0 !important}";
 else css += "body[data-media-type=tv] .bx-badges{top:calc(var(--streamMenuItemSize) + 30px)}body:not([data-media-type=tv]) .bx-badges{top:calc(var(--streamMenuItemSize) + 20px)}body:not([data-media-type=tv]) button[class*=MenuItem-module__container]{min-width:auto !important;width:100px !important}body:not([data-media-type=tv]) button[class*=MenuItem-module__container]:nth-child(n+2){margin-left:10px !important}body:not([data-media-type=tv]) div[class*=MenuItem-module__label]{margin-left:8px !important;margin-right:8px !important}";
 if (getGlobalPref("ui.hideScrollbar")) css += "html{scrollbar-width:none}body::-webkit-scrollbar{display:none}";
 let existing = document.getElementById("bx-dynamic-css");
 if (existing) existing.textContent = css;
 else {
  let $style = CE("style", { id: "bx-dynamic-css" }, css);
  document.documentElement.appendChild($style);
 }
}
function preloadFonts() {
 let $link = CE("link", {
  rel: "preload",
  href: "https://redphx.github.io/better-xcloud/fonts/promptfont.otf",
  as: "font",
  type: "font/otf",
  crossorigin: ""
 });
 document.querySelector("head")?.appendChild($link);
}
class SettingsManager {
 static instance;
 static getInstance = () => SettingsManager.instance ?? (SettingsManager.instance = new SettingsManager);
 $streamSettingsSelection;
 $tips;
 playingGameId = -1;
 targetGameId = -1;
 SETTINGS = {
  "localCoOp.enabled": {
   onChange: () => {
    BxExposed.toggleLocalCoOp(getStreamPref("localCoOp.enabled"));
   }
  },
  "deviceVibration.mode": {
   onChange: StreamSettings.refreshControllerSettings
  },
  "deviceVibration.intensity": {
   onChange: StreamSettings.refreshControllerSettings
  },
  "controller.pollingRate": {
   onChange: StreamSettings.refreshControllerSettings
  },
  "controller.settings": {
   onChange: StreamSettings.refreshControllerSettings
  },
  "nativeMkb.scroll.sensitivityX": {
   onChange: () => {
    let value = getStreamPref("nativeMkb.scroll.sensitivityX");
    NativeMkbHandler.getInstance()?.setHorizontalScrollMultiplier(value / 100);
   }
  },
  "nativeMkb.scroll.sensitivityY": {
   onChange: () => {
    let value = getStreamPref("nativeMkb.scroll.sensitivityY");
    NativeMkbHandler.getInstance()?.setVerticalScrollMultiplier(value / 100);
   }
  },
  "video.player.type": {
   onChange: updateVideoPlayer,
   onChangeUi: onChangeVideoPlayerType
  },
  "video.player.powerPreference": {
   onChange: () => {
    if (!STATES.currentStream.streamPlayerManager) return;
    updateVideoPlayer();
   }
  },
  "video.processing": {
   onChange: updateVideoPlayer,
   onChangeUi: onChangeVideoPlayerType
  },
  "video.processing.mode": {
   onChange: updateVideoPlayer
  },
  "video.processing.sharpness": {
   onChange: updateVideoPlayer
  },
  "video.maxFps": {
   onChange: () => {
    let value = getStreamPref("video.maxFps");
    limitVideoPlayerFps(value);
   }
  },
  "video.ratio": {
   onChange: updateVideoPlayer
  },
  "video.brightness": {
   onChange: updateVideoPlayer
  },
  "video.contrast": {
   onChange: updateVideoPlayer
  },
  "video.saturation": {
   onChange: updateVideoPlayer
  },
  "video.position": {
   onChange: updateVideoPlayer
  },
  "vx.upscale.target": {
   onChange: updateVideoPlayer
  },
  "vx.upscale.algorithm": {
   onChange: updateVideoPlayer
  },
  "vx.antiAliasing": {
   onChange: updateVideoPlayer
  },
  "vx.artifactReduction": {
   onChange: updateVideoPlayer
  },
  "vx.frameGeneration": {
   onChange: updateVideoPlayer,
   onChangeUi: onChangeVxFrameGeneration
  },
  "vx.latencyBudget": {
   onChange: updateVideoPlayer
  },
  "vx.adaptiveSharpen": {
   onChange: updateVideoPlayer
  },
  "vx.dynamicReconstruction": {
   onChange: updateVideoPlayer
  },
  "vx.temporalSuperResolution": {
   onChange: updateVideoPlayer
  },
  "vx.hudProtection": {
   onChange: updateVideoPlayer
  },
  "vx.frameTargetFps": {
   onChange: updateVideoPlayer
  },
  "vx.fineDetailReconstruction": {
   onChange: updateVideoPlayer
  },
  "vx.competitiveMode": {
   onChange: updateVideoPlayer,
   onChangeUi: onChangeCompetitiveMode
  },
  "audio.volume": {
   onChange: () => {
    let value = getStreamPref("audio.volume");
    SoundShortcut.setGainNodeVolume(value);
   }
  },
  "stats.items": {
   onChange: StreamStats.refreshStyles
  },
  "stats.quickGlance.enabled": {
   onChange: () => {
    if (!getStreamPref("stats.quickGlance.enabled")) StreamStats.getInstance().stop(!0);
   }
  },
  "stats.position": {
   onChange: StreamStats.refreshStyles
  },
  "stats.textSize": {
   onChange: StreamStats.refreshStyles
  },
  "stats.opacity.all": {
   onChange: StreamStats.refreshStyles
  },
  "stats.opacity.background": {
   onChange: StreamStats.refreshStyles
  },
  "stats.colors": {
   onChange: StreamStats.refreshStyles
  },
  "mkb.p1.preset.mappingId": {
   onChange: StreamSettings.refreshMkbSettings
  },
  "mkb.p1.slot": {
   onChange: () => {
    EmulatedMkbHandler.getInstance()?.resetXcloudGamepads();
   }
  },
  "keyboardShortcuts.preset.inGameId": {
   onChange: StreamSettings.refreshKeyboardShortcuts
  }
 };
 constructor() {
  BxEventBus.Stream.on("setting.changed", (data) => {
   if (isStreamPref(data.settingKey)) this.enforceVxExclusiveMode(data.settingKey), this.updateStreamElement(data.settingKey);
  }), BxEventBus.Stream.on("gameSettings.switched", ({ id }) => {
   this.switchGameSettings(id);
  }), BxEventBus.Script.on("setting.changed", ({ settingKey }) => {
   if ([
    "ui.theme",
    "ui.reduceAnimations",
    "ui.hideScrollbar",
    "ui.hideSections",
    "ui.systemMenu.hideHandle",
    "ui.streamMenu.simplify",
    "block.features",
    "ui.hub.cardSize",
    "ui.hub.cardRounded",
    "ui.hub.hoverEffects",
    "ui.hub.animations"
   ].includes(settingKey))
    addCss();
  }), this.renderStreamSettingsSelection();
 }
 enforceVxExclusiveMode(settingKey) {
  if (settingKey !== "vx.upscale.target" && settingKey !== "vx.frameGeneration") return;
  let upscaleTarget = getGamePref(this.targetGameId, "vx.upscale.target", !0), frameGeneration = getGamePref(this.targetGameId, "vx.frameGeneration", !0), upscaleEnabled = upscaleTarget !== "native", frameGenerationEnabled = frameGeneration !== "off";
  if (!upscaleEnabled || !frameGenerationEnabled) return;
  if (settingKey === "vx.upscale.target") setGamePref(this.targetGameId, "vx.frameGeneration", "off", "ui"), Toast.show("Upscale e geração de frames não podem ser usados juntos. A geração de frames foi desligada.", "⚠️", { instant: !0 });
  else setGamePref(this.targetGameId, "vx.upscale.target", "native", "ui"), Toast.show("Upscale e geração de frames não podem ser usados juntos. O upscale foi definido como Stream nativo.", "⚠️", { instant: !0 });
 }
 updateStreamElement(key, onChanges, onChangeUis) {
  let info = this.SETTINGS[key];
  if (info.onChangeUi) if (onChangeUis) onChangeUis.add(info.onChangeUi);
   else info.onChangeUi();
  if (info.onChange && STATES.isPlaying) if (onChanges) onChanges.add(info.onChange);
   else info.onChange();
  let $elm = info.$element;
  if (!$elm) return;
  let value = getGamePref(this.targetGameId, key, !0);
  if ("setValue" in $elm) $elm.setValue(value);
  else $elm.value = value.toString();
  this.updateDataset($elm, key);
 }
 switchGameSettings(id) {
  if (setGameIdPref(id), this.targetGameId === id) return;
  let onChanges = new Set, onChangeUis = new Set, oldGameId = this.targetGameId;
  this.targetGameId = id;
  let key;
  for (key in this.SETTINGS) {
   if (!isStreamPref(key)) continue;
   let oldValue = getGamePref(oldGameId, key, !0), newValue = getGamePref(this.targetGameId, key, !0);
   if (oldValue === newValue) continue;
   this.updateStreamElement(key, onChanges, onChangeUis);
  }
  onChangeUis.forEach((fn) => fn && fn()), onChanges.forEach((fn) => fn && fn()), this.$tips.classList.toggle("bx-gone", id < 0);
 }
 setElement(pref, $elm) {
  if (!this.SETTINGS[pref]) this.SETTINGS[pref] = {};
  this.updateDataset($elm, pref), this.SETTINGS[pref].$element = $elm;
 }
 getElement(pref, params) {
  if (!this.SETTINGS[pref]) this.SETTINGS[pref] = {};
  let $elm = this.SETTINGS[pref].$element;
  if (!$elm) $elm = SettingElement.fromPref(pref, null, params), this.SETTINGS[pref].$element = $elm;
  return this.updateDataset($elm, pref), $elm;
 }
 hasElement(pref) {
  return !!this.SETTINGS[pref]?.$element;
 }
 updateDataset($elm, pref) {
  if (this.targetGameId === this.playingGameId && hasGamePref(this.playingGameId, pref)) $elm.dataset.override = "true";
  else delete $elm.dataset.override;
 }
 renderStreamSettingsSelection() {
  this.$tips = CE("p", { class: "bx-gone" }, `⇐ Ｑ ⟶: ${t("reset-highlighted-setting")}`);
  let $select = BxSelectElement.create(CE("select", !1, CE("optgroup", { label: t("settings-for") }, CE("option", { value: -1 }, t("all-games")))), !0);
  $select.addEventListener("input", (e) => {
   let id = parseInt($select.value);
   BxEventBus.Stream.emit("gameSettings.switched", { id });
  }), this.$streamSettingsSelection = CE("div", {
   class: "bx-stream-settings-selection bx-gone",
   _nearby: { orientation: "vertical" }
  }, CE("div", !1, $select), this.$tips), BxEventBus.Stream.on("xboxTitleId.changed", async ({ id }) => {
   this.playingGameId = id;
   let gameSettings = STORAGE.Stream.getGameSettings(id), selectedId = gameSettings && !gameSettings.isEmpty() ? id : -1;
   setGameIdPref(selectedId);
   let $optGroup = $select.querySelector("optgroup");
   while ($optGroup.childElementCount > 1)
    $optGroup.lastElementChild?.remove();
   if (id >= 0) {
    let title = id === 0 ? "Xbox" : await XboxApi.getProductTitle(id);
    $optGroup.appendChild(CE("option", {
     value: id
    }, title));
   }
   $select.value = selectedId.toString(), BxEventBus.Stream.emit("gameSettings.switched", { id: selectedId });
  });
 }
 getStreamSettingsSelection() {
  return this.$streamSettingsSelection;
 }
 getTargetGameId() {
  return this.targetGameId;
 }
}
function onChangeVideoPlayerType() {
 let playerType = getStreamPref("video.player.type"), processing = getStreamPref("video.processing"), settingsManager = SettingsManager.getInstance();
 if (!settingsManager.hasElement("video.processing")) return;
 let isDisabled = !1, $videoProcessing = settingsManager.getElement("video.processing"), $videoProcessingMode = settingsManager.getElement("video.processing.mode"), $videoSharpness = settingsManager.getElement("video.processing.sharpness"), $videoPowerPreference = settingsManager.getElement("video.player.powerPreference"), $videoMaxFps = settingsManager.getElement("video.maxFps"), $optCas = $videoProcessing.querySelector(`option[value=${"cas"}]`);
 if (playerType === "default") {
  if ($videoProcessing.value = "usm", setStreamPref("video.processing", "usm", "direct"), $optCas && ($optCas.disabled = !0), UserAgent.isSafari()) isDisabled = !0;
 } else $optCas && ($optCas.disabled = !1);
 $videoProcessing.disabled = isDisabled, $videoSharpness.dataset.disabled = isDisabled.toString(), $videoProcessingMode.closest(".bx-settings-row").classList.toggle("bx-gone", !(playerType === "webgl2" && processing === "cas")), $videoPowerPreference.closest(".bx-settings-row").classList.toggle("bx-gone", playerType !== "webgl2"), $videoMaxFps.closest(".bx-settings-row").classList.toggle("bx-gone", playerType === "default");
}
function onChangeVxFrameGeneration() {
 let settingsManager = SettingsManager.getInstance();
 if (!settingsManager.hasElement("vx.frameTargetFps")) return;
 settingsManager.getElement("vx.frameTargetFps").closest(".bx-settings-row").classList.remove("bx-gone");
}
var COMPETITIVE_DISABLED_PREFS = [
 "vx.upscale.target",
 "vx.upscale.algorithm",
 "vx.antiAliasing",
 "vx.artifactReduction",
 "vx.frameGeneration",
 "vx.adaptiveSharpen",
 "vx.dynamicReconstruction",
 "vx.temporalSuperResolution",
 "vx.hudProtection",
 "vx.frameTargetFps",
 "vx.fineDetailReconstruction"
];
function onChangeCompetitiveMode() {
 let settingsManager = SettingsManager.getInstance(), isCompetitive = getStreamPref("vx.competitiveMode");
 for (let pref of COMPETITIVE_DISABLED_PREFS) {
  if (!settingsManager.hasElement(pref)) continue;
  let $control = settingsManager.getElement(pref);
  $control.disabled = isCompetitive, $control.closest(".bx-settings-row")?.classList.toggle("bx-vx-competitive-locked", isCompetitive);
 }
}
function limitVideoPlayerFps(targetFps) {
 STATES.currentStream.streamPlayerManager?.getCanvasPlayer()?.setTargetFps(targetFps);
}
function getEffectiveVideoPlayerType() {
 if (getStreamPref("vx.competitiveMode")) return "default";
 let configuredType = getStreamPref("video.player.type"), needsVxCanvas = getStreamPref("vx.upscale.target") !== "native" || getStreamPref("vx.artifactReduction") > 0 || getStreamPref("vx.frameGeneration") === "2x" || getStreamPref("vx.frameGeneration") === "3x" || getStreamPref("vx.frameGeneration") === "4x" || getStreamPref("vx.frameGeneration") === "custom" || getStreamPref("vx.temporalSuperResolution") || getStreamPref("vx.fineDetailReconstruction") > 0 || getStreamPref("vx.antiAliasing") !== "off" || getStreamPref("vx.adaptiveSharpen") && getStreamPref("video.processing.sharpness") > 0;
 return getStreamPref("vx.temporalSuperResolution") || getStreamPref("vx.frameGeneration") === "2x" || getStreamPref("vx.frameGeneration") === "3x" || getStreamPref("vx.frameGeneration") === "4x" || getStreamPref("vx.frameGeneration") === "custom" || needsVxCanvas && configuredType === "default" ? "webgl2" : configuredType;
}
function applyCompetitiveMode(options) {
 if (!getStreamPref("vx.competitiveMode")) return options;
 return {
  ...options,
  processing: "usm",
  sharpness: 0,
  vxUpscaleTarget: "native",
  vxUpscaleAlgorithm: "vx",
  vxAntiAliasing: "off",
  vxArtifactReduction: 0,
  vxFrameGeneration: "off",
  vxAdaptiveSharpen: !1,
  vxDynamicReconstruction: !1,
  vxTemporalSuperResolution: !1,
  vxHudProtection: !1,
  vxFineDetailReconstruction: 0
 };
}
function updateVideoPlayer() {
 let streamPlayerManager = STATES.currentStream.streamPlayerManager;
 if (!streamPlayerManager) return;
 let frameGeneration = getStreamPref("vx.frameGeneration");
 if (frameGeneration === "auto") frameGeneration = "off", setStreamPref("vx.frameGeneration", frameGeneration, "direct");
 let options = {
  processing: getStreamPref("video.processing"),
  processingMode: getStreamPref("video.processing.mode"),
  sharpness: getStreamPref("video.processing.sharpness"),
  saturation: getStreamPref("video.saturation"),
  contrast: getStreamPref("video.contrast"),
  brightness: getStreamPref("video.brightness"),
  vxUpscaleTarget: getStreamPref("vx.upscale.target"),
  vxUpscaleAlgorithm: getStreamPref("vx.upscale.algorithm"),
  vxAntiAliasing: getStreamPref("vx.antiAliasing"),
  vxArtifactReduction: getStreamPref("vx.artifactReduction"),
  vxFrameGeneration: frameGeneration,
  vxLatencyBudget: getStreamPref("vx.latencyBudget"),
  vxAdaptiveSharpen: getStreamPref("vx.adaptiveSharpen"),
  vxDynamicReconstruction: getStreamPref("vx.dynamicReconstruction"),
  vxTemporalSuperResolution: getStreamPref("vx.temporalSuperResolution"),
  vxHudProtection: getStreamPref("vx.hudProtection"),
  vxFrameTargetFps: getStreamPref("vx.frameTargetFps"),
  vxFineDetailReconstruction: getStreamPref("vx.fineDetailReconstruction")
 };
 options = applyCompetitiveMode(options), streamPlayerManager.switchPlayerType(getEffectiveVideoPlayerType()), streamPlayerManager.updateOptions(options), streamPlayerManager.refreshPlayer(), limitVideoPlayerFps(getStreamPref("video.maxFps"));
}
function resizeVideoPlayer() {
 STATES.currentStream.streamPlayerManager?.resizePlayer();
}
window.addEventListener("resize", resizeVideoPlayer);
class NavigationDialog {
 dialogManager;
 onMountedCallbacks = [];
 constructor() {
  this.dialogManager = NavigationDialogManager.getInstance();
 }
 isCancellable() {
  return !0;
 }
 isOverlayVisible() {
  return !0;
 }
 show(configs = {}, clearStack = !1) {
  if (NavigationDialogManager.getInstance().show(this, configs, clearStack), !this.getFocusedElement()) this.focusIfNeeded();
 }
 hide() {
  NavigationDialogManager.getInstance().hide();
 }
 getFocusedElement() {
  let $activeElement = document.activeElement;
  if (!$activeElement) return null;
  if (this.$container.contains($activeElement)) return $activeElement;
  return null;
 }
 onBeforeMount(configs = {}) {}
 onMounted(configs = {}) {
  for (let callback of this.onMountedCallbacks)
   callback.call(this);
 }
 onBeforeUnmount() {}
 onUnmounted() {}
 handleKeyPress(key) {
  return !1;
 }
 handleGamepad(button) {
  return !1;
 }
}
class NavigationDialogManager {
 static instance;
 static getInstance = () => NavigationDialogManager.instance ?? (NavigationDialogManager.instance = new NavigationDialogManager);
 LOG_TAG = "NavigationDialogManager";
 static GAMEPAD_POLLING_INTERVAL = 50;
 static GAMEPAD_KEYS = [
  0,
  1,
  2,
  3,
  12,
  15,
  13,
  14,
  4,
  5,
  6,
  7,
  10,
  11,
  8,
  9
 ];
 static GAMEPAD_DIRECTION_MAP = {
  12: 1,
  13: 3,
  14: 4,
  15: 2,
  100: 1,
  101: 3,
  102: 4,
  103: 2
 };
 static SIBLING_PROPERTY_MAP = {
  horizontal: {
   4: "previousElementSibling",
   2: "nextElementSibling"
  },
  vertical: {
   1: "previousElementSibling",
   3: "nextElementSibling"
  }
 };
 gamepadPollingIntervalId = null;
 gamepadLastStates = [];
 gamepadHoldingIntervalId = null;
 menuComboPollingIntervalId = null;
 menuComboStates = {};
 $overlay;
 $container;
 dialog = null;
 dialogsStack = [];
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()"), this.$overlay = CE("div", { class: "bx-navigation-dialog-overlay bx-gone" }), this.$overlay.addEventListener("click", (e) => {
   e.preventDefault(), e.stopPropagation(), this.dialog?.isCancellable() && this.hide();
  }), document.documentElement.appendChild(this.$overlay), this.$container = CE("div", { class: "bx-navigation-dialog bx-gone" }), document.documentElement.appendChild(this.$container), this.$container.addEventListener("pointermove", () => this.updateActiveInput("mouse"), { passive: !0 }), this.$container.addEventListener("pointerdown", () => this.updateActiveInput("mouse"), { passive: !0 }), window.addEventListener(BxEvent.XCLOUD_GUIDE_MENU_SHOWN, (e) => this.hide()), new MutationObserver((mutationList) => {
   if (mutationList.length === 0 || mutationList[0].addedNodes.length === 0) return;
   let $dialog = mutationList[0].addedNodes[0];
   if (!$dialog || !($dialog instanceof HTMLElement)) return;
   calculateSelectBoxes($dialog);
  }).observe(this.$container, { childList: !0 }), this.startMenuComboPolling();
 }
 updateActiveInput(input) {
  document.documentElement.dataset.activeInput = input;
 }
 handleEvent(event) {
  switch (event.type) {
   case "keydown":
    this.updateActiveInput("keyboard");
    let $target = event.target, keyboardEvent = event, keyCode = keyboardEvent.code || keyboardEvent.key, handled = this.dialog?.handleKeyPress(keyCode);
    if (handled) {
     event.preventDefault(), event.stopPropagation();
     return;
    }
    if (keyCode === "ArrowUp" || keyCode === "ArrowDown") handled = !0, this.focusDirection(keyCode === "ArrowUp" ? 1 : 3);
    else if (keyCode === "ArrowLeft" || keyCode === "ArrowRight") {
     if (!($target instanceof HTMLInputElement && ($target.type === "text" || $target.type === "range"))) handled = !0, this.focusDirection(keyCode === "ArrowLeft" ? 4 : 2);
    } else if (keyCode === "Enter" || keyCode === "NumpadEnter" || keyCode === "Space") {
     if (!($target instanceof HTMLInputElement && $target.type === "text")) handled = !0, $target.dispatchEvent(new MouseEvent("click", { bubbles: !0 }));
    } else if (keyCode === "Escape") handled = !0, this.hide();
    if (handled) event.preventDefault(), event.stopPropagation();
    break;
  }
 }
 isShowing() {
  return this.$container && !this.$container.classList.contains("bx-gone");
 }
 startMenuComboPolling() {
  this.menuComboPollingIntervalId ??= window.setInterval(() => {
   if (STATES.isPlaying || this.isShowing()) return;
   for (let gamepad of window.navigator.getGamepads()) {
    if (!gamepad?.connected || gamepad.id === VIRTUAL_GAMEPAD_ID) continue;
    let pressed = !!gamepad.buttons[8]?.pressed && !!gamepad.buttons[9]?.pressed, wasPressed = !!this.menuComboStates[gamepad.index];
    if (this.menuComboStates[gamepad.index] = pressed, wasPressed && !pressed) window.BX_EXPOSED.openSettingsMenu?.();
   }
  }, NavigationDialogManager.GAMEPAD_POLLING_INTERVAL);
 }
 pollGamepad = () => {
  let gamepads = window.navigator.getGamepads();
  for (let gamepad of gamepads) {
   if (!gamepad || !gamepad.connected) continue;
   if (gamepad.id === VIRTUAL_GAMEPAD_ID) continue;
   let { axes, buttons } = gamepad, releasedButton = null, heldButton = null, lastState = this.gamepadLastStates[gamepad.index], lastTimestamp, lastKey, lastKeyPressed;
   if (lastState) [lastTimestamp, lastKey, lastKeyPressed] = lastState;
   if (lastTimestamp && lastTimestamp === gamepad.timestamp) continue;
   for (let key of NavigationDialogManager.GAMEPAD_KEYS)
    if (lastKey === key && !buttons[key].pressed) {
     releasedButton = key;
     break;
    } else if (buttons[key].pressed) {
     heldButton = key;
     break;
    }
   if (heldButton === null && releasedButton === null && axes && axes.length >= 2) {
    if (lastKey) {
     let releasedHorizontal = Math.abs(axes[0]) < 0.1 && (lastKey === 102 || lastKey === 103), releasedVertical = Math.abs(axes[1]) < 0.1 && (lastKey === 100 || lastKey === 101);
     if (releasedHorizontal || releasedVertical) releasedButton = lastKey;
     else heldButton = lastKey;
    } else if (axes[0] < -0.5) heldButton = 102;
    else if (axes[0] > 0.5) heldButton = 103;
    else if (axes[1] < -0.5) heldButton = 100;
    else if (axes[1] > 0.5) heldButton = 101;
   }
   if (heldButton !== null) {
    if (this.updateActiveInput("gamepad"), this.gamepadLastStates[gamepad.index] = [gamepad.timestamp, heldButton, !1], this.clearGamepadHoldingInterval(), NavigationDialogManager.GAMEPAD_DIRECTION_MAP[heldButton]) this.gamepadHoldingIntervalId = window.setInterval(() => {
      let lastState2 = this.gamepadLastStates[gamepad.index];
      if (lastState2) {
       if ([lastTimestamp, lastKey, lastKeyPressed] = lastState2, lastKey === heldButton) {
        this.handleGamepad(gamepad, heldButton);
        return;
       }
      }
      this.clearGamepadHoldingInterval();
     }, 100);
    continue;
   }
   if (releasedButton === null) {
    this.clearGamepadHoldingInterval();
    continue;
   }
   if (this.gamepadLastStates[gamepad.index] = null, lastKeyPressed) return;
   if (this.updateActiveInput("gamepad"), this.handleGamepad(gamepad, releasedButton)) return;
   if (releasedButton === 0) {
    document.activeElement?.dispatchEvent(new MouseEvent("click", { bubbles: !0 }));
    return;
   } else if (releasedButton === 1) {
    this.hide();
    return;
   }
  }
 };
 handleGamepad(gamepad, key) {
  let handled = this.dialog?.handleGamepad(key);
  if (handled) return !0;
  let direction = NavigationDialogManager.GAMEPAD_DIRECTION_MAP[key];
  if (!direction) return !1;
  if (document.activeElement instanceof HTMLInputElement && document.activeElement.type === "range") {
   let $range = document.activeElement;
   if (direction === 4 || direction === 2) {
    let $numberStepper = $range.closest(".bx-number-stepper");
    if ($numberStepper) BxNumberStepper.change.call($numberStepper, direction === 4 ? "dec" : "inc");
    else $range.value = (parseInt($range.value) + parseInt($range.step) * (direction === 4 ? -1 : 1)).toString(), $range.dispatchEvent(new InputEvent("input"));
    handled = !0;
   }
  }
  if (!handled) this.focusDirection(direction);
  return this.gamepadLastStates[gamepad.index] && (this.gamepadLastStates[gamepad.index][2] = !0), !0;
 }
 clearGamepadHoldingInterval() {
  this.gamepadHoldingIntervalId && window.clearInterval(this.gamepadHoldingIntervalId), this.gamepadHoldingIntervalId = null;
 }
 show(dialog, configs = {}, clearStack = !1) {
  this.clearGamepadHoldingInterval(), BxEventBus.Script.emit("dialog.shown", {}), window.BX_EXPOSED.disableGamepadPolling = !0, document.body.classList.add("bx-no-scroll"), this.unmountCurrentDialog(), this.dialogsStack.push(dialog), this.dialog = dialog, dialog.onBeforeMount(configs), this.$container.appendChild(dialog.getContent()), dialog.onMounted(configs), this.$overlay.classList.remove("bx-gone"), this.$overlay.classList.toggle("bx-invisible", !dialog.isOverlayVisible()), this.$container.classList.remove("bx-gone"), this.$container.addEventListener("keydown", this), this.startGamepadPolling();
 }
 hide() {
  if (this.clearGamepadHoldingInterval(), !this.isShowing()) return;
  if (document.body.classList.remove("bx-no-scroll"), BxEventBus.Script.emit("dialog.dismissed", {}), this.$overlay.classList.add("bx-gone"), this.$overlay.classList.remove("bx-invisible"), this.$container.classList.add("bx-gone"), this.$container.removeEventListener("keydown", this), this.stopGamepadPolling(), this.dialog) {
   let dialogIndex = this.dialogsStack.indexOf(this.dialog);
   if (dialogIndex > -1) this.dialogsStack = this.dialogsStack.slice(0, dialogIndex);
  }
  if (this.unmountCurrentDialog(), window.BX_EXPOSED.disableGamepadPolling = !1, this.dialogsStack.length) this.dialogsStack[this.dialogsStack.length - 1].show();
 }
 focus($elm) {
  if (!$elm) return !1;
  if ($elm.nearby && $elm.nearby.focus) if ($elm.nearby.focus instanceof HTMLElement) return this.focus($elm.nearby.focus);
   else return $elm.nearby.focus();
  return $elm.focus(), $elm === document.activeElement;
 }
 getOrientation($elm) {
  let nearby = $elm.nearby || {};
  if (nearby.selfOrientation) return nearby.selfOrientation;
  let orientation, $current = $elm.parentElement;
  while ($current !== this.$container) {
   let tmp = $current.nearby?.orientation;
   if ($current.nearby && tmp) {
    orientation = tmp;
    break;
   }
   $current = $current.parentElement;
  }
  return orientation = orientation || "vertical", setNearby($elm, {
   selfOrientation: orientation
  }), orientation;
 }
 findNextTarget($focusing, direction, checkParent = !1, checked = []) {
  if (!$focusing || $focusing === this.$container) return null;
  if (checked.includes($focusing)) return null;
  checked.push($focusing);
  let $target = $focusing, $parent = $target.parentElement, nearby = $target.nearby || {}, orientation = this.getOrientation($target);
  if (nearby[1] && direction === 1) return nearby[1];
  else if (nearby[3] && direction === 3) return nearby[3];
  else if (nearby[4] && direction === 4) return nearby[4];
  else if (nearby[2] && direction === 2) return nearby[2];
  let siblingProperty = NavigationDialogManager.SIBLING_PROPERTY_MAP[orientation][direction];
  if (siblingProperty) {
   let $sibling = $target;
   while ($sibling[siblingProperty]) {
    $sibling = $sibling[siblingProperty];
    let $focusable = this.findFocusableElement($sibling, direction);
    if ($focusable) return $focusable;
   }
  }
  if (nearby.loop) {
   if (nearby.loop(direction)) return null;
  }
  if (checkParent) return this.findNextTarget($parent, direction, checkParent, checked);
  return null;
 }
 findFocusableElement($elm, direction) {
  if (!$elm) return null;
  if (!!$elm.disabled) return null;
  if (!isElementVisible($elm)) return null;
  if ($elm.tabIndex > -1) return $elm;
  let focus = $elm.nearby?.focus;
  if (focus) {
   if (focus instanceof HTMLElement) return this.findFocusableElement(focus, direction);
   else if (typeof focus === "function") {
    if (focus()) return document.activeElement;
   }
  }
  let children = Array.from($elm.children), orientation = $elm.nearby?.orientation || "vertical";
  if (orientation === "horizontal" || orientation === "vertical" && direction === 1) children.reverse();
  for (let $child of children) {
   if (!$child || !($child instanceof HTMLElement)) return null;
   let $target = this.findFocusableElement($child, direction);
   if ($target) return $target;
  }
  return null;
 }
 startGamepadPolling() {
  this.stopGamepadPolling(), this.gamepadPollingIntervalId = window.setInterval(this.pollGamepad, NavigationDialogManager.GAMEPAD_POLLING_INTERVAL);
 }
 stopGamepadPolling() {
  this.gamepadLastStates = [], this.gamepadPollingIntervalId && window.clearInterval(this.gamepadPollingIntervalId), this.gamepadPollingIntervalId = null;
 }
 focusDirection(direction) {
  let dialog = this.dialog;
  if (!dialog) return;
  let $focusing = dialog.getFocusedElement();
  if (!$focusing || !this.findFocusableElement($focusing, direction)) return dialog.focusIfNeeded(), null;
  let $target = this.findNextTarget($focusing, direction, !0);
  this.focus($target);
 }
 unmountCurrentDialog() {
  let dialog = this.dialog;
  dialog && dialog.onBeforeUnmount(), this.$container.firstChild?.remove(), dialog && dialog.onUnmounted(), this.dialog = null;
 }
}
var LOG_TAG = "TouchController", GENERIC_PERSONAL_LAYOUT = {
 name: "Layout pessoal",
 author: "",
 content: {
  left: {
   inner: [{
    type: "joystick",
    axis: { input: "axisXY", output: "leftJoystick" }
   }],
   outer: [[
    { type: "button", action: "leftTrigger" },
    { type: "button", action: "leftBumper" }
   ]]
  },
  right: {
   inner: [{
    type: "joystick",
    axis: { input: "axisXY", output: "rightJoystick" }
   }],
   outer: [
    [{ type: "button", action: "rightTrigger" }, { type: "button", action: "rightBumper" }],
    { type: "button", action: "gamepadY" },
    { type: "button", action: "gamepadX" },
    { type: "button", action: "gamepadB" },
    { type: "button", action: "gamepadA" }
   ]
  },
  upper: {
   left: [{ type: "button", action: "view" }],
   right: [{ type: "button", action: "menu" }]
  }
 }
};
class TouchController {
 static #EVENT_SHOW_DEFAULT_CONTROLLER = new MessageEvent("message", {
  data: JSON.stringify({
   content: '{"layoutId":""}',
   target: "/streaming/touchcontrols/showlayoutv2",
   type: "Message"
  }),
  origin: "better-xcloud"
 });
 static #$style;
 static #enabled = !1;
 static #dataChannel;
 static #customLayouts = {};
 static #baseCustomLayouts = {};
 static #currentLayoutId;
 static #customList;
 static #xboxTitleId = null;
 static #getPersonalLayouts() {
  try {
   let layouts = JSON.parse(window.localStorage.getItem("BetterXcloud.TouchLayouts.Personal") || "{}");
   return layouts && typeof layouts === "object" ? layouts : {};
  } catch {
   return {};
  }
 }
 static #savePersonalLayouts(layouts) {
  window.localStorage.setItem("BetterXcloud.TouchLayouts.Personal", JSON.stringify(layouts));
 }
 static #mergePersonalLayouts(definition) {
  let titleId = TouchController.#xboxTitleId;
  if (!definition || !titleId) return definition;
  let personal = TouchController.#getPersonalLayouts()[titleId];
  if (personal) Object.assign(definition.layouts, personal);
  return definition;
 }
 static setXboxTitleId(xboxTitleId) {
  TouchController.#xboxTitleId = xboxTitleId;
 }
 static getCustomLayouts() {
  let xboxTitleId = TouchController.#xboxTitleId;
  if (!xboxTitleId) return null;
  return TouchController.#customLayouts[xboxTitleId];
 }
 static getCurrentLayoutId() {
  return TouchController.#currentLayoutId;
 }
 static createPersonalLayout(layoutId) {
  let titleId = TouchController.#xboxTitleId, definition = TouchController.getCustomLayouts();
  if (!titleId) return null;
  if (!definition) definition = {
    name: "Layout pessoal",
    product_id: titleId,
    default_layout: "bx-personal",
    layouts: {}
   }, TouchController.#customLayouts[titleId] = definition;
  let source = definition.layouts[layoutId || definition.default_layout] || GENERIC_PERSONAL_LAYOUT, personalLayouts = TouchController.#getPersonalLayouts(), layoutsForGame = personalLayouts[titleId] ||= {}, id = "bx-personal", copy = JSON.parse(JSON.stringify(source));
  return copy.name = `${source.name || "Layout"} (Pessoal)`, copy.author = "", layoutsForGame[id] = copy, TouchController.#savePersonalLayouts(personalLayouts), definition.layouts[id] = copy, id;
 }
 static updatePersonalLayout(layoutId, text) {
  let titleId = TouchController.#xboxTitleId, definition = TouchController.getCustomLayouts();
  if (!titleId || !definition || !layoutId.startsWith("bx-personal")) return !1;
  try {
   let layout = JSON.parse(text);
   if (!layout || typeof layout !== "object" || !layout.content || typeof layout.content !== "object") throw Error("Invalid layout");
   layout.name = typeof layout.name === "string" && layout.name.trim() ? layout.name.trim() : "Layout pessoal", layout.author = typeof layout.author === "string" ? layout.author : "";
   let personalLayouts = TouchController.#getPersonalLayouts();
   return (personalLayouts[titleId] ||= {})[layoutId] = layout, TouchController.#savePersonalLayouts(personalLayouts), definition.layouts[layoutId] = layout, !0;
  } catch {
   return !1;
  }
 }
 static removePersonalLayout(layoutId) {
  let titleId = TouchController.#xboxTitleId;
  if (!titleId || !layoutId.startsWith("bx-personal")) return !1;
  let personalLayouts = TouchController.#getPersonalLayouts();
  if (!personalLayouts[titleId]?.[layoutId]) return !1;
  return delete personalLayouts[titleId][layoutId], Object.keys(personalLayouts[titleId]).length || delete personalLayouts[titleId], TouchController.#savePersonalLayouts(personalLayouts), delete TouchController.#customLayouts[titleId]?.layouts[layoutId], !0;
 }
 static enable() {
  TouchController.#enabled = !0;
 }
 static disable() {
  TouchController.#enabled = !1;
 }
 static isEnabled() {
  return TouchController.#enabled;
 }
 static #showDefault() {
  TouchController.#dispatchMessage(TouchController.#EVENT_SHOW_DEFAULT_CONTROLLER);
 }
 static #show() {
  document.querySelector("#BabylonCanvasContainer-main")?.parentElement?.classList.remove("bx-offscreen");
 }
 static toggleVisibility() {
  if (!TouchController.#dataChannel) return !1;
  let $container = document.querySelector("#BabylonCanvasContainer-main")?.parentElement;
  if (!$container) return !1;
  return $container.classList.toggle("bx-offscreen"), !$container.classList.contains("bx-offscreen");
 }
 static reset() {
  TouchController.#enabled = !1, TouchController.#dataChannel = null, TouchController.#xboxTitleId = null, TouchController.#$style && (TouchController.#$style.textContent = "");
 }
 static #dispatchMessage(msg) {
  TouchController.#dataChannel && window.setTimeout(() => {
   TouchController.#dataChannel.dispatchEvent(msg);
  }, 10);
 }
 static #dispatchLayouts(data) {
  TouchController.applyCustomLayout(null, 1000), BxEvent.dispatch(window, BxEvent.CUSTOM_TOUCH_LAYOUTS_LOADED);
 }
 static async requestCustomLayouts(retries = 1) {
  let xboxTitleId = TouchController.#xboxTitleId;
  if (!xboxTitleId) return;
  if (xboxTitleId in TouchController.#customLayouts) {
   TouchController.#dispatchLayouts(TouchController.#customLayouts[xboxTitleId]);
   return;
  }
  if (retries = retries || 1, retries > 2) {
   TouchController.#customLayouts[xboxTitleId] = null, window.setTimeout(() => TouchController.#dispatchLayouts(null), 1000);
   return;
  }
  try {
   let json = await (await NATIVE_FETCH(GhPagesUtils.getUrl(`touch-layouts/${xboxTitleId}.json`))).json(), layouts = {};
   await Promise.all(json.layouts.map(async (layoutName) => {
    let baseLayouts = {};
    if (layoutName in TouchController.#baseCustomLayouts) baseLayouts = TouchController.#baseCustomLayouts[layoutName];
    else try {
      let layoutUrl = GhPagesUtils.getUrl(`touch-layouts/layouts/${layoutName}.json`);
      baseLayouts = (await (await NATIVE_FETCH(layoutUrl)).json()).layouts, TouchController.#baseCustomLayouts[layoutName] = baseLayouts;
     } catch (e) {}
    Object.assign(layouts, baseLayouts);
   })), json.layouts = layouts, TouchController.#customLayouts[xboxTitleId] = TouchController.#mergePersonalLayouts(json), window.setTimeout(() => TouchController.#dispatchLayouts(json), 1000);
  } catch (e) {
   TouchController.requestCustomLayouts(retries + 1);
  }
 }
 static applyCustomLayout(layoutId, delay = 0) {
  if (!window.BX_EXPOSED.touchLayoutManager) {
   let listener = (e) => {
    if (TouchController.#enabled) TouchController.applyCustomLayout(layoutId, 0);
   };
   window.addEventListener(BxEvent.TOUCH_LAYOUT_MANAGER_READY, listener, { once: !0 });
   return;
  }
  let xboxTitleId = TouchController.#xboxTitleId;
  if (!xboxTitleId) {
   BxLogger.error(LOG_TAG, "Invalid xboxTitleId");
   return;
  }
  if (!layoutId) layoutId = TouchController.#customLayouts[xboxTitleId]?.default_layout || null;
  if (!layoutId) {
   BxLogger.warning(LOG_TAG, "Invalid layoutId, show default controller"), TouchController.#enabled && TouchController.#showDefault();
   return;
  }
  let layoutChanged = TouchController.#currentLayoutId !== layoutId;
  TouchController.#currentLayoutId = layoutId;
  let layoutData = TouchController.#customLayouts[xboxTitleId];
  if (!xboxTitleId || !layoutId || !layoutData) {
   TouchController.#enabled && TouchController.#showDefault();
   return;
  }
  let layout = layoutData.layouts[layoutId] || layoutData.layouts[layoutData.default_layout];
  if (!layout) return;
  let msg, html = !1;
  if (layout.author) {
   let author = `<b>${escapeHtml(layout.author)}</b>`;
   msg = t("touch-control-layout-by", { name: author }), html = !0;
  } else msg = t("touch-control-layout");
  layoutChanged && Toast.show(msg, layout.name, { html }), window.setTimeout(() => {
   window.BX_EXPOSED.shouldShowSensorControls = JSON.stringify(layout).includes("gyroscope"), window.BX_EXPOSED.touchLayoutManager.changeLayoutForScope({
    type: "showLayout",
    scope: xboxTitleId,
    subscope: "base",
    layout: {
     id: "System.Standard",
     displayName: "System",
     layoutFile: layout
    }
   });
  }, delay);
 }
 static updateCustomList() {
  TouchController.#customList = GhPagesUtils.getTouchControlCustomList();
 }
 static getCustomList() {
  return TouchController.#customList;
 }
 static hasCustomControl(productId) {
  return TouchController.#customList?.includes(productId);
 }
 static setup() {
  window.testTouchLayout = (layout) => {
   let { touchLayoutManager } = window.BX_EXPOSED;
   touchLayoutManager && touchLayoutManager.changeLayoutForScope({
    type: "showLayout",
    scope: "" + TouchController.#xboxTitleId,
    subscope: "base",
    layout: {
     id: "System.Standard",
     displayName: "Custom",
     layoutFile: layout
    }
   });
  };
  let $style = document.createElement("style");
  document.documentElement.appendChild($style), TouchController.#$style = $style;
  let PREF_STYLE_STANDARD = getGlobalPref("touchController.style.standard"), PREF_STYLE_CUSTOM = getGlobalPref("touchController.style.custom");
  BxEventBus.Stream.on("dataChannelCreated", (payload) => {
   let { dataChannel } = payload;
   if (dataChannel?.label !== "message") return;
   let filter = "";
   if (TouchController.#enabled) {
    if (PREF_STYLE_STANDARD === "white") filter = "grayscale(1) brightness(2)";
    else if (PREF_STYLE_STANDARD === "muted") filter = "sepia(0.5)";
   } else if (PREF_STYLE_CUSTOM === "muted") filter = "sepia(0.5)";
   if (filter) $style.textContent = `#babylon-canvas { filter: ${filter} !important; }`;
   else $style.textContent = "";
   TouchController.#dataChannel = dataChannel, dataChannel.addEventListener("open", () => {
    window.setTimeout(TouchController.#show, 1000);
   });
   let focused = !1;
   dataChannel.addEventListener("message", (msg) => {
    if (msg.origin === "better-xcloud" || typeof msg.data !== "string") return;
    if (msg.data.includes("touchcontrols/showtitledefault")) {
     if (TouchController.#enabled) if (focused) TouchController.requestCustomLayouts();
      else TouchController.#showDefault();
     return;
    }
    try {
     if (msg.data.includes("/titleinfo")) {
      let json = JSON.parse(JSON.parse(msg.data).content);
      if (focused = json.focused, !json.focused) TouchController.#show();
      TouchController.setXboxTitleId(parseInt(json.titleid, 16).toString());
     }
    } catch (e) {
     BxLogger.error(LOG_TAG, "Load custom layout", e);
    }
   });
  });
 }
}
var controller_customization_default = "var shareButtonPressed=currentGamepad.buttons[17]?.pressed,shareButtonHandled=!1,xCloudGamepad=$xCloudGamepadVar$;if(currentGamepad.id in window.BX_STREAM_SETTINGS.controllers){let controller=window.BX_STREAM_SETTINGS.controllers[currentGamepad.id];if(controller?.customization){let{mapping,ranges}=controller.customization,pressedButtons={},releasedButtons={},isModified=!1;if(ranges.LeftTrigger){let[from,to]=ranges.LeftTrigger;xCloudGamepad.LeftTrigger=xCloudGamepad.LeftTrigger>to?1:xCloudGamepad.LeftTrigger,xCloudGamepad.LeftTrigger=xCloudGamepad.LeftTrigger<from?0:xCloudGamepad.LeftTrigger}if(ranges.RightTrigger){let[from,to]=ranges.RightTrigger;xCloudGamepad.RightTrigger=xCloudGamepad.RightTrigger>to?1:xCloudGamepad.RightTrigger,xCloudGamepad.RightTrigger=xCloudGamepad.RightTrigger<from?0:xCloudGamepad.RightTrigger}if(ranges.LeftThumb){let[from,to]=ranges.LeftThumb,{LeftThumbXAxis:xAxis,LeftThumbYAxis:yAxis}=xCloudGamepad,range=Math.abs(Math.sqrt(xAxis*xAxis+yAxis*yAxis)),newRange=range>to?1:range;if(newRange=newRange<from?0:newRange,newRange!==range)xCloudGamepad.LeftThumbXAxis=xAxis*(newRange/range),xCloudGamepad.LeftThumbYAxis=yAxis*(newRange/range)}if(ranges.RightThumb){let[from,to]=ranges.RightThumb,{RightThumbXAxis:xAxis,RightThumbYAxis:yAxis}=xCloudGamepad,range=Math.abs(Math.sqrt(xAxis*xAxis+yAxis*yAxis)),newRange=range>to?1:range;if(newRange=newRange<from?0:newRange,newRange!==range)xCloudGamepad.RightThumbXAxis=xAxis*(newRange/range),xCloudGamepad.RightThumbYAxis=yAxis*(newRange/range)}if(shareButtonPressed&&\"Share\"in mapping){let targetButton=mapping.Share;if(typeof targetButton===\"string\")pressedButtons[targetButton]=1;shareButtonHandled=!0,delete mapping.Share}let key;for(key in mapping){let mappedKey=mapping[key];if(key===\"LeftStickAxes\"||key===\"RightStickAxes\"){let sourceX,sourceY,targetX,targetY;if(key===\"LeftStickAxes\")sourceX=\"LeftThumbXAxis\",sourceY=\"LeftThumbYAxis\",targetX=\"RightThumbXAxis\",targetY=\"RightThumbYAxis\";else sourceX=\"RightThumbXAxis\",sourceY=\"RightThumbYAxis\",targetX=\"LeftThumbXAxis\",targetY=\"LeftThumbYAxis\";if(typeof mappedKey===\"string\"){let rangeX=xCloudGamepad[sourceX],rangeY=xCloudGamepad[sourceY];if(Math.abs(Math.sqrt(rangeX*rangeX+rangeY*rangeY))>=0.1)pressedButtons[targetX]=rangeX,pressedButtons[targetY]=rangeY}releasedButtons[sourceX]=0,releasedButtons[sourceY]=0,isModified=!0}else if(typeof mappedKey===\"string\"){let pressed=!1,value=0;if(key===\"LeftTrigger\"||key===\"RightTrigger\"){let currentRange=xCloudGamepad[key];if(mappedKey===\"LeftTrigger\"||mappedKey===\"RightTrigger\")pressed=currentRange>=0.1,value=currentRange;else pressed=!0,value=currentRange>=0.9?1:0}else if(xCloudGamepad[key])pressed=!0,value=xCloudGamepad[key];if(pressed)pressedButtons[mappedKey]=value,releasedButtons[key]=0,isModified=!0}else if(mappedKey===!1)pressedButtons[key]=0,isModified=!0}isModified&&Object.assign(xCloudGamepad,releasedButtons,pressedButtons)}}if(shareButtonPressed&&!shareButtonHandled)window.dispatchEvent(new Event(BxEvent.CAPTURE_SCREENSHOT));\n";
var poll_gamepad_default = "var self=this;if(window.BX_EXPOSED.disableGamepadPolling){self.inputConfiguration.useIntervalWorkerThreadForInput&&self.intervalWorker?self.intervalWorker.scheduleTimer(50):self.pollGamepadssetTimeoutTimerID=window.setTimeout(self.pollGamepads,50);return}var currentGamepad=$gamepadVar$,btnSelect=currentGamepad.buttons[8],btnStart=currentGamepad.buttons[9];if(btnSelect&&btnStart){if(!self.bxMenuComboStates)self.bxMenuComboStates={};let comboIntervalMs=0;if(btnSelect.pressed&&btnStart.pressed)self.bxMenuComboStates[currentGamepad.index]=!0,comboIntervalMs=16;else if(self.bxMenuComboStates[currentGamepad.index])self.bxMenuComboStates[currentGamepad.index]=!1,window.BX_EXPOSED.openSettingsMenu?.(),comboIntervalMs=100;if(comboIntervalMs){self.inputConfiguration.useIntervalWorkerThreadForInput&&self.intervalWorker?self.intervalWorker.scheduleTimer(comboIntervalMs):self.pollGamepadssetTimeoutTimerID=setTimeout(self.pollGamepads,comboIntervalMs);return}}var btnHome=currentGamepad.buttons[16];if(btnHome){if(!self.bxHomeStates)self.bxHomeStates={};let intervalMs=0,hijack=!1;if(btnHome.pressed)if(hijack=!0,intervalMs=16,self.gamepadIsIdle.set(currentGamepad.index,!1),self.bxHomeStates[currentGamepad.index]){let lastTimestamp=self.bxHomeStates[currentGamepad.index].timestamp;if(currentGamepad.timestamp!==lastTimestamp){if(self.bxHomeStates[currentGamepad.index].timestamp=currentGamepad.timestamp,window.BX_EXPOSED.handleControllerShortcut(currentGamepad))self.bxHomeStates[currentGamepad.index].shortcutPressed+=1}}else window.BX_EXPOSED.resetControllerShortcut(currentGamepad.index),self.bxHomeStates[currentGamepad.index]={shortcutPressed:0,timestamp:currentGamepad.timestamp};else if(self.bxHomeStates[currentGamepad.index]){hijack=!0;let info=structuredClone(self.bxHomeStates[currentGamepad.index]);if(self.bxHomeStates[currentGamepad.index]=null,info.shortcutPressed===0){let fakeGamepadMappings=[{GamepadIndex:currentGamepad.index,A:0,B:0,X:0,Y:0,LeftShoulder:0,RightShoulder:0,LeftTrigger:0,RightTrigger:0,View:0,Menu:0,LeftThumb:0,RightThumb:0,DPadUp:0,DPadDown:0,DPadLeft:0,DPadRight:0,Nexus:1,LeftThumbXAxis:0,LeftThumbYAxis:0,RightThumbXAxis:0,RightThumbYAxis:0,PhysicalPhysicality:0,VirtualPhysicality:0,Dirty:!0,Virtual:!1}];intervalMs=currentGamepad.timestamp-info.timestamp>=500?500:100,self.inputSink.onGamepadInput(performance.now()-intervalMs,fakeGamepadMappings)}else intervalMs=window.BX_STREAM_SETTINGS.controllerPollingRate}if(hijack&&intervalMs){self.inputConfiguration.useIntervalWorkerThreadForInput&&self.intervalWorker?self.intervalWorker.scheduleTimer(intervalMs):self.pollGamepadssetTimeoutTimerID=setTimeout(self.pollGamepads,intervalMs);return}}\n";
var expose_stream_session_default = 'var self=this;window.BX_EXPOSED.streamSession=self;var orgSetMicrophoneState=self.setMicrophoneState.bind(self);self.setMicrophoneState=(state)=>{orgSetMicrophoneState(state),window.BxEventBus.Stream.emit("microphone.state.changed",{state})};window.dispatchEvent(new Event(BxEvent.STREAM_SESSION_READY));var updateDimensionsStr=self.updateDimensions.toString();if(updateDimensionsStr.startsWith("function "))updateDimensionsStr=updateDimensionsStr.substring(9);var renderTargetVar=updateDimensionsStr.match(/if\\((\\w+)\\){/)[1];updateDimensionsStr=updateDimensionsStr.replaceAll(renderTargetVar+".scroll","scroll");updateDimensionsStr=updateDimensionsStr.replace(`if(${renderTargetVar}){`,`\nif (${renderTargetVar}) {\nconst scrollWidth = ${renderTargetVar}.dataset.width ? parseInt(${renderTargetVar}.dataset.width) : ${renderTargetVar}.scrollWidth;\nconst scrollHeight = ${renderTargetVar}.dataset.height ? parseInt(${renderTargetVar}.dataset.height) : ${renderTargetVar}.scrollHeight;\n`);eval(`this.updateDimensions = function ${updateDimensionsStr}`);\n';
var game_card_icons_default = `var supportedInputIcons=$supportedInputIcons$,productId=$productId$;supportedInputIcons.shift();if(window.BX_EXPOSED.localCoOpManager.isSupported(productId))supportedInputIcons.push(window.BX_EXPOSED.createReactLocalCoOpIcon);`;
var local_co_op_enable_default = 'this.orgOnGamepadChanged=this.onGamepadChanged;this.orgOnGamepadInput=this.onGamepadInput;var match,onGamepadChangedStr=this.onGamepadChanged.toString();if(onGamepadChangedStr.startsWith("function "))onGamepadChangedStr=onGamepadChangedStr.substring(9);onGamepadChangedStr=onGamepadChangedStr.replaceAll("0","arguments[1]");eval(`this.patchedOnGamepadChanged = function ${onGamepadChangedStr}`);var onGamepadInputStr=this.onGamepadInput.toString();if(onGamepadInputStr.startsWith("function "))onGamepadInputStr=onGamepadInputStr.substring(9);match=onGamepadInputStr.match(/(\\w+\\.GamepadIndex)/);if(match){let gamepadIndexVar=match[0];onGamepadInputStr=onGamepadInputStr.replace("this.gamepadStates.get(",`this.gamepadStates.get(${gamepadIndexVar},`),eval(`this.patchedOnGamepadInput = function ${onGamepadInputStr}`),BxLogger.info("supportLocalCoOp","✅ Successfully patched local co-op support")}else BxLogger.error("supportLocalCoOp","❌ Unable to patch local co-op support");this.toggleLocalCoOp=(enable)=>{BxLogger.info("toggleLocalCoOp",enable?"Enabled":"Disabled"),this.onGamepadChanged=enable?this.patchedOnGamepadChanged:this.orgOnGamepadChanged,this.onGamepadInput=enable?this.patchedOnGamepadInput:this.orgOnGamepadInput;let gamepads=window.navigator.getGamepads();for(let gamepad of gamepads){if(!gamepad?.connected)continue;if(gamepad.id.includes("Better xCloud"))continue;gamepad._noToast=!0,window.dispatchEvent(new GamepadEvent("gamepaddisconnected",{gamepad})),window.dispatchEvent(new GamepadEvent("gamepadconnected",{gamepad}))}};window.BX_EXPOSED.toggleLocalCoOp=this.toggleLocalCoOp.bind(null);\n';
var remote_play_keep_alive_default = `try{if(JSON.parse(e).reason==="WarningForBeingIdle"&&window.location.pathname.includes("/play/consoles/launch/")){this.sendKeepAlive();return}}catch(ex){console.log(ex)}`;
var vibration_adjust_default = `if(e?.gamepad?.connected){let gamepadSettings=window.BX_STREAM_SETTINGS.controllers[e.gamepad.id];if(gamepadSettings?.customization){let intensity=gamepadSettings.customization.vibrationIntensity;if(intensity<=0){e.repeat=0;return}else if(intensity<1)e.leftMotorPercent*=intensity,e.rightMotorPercent*=intensity,e.leftTriggerMotorPercent*=intensity,e.rightTriggerMotorPercent*=intensity}}`;
var stream_hud_default = `window.BX_EXPOSED.showStreamMenu=$onShowStreamMenu$;$guideUI$=null;window.BX_EXPOSED.reactUseEffect(()=>{window.BxEventBus.Stream.emit("ui.streamHud.rendered",{expanded:$offset$.x===0})});`;
var create_portal_default = `var $dom=arguments[1];if($dom&&$dom instanceof HTMLElement&&$dom.id==="gamepass-dialog-root"){let showing=!1,$dialog=$dom.firstElementChild?.firstElementChild;if($dialog)showing=!$dialog.className.includes("pageChangeExit");window.BxEventBus.Script.emit(showing?"dialog.shown":"dialog.dismissed",{})}`;
class PatcherUtils {
 static indexOf(txt, searchString, startIndex, maxRange = 0, after = !1) {
  if (startIndex < 0) return -1;
  let index = txt.indexOf(searchString, startIndex);
  if (index < 0 || maxRange && index - startIndex > maxRange) return -1;
  return after ? index + searchString.length : index;
 }
 static lastIndexOf(txt, searchString, startIndex, maxRange = 0, after = !1) {
  if (startIndex < 0) return -1;
  let index = txt.lastIndexOf(searchString, startIndex);
  if (index < 0 || maxRange && startIndex - index > maxRange) return -1;
  return after ? index + searchString.length : index;
 }
 static insertAt(txt, index, insertString) {
  return txt.substring(0, index) + insertString + txt.substring(index);
 }
 static replaceWith(txt, index, fromString, toString) {
  return txt.substring(0, index) + toString + txt.substring(index + fromString.length);
 }
 static replaceAfterIndex(txt, search, replaceWith, index) {
  let before = txt.slice(0, index), after = txt.slice(index).replace(search, replaceWith);
  return before + after;
 }
 static filterPatches(patches) {
  return patches.filter((item2) => !!item2);
 }
 static patchBeforePageLoad(str, page) {
  let index = str.indexOf(`chunkName:()=>"${page}-page",`);
  if (index < 0) return !1;
  return str = PatcherUtils.replaceAfterIndex(str, "requireAsync(e){", `requireAsync(e){window.BX_EXPOSED.beforePageLoad("${page}");`, index), str = PatcherUtils.replaceAfterIndex(str, "requireSync(e){", `requireSync(e){window.BX_EXPOSED.beforePageLoad("${page}");`, index), str;
 }
 static isVarCharacter(char) {
  let code = char.charCodeAt(0), isUppercase = code >= 65 && code <= 90, isLowercase = code >= 97 && code <= 122, isDigit = code >= 48 && code <= 57;
  return isUppercase || isLowercase || isDigit || (char === "_" || char === "$");
 }
 static getVariableNameBefore(str, index) {
  if (index < 0) return null;
  let end = index, start = end - 1;
  while (PatcherUtils.isVarCharacter(str[start]))
   start -= 1;
  return str.substring(start + 1, end);
 }
 static getVariableNameAfter(str, index) {
  if (index < 0) return null;
  let start = index, end = start + 1;
  while (PatcherUtils.isVarCharacter(str[end]))
   end += 1;
  return str.substring(start, end);
 }
 static injectUseEffect(str, index, group, eventName, separator = ";") {
  let newCode = `window.BX_EXPOSED.reactUseEffect(() => window.BxEventBus.${group}.emit('${eventName}', {}), [])${separator}`;
  return str = PatcherUtils.insertAt(str, index, newCode), str;
 }
 static findAndParseParams(str, index, maxRange) {
  let substr = str.substring(index, index + maxRange), startIndex = substr.indexOf("({");
  if (startIndex < 0) return !1;
  startIndex += 1;
  let endIndex = substr.indexOf("})", startIndex);
  if (endIndex < 0) return !1;
  endIndex += 1;
  try {
   let input = substr.substring(startIndex, endIndex);
   return PatcherUtils.parseObjectVariables(input);
  } catch {
   return null;
  }
 }
 static parseObjectVariables(input) {
  try {
   let pairs = [...input.matchAll(/(\w+)\s*:\s*([a-zA-Z_$][\w$]*)/g)], result = {};
   for (let [_, key, value] of pairs)
    result[key] = value;
   return result;
  } catch {
   return null;
  }
 }
}
var LOG_TAG2 = "Patcher", PATCHES = {
 disableAiTrack(str) {
  let text = ".track=function(", index = str.indexOf('"AppInsightsCore.initialize"');
  if (index > -1 && (index = PatcherUtils.indexOf(str, '"AppInsightsCore.track"', index)), index > -1 && (index = PatcherUtils.lastIndexOf(str, text, index, 300)), index < 0) return !1;
  return PatcherUtils.replaceWith(str, index, text, ".track=function(e){},!!function(");
 },
 disableTelemetryProvider(str) {
  let text = "this.enableLightweightTelemetry=!";
  if (!str.includes(text)) return !1;
  let newCode = [
   "this.trackEvent",
   "this.trackPageView",
   "this.trackHttpCompleted",
   "this.trackHttpFailed",
   "this.trackError",
   "this.trackErrorLike",
   "this.onTrackEvent",
   "()=>{}"
  ].join("=");
  return str.replace(text, newCode + ";" + text);
 },
 disableIndexDbLogging(str) {
  let text = ",this.logsDb=new";
  if (!str.includes(text)) return !1;
  let newCode = ",this.log=()=>{}";
  return str.replace(text, newCode + text);
 },
 websiteLayout(str) {
  let text = '?"tv":"default"';
  if (!str.includes(text)) return !1;
  let layout = getGlobalPref("ui.layout") === "tv" ? "tv" : "default";
  return str.replace(text, `?"${layout}":"${layout}"`);
 },
 remotePlayPostStreamRedirectUrl(str) {
  let text = ".RemotePlayRoot.getLink()):";
  if (!str.includes(text)) return !1;
  return str = str.replace(text, ".Home.getLink()):"), str;
 },
 remotePlayKeepAlive(str) {
  let text = "onServerDisconnectMessage(e){";
  if (!str.includes(text)) return !1;
  return str = str.replace(text, text + remote_play_keep_alive_default), str;
 },
 cloudStreamKeepAlive(str) {
  if (!str.includes("onServerDisconnectMessage(e){")) return !1;
  let cloudKeepAliveCode = remote_play_keep_alive_default.replace("window.location.pathname.includes('/play/consoles/launch/')", "window.location.pathname.includes('/play/launch/')");
  return str.replace("onServerDisconnectMessage(e){", "onServerDisconnectMessage(e){" + cloudKeepAliveCode);
 },
 remotePlayDisableAchievementToast(str) {
  let text = ".AchievementUnlock:{";
  if (!str.includes(text)) return !1;
  let newCode = "if (window.location.pathname.includes('/play/consoles/launch/')) return;";
  return str.replace(text, text + newCode);
 },
 blockWebRtcStatsCollector(str) {
  let text = "this.shouldCollectStats=!0";
  if (!str.includes(text)) return !1;
  return str.replace(text, "this.shouldCollectStats=!1");
 },
 patchPollGamepads(str) {
  let index = str.indexOf('()(this,"pollGamepads",');
  if (index < 0) return !1;
  let setTimeoutIndex = str.indexOf("setTimeout(this.pollGamepads", index);
  if (setTimeoutIndex < 0) return !1;
  let codeBlock = str.substring(index, setTimeoutIndex), tmp = str.substring(setTimeoutIndex, setTimeoutIndex + 150), tmpPatched = tmp.replaceAll("Math.max(0,4-", "Math.max(0,window.BX_STREAM_SETTINGS.controllerPollingRate - ");
  if (str = PatcherUtils.replaceWith(str, setTimeoutIndex, tmp, tmpPatched), getGlobalPref("block.tracking")) codeBlock = codeBlock.replace("this.inputPollingIntervalStats.addValue", ""), codeBlock = codeBlock.replace("this.inputPollingDurationStats.addValue", "");
  let match = codeBlock.match(/this\.gamepadTimestamps\.set\(([A-Za-z0-9_$]+)\.index/);
  if (!match) return !1;
  let newCode = renderString(poll_gamepad_default, {
   gamepadVar: match[1]
  });
  if (codeBlock = codeBlock.replace("this.gamepadTimestamps.set", newCode + "this.gamepadTimestamps.set"), match = codeBlock.match(/let ([A-Za-z0-9_$]+)=this\.gamepadMappings\.find/), !match) return !1;
  let xCloudGamepadVar = match[1], inputFeedbackManager = PatcherUtils.indexOf(codeBlock, "this.inputFeedbackManager.onGamepadConnected(", 0, 1e4), backetIndex = PatcherUtils.indexOf(codeBlock, "}", inputFeedbackManager, 100);
  if (backetIndex < 0) return !1;
  let customizationCode = ";";
  return customizationCode += renderString(controller_customization_default, { xCloudGamepadVar }), codeBlock = PatcherUtils.insertAt(codeBlock, backetIndex, customizationCode), str = str.substring(0, index) + codeBlock + str.substring(setTimeoutIndex), str;
 },
 enableXcloudLogger(str) {
  let index = str.indexOf("this.telemetryProvider.trackErrorLike");
  if (index > -1 && (index = PatcherUtils.lastIndexOf(str, "}log(", index, 1500)), index > -1 && (index = PatcherUtils.indexOf(str, "{", index, 30, !0)), index < 0) return !1;
  let newCode = `
const [logTag, logLevel, logMessage] = Array.from(arguments);
const logFunc = [console.debug, console.log, console.warn, console.error][logLevel];
logFunc(logTag, '//', logMessage);
`;
  return str = PatcherUtils.insertAt(str, index, newCode), str;
 },
 enableConsoleLogging(str) {
  let text = "static isConsoleLoggingAllowed(){";
  if (!str.includes(text)) return !1;
  return str = str.replaceAll(text, text + "return true;"), str;
 },
 playVibration(str) {
  let text = "}playVibration(e){";
  if (!str.includes(text)) return !1;
  return str = str.replaceAll(text, text + vibration_adjust_default), str;
 },
 disableGamepadDisconnectedScreen(str) {
  let index = str.indexOf('"GamepadDisconnected_Title",');
  if (index < 0) return !1;
  let constIndex = PatcherUtils.lastIndexOf(str, "const[", index, 100);
  if (constIndex < 0) return !1;
  return str = PatcherUtils.insertAt(str, constIndex, "e();return null;"), str;
 },
 patchUpdateInputConfigurationAsync(str) {
  let text = "async updateInputConfigurationAsync(e){";
  if (!str.includes(text)) return !1;
  let newCode = "e.enableTouchInput = true;";
  return str = str.replace(text, text + newCode), str;
 },
 disableStreamGate(str) {
  let index = str.indexOf('case"partially-ready":');
  if (index < 0) return !1;
  let bracketIndex = str.indexOf("=>{", index - 150) + 3;
  return str = str.substring(0, bracketIndex) + "return 0;" + str.substring(bracketIndex), str;
 },
 exposeTouchLayoutManager(str) {
  let text = "this._perScopeLayoutsStream=new";
  if (!str.includes(text)) return !1;
  let newCode = `
true;
window.BX_EXPOSED["touchLayoutManager"] = this;
window.dispatchEvent(new Event("${BxEvent.TOUCH_LAYOUT_MANAGER_READY}"));
`;
  return str = str.replace(text, newCode + text), str;
 },
 patchBabylonRendererClass(str) {
  let index = str.indexOf(".current.render(),");
  if (index < 0) return !1;
  index -= 1;
  let newCode = `
if (window.BX_EXPOSED.stopTakRendering) {
  try {
    document.getElementById('BabylonCanvasContainer-main')?.parentElement.classList.add('bx-offscreen');
    ${str[index]}.current.dispose();
  } catch (e) {}
  window.BX_EXPOSED.stopTakRendering = false;
  return;
}
`;
  return str = str.substring(0, index) + newCode + str.substring(index), str;
 },
 supportLocalCoOp(str) {
  let text = "this.gamepadMappingsToSend=[],";
  if (!str.includes(text)) return !1;
  let newCode = `true; ${local_co_op_enable_default}; true,`;
  return str = str.replace(text, text + newCode), str;
 },
 forceFortniteConsole(str) {
  let text = "sendTouchInputEnabledMessage(e){";
  if (!str.includes(text)) return !1;
  let newCode = "window.location.pathname.includes('/launch/fortnite/') && (e = false);";
  return str = str.replace(text, text + newCode), str;
 },
 disableTakRenderer(str) {
  let text = "const{TakRenderer:";
  if (!str.includes(text)) return !1;
  let autoOffCode = "";
  if (getGlobalPref("touchController.mode") === "off") autoOffCode = "return;";
  else if (getGlobalPref("touchController.autoOff")) autoOffCode = `
const gamepads = window.navigator.getGamepads();
let gamepadFound = false;
for (let gamepad of gamepads) {
  if (gamepad && gamepad.connected) {
    gamepadFound = true;
    break;
  }
}
if (gamepadFound) {
  return;
}
`;
  let newCode = `
${autoOffCode}
const titleInfo = window.BX_EXPOSED.getTitleInfo();
if (titleInfo && !titleInfo.details.hasTouchSupport && !titleInfo.details.hasFakeTouchSupport) {
  return;
}
`;
  return str = str.replace(text, newCode + text), str;
 },
 streamCombineSources(str) {
  let text = "this.useCombinedAudioVideoStream=!!this.deviceInformation.isTizen";
  if (!str.includes(text)) return !1;
  return str = str.replace(text, "this.useCombinedAudioVideoStream=true"), str;
 },
 patchStreamHud(str) {
  let index = str.indexOf("({onCollapse:");
  if (index < 0) return !1;
  try {
   if (!PatcherUtils.findAndParseParams(str, index, 1000)) return !1;
   let canShowTakHUDVar = PatcherUtils.getVariableNameAfter(str, PatcherUtils.indexOf(str, "canShowTakHUD", index, 500, !0) + 1), guideUIVar = PatcherUtils.getVariableNameAfter(str, PatcherUtils.indexOf(str, "guideUI", index, 500, !0) + 1), onShowStreamMenuVar = PatcherUtils.getVariableNameAfter(str, PatcherUtils.indexOf(str, "onShowStreamMenu", index, 500, !0) + 1), offsetVar = PatcherUtils.getVariableNameAfter(str, PatcherUtils.indexOf(str, "offset", index, 500, !0) + 1), newCode = renderString(stream_hud_default, {
    guideUI: guideUIVar,
    onShowStreamMenu: onShowStreamMenuVar,
    offset: offsetVar
   });
   if (getGlobalPref("touchController.mode") === "off") newCode += `${canShowTakHUDVar} = false;`;
   let bracketIndex = PatcherUtils.indexOf(str, "}){", index, 500, !0);
   return str = PatcherUtils.insertAt(str, bracketIndex, newCode), str;
  } catch (e) {
   return !1;
  }
 },
 broadcastPollingMode(str) {
  let text = ".setPollingMode=e=>{";
  if (!str.includes(text)) return !1;
  let newCode = `
window.BX_STREAM_SETTINGS.xCloudPollingMode = e.toLowerCase();
BxEvent.dispatch(window, BxEvent.XCLOUD_POLLING_MODE_CHANGED);
`;
  return str = str.replace(text, text + newCode), str;
 },
 patchGamepadPolling(str) {
  let index = str.indexOf(".shouldHandleGamepadInput)())return void");
  if (index < 0) return !1;
  return index = str.indexOf("{", index - 20) + 1, str = str.substring(0, index) + "if (window.BX_EXPOSED.disableGamepadPolling) return;" + str.substring(index), str;
 },
 patchXcloudTitleInfo(str) {
  let text = "async cloudConnect", index = str.indexOf(text);
  if (index < 0) return !1;
  let backetIndex = str.indexOf("{", index), params = str.substring(index, backetIndex).match(/\(([^)]+)\)/)[1];
  if (!params) return !1;
  let titleInfoVar = params.split(",")[0], newCode = `
${titleInfoVar} = window.BX_EXPOSED.modifyTitleInfo(${titleInfoVar});
BxLogger.info('patchXcloudTitleInfo', ${titleInfoVar});
`;
  return str = str.substring(0, backetIndex + 1) + newCode + str.substring(backetIndex + 1), str;
 },
 patchRemotePlayMkb(str) {
  let text = "async homeConsoleConnect", index = str.indexOf(text);
  if (index < 0) return !1;
  let backetIndex = str.indexOf("{", index), params = str.substring(index, backetIndex).match(/\(([^)]+)\)/)[1];
  if (!params) return !1;
  let configsVar = params.split(",")[1], newCode = `
Object.assign(${configsVar}.inputConfiguration, {
  enableMouseInput: false,
  enableKeyboardInput: false,
  enableAbsoluteMouse: false,
});
BxLogger.info('patchRemotePlayMkb', ${configsVar});
`;
  return str = str.substring(0, backetIndex + 1) + newCode + str.substring(backetIndex + 1), str;
 },
 patchAudioMediaStream(str) {
  let text = ".srcObject=this.audioMediaStream,";
  if (!str.includes(text)) return !1;
  let newCode = "window.BX_EXPOSED.setupGainNode(arguments[1], this.audioMediaStream),";
  return str = str.replace(text, text + newCode), str;
 },
 patchCombinedAudioVideoMediaStream(str) {
  let text = ".srcObject=this.combinedAudioVideoStream";
  if (!str.includes(text)) return !1;
  let newCode = ",window.BX_EXPOSED.setupGainNode(arguments[0], this.combinedAudioVideoStream)";
  return str = str.replace(text, text + newCode), str;
 },
 patchTouchControlDefaultOpacity(str) {
  let text = "opacityMultiplier:1";
  if (!str.includes(text)) return !1;
  let newCode = `opacityMultiplier: ${(getGlobalPref("touchController.opacity.default") / 100).toFixed(1)}`;
  return str = str.replace(text, newCode), str;
 },
 patchShowSensorControls(str) {
  let text = ",{shouldShowSensorControls:";
  if (!str.includes(text)) return !1;
  let newCode = ",{shouldShowSensorControls: (window.BX_EXPOSED && window.BX_EXPOSED.shouldShowSensorControls) ||";
  return str = str.replace(text, newCode), str;
 },
 exposeStreamSession(str) {
  let text = ",this._connectionType=";
  if (!str.includes(text)) return !1;
  let newCode = `;
${expose_stream_session_default}
true` + text;
  return str = str.replace(text, newCode), str;
 },
 skipFeedbackDialog(str) {
  let index = str.indexOf("}shouldTransitionToFeedback(");
  if (index >= 0 && (index = PatcherUtils.indexOf(str, "}){", index, 200, !0)), index < 0) return !1;
  return str = PatcherUtils.insertAt(str, index, 'document.dispatchEvent(new CustomEvent("bx-feedback-skipped"));return !1;'), str;
 },
 enableNativeMkb(str) {
  let index = str.indexOf(".mouseSupported&&");
  if (index < 0) return !1;
  let varName = str.charAt(index - 1), text = `${varName}.mouseSupported&&${varName}.keyboardSupported&&${varName}.fullscreenSupported;`;
  if (!str.includes(text)) return !1;
  return str = str.replace(text, text + "return true;"), str;
 },
 patchMouseAndKeyboardEnabled(str) {
  let text = "get mouseAndKeyboardEnabled(){";
  if (!str.includes(text)) return !1;
  return str = str.replace(text, text + "return true;"), str;
 },
 exposeInputChannelV1(str) {
  let text = '()(this,"flushData",(';
  if (!str.includes(text)) return !1;
  return str = str.replace(text, '()(window.BX_EXPOSED.inputChannel = this, "flushData", ('), str;
 },
 exposeInputChannelV2(str) {
  let text = '()(this,"reliableChannel",void';
  if (!str.includes(text)) return !1;
  return str = str.replace(text, '()(window.BX_EXPOSED.inputChannel = this, "reliableChannel",void'), str;
 },
 disableNativeRequestPointerLock(str) {
  let text = "async requestPointerLock(){";
  if (!str.includes(text)) return !1;
  return str = str.replace(text, text + "return;"), str;
 },
 patchRequestInfoCrash(str) {
  let text = 'if(!e)throw new Error("RequestInfo.origin is falsy");';
  if (!str.includes(text)) return !1;
  return str = str.replace(text, 'if (!e) e = "https://www.xbox.com";'), str;
 },
 exposeDialogRoutes(str) {
  let index = str.indexOf("return{goBack:function(){"), firstIndex = index;
  if (index >= 0 && (index = PatcherUtils.indexOf(str, "getIsAnyDialogOpen", index, 2000)), index >= 0 && (index = PatcherUtils.indexOf(str, "return ", index, 300)), index < 0) return !1;
  let endBracketIndex = PatcherUtils.indexOf(str, "}", index, 50), oldCode = str.substring(index, endBracketIndex), newCode = str.substring(index, endBracketIndex).replace("return", "const result=") + ";";
  return newCode += 'window.BxEventBus.Script.emit(result ? "dialog.shown" : "dialog.dismissed", {});', newCode += "return result;", str = PatcherUtils.replaceWith(str, index, oldCode, newCode), str = PatcherUtils.insertAt(str, firstIndex + 6, " window.BX_EXPOSED.dialogRoutes = "), str;
 },
 enableTvRoutes(str) {
  let index = str.indexOf(".LoginDeviceCode.path,");
  if (index < 0) return !1;
  let match = /render:.*?jsx\)\(([^,]+),/.exec(str.substring(index, index + 100));
  if (!match) return !1;
  let funcName = match[1];
  if (index = str.indexOf(`const ${funcName}=({children`), index > -1 && (index = PatcherUtils.indexOf(str, "return ", 300)), index > -1 && (index = PatcherUtils.indexOf(str, "?", 100)), index < 0) return !1;
  return str = str.substring(0, index) + "|| true" + str.substring(index), str;
 },
 ignoreNewsSection(str) {
  let index = str.indexOf('("CarouselRow"))');
  if (index > -1 && (index = PatcherUtils.lastIndexOf(str, "const ", index, 200)), index < 0) return !1;
  return str = PatcherUtils.insertAt(str, index, "return null;"), str;
 },
 ignorePlayWithFriendsSection(str) {
  let index = str.indexOf('location:"PlayWithFriendsRow",');
  if (index < 0) return !1;
  if (index = PatcherUtils.lastIndexOf(str, "=>", index, 50), index < 0) return !1;
  return str = PatcherUtils.replaceWith(str, index, "=>", "=> true ? null :"), str;
 },
 ignoreAllGamesSection(str) {
  let index = str.indexOf('className:"AllGamesRow-module__allGamesRowContainer');
  if (index > -1 && (index = PatcherUtils.indexOf(str, "grid:!0,", index, 1500)), index > -1 && (index = PatcherUtils.lastIndexOf(str, "(0,", index, 70)), index < 0) return !1;
  return str = PatcherUtils.insertAt(str, index, "true ? null :"), str;
 },
 ignoreByogSection(str) {
  let index = str.indexOf('"ShowcaseRow-module__container');
  if (index > -1 && (index = PatcherUtils.lastIndexOf(str, ")=>(", index, 200)), index < 0) return !1;
  return str = PatcherUtils.insertAt(str, index + 3, "null && "), str;
 },
 ignorePlayWithTouchSection(str) {
  let index = str.indexOf('("Play_With_Touch"),');
  if (index < 0) return !1;
  if (index = PatcherUtils.lastIndexOf(str, "const ", index, 30), index < 0) return !1;
  return str = PatcherUtils.insertAt(str, index, "return null;"), str;
 },
 ignoreSiglSections(str) {
  let index = str.indexOf("SiglRow requires either id");
  if (index >= 0 && (index = PatcherUtils.lastIndexOf(str, "})=>{", index, 300, !0)), index < 0) return !1;
  let params = PatcherUtils.findAndParseParams(str, PatcherUtils.lastIndexOf(str, "const", index, 1000), 1000);
  if (!params || !params.id) return !1;
  let PREF_HIDE_SECTIONS = getGlobalPref("ui.hideSections"), siglIds = [], sections = {
   "native-mkb": "8fa264dd-124f-4af3-97e8-596fcdf4b486",
   "most-popular": "e7590b22-e299-44db-ae22-25c61405454c",
   "leaving-soon": "393f05bf-e596-4ef6-9487-6d4fa0eab987",
   "recently-added": "44a55037-770f-4bbf-bde5-a9fa27dba1da"
  };
  for (let section of PREF_HIDE_SECTIONS) {
   let galleryId = sections[section];
   galleryId && siglIds.push(galleryId);
  }
  let checkSyntax = siglIds.map((item2) => `${params.id} === "${item2}"`).join(" || "), newCode = `if (${params.id} && (${checkSyntax})) return null;`;
  return str = PatcherUtils.insertAt(str, index, newCode), str;
 },
 ignoreGenresSection(str) {
  let index = str.indexOf('="GenresRow"');
  if (index > -1 && (index = PatcherUtils.lastIndexOf(str, "{", index)), index < 0) return !1;
  return str = PatcherUtils.insertAt(str, index + 1, "return null;"), str;
 },
 overrideStorageGetSettings(str) {
  let text = "}getSetting(e){";
  if (!str.includes(text)) return !1;
  let newCode = `
// console.log('setting', this.baseStorageKey, e);
if (this.baseStorageKey in window.BX_EXPOSED.overrideSettings) {
  const settings = window.BX_EXPOSED.overrideSettings[this.baseStorageKey];
  if (e in settings) {
    return settings[e];
  }
}
`;
  return str = str.replace(text, text + newCode), str;
 },
 alwaysShowStreamHud(str) {
  let index = str.indexOf(",{onShowStreamMenu:");
  if (index < 0) return !1;
  if (index = str.indexOf("&&(0,", index - 100), index < 0) return !1;
  let commaIndex = str.indexOf(",", index - 10);
  return str = str.substring(0, commaIndex) + ",true" + str.substring(index), str;
 },
 patchSetCurrentFocus(str) {
  let index = str.indexOf(".setCurrentFocus=(");
  if (index < 0) return !1;
  return index = str.indexOf("{", index) + 1, str = PatcherUtils.insertAt(str, index, `
if (window.BX_EXPOSED.hubFullscreenButton && e instanceof HTMLElement) {
  const bxFocusText = (e.textContent || '').normalize('NFD').replace(/[\̀-\ͯ]/g, '').toLowerCase();
  if (bxFocusText.includes('experimentar a nova experiencia') || bxFocusText.includes('try the new experience')) {
    e = window.BX_EXPOSED.hubFullscreenButton;
  }
}
e && BxEvent.dispatch(window, BxEvent.NAVIGATION_FOCUS_CHANGED, { element: e });
`), str;
 },
 detectProductDetailPage(str) {
  let index = str.indexOf('{location:"ProductDetailPage",');
  if (index >= 0 && (index = PatcherUtils.lastIndexOf(str, "return", index, 200)), index < 0) return !1;
  return str = str.substring(0, index) + 'BxEvent.dispatch(window, BxEvent.XCLOUD_RENDERING_COMPONENT, { component: "product-detail" });' + str.substring(index), str;
 },
 detectBrowserRouterReady(str) {
  let index = str.indexOf("{history:this.history,");
  if (index >= 0 && (index = PatcherUtils.lastIndexOf(str, "return", index, 100)), index < 0) return !1;
  return str = PatcherUtils.insertAt(str, index, "window.BxEvent.dispatch(window, window.BxEvent.XCLOUD_ROUTER_HISTORY_READY, {history: this.history});"), str;
 },
 guideAchievementsDefaultLocked(str) {
  let index = str.indexOf("FilterButton-module__container");
  if (index >= 0 && (index = PatcherUtils.lastIndexOf(str, '"All"', index, 150)), index < 0) return !1;
  if (str = PatcherUtils.replaceWith(str, index, '"All"', '"Locked"'), index = str.indexOf('"Guide_Achievements_Unlocked_Empty","Guide_Achievements_Locked_Empty"'), index >= 0 && (index = PatcherUtils.indexOf(str, '"All"', index, 250)), index < 0) return !1;
  return str = PatcherUtils.replaceWith(str, index, '"All"', '"Locked"'), str;
 },
 disableTouchContextMenu(str) {
  let index = str.indexOf('.addEventListener("touchstart",');
  if (index >= 0 && (index = PatcherUtils.indexOf(str, '.addEventListener("touchend"', index, 200)), index >= 0 && (index = PatcherUtils.lastIndexOf(str, "return ", index, 50)), index < 0) return !1;
  return str = PatcherUtils.replaceWith(str, index, "return", "return () => {};"), str;
 },
 modifyPreloadedState(str) {
  let text = "=window.__PRELOADED_STATE__;";
  if (!str.includes(text)) return !1;
  return str = str.replace(text, "=window.BX_EXPOSED.modifyPreloadedState(window.__PRELOADED_STATE__);"), str;
 },
 homePageBeforeLoad(str) {
  return PatcherUtils.patchBeforePageLoad(str, "home");
 },
 streamPageBeforeLoad(str) {
  return PatcherUtils.patchBeforePageLoad(str, "stream");
 },
 remotePlayStreamPageBeforeLoad(str) {
  return PatcherUtils.patchBeforePageLoad(str, "remote-play-stream");
 },
 disableAbsoluteMouse(str) {
  let text = "sendAbsoluteMouseCapableMessage(e){";
  if (!str.includes(text)) return !1;
  return str = str.replace(text, text + "return;"), str;
 },
 changeNotificationsSubscription(str) {
  let text = "}buildSubscriptionQueryParamsForNotifications(", index = str.indexOf(text);
  if (index < 0) return !1;
  index += text.length;
  let subsVar = str[index];
  index = str.indexOf("{", index) + 1;
  let blockFeatures = getGlobalPref("block.features"), filters = [];
  if (blockFeatures.includes("notifications-invites")) filters.push("GameInvite", "PartyInvite");
  if (blockFeatures.includes("friends")) filters.push("Follower");
  if (blockFeatures.includes("notifications-achievements")) filters.push("AchievementUnlock");
  let newCode = `
let subs = ${subsVar};
subs = subs.filter(val => !${JSON.stringify(filters)}.includes(val));
${subsVar} = subs;
`;
  return str = PatcherUtils.insertAt(str, index, newCode), str;
 },
 exposeReactCreateComponent(str) {
  let index = str.indexOf(".prototype.isReactComponent={}");
  if (index > -1 && (index = PatcherUtils.indexOf(str, ".createElement=", index)), index < 0) return !1;
  if (str = PatcherUtils.insertAt(str, index - 1, "window.BX_EXPOSED.reactCreateElement="), index = PatcherUtils.indexOf(str, ".useEffect=", index), index < 0) return !1;
  return str = PatcherUtils.insertAt(str, index - 1, "window.BX_EXPOSED.reactUseEffect="), str;
 },
 gameCardCustomIcons(str) {
  let initialIndex = str.indexOf("const{supportedInputIcons:");
  if (initialIndex < 0) return !1;
  let returnIndex = PatcherUtils.lastIndexOf(str, "return ", str.indexOf("SupportedInputsBadge"));
  if (returnIndex < 0) return !1;
  let productIdIndex = PatcherUtils.lastIndexOf(str, ",productId:", initialIndex, 300);
  if (productIdIndex < 0) return !1;
  let params = PatcherUtils.findAndParseParams(str, productIdIndex - 200, 400);
  if (!params || !params.productId) return !1;
  let productIdVar = params.productId, supportedInputIconsVar = PatcherUtils.getVariableNameAfter(str, PatcherUtils.indexOf(str, "supportedInputIcons:", initialIndex, 100, !0));
  if (!supportedInputIconsVar) return !1;
  let newCode = renderString(game_card_icons_default, {
   productId: productIdVar,
   supportedInputIcons: supportedInputIconsVar
  });
  return str = PatcherUtils.insertAt(str, returnIndex, newCode), str;
 },
 setImageQuality(str) {
  let index = str.indexOf("const{size:{width:");
  if (index > -1 && (index = PatcherUtils.indexOf(str, "=new URLSearchParams", index, 500)), index < 0) return !1;
  let paramVar = PatcherUtils.getVariableNameBefore(str, index);
  if (!paramVar) return !1;
  index = PatcherUtils.indexOf(str, "return", index, 200);
  let newCode = `${paramVar}.set('q', ${getGlobalPref("ui.imageQuality")});`;
  return str = PatcherUtils.insertAt(str, index, newCode), str;
 },
 setBackgroundImageQuality(str) {
  let index = str.indexOf("}?w=${");
  if (index > -1 && (index = PatcherUtils.indexOf(str, "}", index + 1, 10, !0)), index < 0) return !1;
  return str = PatcherUtils.insertAt(str, index, `&q=${getGlobalPref("ui.imageQuality")}`), str;
 },
 injectHeaderUseEffect(str) {
  let index = str.indexOf('className:"Header-module__header');
  if (index > -1 && (index = PatcherUtils.lastIndexOf(str, "return", index, 300)), index < 0) return !1;
  return PatcherUtils.injectUseEffect(str, index, "Script", "ui.header.rendered");
 },
 injectErrorPageUseEffect(str) {
  let index = str.indexOf('"PureErrorPage-module__container');
  if (index > -1 && (index = PatcherUtils.lastIndexOf(str, "})=>(0,", index, 200)), index < 0) return !1;
  return str = PatcherUtils.insertAt(str, index + 4, "{return "), str = PatcherUtils.injectUseEffect(str, index + 5, "Script", "ui.error.rendered"), str += "}", str;
 },
 injectStreamMenuUseEffect(str) {
  let index = str.indexOf('"StreamMenu-module__container');
  if (index > -1 && (index = PatcherUtils.lastIndexOf(str, "return", index, 200)), index < 0) return !1;
  return PatcherUtils.injectUseEffect(str, index, "Stream", "ui.streamMenu.rendered");
 },
 injectGuideHomeUseEffect(str) {
  let index = str.indexOf('"HomeLandingPage-module__authenticatedContentContainer');
  if (index > -1 && (index = PatcherUtils.lastIndexOf(str, "return", index, 200)), index < 0) return !1;
  return PatcherUtils.injectUseEffect(str, index, "Script", "ui.guideHome.rendered");
 },
 injectCreatePortal(str) {
  let index = str.indexOf(".createPortal=function");
  if (index > -1 && (index = PatcherUtils.indexOf(str, "{", index, 50, !0)), index < 0) return !1;
  return str = PatcherUtils.insertAt(str, index, create_portal_default), str;
 },
 injectAchievementsProgressUseEffect(str) {
  let index = str.indexOf('"AchievementsButton-module__progressBarContainer');
  if (index > -1 && (index = PatcherUtils.lastIndexOf(str, "return", index, 200)), index < 0) return !1;
  return PatcherUtils.injectUseEffect(str, index, "Script", "ui.guideAchievementProgress.rendered");
 },
 injectAchievementsDetailUseEffect(str) {
  let index = str.indexOf("GuideAchievementDetail.useParams()");
  if (index > -1 && (index = PatcherUtils.lastIndexOf(str, "const", index, 200)), index < 0) return !1;
  return PatcherUtils.injectUseEffect(str, index, "Script", "ui.guideAchievementDetail.rendered");
 },
 patchCustomInputIcon(str) {
  let index = str.indexOf('.MouseAndKeyboard="MouseAndKeyboard"');
  if (index < 0) return !1;
  let productIdMatch = /const (\w+)=(\w+)=>{/.exec(str.substring(index, index + 200));
  if (!productIdMatch) return !1;
  str = str.replace(productIdMatch[0], productIdMatch[0] + `const productId = ${productIdMatch[2]};`);
  let match = /(\w+)&&(\w+\.push\(\w+\.Touch\))/.exec(str);
  if (!match) return !1;
  if (str = str.replace(match[0], `(${match[1]} || window.BX_EXPOSED.hasCustomTouchControl(productId)) && ${match[2]}`), match = /(\w+)&&(\w+\.push\(\w+\.MouseAndKeyboard\))/.exec(str), match) str = str.replace(match[0], `(${match[1]} || window.BX_EXPOSED.hasCustomNativeMkb(productId)) && ${match[2]}`);
  return str;
 },
 patchStreamMetadata(str) {
  let index = str.indexOf("}onVideoFrame(");
  if (index >= 0 && (index = PatcherUtils.indexOf(str, "){", index, 30, !0)), index < 0) return !1;
  let maxDt = 10, code = `
try {
  const obj = arguments[0];
  if (true || obj.frameDecodedTimeMs - obj.frameSubmittedTimeMs > ${maxDt}) {
    const baseMs = obj.frameSubmittedTimeMs;
    const renderMs = obj.frameRenderedTimeMs - obj.frameDecodedTimeMs;
    obj.frameDecodedTimeMs = baseMs + ${maxDt};
    obj.frameRenderedTimeMs = obj.frameDecodedTimeMs + renderMs;
    obj.expectedDisplayTime = obj.frameRenderedTimeMs;
    arguments[0] = obj;
  }
} catch (e) { alert(e) }
`;
  return str = PatcherUtils.insertAt(str, index, code), str;
 },
 disablePauseOnWindowBlur(str) {
  let index = str.indexOf("},this.onFocusChanged=");
  if (index >= 0 && (index = PatcherUtils.indexOf(str, "=>{", index, 30)), index < 0) return !1;
  let varName = PatcherUtils.getVariableNameBefore(str, index);
  if (!varName) return !1;
  return str = PatcherUtils.insertAt(str, index + 3, `try { ${varName} = "focus"; } catch (xxx) {}`), str;
 }
}, PATCH_ORDERS = PatcherUtils.filterPatches([
 ...AppInterface && getGlobalPref("nativeMkb.mode") === "on" ? [
  "enableNativeMkb",
  "disableAbsoluteMouse"
 ] : [],
 "exposeReactCreateComponent",
 "injectCreatePortal",
 "broadcastPollingMode",
 "patchGamepadPolling",
 "modifyPreloadedState",
 "detectBrowserRouterReady",
 "exposeStreamSession",
 "supportLocalCoOp",
 "disableStreamGate",
 "exposeDialogRoutes",
 ...getGlobalPref("ui.imageQuality") !== 90 ? [
  "setImageQuality"
 ] : [],
 "patchRequestInfoCrash",
 "injectErrorPageUseEffect",
 "streamPageBeforeLoad",
 "remotePlayStreamPageBeforeLoad",
 "injectGuideHomeUseEffect",
 "injectAchievementsProgressUseEffect",
 "injectAchievementsDetailUseEffect",
 "guideAchievementsDefaultLocked",
 "injectHeaderUseEffect",
 "homePageBeforeLoad",
 "patchCustomInputIcon",
 "gameCardCustomIcons",
 "overrideStorageGetSettings",
 "detectProductDetailPage",
 getGlobalPref("ui.layout") !== "default" && "websiteLayout",
 getGlobalPref("game.fortnite.forceConsole") && "forceFortniteConsole",
 ...STATES.userAgent.capabilities.touch ? [
  "disableTouchContextMenu"
 ] : [],
 ...getGlobalPref("block.tracking") ? [
  "disableAiTrack",
  "blockWebRtcStatsCollector",
  "disableIndexDbLogging",
  "disableTelemetryProvider"
 ] : [],
 ...!getGlobalPref("block.features").includes("remote-play") ? [
  "remotePlayKeepAlive",
  "remotePlayDisableAchievementToast",
  STATES.userAgent.capabilities.touch && "patchUpdateInputConfigurationAsync"
 ] : [],
 ...BX_FLAGS.EnableXcloudLogging ? [
  "enableConsoleLogging",
  "enableXcloudLogger"
 ] : []
]), hideSections = getGlobalPref("ui.hideSections"), HOME_PAGE_PATCH_ORDERS = PatcherUtils.filterPatches([
 hideSections.includes("genres") && "ignoreGenresSection",
 hideSections.includes("byog") && "ignoreByogSection",
 STATES.browser.capabilities.touch && hideSections.includes("touch") && "ignorePlayWithTouchSection",
 getGlobalPref("ui.imageQuality") !== 90 && "setBackgroundImageQuality",
 hideSections.some((value) => ["native-mkb", "most-popular"].includes(value)) && "ignoreSiglSections",
 hideSections.includes("news") && "ignoreNewsSection",
 (getGlobalPref("block.features").includes("friends") || hideSections.includes("friends")) && "ignorePlayWithFriendsSection",
 hideSections.includes("all-games") && "ignoreAllGamesSection",
 ...blockSomeNotifications() ? [
  "changeNotificationsSubscription"
 ] : []
]), STREAM_PAGE_PATCH_ORDERS = PatcherUtils.filterPatches([
 "exposeInputChannelV1",
 "exposeInputChannelV2",
 "patchXcloudTitleInfo",
 "disableGamepadDisconnectedScreen",
 "patchStreamHud",
 "playVibration",
 "alwaysShowStreamHud",
 "injectStreamMenuUseEffect",
 "disablePauseOnWindowBlur",
 getGlobalPref("stream.cloud.keepAlive") && "cloudStreamKeepAlive",
 getGlobalPref("stream.video.preventResolutionDrops") && "patchStreamMetadata",
 getGlobalPref("audio.volume.booster.enabled") && !getGlobalPref("stream.video.combineAudio") && "patchAudioMediaStream",
 getGlobalPref("audio.volume.booster.enabled") && getGlobalPref("stream.video.combineAudio") && "patchCombinedAudioVideoMediaStream",
 getGlobalPref("ui.feedbackDialog.disabled") && "skipFeedbackDialog",
 ...STATES.userAgent.capabilities.touch ? [
  getGlobalPref("touchController.mode") === "all" && "patchShowSensorControls",
  getGlobalPref("touchController.mode") === "all" && "exposeTouchLayoutManager",
  (getGlobalPref("touchController.mode") === "off" || getGlobalPref("touchController.autoOff")) && "disableTakRenderer",
  getGlobalPref("touchController.opacity.default") !== 100 && "patchTouchControlDefaultOpacity",
  getGlobalPref("touchController.mode") !== "off" && (getGlobalPref("mkb.enabled") || getGlobalPref("nativeMkb.mode") === "on") && "patchBabylonRendererClass"
 ] : [],
 "patchPollGamepads",
 getGlobalPref("stream.video.combineAudio") && "streamCombineSources",
 ...!getGlobalPref("block.features").includes("remote-play") ? [
  "remotePlayPostStreamRedirectUrl",
  "patchRemotePlayMkb"
 ] : [],
 ...AppInterface && getGlobalPref("nativeMkb.mode") === "on" ? [
  "patchMouseAndKeyboardEnabled",
  "disableNativeRequestPointerLock"
 ] : []
]), ALL_PATCHES = [...PATCH_ORDERS, ...HOME_PAGE_PATCH_ORDERS, ...STREAM_PAGE_PATCH_ORDERS];
class Patcher {
 static remainingPatches = {
  home: HOME_PAGE_PATCH_ORDERS,
  stream: STREAM_PAGE_PATCH_ORDERS,
  "remote-play-stream": STREAM_PAGE_PATCH_ORDERS
 };
 static patchPage(page) {
  let remaining = Patcher.remainingPatches[page];
  if (!remaining) return;
  PATCH_ORDERS = PATCH_ORDERS.concat(remaining), delete Patcher.remainingPatches[page];
 }
 static patchNativeBind() {
  let nativeBind = Function.prototype.bind;
  Function.prototype.bind = function() {
   let valid = !1;
   if (this.name.length <= 2 && arguments.length === 2 && arguments[0] === null) {
    if (arguments[1] === 0 || typeof arguments[1] === "function") valid = !0;
   }
   if (!valid) return nativeBind.apply(this, arguments);
   if (typeof arguments[1] === "function") BxLogger.info(LOG_TAG2, "Restored Function.prototype.bind()"), Function.prototype.bind = nativeBind;
   let orgFunc = this, newFunc = (a, item2) => {
    Patcher.checkChunks(item2), orgFunc(a, item2);
   };
   return nativeBind.apply(newFunc, arguments);
  };
 }
 static checkChunks(item) {
  let patchesToCheck, appliedPatches, chunkData = item[1], patchesMap = {}, patcherCache = PatcherCache.getInstance();
  for (let chunkId in chunkData) {
   appliedPatches = [];
   let cachedPatches = patcherCache.getPatches(chunkId);
   if (cachedPatches) patchesToCheck = cachedPatches.slice(0), patchesToCheck.push(...PATCH_ORDERS);
   else patchesToCheck = PATCH_ORDERS.slice(0);
   if (!patchesToCheck.length) continue;
   let func = chunkData[chunkId], funcStr = func.toString(), patchedFuncStr = funcStr, modified = !1, chunkAppliedPatches = [];
   for (let patchIndex = 0;patchIndex < patchesToCheck.length; patchIndex++) {
    let patchName = patchesToCheck[patchIndex];
    if (appliedPatches.indexOf(patchName) > -1) continue;
    if (!PATCHES[patchName]) continue;
    let tmpStr = PATCHES[patchName].call(null, patchedFuncStr);
    if (!tmpStr) continue;
    modified = !0, patchedFuncStr = tmpStr, appliedPatches.push(patchName), chunkAppliedPatches.push(patchName), patchesToCheck.splice(patchIndex, 1), patchIndex--, PATCH_ORDERS = PATCH_ORDERS.filter((item2) => item2 != patchName);
   }
   if (modified) {
    BxLogger.info(LOG_TAG2, `✅ [${chunkId}] ${chunkAppliedPatches.join(", ")}`), PATCH_ORDERS.length && BxLogger.info(LOG_TAG2, "Remaining patches", PATCH_ORDERS), BX_FLAGS.Debug && console.time(LOG_TAG2);
    try {
     chunkData[chunkId] = eval("(function " + patchedFuncStr.replace(/^\d+/, "") + ")");
    } catch (e) {
     if (e instanceof Error) BxLogger.error(LOG_TAG2, "Error", appliedPatches, e.message, patchedFuncStr);
    }
    BX_FLAGS.Debug && console.timeEnd(LOG_TAG2);
   }
   if (appliedPatches.length) patchesMap[chunkId] = appliedPatches;
  }
  if (Object.keys(patchesMap).length) patcherCache.saveToCache(patchesMap);
 }
 static init() {
  Patcher.patchNativeBind();
 }
}
class PatcherCache {
 static instance;
 static getInstance = () => PatcherCache.instance ?? (PatcherCache.instance = new PatcherCache);
 KEY_CACHE = "BetterXcloud.Patches.Cache";
 KEY_SIGNATURE = "BetterXcloud.Patches.Cache.Signature";
 CACHE;
 constructor() {
  this.checkSignature(), this.CACHE = JSON.parse(window.localStorage.getItem(this.KEY_CACHE) || "{}"), BxLogger.info(LOG_TAG2, "Cache", this.CACHE);
  let pathName = window.location.pathname;
  if (pathName.includes("/play/consoles/launch/")) Patcher.patchPage("remote-play-stream");
  else if (pathName.includes("/play/launch/")) Patcher.patchPage("stream");
  else if (pathName.endsWith("/play") || pathName.endsWith("/play/")) Patcher.patchPage("home");
  PATCH_ORDERS = this.cleanupPatches(PATCH_ORDERS), STREAM_PAGE_PATCH_ORDERS = this.cleanupPatches(STREAM_PAGE_PATCH_ORDERS), BxLogger.info(LOG_TAG2, "PATCH_ORDERS", PATCH_ORDERS.slice(0));
 }
 getSignature() {
  let scriptVersion = SCRIPT_VERSION, patches = JSON.stringify(ALL_PATCHES), clientHash = "", $link = document.querySelector('link[data-chunk="client"][as="script"][href*="/client."]');
  if ($link) {
   let match = /\/client\.([^\.]+)\.js/.exec($link.href);
   match && (clientHash = match[1]);
  }
  let webVersion = document.querySelector("meta[name=gamepass-app-version]")?.content ?? "", webVersionDate = document.querySelector("meta[name=gamepass-app-date]")?.content ?? "";
  return `${scriptVersion}:${clientHash}:${webVersion}:${webVersionDate}:${hashCode(patches)}`;
 }
 clear() {
  window.localStorage.removeItem(this.KEY_CACHE), this.CACHE = {};
 }
 checkSignature() {
  let storedSig = window.localStorage.getItem(this.KEY_SIGNATURE) || 0, currentSig = this.getSignature();
  if (currentSig !== storedSig) BxLogger.warning(LOG_TAG2, "Signature changed"), window.localStorage.setItem(this.KEY_SIGNATURE, currentSig.toString()), this.clear();
  else BxLogger.info(LOG_TAG2, "Signature unchanged");
 }
 cleanupPatches(patches) {
  return patches.filter((item2) => {
   for (let id in this.CACHE)
    if (this.CACHE[id].includes(item2)) return !1;
   return !0;
  });
 }
 getPatches(id) {
  return this.CACHE[id];
 }
 saveToCache(subCache) {
  for (let id in subCache) {
   let patchNames = subCache[id], data = this.CACHE[id];
   if (!data) this.CACHE[id] = patchNames;
   else for (let patchName of patchNames)
     if (!data.includes(patchName)) data.push(patchName);
  }
  window.localStorage.setItem(this.KEY_CACHE, JSON.stringify(this.CACHE));
 }
}
class FullscreenText {
 static instance;
 static getInstance = () => FullscreenText.instance ?? (FullscreenText.instance = new FullscreenText);
 LOG_TAG = "FullscreenText";
 $text;
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()"), this.$text = CE("div", {
   class: "bx-fullscreen-text bx-gone"
  }), document.documentElement.appendChild(this.$text);
 }
 show(msg) {
  document.body.classList.add("bx-no-scroll"), this.$text.classList.remove("bx-gone"), this.$text.textContent = msg;
 }
 hide() {
  document.body.classList.remove("bx-no-scroll"), this.$text.classList.add("bx-gone");
 }
}
class BaseProfileManagerDialog extends NavigationDialog {
 $container;
 title;
 presetsDb;
 allPresets;
 currentPresetId = null;
 activatedPresetId = null;
 $presets;
 $header;
 $defaultNote;
 $content;
 $btnRename;
 $btnDelete;
 constructor(title, presetsDb) {
  super();
  this.title = title, this.presetsDb = presetsDb;
 }
 async renderSummary(presetId) {
  return null;
 }
 updateButtonStates() {
  let isDefaultPreset = this.currentPresetId === null || this.currentPresetId <= 0;
  this.$btnRename.disabled = isDefaultPreset, this.$btnDelete.disabled = isDefaultPreset, this.$defaultNote.classList.toggle("bx-gone", !isDefaultPreset);
 }
 async renderPresetsList() {
  if (this.allPresets = await this.presetsDb.getPresets(), this.currentPresetId === null) this.currentPresetId = this.allPresets.default[0];
  renderPresetsList(this.$presets, this.allPresets, this.activatedPresetId, { selectedIndicator: !0 });
 }
 promptNewName(action, value = "") {
  let newName = "";
  while (!newName) {
   if (newName = prompt(`[${action}] ${t("prompt-preset-name")}`, value), newName === null) return !1;
   newName = newName.trim();
  }
  return newName ? newName : !1;
 }
 async renderDialog() {
  this.$presets = CE("select", {
   class: "bx-full-width",
   tabindex: -1
  });
  let $select = BxSelectElement.create(this.$presets);
  $select.addEventListener("input", (e) => {
   this.switchPreset(parseInt($select.value));
  });
  let $header = CE("div", {
   class: "bx-dialog-preset-tools",
   _nearby: {
    orientation: "horizontal",
    focus: $select
   }
  }, $select, this.$btnRename = createButton({
   title: t("rename"),
   icon: BxIcon.CURSOR_TEXT,
   style: 64,
   onClick: async () => {
    let preset = this.allPresets.data[this.currentPresetId], newName = this.promptNewName(t("rename"), preset.name);
    if (!newName) return;
    preset.name = newName, await this.presetsDb.updatePreset(preset), await this.refresh();
   }
  }), this.$btnDelete = createButton({
   icon: BxIcon.TRASH,
   title: t("delete"),
   style: 4 | 64,
   onClick: async (e) => {
    if (!confirm(t("confirm-delete-preset"))) return;
    await this.presetsDb.deletePreset(this.currentPresetId), delete this.allPresets.data[this.currentPresetId], this.currentPresetId = parseInt(Object.keys(this.allPresets.data)[0]), await this.refresh();
   }
  }), createButton({
   icon: BxIcon.NEW,
   title: t("new"),
   style: 64 | 1,
   onClick: async (e) => {
    let newName = this.promptNewName(t("new"));
    if (!newName) return;
    let newId = await this.presetsDb.newPreset(newName, this.presetsDb.BLANK_PRESET_DATA);
    this.currentPresetId = newId, await this.refresh();
   }
  }), createButton({
   icon: BxIcon.COPY,
   title: t("copy"),
   style: 64 | 1,
   onClick: async (e) => {
    let preset = this.allPresets.data[this.currentPresetId], newName = this.promptNewName(t("copy"), `${preset.name} (2)`);
    if (!newName) return;
    let newId = await this.presetsDb.newPreset(newName, preset.data);
    this.currentPresetId = newId, await this.refresh();
   }
  }));
  this.$header = $header, this.$container = CE("div", { class: "bx-centered-dialog" }, CE("div", { class: "bx-dialog-title" }, CE("p", !1, this.title), createButton({
   icon: BxIcon.CLOSE,
   style: 64 | 2048 | 8,
   onClick: (e) => this.hide()
  })), CE("div", !1, $header, this.$defaultNote = CE("div", { class: "bx-default-preset-note bx-gone" }, t("default-preset-note"))), CE("div", { class: "bx-dialog-content" }, this.$content));
 }
 async refresh() {
  await this.renderPresetsList(), this.$presets.value = this.currentPresetId.toString(), BxEvent.dispatch(this.$presets, "input", { manualTrigger: !0 });
 }
 async onBeforeMount(configs = {}) {
  await this.renderPresetsList();
  let valid = !1;
  if (typeof configs?.id === "number") {
   if (configs.id in this.allPresets.data) this.currentPresetId = configs.id, this.activatedPresetId = configs.id, valid = !0;
  }
  if (!valid) this.currentPresetId = this.allPresets.default[0], this.activatedPresetId = null;
  this.refresh();
 }
 getDialog() {
  return this;
 }
 getContent() {
  if (!this.$container) this.renderDialog();
  return this.$container;
 }
 focusIfNeeded() {
  this.dialogManager.focus(this.$header);
 }
}
var SHORTCUT_ACTIONS = {
 [t("better-xcloud")]: {
  "bx.settings.show": [t("settings"), t("show")]
 },
 ...STATES.browser.capabilities.mkb ? {
  [t("mouse-and-keyboard")]: {
   "mkb.toggle": [t("toggle")]
  }
 } : {},
 [t("controller")]: {
  "controller.xbox.press": [t("button-xbox"), t("press")]
 },
 ...AppInterface ? {
  [t("device")]: {
   "device.sound.toggle": [t("sound"), t("toggle")],
   "device.volume.inc": [t("volume"), t("increase")],
   "device.volume.dec": [t("volume"), t("decrease")],
   "device.brightness.inc": [t("brightness"), t("increase")],
   "device.brightness.dec": [t("brightness"), t("decrease")]
  }
 } : {},
 [t("stream")]: {
  "stream.screenshot.capture": [t("take-screenshot")],
  "stream.video.toggle": [t("video"), t("toggle")],
  "stream.sound.toggle": [t("sound"), t("toggle")],
  ...getGlobalPref("audio.volume.booster.enabled") ? {
   "stream.volume.inc": [t("volume"), t("increase")],
   "stream.volume.dec": [t("volume"), t("decrease")]
  } : {},
  "stream.menu.show": [t("menu"), t("show")],
  "stream.stats.toggle": [t("stats"), t("show-hide")],
  "stream.microphone.toggle": [t("microphone"), t("toggle")]
 },
 [t("other")]: {
  "ta.open": [t("true-achievements"), t("show")]
 }
};
class ControllerShortcutsManagerDialog extends BaseProfileManagerDialog {
 static instance;
 static getInstance = () => ControllerShortcutsManagerDialog.instance ?? (ControllerShortcutsManagerDialog.instance = new ControllerShortcutsManagerDialog(t("controller-shortcuts")));
 $content;
 selectActions = {};
 BUTTONS_ORDER = [
  3,
  0,
  2,
  1,
  12,
  13,
  14,
  15,
  8,
  9,
  4,
  5,
  6,
  7,
  10,
  11
 ];
 constructor(title) {
  super(title, ControllerShortcutsTable.getInstance());
  let $baseSelect = CE("select", {
   class: "bx-full-width",
   autocomplete: "off"
  }, CE("option", { value: "" }, "---"));
  for (let groupLabel in SHORTCUT_ACTIONS) {
   let items = SHORTCUT_ACTIONS[groupLabel];
   if (!items) continue;
   let $optGroup = CE("optgroup", { label: groupLabel });
   for (let action in items) {
    let crumbs = items[action];
    if (!crumbs) continue;
    let label = crumbs.join(" ❯ "), $option = CE("option", { value: action }, label);
    $optGroup.appendChild($option);
   }
   $baseSelect.appendChild($optGroup);
  }
  let $content = CE("div", {
   class: "bx-controller-shortcuts-manager-container"
  }), onActionChanged = (e) => {
   if (!e.ignoreOnChange) this.updatePreset();
  }, fragment = document.createDocumentFragment();
  fragment.appendChild(CE("p", { class: "bx-shortcut-note" }, CE("span", { class: "bx-prompt" }, ""), ": " + t("controller-shortcuts-xbox-note")));
  for (let button of this.BUTTONS_ORDER) {
   let prompt2 = GamepadKeyName[button][1], $row = CE("div", {
    class: "bx-shortcut-row",
    _nearby: {
     orientation: "horizontal"
    }
   }), $label = CE("label", { class: "bx-prompt" }, `${""}${prompt2}`), $select = BxSelectElement.create($baseSelect.cloneNode(!0));
   $select.dataset.button = button.toString(), $select.addEventListener("input", onActionChanged), this.selectActions[button] = $select, setNearby($row, {
    focus: $select
   }), $row.append($label, $select), fragment.appendChild($row);
  }
  $content.appendChild(fragment), this.$content = $content;
 }
 switchPreset(id) {
  let preset = this.allPresets.data[id];
  if (!preset) {
   this.currentPresetId = 0;
   return;
  }
  this.currentPresetId = id;
  let isDefaultPreset = id <= 0, actions = preset.data, button;
  for (button in this.selectActions) {
   let $select = this.selectActions[button];
   $select.value = actions.mapping[button] || "", $select.disabled = isDefaultPreset, BxEvent.dispatch($select, "input", {
    ignoreOnChange: !0,
    manualTrigger: !0
   });
  }
  super.updateButtonStates();
 }
 updatePreset() {
  let newData = deepClone(this.presetsDb.BLANK_PRESET_DATA), button;
  for (button in this.selectActions) {
   let action = this.selectActions[button].value;
   if (!action) continue;
   newData.mapping[button] = action;
  }
  let preset = this.allPresets.data[this.currentPresetId];
  preset.data = newData, this.presetsDb.updatePreset(preset);
 }
 onBeforeUnmount() {
  StreamSettings.refreshControllerSettings(), super.onBeforeUnmount();
 }
}
class BxDualNumberStepper extends HTMLInputElement {
 controlValues;
 controlMin;
 controlMinDiff;
 controlMax;
 steps;
 options;
 onChange;
 $text;
 $rangeFrom;
 $rangeTo;
 $activeRange;
 onRangeInput;
 setValue;
 getValue;
 normalizeValue;
 static create(key, values, options, onChange) {
  options.suffix = options.suffix || "", options.disabled = !!options.disabled;
  let $text, $rangeFrom, $rangeTo, self = CE("div", {
   class: "bx-dual-number-stepper",
   id: `bx_setting_${escapeCssSelector(key)}`
  }, $text = CE("span"));
  if (self.$text = $text, self.onChange = onChange, self.onRangeInput = BxDualNumberStepper.onRangeInput.bind(self), self.controlMin = options.min, self.controlMax = options.max, self.controlMinDiff = options.minDiff, self.options = options, self.steps = Math.max(options.steps || 1, 1), options.disabled) return self.disabled = !0, self;
  return $rangeFrom = CE("input", {
   type: "range",
   min: self.controlMin,
   max: self.controlMax,
   step: self.steps,
   tabindex: 0
  }), $rangeTo = $rangeFrom.cloneNode(), self.$rangeFrom = $rangeFrom, self.$rangeTo = $rangeTo, self.$activeRange = $rangeFrom, self.getValue = BxDualNumberStepper.getValues.bind(self), self.setValue = BxDualNumberStepper.setValues.bind(self), $rangeFrom.addEventListener("input", self.onRangeInput), $rangeTo.addEventListener("input", self.onRangeInput), self.addEventListener("input", self.onRangeInput), self.append(CE("div", !1, $rangeFrom, $rangeTo)), BxDualNumberStepper.setValues.call(self, values), self.addEventListener("contextmenu", BxDualNumberStepper.onContextMenu), setNearby(self, {
   focus: $rangeFrom,
   orientation: "vertical"
  }), Object.defineProperty(self, "value", {
   get() {
    return self.controlValues;
   },
   set(value) {
    let from, to;
    if (typeof value === "string") {
     let tmp = value.split(",");
     from = parseInt(tmp[0]), to = parseInt(tmp[1]);
    } else if (Array.isArray(value)) [from, to] = value;
    if (typeof from < "u" && typeof to < "u") BxDualNumberStepper.setValues.call(self, [from, to]);
   }
  }), self;
 }
 static setValues(values) {
  let from, to;
  if (values) [from, to] = BxDualNumberStepper.normalizeValues.call(this, values);
  else from = this.controlMin, to = this.controlMax, values = [from, to];
  this.controlValues = [from, to], this.$text.textContent = BxDualNumberStepper.updateTextValue.call(this), this.$rangeFrom.value = from.toString(), this.$rangeTo.value = to.toString();
  let ratio = 100 / (this.controlMax - this.controlMin);
  this.style.setProperty("--from", ratio * (from - this.controlMin) + "%"), this.style.setProperty("--to", ratio * (to - this.controlMin) + "%");
 }
 static getValues() {
  return this.controlValues || [this.controlMin, this.controlMax];
 }
 static normalizeValues(values) {
  let [from, to] = values;
  if (this.$activeRange === this.$rangeFrom) to = Math.min(this.controlMax, to), from = Math.min(from, to), from = Math.min(to - this.controlMinDiff, from);
  else from = Math.max(this.controlMin, from), to = Math.max(from, to), to = Math.max(this.controlMinDiff + from, to);
  return to = Math.min(this.controlMax, to), from = Math.min(from, to), [from, to];
 }
 static onRangeInput(e) {
  this.$activeRange = e.target;
  let values = BxDualNumberStepper.normalizeValues.call(this, [parseInt(this.$rangeFrom.value), parseInt(this.$rangeTo.value)]);
  if (BxDualNumberStepper.setValues.call(this, values), !e.ignoreOnChange && this.onChange) this.onChange(e, values);
 }
 static onContextMenu(e) {
  e.preventDefault();
 }
 static updateTextValue() {
  let values = this.controlValues, textContent = null;
  if (this.options.customTextValue) textContent = this.options.customTextValue(values, this.controlMin, this.controlMax);
  if (textContent === null) {
   let [from, to] = values;
   if (from === this.controlMin && to === this.controlMax) textContent = t("default");
   else {
    let pad = to.toString().length;
    textContent = `${from.toString().padStart(pad)} - ${to.toString().padEnd(pad)}${this.options.suffix}`;
   }
  }
  return textContent;
 }
}
class ControllerCustomizationsManagerDialog extends BaseProfileManagerDialog {
 static instance;
 static getInstance = () => ControllerCustomizationsManagerDialog.instance ?? (ControllerCustomizationsManagerDialog.instance = new ControllerCustomizationsManagerDialog(t("controller-customization")));
 $vibrationIntensity;
 $leftTriggerRange;
 $rightTriggerRange;
 $leftStickDeadzone;
 $rightStickDeadzone;
 $btnDetect;
 selectsMap = {};
 selectsOrder = [];
 isDetectingButton = !1;
 detectIntervalId = null;
 static BUTTONS_ORDER = [
  0,
  1,
  2,
  3,
  12,
  15,
  13,
  14,
  4,
  5,
  6,
  7,
  10,
  11,
  104,
  204,
  8,
  9,
  17
 ];
 constructor(title) {
  super(title, ControllerCustomizationsTable.getInstance());
  this.render();
 }
 render() {
  let isControllerFriendly = getGlobalPref("ui.controllerFriendly"), $rows = CE("div", { class: "bx-buttons-grid" }), $baseSelect = CE("select", { class: "bx-full-width" }, CE("option", { value: "" }, "---"), CE("option", { value: "false", _dataset: { label: "🚫" } }, isControllerFriendly ? "🚫" : t("off"))), $baseButtonSelect = $baseSelect.cloneNode(!0), $baseStickSelect = $baseSelect.cloneNode(!0), onButtonChanged = (e) => {
   if (!e.ignoreOnChange) this.updatePreset();
  }, boundUpdatePreset = this.updatePreset.bind(this);
  for (let gamepadKey of ControllerCustomizationsManagerDialog.BUTTONS_ORDER) {
   if (gamepadKey === 17) continue;
   let name = GamepadKeyName[gamepadKey][isControllerFriendly ? 1 : 0];
   (gamepadKey === 104 || gamepadKey === 204 ? $baseStickSelect : $baseButtonSelect).appendChild(CE("option", {
    value: gamepadKey,
    _dataset: { label: GamepadKeyName[gamepadKey][1] }
   }, name));
  }
  for (let gamepadKey of ControllerCustomizationsManagerDialog.BUTTONS_ORDER) {
   let [buttonName, buttonPrompt] = GamepadKeyName[gamepadKey], $clonedSelect = (gamepadKey === 104 || gamepadKey === 204 ? $baseStickSelect : $baseButtonSelect).cloneNode(!0);
   $clonedSelect.querySelector(`option[value="${gamepadKey}"]`)?.remove();
   let $select = BxSelectElement.create($clonedSelect);
   $select.dataset.index = gamepadKey.toString(), $select.addEventListener("input", onButtonChanged), this.selectsMap[gamepadKey] = $select, this.selectsOrder.push(gamepadKey);
   let $row = CE("div", {
    class: "bx-controller-key-row",
    _nearby: { orientation: "horizontal" }
   }, CE("label", { title: buttonName }, buttonPrompt), $select);
   $rows.append($row);
  }
  if (getGlobalPref("ui.controllerFriendly")) for (let i = 0;i < this.selectsOrder.length; i++) {
    let $select = this.selectsMap[this.selectsOrder[i]], directions = {
     1: i - 2,
     3: i + 2,
     4: i - 1,
     2: i + 1
    };
    for (let dir in directions) {
     let idx = directions[dir];
     if (typeof this.selectsOrder[idx] > "u") continue;
     let $targetSelect = this.selectsMap[this.selectsOrder[idx]];
     setNearby($select, {
      [dir]: $targetSelect
     });
    }
   }
  let blankSettings = this.presetsDb.BLANK_PRESET_DATA.settings, params = {
   min: 0,
   minDiff: 1,
   max: 100,
   steps: 1
  };
  this.$content = CE("div", { class: "bx-controller-customizations-container" }, this.$btnDetect = createButton({
   label: t("detect-controller-button"),
   classes: ["bx-btn-detect"],
   style: 4096 | 64 | 128,
   onClick: () => {
    this.startDetectingButton();
   }
  }), $rows, createSettingRow(t("vibration-intensity"), this.$vibrationIntensity = BxNumberStepper.create("controller_vibration_intensity", 50, 0, 100, {
   steps: 10,
   suffix: "%",
   exactTicks: 20,
   customTextValue: (value) => (value = parseInt(value), value === 0 ? t("off") : value + "%")
  }, boundUpdatePreset)), createSettingRow(t("left-trigger-range"), this.$leftTriggerRange = BxDualNumberStepper.create("left-trigger-range", blankSettings.leftTriggerRange, params, boundUpdatePreset)), createSettingRow(t("right-trigger-range"), this.$rightTriggerRange = BxDualNumberStepper.create("right-trigger-range", blankSettings.rightTriggerRange, params, boundUpdatePreset)), createSettingRow(t("left-stick-deadzone"), this.$leftStickDeadzone = BxDualNumberStepper.create("left-stick-deadzone", blankSettings.leftStickDeadzone, params, boundUpdatePreset)), createSettingRow(t("right-stick-deadzone"), this.$rightStickDeadzone = BxDualNumberStepper.create("right-stick-deadzone", blankSettings.rightStickDeadzone, params, boundUpdatePreset)));
 }
 startDetectingButton() {
  this.isDetectingButton = !0;
  let { $btnDetect } = this;
  $btnDetect.classList.add("bx-monospaced", "bx-blink-me"), $btnDetect.disabled = !0;
  let count = 4;
  $btnDetect.textContent = `[${count}] ${t("press-any-button")}`, this.detectIntervalId = window.setInterval(() => {
   if (count -= 1, count === 0) {
    this.stopDetectingButton(), $btnDetect.focus();
    return;
   }
   $btnDetect.textContent = `[${count}] ${t("press-any-button")}`;
  }, 1000);
 }
 stopDetectingButton() {
  let { $btnDetect } = this;
  $btnDetect.classList.remove("bx-monospaced", "bx-blink-me"), $btnDetect.textContent = t("detect-controller-button"), $btnDetect.disabled = !1, this.isDetectingButton = !1, this.detectIntervalId && window.clearInterval(this.detectIntervalId), this.detectIntervalId = null;
 }
 async onBeforeMount() {
  this.stopDetectingButton(), super.onBeforeMount(...arguments);
 }
 onBeforeUnmount() {
  this.stopDetectingButton(), StreamSettings.refreshControllerSettings(), super.onBeforeUnmount();
 }
 handleGamepad(button) {
  if (!this.isDetectingButton) return super.handleGamepad(button);
  if (button in ControllerCustomizationsManagerDialog.BUTTONS_ORDER) {
   this.stopDetectingButton();
   let $select = this.selectsMap[button], $label = $select.previousElementSibling;
   if ($label.addEventListener("animationend", () => {
    $label.classList.remove("bx-horizontal-shaking");
   }, { once: !0 }), $label.classList.add("bx-horizontal-shaking"), getGlobalPref("ui.controllerFriendly"))
    this.dialogManager.focus($select);
  }
  return !0;
 }
 switchPreset(id) {
  let preset = this.allPresets.data[id];
  if (!preset) {
   this.currentPresetId = 0;
   return;
  }
  let {
   $btnDetect,
   $vibrationIntensity,
   $leftStickDeadzone,
   $rightStickDeadzone,
   $leftTriggerRange,
   $rightTriggerRange,
   selectsMap
  } = this, presetData = preset.data;
  this.currentPresetId = id;
  let isDefaultPreset = id <= 0;
  this.updateButtonStates(), $btnDetect.classList.toggle("bx-gone", isDefaultPreset);
  let buttonIndex;
  for (buttonIndex in selectsMap) {
   buttonIndex = buttonIndex;
   let $select = selectsMap[buttonIndex];
   if (!$select) continue;
   let mappedButton = presetData.mapping[buttonIndex];
   $select.value = typeof mappedButton > "u" ? "" : mappedButton.toString(), $select.disabled = isDefaultPreset, BxEvent.dispatch($select, "input", {
    ignoreOnChange: !0,
    manualTrigger: !0
   });
  }
  presetData.settings = Object.assign({}, this.presetsDb.BLANK_PRESET_DATA.settings, presetData.settings), $vibrationIntensity.value = presetData.settings.vibrationIntensity.toString(), $vibrationIntensity.dataset.disabled = isDefaultPreset.toString(), $leftStickDeadzone.dataset.disabled = $rightStickDeadzone.dataset.disabled = $leftTriggerRange.dataset.disabled = $rightTriggerRange.dataset.disabled = isDefaultPreset.toString(), $leftStickDeadzone.setValue(presetData.settings.leftStickDeadzone), $rightStickDeadzone.setValue(presetData.settings.rightStickDeadzone), $leftTriggerRange.setValue(presetData.settings.leftTriggerRange), $rightTriggerRange.setValue(presetData.settings.rightTriggerRange);
 }
 updatePreset() {
  let newData = deepClone(this.presetsDb.BLANK_PRESET_DATA), gamepadKey;
  for (gamepadKey in this.selectsMap) {
   let value = this.selectsMap[gamepadKey].value;
   if (!value) continue;
   let mapTo = value === "false" ? !1 : parseInt(value);
   newData.mapping[gamepadKey] = mapTo;
  }
  Object.assign(newData.settings, {
   vibrationIntensity: parseInt(this.$vibrationIntensity.value),
   leftStickDeadzone: this.$leftStickDeadzone.getValue(),
   rightStickDeadzone: this.$rightStickDeadzone.getValue(),
   leftTriggerRange: this.$leftTriggerRange.getValue(),
   rightTriggerRange: this.$rightTriggerRange.getValue()
  });
  let preset = this.allPresets.data[this.currentPresetId];
  preset.data = newData, this.presetsDb.updatePreset(preset);
 }
 async renderSummary(presetId) {
  let preset = await this.presetsDb.getPreset(presetId);
  if (!preset) return null;
  let presetData = preset.data, $content, showNote = !1;
  if (Object.keys(presetData.mapping).length > 0) {
   $content = CE("div", { class: "bx-controller-customization-summary" });
   for (let gamepadKey of ControllerCustomizationsManagerDialog.BUTTONS_ORDER) {
    if (!(gamepadKey in presetData.mapping)) continue;
    let mappedKey = presetData.mapping[gamepadKey];
    $content.append(CE("span", { class: "bx-prompt" }, getGamepadPrompt(gamepadKey) + " > " + (mappedKey === !1 ? "🚫" : getGamepadPrompt(mappedKey))));
   }
   showNote = !0;
  }
  let key;
  for (key in presetData.settings) {
   if (key === "vibrationIntensity") continue;
   let value = presetData.settings[key];
   if (Array.isArray(value) && (value[0] !== 0 || value[1] !== 100)) {
    showNote = !0;
    break;
   }
  }
  let fragment = document.createDocumentFragment();
  if (showNote) {
   let $note = CE("div", { class: "bx-settings-dialog-note" }, "ⓘ " + t("controller-customization-input-latency-note"));
   fragment.appendChild($note);
  }
  if ($content) fragment.appendChild($content);
  return fragment.childElementCount ? fragment : null;
 }
}
class ControllerExtraSettings extends HTMLElement {
 currentControllerId;
 controllerIds;
 $selectControllers;
 $selectShortcuts;
 $selectCustomization;
 $summaryCustomization;
 updateLayout;
 switchController;
 getCurrentControllerId;
 saveSettings;
 updateCustomizationSummary;
 setValue;
 static renderSettings() {
  let $container = CE("label", {
   class: "bx-settings-row bx-controller-extra-settings"
  });
  $container.prefKey = "controller.settings", $container.addEventListener("contextmenu", this.boundOnContextMenu), this.settingsManager.setElement("controller.settings", $container), $container.updateLayout = ControllerExtraSettings.updateLayout.bind($container), $container.switchController = ControllerExtraSettings.switchController.bind($container), $container.getCurrentControllerId = ControllerExtraSettings.getCurrentControllerId.bind($container), $container.saveSettings = ControllerExtraSettings.saveSettings.bind($container), $container.setValue = ControllerExtraSettings.setValue.bind($container);
  let $selectControllers = BxSelectElement.create(CE("select", {
   class: "bx-full-width",
   autocomplete: "off",
   _on: {
    input: (e) => {
     $container.switchController($selectControllers.value);
    }
   }
  })), $selectShortcuts = BxSelectElement.create(CE("select", {
   autocomplete: "off",
   _on: { input: $container.saveSettings }
  })), $selectCustomization = BxSelectElement.create(CE("select", {
   autocomplete: "off",
   _on: {
    input: async () => {
     ControllerExtraSettings.updateCustomizationSummary.call($container), $container.saveSettings();
    }
   }
  })), $rowCustomization = createSettingRow(t("in-game-controller-customization"), CE("div", {
   class: "bx-preset-row",
   _nearby: { orientation: "horizontal" }
  }, $selectCustomization, createButton({
   title: t("manage"),
   icon: BxIcon.MANAGE,
   style: 64 | 1 | 512,
   onClick: () => ControllerCustomizationsManagerDialog.getInstance().show({
    id: $container.$selectCustomization.value ? parseInt($container.$selectCustomization.value) : null
   })
  })), { multiLines: !0 });
  return $rowCustomization.appendChild($container.$summaryCustomization = CE("div")), $container.append(CE("span", !1, t("no-controllers-connected")), CE("div", { class: "bx-controller-extra-wrapper" }, $selectControllers, CE("div", { class: "bx-sub-content-box" }, createSettingRow(t("in-game-controller-shortcuts"), CE("div", {
   class: "bx-preset-row",
   _nearby: { orientation: "horizontal" }
  }, $selectShortcuts, createButton({
   title: t("manage"),
   icon: BxIcon.MANAGE,
   style: 64 | 1 | 512,
   onClick: () => ControllerShortcutsManagerDialog.getInstance().show({
    id: parseInt($container.$selectShortcuts.value)
   })
  })), { multiLines: !0 }), $rowCustomization))), $container.$selectControllers = $selectControllers, $container.$selectShortcuts = $selectShortcuts, $container.$selectCustomization = $selectCustomization, $container.updateLayout(), window.addEventListener("gamepadconnected", $container.updateLayout), window.addEventListener("gamepaddisconnected", $container.updateLayout), this.onMountedCallbacks.push(() => {
   $container.updateLayout();
  }), $container;
 }
 static async updateCustomizationSummary() {
  let presetId = parseInt(this.$selectCustomization.value), $summaryContent = await ControllerCustomizationsManagerDialog.getInstance().renderSummary(presetId);
  if (removeChildElements(this.$summaryCustomization), $summaryContent) this.$summaryCustomization.appendChild($summaryContent);
 }
 static async updateLayout() {
  if (this.controllerIds = getUniqueGamepadNames(), this.dataset.hasGamepad = (this.controllerIds.length > 0).toString(), this.controllerIds.length === 0) return;
  let $fragment = document.createDocumentFragment();
  removeChildElements(this.$selectControllers);
  for (let name of this.controllerIds) {
   let $option = CE("option", { value: name }, simplifyGamepadName(name));
   $fragment.appendChild($option);
  }
  this.$selectControllers.appendChild($fragment);
  let allShortcutPresets = await ControllerShortcutsTable.getInstance().getPresets();
  renderPresetsList(this.$selectShortcuts, allShortcutPresets, null, { addOffValue: !0 });
  let allCustomizationPresets = await ControllerCustomizationsTable.getInstance().getPresets();
  renderPresetsList(this.$selectCustomization, allCustomizationPresets, null, { addOffValue: !0 });
  for (let name of this.controllerIds) {
   let $option = CE("option", { value: name }, name);
   $fragment.appendChild($option);
  }
  BxEvent.dispatch(this.$selectControllers, "input"), calculateSelectBoxes(this);
 }
 static async switchController(id) {
  if (this.currentControllerId = id, !this.getCurrentControllerId()) return;
  let controllerSetting = STORAGE.Stream.getControllerSetting(this.currentControllerId);
  ControllerExtraSettings.updateElements.call(this, controllerSetting);
 }
 static getCurrentControllerId() {
  if (this.currentControllerId) {
   if (this.controllerIds.includes(this.currentControllerId)) return this.currentControllerId;
   this.currentControllerId = "";
  }
  if (!this.currentControllerId) this.currentControllerId = this.controllerIds[0];
  if (this.currentControllerId) return this.currentControllerId;
  return null;
 }
 static async saveSettings() {
  if (!this.getCurrentControllerId()) return;
  let controllerSettings = getStreamPref("controller.settings");
  controllerSettings[this.currentControllerId] = {
   shortcutPresetId: parseInt(this.$selectShortcuts.value),
   customizationPresetId: parseInt(this.$selectCustomization.value)
  }, setStreamPref("controller.settings", controllerSettings, "ui"), StreamSettings.refreshControllerSettings();
 }
 static setValue(value) {
  ControllerExtraSettings.updateElements.call(this, value[this.currentControllerId]);
 }
 static updateElements(controllerSetting) {
  if (!controllerSetting) return;
  this.$selectShortcuts.value = controllerSetting.shortcutPresetId.toString(), this.$selectCustomization.value = controllerSetting.customizationPresetId.toString(), ControllerExtraSettings.updateCustomizationSummary.call(this);
 }
}
class SuggestionsSetting {
 static async renderSuggestions(e) {
  let $btnSuggest = e.target.closest("div");
  $btnSuggest.toggleAttribute("bx-open");
  let $content = $btnSuggest.nextElementSibling;
  if ($content) {
   BxEvent.dispatch($content.querySelector("select"), "input");
   return;
  }
  let settingTabGroup;
  for (settingTabGroup in this.SETTINGS_UI) {
   let settingTab = this.SETTINGS_UI[settingTabGroup];
   if (!settingTab || !settingTab.items || typeof settingTab.items === "function") continue;
   for (let settingTabContent of settingTab.items) {
    if (!settingTabContent || settingTabContent instanceof HTMLElement || !settingTabContent.items) continue;
    for (let setting of settingTabContent.items) {
     let prefKey;
     if (typeof setting === "string") prefKey = setting;
     else if (typeof setting === "object") prefKey = setting.pref;
     if (prefKey) this.settingLabels[prefKey] = settingTabContent.label;
    }
   }
  }
  let recommendedDevice = "";
  if (BX_FLAGS.DeviceInfo.deviceType.includes("android")) {
   if (BX_FLAGS.DeviceInfo.androidInfo) recommendedDevice = await SuggestionsSetting.getRecommendedSettings.call(this, BX_FLAGS.DeviceInfo.androidInfo);
  }
  let hasRecommendedSettings = Object.keys(this.suggestedSettings.recommended).length > 0, deviceType = BX_FLAGS.DeviceInfo.deviceType;
  if (deviceType === "android-handheld") SuggestionsSetting.addDefaultSuggestedSetting.call(this, "touchController.mode", "off"), SuggestionsSetting.addDefaultSuggestedSetting.call(this, "deviceVibration.mode", "on");
  else if (deviceType === "android") SuggestionsSetting.addDefaultSuggestedSetting.call(this, "deviceVibration.mode", "auto");
  else if (deviceType === "android-tv") SuggestionsSetting.addDefaultSuggestedSetting.call(this, "touchController.mode", "off");
  SuggestionsSetting.generateDefaultSuggestedSettings.call(this);
  let $suggestedSettings = CE("div", { class: "bx-suggest-wrapper" }), $select = CE("select", !1, hasRecommendedSettings && CE("option", { value: "recommended" }, t("recommended")), !hasRecommendedSettings && CE("option", { value: "highest" }, t("highest-quality")), CE("option", { value: "default" }, t("default")), CE("option", { value: "lowest" }, t("lowest-quality")));
  $select.addEventListener("input", (e) => {
   let profile = $select.value;
   removeChildElements($suggestedSettings);
   let fragment = document.createDocumentFragment(), note;
   if (profile === "recommended") note = t("recommended-settings-for-device", { device: recommendedDevice });
   else if (profile === "highest") note = "⚠️ " + t("highest-quality-note");
   note && fragment.appendChild(CE("div", { class: "bx-suggest-note" }, note));
   let settings = this.suggestedSettings[profile];
   for (let key in settings) {
    let { storage, definition } = getPrefInfo(key), prefKey;
    if (storage === STORAGE.Stream) prefKey = key;
    else prefKey = key;
    let suggestedValue;
    if (definition && definition.transformValue) suggestedValue = definition.transformValue.get.call(definition, settings[prefKey]);
    else suggestedValue = settings[prefKey];
    let currentValue = storage.getSetting(prefKey, !1), currentValueText = storage.getValueText(prefKey, currentValue), isSameValue = currentValue === suggestedValue, $child, $value;
    if (isSameValue) $value = currentValueText;
    else {
     let suggestedValueText = storage.getValueText(prefKey, suggestedValue);
     $value = currentValueText + " ➔ " + suggestedValueText;
    }
    let $checkbox, breadcrumb = this.settingLabels[prefKey] + " ❯ " + storage.getLabel(prefKey), id = escapeCssSelector(`bx_suggest_${prefKey}`);
    if ($child = CE("div", {
     class: `bx-suggest-row ${isSameValue ? "bx-suggest-ok" : "bx-suggest-change"}`
    }, $checkbox = CE("input", {
     type: "checkbox",
     tabindex: 0,
     checked: !0,
     id
    }), CE("label", {
     for: id
    }, CE("div", {
     class: "bx-suggest-label"
    }, breadcrumb), CE("div", {
     class: "bx-suggest-value"
    }, $value))), isSameValue)
     $checkbox.disabled = !0, $checkbox.checked = !0;
    fragment.appendChild($child);
   }
   $suggestedSettings.appendChild(fragment);
  }), BxEvent.dispatch($select, "input");
  let onClickApply = () => {
   let profile = $select.value, settings = this.suggestedSettings[profile], prefKey, settingsManager = SettingsManager.getInstance();
   for (prefKey in settings) {
    let suggestedValue = settings[prefKey], $checkBox = $content.querySelector(`#bx_suggest_${escapeCssSelector(prefKey)}`);
    if (!$checkBox.checked || $checkBox.disabled) continue;
    let $control = settingsManager.getElement(prefKey);
    if (!$control) {
     setPref(prefKey, suggestedValue, "direct");
     continue;
    }
    let { definition: settingDefinition } = getPrefInfo(prefKey);
    if (settingDefinition?.transformValue) suggestedValue = settingDefinition.transformValue.get.call(settingDefinition, suggestedValue);
    if ("setValue" in $control) $control.setValue(suggestedValue);
    else $control.value = suggestedValue;
    BxEvent.dispatch($control, "input", {
     manualTrigger: !0
    });
   }
   BxEvent.dispatch($select, "input");
  }, $btnApply = createButton({
   label: t("apply"),
   style: 128 | 64,
   onClick: onClickApply
  });
  $content = CE("div", {
   class: "bx-sub-content-box bx-suggest-box",
   _nearby: {
    orientation: "vertical"
   }
  }, BxSelectElement.create($select), $suggestedSettings, $btnApply), $btnSuggest.insertAdjacentElement("afterend", $content);
 }
 static async getRecommendedSettings(androidInfo) {
  function normalize(str) {
   return str.toLowerCase().trim().replaceAll(/\s+/g, "-").replaceAll(/-+/g, "-");
  }
  try {
   let { brand, board, model } = androidInfo;
   brand = normalize(brand), board = normalize(board), model = normalize(model);
   let url = GhPagesUtils.getUrl(`devices/${brand}/${board}-${model}.json`), json = await (await NATIVE_FETCH(url)).json(), recommended = {};
   if (json.schema_version !== 2) return null;
   let scriptSettings = json.settings.script;
   if (scriptSettings._base) {
    let base = typeof scriptSettings._base === "string" ? [scriptSettings._base] : scriptSettings._base;
    for (let profile of base)
     Object.assign(recommended, this.suggestedSettings[profile]);
    delete scriptSettings._base;
   }
   let key;
   for (key in scriptSettings)
    recommended[key] = scriptSettings[key];
   return BX_FLAGS.DeviceInfo.deviceType = json.device_type, this.suggestedSettings.recommended = recommended, json.device_name;
  } catch (e) {}
  return null;
 }
 static addDefaultSuggestedSetting(prefKey, value) {
  let key;
  for (key in this.suggestedSettings)
   if (key !== "default" && !(prefKey in this.suggestedSettings)) this.suggestedSettings[key][prefKey] = value;
 }
 static generateDefaultSuggestedSettings() {
  let key;
  for (key in this.suggestedSettings) {
   if (key === "default") continue;
   let prefKey;
   for (prefKey in this.suggestedSettings[key])
    if (!(prefKey in this.suggestedSettings.default)) this.suggestedSettings.default[prefKey] = getPrefInfo(prefKey).definition.default;
  }
 }
}
class BxKeyBindingButton extends HTMLButtonElement {
 title;
 isPrompt = !1;
 allowedFlags;
 keyInfo = null;
 bindKey;
 unbindKey;
 static create(options) {
  let $btn = CE("button", {
   class: "bx-binding-button bx-focusable",
   type: "button"
  });
  return $btn.title = options.title, $btn.isPrompt = !!options.isPrompt, $btn.allowedFlags = options.allowedFlags, $btn.bindKey = BxKeyBindingButton.bindKey.bind($btn), $btn.unbindKey = BxKeyBindingButton.unbindKey.bind($btn), $btn.addEventListener("click", BxKeyBindingButton.onClick.bind($btn)), $btn.addEventListener("contextmenu", BxKeyBindingButton.onContextMenu), $btn.addEventListener("change", options.onChanged), $btn;
 }
 static onClick(e) {
  KeyBindingDialog.getInstance().show({
   $elm: this
  });
 }
 static onContextMenu = (e) => {
  e.preventDefault();
  let $btn = e.target;
  if (!$btn.disabled) $btn.unbindKey.apply($btn);
 };
 static bindKey(key, force = !1) {
  if (!key) return;
  if (force || this.keyInfo === null || key.code !== this.keyInfo?.code || key.modifiers !== this.keyInfo?.modifiers) {
   if (this.textContent = KeyHelper.codeToKeyName(key), this.keyInfo = key, !force) BxEvent.dispatch(this, "change");
  }
 }
 static unbindKey(force = !1) {
  this.textContent = "", this.keyInfo = null, !force && BxEvent.dispatch(this, "change");
 }
 constructor() {
  super();
 }
}
class KeyBindingDialog {
 static instance;
 static getInstance = () => KeyBindingDialog.instance ?? (KeyBindingDialog.instance = new KeyBindingDialog);
 $dialog;
 $wait;
 $title;
 $inputList;
 $overlay;
 $currentElm;
 countdownIntervalId;
 constructor() {
  this.$overlay = CE("div", { class: "bx-key-binding-dialog-overlay bx-gone" }), this.$overlay.addEventListener("contextmenu", (e) => e.preventDefault()), document.documentElement.appendChild(this.$overlay), this.$dialog = CE("div", { class: "bx-key-binding-dialog bx-gone" }, this.$title = CE("h2", {}), CE("div", { class: "bx-key-binding-dialog-content" }, CE("div", !1, this.$wait = CE("p", { class: "bx-blink-me" }), this.$inputList = CE("ul", !1, CE("li", { _dataset: { flag: 1 } }, t("keyboard-key")), CE("li", { _dataset: { flag: 2 } }, t("modifiers-note")), CE("li", { _dataset: { flag: 4 } }, t("mouse-click")), CE("li", { _dataset: { flag: 8 } }, t("mouse-wheel"))), CE("i", !1, t("press-esc-to-cancel"))))), this.$dialog.addEventListener("contextmenu", (e) => e.preventDefault()), document.documentElement.appendChild(this.$dialog);
 }
 show(options) {
  this.$currentElm = options.$elm, this.addEventListeners();
  let allowedFlags = this.$currentElm.allowedFlags;
  this.$inputList.dataset.flags = "[" + allowedFlags.join("][") + "]", document.activeElement && document.activeElement.blur(), this.$title.textContent = this.$currentElm.title, this.$title.classList.toggle("bx-prompt", this.$currentElm.isPrompt), this.$dialog.classList.remove("bx-gone"), this.$overlay.classList.remove("bx-gone"), this.startCountdown();
 }
 startCountdown() {
  this.stopCountdown();
  let count = 9;
  this.$wait.textContent = `[${count}] ${t("waiting-for-input")}`, this.countdownIntervalId = window.setInterval(() => {
   if (count -= 1, count === 0) {
    this.stopCountdown(), this.hide();
    return;
   }
   this.$wait.textContent = `[${count}] ${t("waiting-for-input")}`;
  }, 1000);
 }
 stopCountdown() {
  this.countdownIntervalId && clearInterval(this.countdownIntervalId), this.countdownIntervalId = null;
 }
 hide = () => {
  this.clearEventListeners(), this.$dialog.classList.add("bx-gone"), this.$overlay.classList.add("bx-gone");
 };
 addEventListeners() {
  let allowedFlags = this.$currentElm.allowedFlags;
  if (allowedFlags.includes(1)) window.addEventListener("keyup", this);
  if (allowedFlags.includes(4)) window.addEventListener("mousedown", this);
  if (allowedFlags.includes(8)) window.addEventListener("wheel", this);
 }
 clearEventListeners() {
  window.removeEventListener("keyup", this), window.removeEventListener("mousedown", this), window.removeEventListener("wheel", this);
 }
 handleEvent(e) {
  let allowedFlags = this.$currentElm.allowedFlags, handled = !1, valid = !1;
  switch (e.type) {
   case "wheel":
    if (handled = !0, allowedFlags.includes(8)) valid = !0;
    break;
   case "mousedown":
    if (handled = !0, allowedFlags.includes(4)) valid = !0;
    break;
   case "keyup":
    if (handled = !0, allowedFlags.includes(1)) {
     let keyboardEvent = e;
     if (valid = keyboardEvent.code !== "Escape", valid && allowedFlags.includes(2)) {
      let key = keyboardEvent.key;
      valid = key !== "Control" && key !== "Shift" && key !== "Alt", handled = valid;
     }
    }
    break;
  }
  if (handled) {
   if (e.preventDefault(), e.stopPropagation(), valid) this.$currentElm.bindKey(KeyHelper.getKeyFromEvent(e)), this.stopCountdown();
   else this.startCountdown();
   window.setTimeout(this.hide, 200);
  }
 }
}
class MkbMappingManagerDialog extends BaseProfileManagerDialog {
 static instance;
 static getInstance = () => MkbMappingManagerDialog.instance ?? (MkbMappingManagerDialog.instance = new MkbMappingManagerDialog(t("virtual-controller")));
 KEYS_PER_BUTTON = 2;
 BUTTONS_ORDER = [
  16,
  12,
  13,
  14,
  15,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  100,
  101,
  102,
  103,
  11,
  200,
  201,
  202,
  203
 ];
 allKeyElements = [];
 $mouseMapTo;
 $mouseSensitivityX;
 $mouseSensitivityY;
 $mouseDeadzone;
 $unbindNote;
 constructor(title) {
  super(title, MkbMappingPresetsTable.getInstance());
  this.render();
 }
 onBindingKey = (e) => {
  if (e.target.disabled) return;
  if (e.button !== 0) return;
 };
 parseDataset($btn) {
  let dataset = $btn.dataset;
  return {
   keySlot: parseInt(dataset.keySlot),
   buttonIndex: parseInt(dataset.buttonIndex)
  };
 }
 onKeyChanged = (e) => {
  let $current = e.target, keyInfo = $current.keyInfo;
  if (keyInfo) {
   for (let $elm of this.allKeyElements)
    if ($elm !== $current && $elm.keyInfo?.code === keyInfo.code) $elm.unbindKey(!0);
  }
  this.savePreset();
 };
 render() {
  let $rows = CE("div", !1, this.$unbindNote = CE("i", { class: "bx-mkb-note" }, t("right-click-to-unbind")));
  for (let buttonIndex of this.BUTTONS_ORDER) {
   let [buttonName, buttonPrompt] = GamepadKeyName[buttonIndex], $elm, $fragment = document.createDocumentFragment();
   for (let i = 0;i < this.KEYS_PER_BUTTON; i++)
    $elm = BxKeyBindingButton.create({
     title: buttonPrompt,
     isPrompt: !0,
     allowedFlags: [1, 4, 8],
     onChanged: this.onKeyChanged
    }), $elm.dataset.buttonIndex = buttonIndex.toString(), $elm.dataset.keySlot = i.toString(), $elm.addEventListener("mouseup", this.onBindingKey), $fragment.appendChild($elm), this.allKeyElements.push($elm);
   let $keyRow = CE("div", {
    class: "bx-mkb-key-row",
    _nearby: { orientation: "horizontal" }
   }, CE("label", { title: buttonName }, buttonPrompt), $fragment);
   $rows.appendChild($keyRow);
  }
  let savePreset = () => this.savePreset(), $extraSettings = CE("div", !1, createSettingRow(t("map-mouse-to"), this.$mouseMapTo = BxSelectElement.create(CE("select", { _on: { input: savePreset } }, CE("option", { value: 2 }, t("right-stick")), CE("option", { value: 1 }, t("left-stick")), CE("option", { value: 0 }, t("off"))))), createSettingRow(t("horizontal-sensitivity"), this.$mouseSensitivityX = BxNumberStepper.create("hor_sensitivity", 0, 1, 300, {
   suffix: "%",
   exactTicks: 50
  }, savePreset)), createSettingRow(t("vertical-sensitivity"), this.$mouseSensitivityY = BxNumberStepper.create("ver_sensitivity", 0, 1, 300, {
   suffix: "%",
   exactTicks: 50
  }, savePreset)), createSettingRow(t("deadzone-counterweight"), this.$mouseDeadzone = BxNumberStepper.create("deadzone_counterweight", 0, 1, 50, {
   suffix: "%",
   exactTicks: 10
  }, savePreset)));
  this.$content = CE("div", !1, $rows, $extraSettings);
 }
 switchPreset(id) {
  let preset = this.allPresets.data[id];
  if (!preset) {
   this.currentPresetId = 0;
   return;
  }
  let presetData = preset.data;
  this.currentPresetId = id;
  let isDefaultPreset = id <= 0;
  this.updateButtonStates(), this.$unbindNote.classList.toggle("bx-gone", isDefaultPreset);
  for (let $elm of this.allKeyElements) {
   let { buttonIndex, keySlot } = this.parseDataset($elm), buttonKeys = presetData.mapping[buttonIndex];
   if (buttonKeys && buttonKeys[keySlot]) $elm.bindKey({
     code: buttonKeys[keySlot]
    }, !0);
   else $elm.unbindKey(!0);
   $elm.disabled = isDefaultPreset;
  }
  let mouse = presetData.mouse;
  this.$mouseMapTo.value = mouse.mapTo.toString(), this.$mouseSensitivityX.value = mouse.sensitivityX.toString(), this.$mouseSensitivityY.value = mouse.sensitivityY.toString(), this.$mouseDeadzone.value = mouse.deadzoneCounterweight.toString(), this.$mouseMapTo.disabled = isDefaultPreset, this.$mouseSensitivityX.dataset.disabled = isDefaultPreset.toString(), this.$mouseSensitivityY.dataset.disabled = isDefaultPreset.toString(), this.$mouseDeadzone.dataset.disabled = isDefaultPreset.toString();
 }
 savePreset() {
  let presetData = deepClone(this.presetsDb.BLANK_PRESET_DATA);
  for (let $elm of this.allKeyElements) {
   let { buttonIndex, keySlot } = this.parseDataset($elm), mapping = presetData.mapping;
   if (!mapping[buttonIndex]) mapping[buttonIndex] = [];
   if (!$elm.keyInfo) delete mapping[buttonIndex][keySlot];
   else mapping[buttonIndex][keySlot] = $elm.keyInfo.code;
  }
  let mouse = presetData.mouse;
  mouse.mapTo = parseInt(this.$mouseMapTo.value), mouse.sensitivityX = parseInt(this.$mouseSensitivityX.value), mouse.sensitivityY = parseInt(this.$mouseSensitivityY.value), mouse.deadzoneCounterweight = parseInt(this.$mouseDeadzone.value);
  let oldPreset = this.allPresets.data[this.currentPresetId], newPreset = {
   id: this.currentPresetId,
   name: oldPreset.name,
   data: presetData
  };
  this.presetsDb.updatePreset(newPreset), this.allPresets.data[this.currentPresetId] = newPreset;
 }
 onBeforeUnmount() {
  StreamSettings.refreshMkbSettings(), super.onBeforeUnmount();
 }
}
class KeyboardShortcutsManagerDialog extends BaseProfileManagerDialog {
 static instance;
 static getInstance = () => KeyboardShortcutsManagerDialog.instance ?? (KeyboardShortcutsManagerDialog.instance = new KeyboardShortcutsManagerDialog(t("keyboard-shortcuts")));
 $content;
 $unbindNote;
 allKeyElements = [];
 constructor(title) {
  super(title, KeyboardShortcutsTable.getInstance());
  let $rows = CE("div", { class: "bx-keyboard-shortcuts-manager-container" });
  for (let groupLabel in SHORTCUT_ACTIONS) {
   let items = SHORTCUT_ACTIONS[groupLabel];
   if (!items) continue;
   let $fieldSet = CE("fieldset", !1, CE("legend", !1, groupLabel));
   for (let action in items) {
    let crumbs = items[action];
    if (!crumbs) continue;
    let label = crumbs.join(" ❯ "), $btn = BxKeyBindingButton.create({
     title: label,
     isPrompt: !1,
     onChanged: this.onKeyChanged,
     allowedFlags: [1, 2]
    });
    $btn.classList.add("bx-full-width"), $btn.dataset.action = action, this.allKeyElements.push($btn);
    let $row = createSettingRow(label, CE("div", { class: "bx-binding-button-wrapper" }, $btn));
    $fieldSet.appendChild($row);
   }
   if ($fieldSet.childElementCount > 1) $rows.appendChild($fieldSet);
  }
  this.$content = CE("div", !1, this.$unbindNote = CE("i", { class: "bx-mkb-note" }, t("right-click-to-unbind")), $rows);
 }
 onKeyChanged = (e) => {
  let $current = e.target, keyInfo = $current.keyInfo;
  if (keyInfo) for (let $elm of this.allKeyElements) {
    if ($elm === $current) continue;
    if ($elm.keyInfo?.code === keyInfo.code && $elm.keyInfo?.modifiers === keyInfo.modifiers) $elm.unbindKey(!0);
   }
  this.savePreset();
 };
 parseDataset($btn) {
  return {
   action: $btn.dataset.action
  };
 }
 switchPreset(id) {
  let preset = this.allPresets.data[id];
  if (!preset) {
   this.currentPresetId = 0;
   return;
  }
  let presetData = preset.data;
  this.currentPresetId = id;
  let isDefaultPreset = id <= 0;
  this.updateButtonStates(), this.$unbindNote.classList.toggle("bx-gone", isDefaultPreset);
  for (let $elm of this.allKeyElements) {
   let { action } = this.parseDataset($elm), keyInfo = presetData.mapping[action];
   if (keyInfo) $elm.bindKey(keyInfo, !0);
   else $elm.unbindKey(!0);
   $elm.disabled = isDefaultPreset;
  }
 }
 savePreset() {
  let presetData = deepClone(this.presetsDb.BLANK_PRESET_DATA);
  for (let $elm of this.allKeyElements) {
   let { action } = this.parseDataset($elm), mapping = presetData.mapping;
   if ($elm.keyInfo) mapping[action] = $elm.keyInfo;
  }
  let oldPreset = this.allPresets.data[this.currentPresetId], newPreset = {
   id: this.currentPresetId,
   name: oldPreset.name,
   data: presetData
  };
  this.presetsDb.updatePreset(newPreset), this.allPresets.data[this.currentPresetId] = newPreset;
 }
 onBeforeUnmount() {
  StreamSettings.refreshKeyboardShortcuts(), super.onBeforeUnmount();
 }
}
class MkbExtraSettings extends HTMLElement {
 $mappingPresets;
 $shortcutsPresets;
 updateLayout;
 saveMkbSettings;
 saveShortcutsSettings;
 static renderSettings() {
  let $container = document.createDocumentFragment();
  $container.updateLayout = MkbExtraSettings.updateLayout.bind($container), $container.saveMkbSettings = MkbExtraSettings.saveMkbSettings.bind($container), $container.saveShortcutsSettings = MkbExtraSettings.saveShortcutsSettings.bind($container);
  let $mappingPresets = BxSelectElement.create(CE("select", {
   autocomplete: "off",
   _on: {
    input: $container.saveMkbSettings
   }
  })), $shortcutsPresets = BxSelectElement.create(CE("select", {
   autocomplete: "off",
   _on: {
    input: $container.saveShortcutsSettings
   }
  })), suggestedPreset = getSuggestedMkbPresetForTitle(STATES.currentStream.titleInfo?.product.title);
  return $container.append(...getGlobalPref("mkb.enabled") ? [
   createSettingRow(t("virtual-controller"), CE("div", {
    class: "bx-preset-row",
    _nearby: {
     orientation: "horizontal"
    }
   }, $mappingPresets, createButton({
    title: t("manage"),
    icon: BxIcon.MANAGE,
    style: 64 | 1 | 512,
    onClick: () => MkbMappingManagerDialog.getInstance().show({
     id: parseInt($container.$mappingPresets.value)
    })
   })), {
    multiLines: !0,
    onContextMenu: this.boundOnContextMenu,
    pref: "mkb.p1.preset.mappingId"
   }),
   ...suggestedPreset ? [createSettingRow(t("suggested-control-profile"), createButton({
    label: `${t("use-suggested-profile")}: ${suggestedPreset.name}`,
    icon: BxIcon.NEW,
    style: 64 | 4096,
    onClick: () => {
     $container.$mappingPresets.value = suggestedPreset.id.toString(), $container.saveMkbSettings();
    }
   }), {
    multiLines: !0,
    $note: CE("div", { class: "bx-settings-dialog-note" }, t("suggested-profile-note"))
   })] : [],
   createSettingRow(t("virtual-controller-slot"), this.settingsManager.getElement("mkb.p1.slot"), {
    onContextMenu: this.boundOnContextMenu,
    pref: "mkb.p1.slot"
   })
  ] : [], createSettingRow(t("in-game-keyboard-shortcuts"), CE("div", {
   class: "bx-preset-row",
   _nearby: {
    orientation: "horizontal"
   }
  }, $shortcutsPresets, createButton({
   title: t("manage"),
   icon: BxIcon.MANAGE,
   style: 64 | 1 | 512,
   onClick: () => KeyboardShortcutsManagerDialog.getInstance().show({
    id: parseInt($container.$shortcutsPresets.value)
   })
  })), {
   multiLines: !0,
   onContextMenu: this.boundOnContextMenu,
   pref: "keyboardShortcuts.preset.inGameId"
  })), $container.$mappingPresets = $mappingPresets, $container.$shortcutsPresets = $shortcutsPresets, this.settingsManager.setElement("keyboardShortcuts.preset.inGameId", $shortcutsPresets), this.settingsManager.setElement("mkb.p1.preset.mappingId", $mappingPresets), $container.updateLayout(), this.onMountedCallbacks.push(() => {
   $container.updateLayout();
  }), $container;
 }
 static async updateLayout() {
  let mappingPresets = await MkbMappingPresetsTable.getInstance().getPresets();
  renderPresetsList(this.$mappingPresets, mappingPresets, getStreamPref("mkb.p1.preset.mappingId"));
  let shortcutsPresets = await KeyboardShortcutsTable.getInstance().getPresets();
  renderPresetsList(this.$shortcutsPresets, shortcutsPresets, getStreamPref("keyboardShortcuts.preset.inGameId"), { addOffValue: !0 });
 }
 static async saveMkbSettings() {
  let presetId = parseInt(this.$mappingPresets.value);
  setStreamPref("mkb.p1.preset.mappingId", presetId, "ui");
 }
 static async saveShortcutsSettings() {
  let presetId = parseInt(this.$shortcutsPresets.value);
  setStreamPref("keyboardShortcuts.preset.inGameId", presetId, "ui");
 }
}
class VxLabsSettings {
 static render() {
  let $status = CE("pre", { class: "bx-vx-status" }), refresh = () => {
   let capabilities = VxVideoEngine.getInstance().getCapabilities(), rendererMs = VxTelemetry.getInstance().getAverageRendererMs(), latencyProtection = STATES.currentStream.streamPlayerManager?.getCanvasPlayer()?.getLatencyProtectionStatus();
   $status.textContent = [
    `${t("vx-diagnostics-backend")}: ${capabilities.webgpu ? "WebGPU" : capabilities.webgl2 ? "WebGL2" : t("vx-diagnostics-unavailable")}`,
    `${t("vx-diagnostics-vfc")}: ${capabilities.videoFrameCallback ? t("enabled") : t("disabled")}`,
    `${t("vx-diagnostics-video-frame")}: ${capabilities.videoFrame ? t("enabled") : t("disabled")}`,
    `${t("vx-diagnostics-refresh-rate")}: ${capabilities.displayRefreshRate ? capabilities.displayRefreshRate + " Hz" : t("vx-diagnostics-measuring")}`,
    `${t("vx-diagnostics-renderer-time")}: ${typeof rendererMs === "number" ? rendererMs.toFixed(2) + " ms (CPU)" : t("vx-diagnostics-unavailable")}`,
    `${t("vx-diagnostics-latency-protection")}: ${latencyProtection ? `${latencyProtection.label} (${latencyProtection.rendererMs?.toFixed(2) ?? "—"} / ${latencyProtection.budgetMs} ms)` : t("vx-diagnostics-unavailable")}`
   ].join(`
`);
  }, $refresh = CE("button", {
   class: "bx-button",
   type: "button",
   _on: { click: refresh }
  }, t("vx-diagnostics-refresh"));
  return refresh(), CE("div", { class: "bx-vx-labs" }, CE("p", !1, t("vx-diagnostics-description")), $status, CE("div", { class: "bx-vx-actions" }, $refresh));
 }
}
class SettingsDialog extends NavigationDialog {
 static instance;
 static getInstance = () => SettingsDialog.instance ?? (SettingsDialog.instance = new SettingsDialog);
 LOG_TAG = "SettingsNavigationDialog";
 $container;
 $tabs;
 $tabContents;
 $btnReload;
 $btnGlobalReload;
 $noteGlobalReload;
 $btnSuggestion;
 $streamSettingsSelection;
 renderFullSettings;
 boundOnContextMenu;
 suggestedSettings = {
  recommended: {},
  default: {},
  lowest: {},
  highest: {}
 };
 settingLabels = {};
 settingsManager;
 TAB_GLOBAL_ITEMS = [{
  group: "general",
  label: t("better-xcloud"),
  items: [
   ($parent) => {
    let topButtons = [];
    if (AppInterface) topButtons.push(createButton({
      label: t("app-settings"),
      icon: BxIcon.STREAM_SETTINGS,
      style: 128 | 64,
      onClick: (e) => {
       AppInterface.openAppSettings && AppInterface.openAppSettings(), this.hide();
      }
     }));
    this.$btnGlobalReload = createButton({
     label: t("settings-reload"),
     classes: ["bx-settings-reload-button", "bx-gone"],
     style: 64 | 128,
     onClick: (e) => {
      this.reloadPage();
     }
    }), topButtons.push(this.$btnGlobalReload), this.$noteGlobalReload = CE("span", {
     class: "bx-settings-reload-note"
    }, t("settings-reload-note")), topButtons.push(this.$noteGlobalReload), this.$btnSuggestion = CE("div", {
     class: "bx-suggest-toggler bx-focusable",
     tabindex: 0
    }, CE("label", !1, t("suggest-settings")), CE("span", !1, "❯")), this.$btnSuggestion.addEventListener("click", SuggestionsSetting.renderSuggestions.bind(this)), topButtons.push(this.$btnSuggestion);
    let $div = CE("div", {
     class: "bx-top-buttons",
     _nearby: {
      orientation: "vertical"
     }
    }, ...topButtons);
    $parent.appendChild($div);
   },
   {
    pref: "bx.locale",
    multiLines: !0
   },
   "server.bypassRestriction"
  ]
 }, {
  group: "server",
  label: t("server"),
  items: [
   {
    pref: "server.region",
    multiLines: !0
   },
   {
    pref: "stream.locale",
    multiLines: !0
   },
   "server.ipv6.prefer"
  ]
 }, {
  group: "stream",
  label: t("stream"),
  items: [
   "stream.video.resolution",
   "stream.video.codecProfile",
   "stream.video.maxBitrate",
   "stream.video.preventResolutionDrops",
   "stream.cloud.keepAlive",
   "audio.volume.booster.enabled",
   "screenshot.applyFilters",
   "audio.mic.onPlaying",
   "game.fortnite.forceConsole",
   "stream.video.combineAudio"
  ]
 }, {
  group: "ui",
  label: t("ui"),
  items: [
   "ui.layout",
   "ui.theme",
   "ui.imageQuality",
   "ui.hub.cardSize",
   "ui.hub.cardRounded",
   "ui.hub.hoverEffects",
   "ui.hub.animations",
   "ui.streamMenu.simplify",
   !AppInterface && "ui.hideScrollbar",
   "ui.systemMenu.hideHandle",
   "ui.feedbackDialog.disabled",
   "ui.reduceAnimations",
   {
    pref: "ui.hideSections",
    multiLines: !0
   },
   {
    pref: "block.features",
    multiLines: !0
   }
  ]
 }, {
  requiredVariants: "full",
  group: "game-bar",
  label: t("game-bar"),
  items: [
   "gameBar.position"
  ]
 }, {
  group: "loading-screen",
  label: t("loading-screen"),
  items: [
   "loadingScreen.gameArt.show",
   "loadingScreen.waitTime.show",
   "loadingScreen.rocket",
   "ui.splashVideo.skip"
  ]
 }, {
  group: "other",
  label: t("other"),
  items: [
   "block.tracking",
   ($parent) => {
    $parent.appendChild(createSettingRow(t("show-tutorial-again"), createButton({
     label: t("tutorial-start"),
     icon: BxIcon.REFRESH,
     style: 16 | 64 | 4096,
     onClick: () => {
      this.hide(), BxEvent.dispatch(window, BxEvent.SHOW_WELCOME_TUTORIAL);
     }
    })));
   }
  ]
 }, {
  group: "advanced",
  label: t("advanced"),
  items: [
   {
    pref: "userAgent.profile",
    multiLines: !0,
    onCreated: (setting, $control) => {
     let defaultUserAgent = window.navigator.orgUserAgent || window.navigator.userAgent, $inpCustomUserAgent = CE("input", {
      type: "text",
      placeholder: defaultUserAgent,
      autocomplete: "off",
      class: "bx-settings-custom-user-agent",
      tabindex: 0
     });
     $inpCustomUserAgent.addEventListener("input", (e) => {
      let profile = $control.value, custom = e.target.value.trim();
      UserAgent.updateStorage(profile, custom), this.onGlobalSettingChanged(e);
     }), $control.insertAdjacentElement("afterend", $inpCustomUserAgent), setNearby($inpCustomUserAgent.parentElement, {
      orientation: "vertical"
     });
    }
   }
  ]
 }, {
  group: "footer",
  items: [
   ($parent) => {
    try {
     let appVersion = document.querySelector("meta[name=gamepass-app-version]").content, appDate = new Date(document.querySelector("meta[name=gamepass-app-date]").content).toISOString().substring(0, 10);
     $parent.appendChild(CE("div", {
      class: "bx-settings-app-version"
     }, `${t("xcloud-website-version")} ${appVersion} (${appDate})`));
    } catch (e) {}
   },
   ($parent) => {
    $parent.appendChild(CE("a", {
     class: "bx-donation-link",
     href: "https://ko-fi.com/redphx",
     target: "_blank",
     tabindex: 0
    }, `❤️ ${t("support-better-xcloud")}`));
   },
   ($parent) => {
    $parent.appendChild(CE("div", {
     class: "bx-original-credits"
    }, t("original-creator-credits")));
   },
   ($parent) => {
    $parent.appendChild(createButton({
     label: t("clear-data"),
     style: 4 | 16 | 128 | 64,
     onClick: (e) => {
      if (confirm(t("clear-data-confirm"))) clearAllData();
     }
    }));
   },
   ($parent) => {
    $parent.appendChild(CE("div", { class: "bx-debug-info" }, createButton({
     label: t("debug-info"),
     style: 8 | 128 | 64,
     onClick: (e) => {
      let $button = e.target.closest("button");
      if (!$button) return;
      let $pre = $button.nextElementSibling;
      if (!$pre) {
       let debugInfo = deepClone(BX_FLAGS.DeviceInfo);
       debugInfo.settings = JSON.parse(window.localStorage.getItem("BetterXcloud") || "{}"), $pre = CE("pre", {
        class: "bx-focusable bx-gone",
        tabindex: 0,
        _on: {
         click: async (e2) => {
          await copyToClipboard(e2.target.innerText);
         }
        }
       }, "```\n" + JSON.stringify(debugInfo, null, "  ") + "\n```"), $button.insertAdjacentElement("afterend", $pre);
      }
      $pre.classList.toggle("bx-gone"), $pre.scrollIntoView();
     }
    })));
   }
  ]
 }];
 TAB_DISPLAY_ITEMS = [{
  requiredVariants: "full",
  group: "audio",
  label: t("audio"),
  items: [{
   pref: "audio.volume",
   params: {
    disabled: !getGlobalPref("audio.volume.booster.enabled")
   },
   onCreated: (setting, $elm) => {
    let $range = $elm.querySelector("input[type=range");
    BxEventBus.Stream.on("setting.changed", (payload) => {
     let { settingKey } = payload;
     if (settingKey === "audio.volume") $range.value = getStreamPref(settingKey).toString(), BxEvent.dispatch($range, "input", { ignoreOnChange: !0 });
    });
   }
  }]
 }, {
  group: "video",
  label: t("video"),
  items: [
   "video.player.type",
   "video.maxFps",
   "video.player.powerPreference",
   "video.processing",
   "video.processing.mode",
   "video.ratio",
   "video.position",
   "video.processing.sharpness",
   "video.saturation",
   "video.contrast",
   "video.brightness",
   "vx.antiAliasing"
  ]
 }];
 TAB_VX_ITEMS = [
  isAndroidAppBuild() && {
   requiredVariants: "full",
   group: "video",
   label: t("vx-mobile-warning-title"),
   unsupportedNote: "⚠️ " + t("vx-mobile-warning-summary"),
   content: CE("div", { class: "bx-settings-dialog-note" }, CE("p", !1, t("vx-mobile-warning-webgl")), CE("p", !1, t("vx-mobile-warning-performance")), CE("p", !1, t("vx-mobile-warning-fallback")))
  },
  {
   requiredVariants: "full",
   group: "video",
   label: t("vx-diagnostics"),
   content: VxLabsSettings.render()
  },
  {
   requiredVariants: "full",
   group: "video",
   label: t("vx-ai-and-reconstruction"),
   items: [
    "vx.upscale.target",
    "vx.upscale.algorithm",
    "vx.artifactReduction",
    "vx.frameGeneration",
    "vx.latencyBudget",
    "vx.adaptiveSharpen",
    "vx.dynamicReconstruction",
    "vx.temporalSuperResolution",
    "vx.hudProtection",
    {
     pref: "vx.frameTargetFps",
     onCreated: (_setting, $control) => {
      let $generationRow = this.settingsManager.getElement("vx.frameGeneration").closest(".bx-settings-row"), $targetRow = $control.closest(".bx-settings-row");
      if (!$generationRow || !$targetRow) return;
      let $target = CE("div", { class: "bx-vx-frame-target-input" }, CE("span", !1, t("vx-target-fps")), $control);
      $generationRow.appendChild($target), $targetRow.remove();
     }
    },
    "vx.fineDetailReconstruction",
    "vx.competitiveMode"
   ]
  }
 ];
 TAB_CONTROLLER_ITEMS = [
  {
   group: "controller",
   label: t("controller"),
   items: [
    "ui.controllerFriendly",
    "ui.controllerStatus.show",
    "localCoOp.enabled",
    "controller.pollingRate",
    ($parent) => {
     $parent.appendChild(createSettingRow(t("remap-controller-buttons"), createButton({
      label: t("open-remapping"),
      icon: BxIcon.MANAGE,
      style: 64 | 1 | 4096,
      onClick: () => ControllerCustomizationsManagerDialog.getInstance().show({ id: null })
     }), { multiLines: !0, $note: CE("div", { class: "bx-settings-dialog-note" }, t("remap-controller-buttons-note")) }));
    },
    ($parent) => {
     $parent.appendChild(ControllerExtraSettings.renderSettings.apply(this));
    }
   ]
  },
  {
   requiredVariants: "full",
   group: "touch-control",
   label: t("touch-controller"),
   items: [
    {
     pref: "touchController.mode",
     note: CE("a", { href: "https://github.com/redphx/better-xcloud/discussions/241", target: "_blank" }, t("unofficial-game-list"))
    },
    "touchController.autoOff",
    "touchController.opacity.default",
    "touchController.style.standard",
    "touchController.style.custom"
   ],
   ...!STATES.userAgent.capabilities.touch ? {
    unsupported: !0,
    unsupportedNote: "⚠️ " + t("device-unsupported-touch")
   } : {}
  },
  STATES.userAgent.capabilities.touch && {
   group: "touch-control",
   label: t("touch-controller"),
   items: [{
    label: t("layout"),
    content: CE("select", {
     disabled: !0
    }, CE("option", !1, t("default"))),
    onCreated: (setting, $elm) => {
     $elm.addEventListener("input", (e) => {
      TouchController.applyCustomLayout($elm.value, 1000);
     }), window.addEventListener(BxEvent.CUSTOM_TOUCH_LAYOUTS_LOADED, (e) => {
      let customLayouts = TouchController.getCustomLayouts();
      while ($elm.firstChild)
       $elm.removeChild($elm.firstChild);
      if ($elm.disabled = !customLayouts, !customLayouts) {
       $elm.appendChild(CE("option", { value: "" }, t("default"))), $elm.value = "", $elm.dispatchEvent(new Event("input"));
       return;
      }
      let $fragment = document.createDocumentFragment();
      for (let key in customLayouts.layouts) {
       let layout = customLayouts.layouts[key], name;
       if (layout.author) name = `${layout.name} (${layout.author})`;
       else name = layout.name;
       let $option = CE("option", { value: key }, name);
       $fragment.appendChild($option);
      }
      $elm.appendChild($fragment), $elm.value = customLayouts.default_layout;
     });
    }
   }]
  },
  STATES.browser.capabilities.deviceVibration && {
   group: "device",
   label: t("device"),
   items: [{
    pref: "deviceVibration.mode",
    multiLines: !0,
    unsupported: !STATES.browser.capabilities.deviceVibration
   }, {
    pref: "deviceVibration.intensity",
    unsupported: !STATES.browser.capabilities.deviceVibration
   }]
  }
 ];
 TAB_MKB_ITEMS = [
  {
   requiredVariants: "full",
   group: "mkb",
   label: t("mouse-and-keyboard"),
   items: [
    "nativeMkb.mode",
    {
     pref: "nativeMkb.forcedGames",
     multiLines: !0,
     note: CE("a", { href: "https://github.com/redphx/better-xcloud/discussions/574", target: "_blank" }, t("unofficial-game-list"))
    },
    "mkb.enabled",
    "mkb.cursor.hideIdle"
   ],
   ...UserAgent.isMobileDevice() ? {
    unsupported: !0,
    unsupportedNote: "⚠️ " + t("pc-only-not-supported-on-mobile")
   } : !STATES.browser.capabilities.emulatedNativeMkb && (!STATES.userAgent.capabilities.mkb || !STATES.browser.capabilities.mkb) ? {
    unsupported: !0,
    unsupportedNote: CE("a", {
     href: "https://github.com/redphx/better-xcloud/issues/206#issuecomment-1920475657",
     target: "_blank"
    }, "⚠️ " + t("browser-unsupported-feature"))
   } : {}
  },
  {
   requiredVariants: "full",
   group: "mkb",
   label: t("mapping-and-shortcuts"),
   items: [
    ($parent) => {
     $parent.appendChild(MkbExtraSettings.renderSettings.apply(this));
    }
   ],
   ...UserAgent.isMobileDevice() ? {
    unsupported: !0,
    unsupportedNote: "⚠️ " + t("pc-only-not-supported-on-mobile")
   } : {}
  },
  NativeMkbHandler.isAllowed() && !UserAgent.isMobileDevice() && {
   requiredVariants: "full",
   group: "native-mkb",
   label: t("native-mkb"),
   items: [
    "nativeMkb.scroll.sensitivityY",
    "nativeMkb.scroll.sensitivityX"
   ]
  }
 ];
 TAB_STATS_ITEMS = [{
  group: "stats",
  label: t("stream-stats"),
  items: [
   "stats.showWhenPlaying",
   "stats.quickGlance.enabled",
   "stats.items",
   "stats.position",
   "stats.textSize",
   "stats.opacity.all",
   "stats.opacity.background",
   "stats.colors"
  ]
 }];
 SETTINGS_UI = {
  global: {
   group: "global",
   icon: BxIcon.HOME,
   label: t("general"),
   items: this.TAB_GLOBAL_ITEMS
  },
  stream: {
   group: "stream",
   icon: BxIcon.DISPLAY,
   label: t("image"),
   items: this.TAB_DISPLAY_ITEMS
  },
  vx: {
   group: "vx",
   icon: BxIcon.AI,
   label: t("vx-tab"),
   items: this.TAB_VX_ITEMS,
   requiredVariants: "full"
  },
  controller: {
   group: "controller",
   icon: BxIcon.CONTROLLER,
   label: t("controller"),
   items: this.TAB_CONTROLLER_ITEMS,
   requiredVariants: "full"
  },
  mkb: {
   group: "mkb",
   icon: BxIcon.NATIVE_MKB,
   label: t("mouse-and-keyboard"),
   items: this.TAB_MKB_ITEMS,
   requiredVariants: "full"
  },
  stats: {
   group: "stats",
   icon: BxIcon.STREAM_STATS,
   label: t("stream-stats"),
   items: this.TAB_STATS_ITEMS
  }
 };
 constructor() {
  super();
  BxLogger.info(this.LOG_TAG, "constructor()"), this.boundOnContextMenu = this.onContextMenu.bind(this), this.settingsManager = SettingsManager.getInstance(), this.renderFullSettings = STATES.supportedRegion && STATES.isSignedIn, this.setupDialog(), this.onMountedCallbacks.push(() => {
   if (onChangeVideoPlayerType(), onChangeVxFrameGeneration(), onChangeCompetitiveMode(), STATES.userAgent.capabilities.touch) BxEvent.dispatch(window, BxEvent.CUSTOM_TOUCH_LAYOUTS_LOADED);
   let $selectUserAgent = document.querySelector(`#bx_setting_${escapeCssSelector("userAgent.profile")}`);
   if ($selectUserAgent) $selectUserAgent.disabled = !0, BxEvent.dispatch($selectUserAgent, "input", {}), $selectUserAgent.disabled = !1;
  }), BxEventBus.Stream.on("gameSettings.switched", ({ id }) => {
   this.$tabContents.dataset.gameId = id.toString();
  });
 }
 getDialog() {
  return this;
 }
 getContent() {
  return this.$container;
 }
 onBeforeMount() {
  this.$container.classList.remove("bx-settings-menu-closing");
 }
 onMounted() {
  super.onMounted();
 }
 isOverlayVisible() {
  return !STATES.isPlaying;
 }
 reloadPage() {
  this.$btnGlobalReload.disabled = !0, this.$btnGlobalReload.firstElementChild.textContent = t("settings-reloading"), this.hide(), FullscreenText.getInstance().show(t("settings-reloading")), window.location.reload();
 }
 isSupportedVariant(requiredVariants) {
  if (typeof requiredVariants > "u") return !0;
  return requiredVariants = typeof requiredVariants === "string" ? [requiredVariants] : requiredVariants, requiredVariants.includes(SCRIPT_VARIANT);
 }
 onTabClicked = (e) => {
  let $tab = e.target.closest(".bx-settings-tab"), $child, children = Array.from(this.$tabContents.children);
  for ($child of children)
   if ($child.dataset.tabGroup === $tab.dataset.group) $child.classList.remove("bx-gone"), calculateSelectBoxes($child);
   else if ($child.dataset.tabGroup) $child.classList.add("bx-gone");
  this.$streamSettingsSelection.classList.toggle("bx-gone", $tab.dataset.group === "global");
  for (let $child2 of Array.from(this.$tabs.children))
   $child2.classList.remove("bx-active");
  $tab.classList.add("bx-active");
 };
 renderTab(settingTab) {
  let $icon = createSvgIcon(settingTab.icon), $tab = CE("button", {
   class: "bx-settings-tab bx-focusable",
   type: "button",
   title: settingTab.label,
   "aria-label": settingTab.label,
   _dataset: { group: settingTab.group }
  }, $icon, CE("span", !1, settingTab.label));
  return $tab.addEventListener("click", this.onTabClicked), $tab;
 }
 onGlobalSettingChanged = (e) => {
  let pref = e.currentTarget?.dataset.pref, liveVisualSettings = [
   "ui.theme",
   "ui.reduceAnimations",
   "ui.hideScrollbar",
   "ui.hideSections",
   "ui.systemMenu.hideHandle",
   "ui.streamMenu.simplify",
   "ui.hub.cardSize",
   "ui.hub.cardRounded",
   "ui.hub.hoverEffects",
   "ui.hub.animations",
   "block.features"
  ];
  if (pref && liveVisualSettings.includes(pref)) return;
  PatcherCache.getInstance().clear(), this.$btnReload.classList.add("bx-danger"), this.$noteGlobalReload.classList.add("bx-gone"), this.$btnGlobalReload.classList.remove("bx-gone"), this.$btnGlobalReload.classList.add("bx-danger");
 };
 onContextMenu(e) {
  e.preventDefault();
  let $elm = e.target;
  $elm instanceof HTMLElement && this.resetHighlightedSetting($elm);
 }
 renderServerSetting(setting) {
  return this.renderFlagServerSetting(setting);
 }
 renderFlagServerSetting(setting) {
  let selectedValue = getGlobalPref("server.region"), continents = {
   "america-north": { label: t("continent-north-america"), children: [] },
   "america-south": { label: t("continent-south-america"), children: [] },
   asia: { label: t("continent-asia"), children: [] },
   australia: { label: t("continent-australia"), children: [] },
   europe: { label: t("continent-europe"), children: [] },
   other: { label: t("other"), children: [] }
  }, $control = CE("div", {
   class: "bx-server-region-picker",
   id: `bx_setting_${escapeCssSelector(setting.pref)}`
  }), $trigger = CE("button", {
   class: "bx-server-region-picker-trigger bx-focusable",
   type: "button",
   ariaExpanded: "false"
  }), $menu = CE("div", {
   class: "bx-server-region-picker-menu",
   hidden: !0
  });
  setting.options = {};
  for (let regionName in STATES.serverRegions) {
   let region = STATES.serverRegions[regionName], value = regionName, label = `${region.shortName.replace(region.flag || "", "").trim()} - ${region.displayName ?? regionName}`;
   if (region.isDefault) {
    if (label += ` (${t("default")})`, value = "default", selectedValue === regionName) selectedValue = value;
   }
   let flagCode = region.flagCode || [...region.flag || ""].map((char) => String.fromCharCode(char.codePointAt(0) - 127462 + 65)).join("").toLowerCase(), option = {
    regionName,
    value,
    label,
    flagCode,
    continent: region.contintent
   };
   setting.options[value] = label, (continents[option.continent] || continents.other).children.push(option);
  }
  let selectedOption = () => Object.values(continents).flatMap((continent) => continent.children).find((option) => option.value === selectedValue), updateTrigger = () => {
   let option = selectedOption();
   $trigger.replaceChildren(option?.flagCode ? CE("img", {
    class: "bx-select-flag-image",
    src: `https://flagcdn.com/w40/${option.flagCode}.png`,
    alt: ""
   }) : "", CE("span", !1, option?.label || t("default")), CE("span", { class: "bx-server-region-picker-arrow" }, "▾"));
  }, closeMenu = () => {
   $menu.hidden = !0, $trigger.setAttribute("aria-expanded", "false");
  }, openMenu = () => {
   $menu.hidden = !1, $trigger.setAttribute("aria-expanded", "true");
  };
  for (let continent of Object.values(continents)) {
   if (!continent.children.length) continue;
   $menu.appendChild(CE("div", { class: "bx-server-region-picker-group" }, continent.label));
   for (let option of continent.children) {
    let $item = CE("button", {
     class: "bx-server-region-picker-option",
     type: "button",
     _dataset: { selected: option.value === selectedValue }
    }, option.flagCode ? CE("img", {
     class: "bx-select-flag-image",
     src: `https://flagcdn.com/w40/${option.flagCode}.png`,
     alt: ""
    }) : "", CE("span", !1, option.label));
    $item.addEventListener("click", () => {
     selectedValue = option.value, setGlobalPref(setting.pref, option.value, "ui"), $menu.querySelectorAll("[data-selected]").forEach(($element) => delete $element.dataset.selected), $item.dataset.selected = "true", updateTrigger(), closeMenu(), $control.dispatchEvent(new Event("input")), window.dispatchEvent(new CustomEvent("bx-server-region-changed", {
      detail: { regionName: option.regionName }
     }));
    }), $menu.appendChild($item);
   }
  }
  return $trigger.addEventListener("click", () => $menu.hidden ? openMenu() : closeMenu()), document.addEventListener("pointerdown", (event) => {
   if (event.target instanceof Node && !$control.contains(event.target)) closeMenu();
  }), $control.addEventListener("input", this.onGlobalSettingChanged), $control.append($trigger, $menu), updateTrigger(), $control;
 }
 renderSettingRow(settingTab, $tabContent, settingTabContent, setting) {
  if (typeof setting === "string") setting = {
    pref: setting
   };
  let pref = setting.pref, $control;
  if (setting.content) if (typeof setting.content === "function") $control = setting.content.apply(this);
   else $control = setting.content;
  else if (!setting.unsupported) {
   if (pref === "server.region") $control = this.renderServerSetting(setting);
   else if (pref === "bx.locale") $control = SettingElement.fromPref(pref, async (e) => {
     let newLocale = e.target.value;
     if (getGlobalPref("ui.controllerFriendly")) {
      let timeoutId = e.target.timeoutId;
      timeoutId && window.clearTimeout(timeoutId), e.target.timeoutId = window.setTimeout(() => {
       Translations.refreshLocale(newLocale), Translations.updateTranslations();
      }, 500);
     } else Translations.refreshLocale(newLocale), Translations.updateTranslations();
     this.onGlobalSettingChanged(e);
    });
   else if (pref === "userAgent.profile") $control = SettingElement.fromPref("userAgent.profile", (e) => {
     let value = e.target.value, isCustom = value === "custom", userAgent = UserAgent.get(value);
     UserAgent.updateStorage(value);
     let $inp = $control.nextElementSibling;
     $inp.value = userAgent, $inp.readOnly = !isCustom, $inp.disabled = !isCustom, !e.target.disabled && this.onGlobalSettingChanged(e);
    });
   else if ($control = this.settingsManager.getElement(pref, setting.params), !isStreamPref(pref)) $control.addEventListener("input", this.onGlobalSettingChanged);
   if ($control instanceof HTMLElement) $control.dataset.pref = pref;
   if ($control instanceof HTMLSelectElement) $control = BxSelectElement.create($control, !0);
  }
  let prefDefinition = null;
  if (pref) prefDefinition = getPrefInfo(pref).definition;
  if (prefDefinition && !this.isSupportedVariant(prefDefinition.requiredVariants)) return;
  let label = prefDefinition?.label || setting.label || "", note = prefDefinition?.note || setting.note, unsupportedNote = prefDefinition?.unsupportedNote || setting.unsupportedNote, experimental = prefDefinition?.experimental || setting.experimental;
  if (prefDefinition?.desktopOnly && UserAgent.isMobileDevice()) label += ` (${t("pc-only")})`;
  if (typeof note === "function") note = note();
  if (typeof unsupportedNote === "function") unsupportedNote = unsupportedNote();
  if (settingTabContent.label && setting.pref) {
   if (prefDefinition?.suggest) typeof prefDefinition.suggest.lowest < "u" && (this.suggestedSettings.lowest[setting.pref] = prefDefinition.suggest.lowest), typeof prefDefinition.suggest.highest < "u" && (this.suggestedSettings.highest[setting.pref] = prefDefinition.suggest.highest);
  }
  if (experimental) if (label = "🧪 " + label, !note) note = t("experimental");
   else note = `${t("experimental")}: ${note}`;
  let $note;
  if (unsupportedNote) $note = CE("div", { class: "bx-settings-dialog-note" }, unsupportedNote);
  else if (note) $note = CE("div", { class: "bx-settings-dialog-note" }, note);
  let $row = createSettingRow(label, !prefDefinition?.unsupported && $control, {
   $note,
   multiLines: setting.multiLines,
   icon: prefDefinition?.labelIcon,
   onContextMenu: this.boundOnContextMenu,
   pref
  });
  if (pref) $row.htmlFor = `bx_setting_${escapeCssSelector(pref)}`;
  if ($row.dataset.type = settingTabContent.group, !STATES.supportedRegion && setting.pref === "server.bypassRestriction") $row.classList.add("bx-settings-important-row");
  $tabContent.appendChild($row), !prefDefinition?.unsupported && setting.onCreated && setting.onCreated(setting, $control);
 }
 renderSettingsSection(settingTab, sections) {
  let $tabContent = CE("div", {
   class: "bx-gone",
   _dataset: {
    tabGroup: settingTab.group
   }
  });
  for (let section of sections) {
   if (!section) continue;
   if (section instanceof HTMLElement) {
    $tabContent.appendChild(section);
    continue;
   }
   if (!this.isSupportedVariant(section.requiredVariants)) continue;
   if (!this.renderFullSettings && settingTab.group === "global" && section.group !== "general" && section.group !== "footer" && section.group !== "advanced") continue;
   let label = section.label, isProjectHeading = label === t("better-xcloud");
   if (isProjectHeading) {
    if (label += " " + SCRIPT_VERSION, SCRIPT_VARIANT === "lite") label += " (Lite)";
   }
   if (label) {
    let $title = CE("h2", {
     _nearby: {
      orientation: "horizontal"
     }
    }, isProjectHeading ? createButton({
     label,
     url: "https://github.com/viniraus1-gif/Better-xCloud-Plus",
     title: t("open-project-on-github"),
     classes: ["bx-settings-project-link"],
     style: 16 | 64 | 4096
    }) : CE("span", !1, label), section.helpUrl && createButton({
     icon: BxIcon.QUESTION,
     style: 8 | 64,
     url: section.helpUrl,
     title: t("help")
    }));
    $tabContent.appendChild($title);
   }
   if (section.unsupportedNote) {
    let $note = CE("b", { class: "bx-note-unsupported" }, section.unsupportedNote);
    $tabContent.appendChild($note);
   }
   if (section.unsupported) continue;
   if (section.content) {
    $tabContent.appendChild(section.content);
    continue;
   }
   section.items = section.items || [];
   for (let setting of section.items) {
    if (setting === !1) continue;
    if (typeof setting === "function") {
     setting.apply(this, [$tabContent]);
     continue;
    }
    this.renderSettingRow(settingTab, $tabContent, section, setting);
   }
  }
  return $tabContent;
 }
 setupDialog() {
  let $tabs, $tabContents, $container = CE("div", {
   class: "bx-settings-dialog",
   _nearby: {
    orientation: "horizontal"
   }
  }, CE("div", {
   class: "bx-settings-tabs-container",
   _nearby: {
    orientation: "vertical",
    focus: () => this.dialogManager.focus($tabs),
    loop: (direction) => {
     if (direction === 1 || direction === 3) return this.focusVisibleTab(direction === 1 ? "last" : "first"), !0;
     return !1;
    }
   }
  }, $tabs = CE("div", {
   class: "bx-settings-tabs bx-hide-scroll-bar",
   _nearby: {
    focus: () => this.focusActiveTab()
   }
  }), CE("div", !1, this.$btnReload = createButton({
   icon: BxIcon.REFRESH,
   style: 64 | 32,
   onClick: (e) => {
    this.reloadPage();
   }
  }), createButton({
   icon: BxIcon.CLOSE,
   style: 64 | 32,
   onClick: (e) => {
    this.dialogManager.hide();
   }
  }))), CE("div", {
   class: "bx-settings-tab-contents",
   _nearby: {
    orientation: "vertical",
    loop: (direction) => {
     if (direction === 1 || direction === 3) return this.focusVisibleSetting(direction === 1 ? "last" : "first"), !0;
     return !1;
    }
   }
  }, this.$streamSettingsSelection = SettingsManager.getInstance().getStreamSettingsSelection(), $tabContents = CE("div", {
   class: "bx-settings-tab-content",
   _nearby: {
    orientation: "vertical",
    focus: () => this.jumpToSettingGroup("next")
   }
  })));
  this.$container = $container, this.$tabs = $tabs, this.$tabContents = $tabContents, $container.addEventListener("click", (e) => {
   if (e.target === $container) e.preventDefault(), e.stopPropagation(), this.hide();
  });
  let settingTabGroup;
  for (settingTabGroup in this.SETTINGS_UI) {
   let settingTab = this.SETTINGS_UI[settingTabGroup];
   if (!settingTab) continue;
   if (!this.isSupportedVariant(settingTab.requiredVariants)) continue;
   if (settingTab.group !== "global" && !this.renderFullSettings) continue;
   let $svg = this.renderTab(settingTab);
   $tabs.appendChild($svg);
   let $tabContent = this.renderSettingsSection.call(this, settingTab, settingTab.items);
   $tabContents.appendChild($tabContent);
  }
  $tabs.firstElementChild.dispatchEvent(new Event("click"));
 }
 focusTab(tabId) {
  let $tab = this.$container.querySelector(`.bx-settings-tab[data-group=${tabId}]`);
  $tab && $tab.dispatchEvent(new Event("click"));
 }
 focusIfNeeded() {
  this.jumpToSettingGroup("next");
 }
 focusActiveTab() {
  let $currentTab = this.$tabs.querySelector(".bx-active");
  return $currentTab && $currentTab.focus(), !0;
 }
 focusVisibleSetting(type = "first") {
  let controls = Array.from(this.$tabContents.querySelectorAll("div[data-tab-group]:not(.bx-gone) > *"));
  if (!controls.length) return !1;
  if (type === "last") controls.reverse();
  for (let $control of controls) {
   if (!($control instanceof HTMLElement)) continue;
   let $focusable = this.dialogManager.findFocusableElement($control);
   if ($focusable) {
    if (this.dialogManager.focus($focusable)) return !0;
   }
  }
  return !1;
 }
 focusVisibleTab(type = "first") {
  let tabs = Array.from(this.$tabs.querySelectorAll("svg:not(.bx-gone)"));
  if (!tabs.length) return !1;
  if (type === "last") tabs.reverse();
  for (let $tab of tabs)
   if (this.dialogManager.focus($tab)) return !0;
  return !1;
 }
 jumpToSettingGroup(direction) {
  let $tabContent = this.$tabContents.querySelector("div[data-tab-group]:not(.bx-gone)");
  if (!$tabContent) return !1;
  let $header, $focusing = document.activeElement;
  if (!$focusing || !$tabContent.contains($focusing)) $header = $tabContent.querySelector("h2");
  else {
   let $parent = $focusing.closest("[data-tab-group] > *"), siblingProperty = direction === "next" ? "nextSibling" : "previousSibling", $tmp = $parent, times = 0;
   while (!0) {
    if (!$tmp) break;
    if ($tmp.tagName === "H2") {
     if ($header = $tmp, !$tmp.nextElementSibling?.classList.contains("bx-note-unsupported")) {
      if (++times, direction === "next" || times >= 2) break;
     }
    }
    $tmp = $tmp[siblingProperty];
   }
  }
  let $target;
  if ($header) $target = this.dialogManager.findNextTarget($header, 3, !1);
  if ($target) return this.dialogManager.focus($target);
  return !1;
 }
 resetHighlightedSetting($elm) {
  let targetGameId = SettingsManager.getInstance().getTargetGameId();
  if (targetGameId < 0) return;
  if (!$elm) $elm = document.activeElement instanceof HTMLElement ? document.activeElement : void 0;
  let $row = $elm?.closest("div[data-tab-group] > .bx-settings-row");
  if (!$row) return;
  let pref = $row.prefKey;
  if (!pref) alert("Pref not found: " + $row.id);
  if (!isStreamPref(pref)) return;
  let deleted = STORAGE.Stream.deleteSettingByGame(targetGameId, pref);
  if (deleted) BxEventBus.Stream.emit("setting.changed", {
    storageKey: `${"BetterXcloud.Stream"}.${targetGameId}`,
    settingKey: pref
   });
  return deleted;
 }
 handleKeyPress(key) {
  let handled = !0;
  switch (key) {
   case "Tab":
    this.focusActiveTab();
    break;
   case "Home":
    this.focusVisibleSetting("first");
    break;
   case "End":
    this.focusVisibleSetting("last");
    break;
   case "PageUp":
    this.jumpToSettingGroup("previous");
    break;
   case "PageDown":
    this.jumpToSettingGroup("next");
    break;
   case "KeyQ":
    this.resetHighlightedSetting();
    break;
   default:
    handled = !1;
    break;
  }
  return handled;
 }
 handleGamepad(button) {
  let handled = !0;
  switch (button) {
   case 1:
    let $focusing = document.activeElement;
    if ($focusing && this.$tabs.contains($focusing)) this.hide();
    else this.focusActiveTab();
    break;
   case 4:
   case 5:
    this.focusActiveTab();
    break;
   case 6:
    this.jumpToSettingGroup("previous");
    break;
   case 7:
    this.jumpToSettingGroup("next");
    break;
   case 2:
    this.resetHighlightedSetting();
    break;
   default:
    handled = !1;
    break;
  }
  return handled;
 }
}
class ScreenshotManager {
 static instance;
 static getInstance = () => ScreenshotManager.instance ?? (ScreenshotManager.instance = new ScreenshotManager);
 LOG_TAG = "ScreenshotManager";
 $download;
 $canvas;
 canvasContext;
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()"), this.$download = CE("a"), this.$canvas = CE("canvas", { class: "bx-gone" }), this.canvasContext = this.$canvas.getContext("2d", {
   alpha: !1,
   willReadFrequently: !1
  });
 }
 updateCanvasSize(width, height) {
  this.$canvas.width = width, this.$canvas.height = height;
 }
 updateCanvasFilters(filters) {
  this.canvasContext.filter = filters;
 }
 onAnimationEnd(e) {
  e.target.classList.remove("bx-taking-screenshot");
 }
 takeScreenshot(callback) {
  let currentStream = STATES.currentStream, streamPlayerManager = currentStream.streamPlayerManager, $canvas = this.$canvas;
  if (!streamPlayerManager || !$canvas) return;
  let $player;
  if (getGlobalPref("screenshot.applyFilters")) $player = streamPlayerManager.getPlayerElement();
  else $player = streamPlayerManager.getPlayerElement("video");
  if (!$player || !$player.isConnected) return;
  let canvasContext = this.canvasContext;
  if ($player instanceof HTMLCanvasElement) streamPlayerManager.getCanvasPlayer()?.updateFrame();
  canvasContext.drawImage($player, 0, 0);
  let $gameStream = $player.closest("#game-stream");
  if ($gameStream) $gameStream.addEventListener("animationend", this.onAnimationEnd, { once: !0 }), $gameStream.classList.add("bx-taking-screenshot");
  if (AppInterface) {
   let data = $canvas.toDataURL("image/png").split(";base64,")[1];
   AppInterface.saveScreenshot(currentStream.titleSlug, data), canvasContext.clearRect(0, 0, $canvas.width, $canvas.height), callback && callback();
   return;
  }
  $canvas.toBlob((blob) => {
   if (!blob) return;
   let now = +new Date, $download = this.$download;
   $download.download = `${currentStream.titleSlug}-${now}.png`, $download.href = URL.createObjectURL(blob), $download.click(), URL.revokeObjectURL($download.href), $download.href = "", $download.download = "", canvasContext.clearRect(0, 0, $canvas.width, $canvas.height), callback && callback();
  }, "image/png");
 }
}
class RendererShortcut {
 static toggleVisibility() {
  let $mediaContainer = document.querySelector('#game-stream div[data-testid="media-container"]');
  if (!$mediaContainer) {
   BxEventBus.Stream.emit("video.visibility.changed", { isVisible: !0 });
   return;
  }
  $mediaContainer.classList.toggle("bx-gone");
  let isVisible = !$mediaContainer.classList.contains("bx-gone");
  limitVideoPlayerFps(isVisible ? getStreamPref("video.maxFps") : 0), BxEventBus.Stream.emit("video.visibility.changed", { isVisible });
 }
}
class TrueAchievements {
 static instance;
 static getInstance = () => TrueAchievements.instance ?? (TrueAchievements.instance = new TrueAchievements);
 LOG_TAG = "TrueAchievements";
 $link;
 $button;
 $hiddenLink;
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()"), this.$link = createButton({
   label: t("true-achievements"),
   url: "#",
   icon: BxIcon.TRUE_ACHIEVEMENTS,
   style: 64 | 8 | 128 | 8192,
   onClick: this.onClick
  }), this.$button = createButton({
   label: t("true-achievements"),
   title: t("true-achievements"),
   icon: BxIcon.TRUE_ACHIEVEMENTS,
   style: 64,
   onClick: this.onClick
  }), this.$hiddenLink = CE("a", {
   target: "_blank"
  });
 }
 onClick = (e) => {
  e.preventDefault(), window.BX_EXPOSED.dialogRoutes?.closeAll();
  let dataset = this.$link.dataset;
  this.open(!0, dataset.xboxTitleId, dataset.id);
 };
 updateIds(xboxTitleId, id) {
  let $link = this.$link, $button = this.$button;
  if (clearDataSet($link), clearDataSet($button), xboxTitleId) $link.dataset.xboxTitleId = xboxTitleId, $button.dataset.xboxTitleId = xboxTitleId;
  if (id) $link.dataset.id = id, $button.dataset.id = id;
 }
 injectAchievementsProgress($elm) {
  if (SCRIPT_VARIANT !== "full") return;
  let $parent = $elm.parentElement, $div = CE("div", {
   class: "bx-guide-home-achievements-progress"
  }, $elm), xboxTitleId;
  try {
   let $container = $parent.closest("div[class*=AchievementsPreview-module__container]");
   if ($container) xboxTitleId = getReactProps($container).children.props.data.data.xboxTitleId;
  } catch (e) {}
  if (!xboxTitleId) xboxTitleId = this.getStreamXboxTitleId();
  if (typeof xboxTitleId < "u") xboxTitleId = xboxTitleId.toString();
  if (this.updateIds(xboxTitleId), document.body.dataset.mediaType === "tv") $div.appendChild(this.$link);
  else $div.appendChild(this.$button);
  $parent.appendChild($div);
 }
 injectAchievementDetailPage($parent) {
  if (SCRIPT_VARIANT !== "full") return;
  let props = getReactProps($parent);
  if (!props) return;
  try {
   let achievementList = props.children.props.data.data, $header = $parent.querySelector("div[class*=AchievementDetailHeader]"), achievementName = getReactProps($header).children[0].props.achievementName, id, xboxTitleId;
   for (let achiev of achievementList)
    if (achiev.name === achievementName) {
     id = achiev.id, xboxTitleId = achiev.title.id;
     break;
    }
   if (id) this.updateIds(xboxTitleId, id), $parent.appendChild(this.$link);
  } catch (e) {}
 }
 getStreamXboxTitleId() {
  return STATES.currentStream.xboxTitleId || STATES.currentStream.titleInfo?.details.xboxTitleId;
 }
 open(override, xboxTitleId, id) {
  if (!xboxTitleId || xboxTitleId === "undefined") xboxTitleId = this.getStreamXboxTitleId();
  if (AppInterface?.openTrueAchievementsLink) {
   AppInterface.openTrueAchievementsLink(override, xboxTitleId?.toString(), id?.toString());
   return;
  }
  let url = "https://www.trueachievements.com";
  if (xboxTitleId) {
   if (url += `/deeplink/${xboxTitleId}`, id) url += `/${id}`;
  }
  this.$hiddenLink.href = url, this.$hiddenLink.click();
 }
}
class VirtualControllerShortcut {
 static pressXboxButton() {
  let streamSession = window.BX_EXPOSED.streamSession;
  if (!streamSession) return;
  let released = generateVirtualControllerMapping(0), pressed = generateVirtualControllerMapping(0, {
   Nexus: 1,
   VirtualPhysicality: 1024
  });
  streamSession.onVirtualGamepadInput("systemMenu", performance.now(), [pressed]), setTimeout(() => {
   streamSession.onVirtualGamepadInput("systemMenu", performance.now(), [released]);
  }, 100);
 }
}
class ShortcutHandler {
 static runAction(action) {
  switch (action) {
   case "bx.settings.show":
    SettingsDialog.getInstance().show();
    break;
   case "stream.screenshot.capture":
    ScreenshotManager.getInstance().takeScreenshot();
    break;
   case "stream.video.toggle":
    RendererShortcut.toggleVisibility();
    break;
   case "stream.stats.toggle":
    StreamStats.getInstance().toggle();
    break;
   case "stream.microphone.toggle":
    MicrophoneShortcut.toggle();
    break;
   case "stream.menu.show":
    StreamUiShortcut.showHideStreamMenu();
    break;
   case "stream.sound.toggle":
    SoundShortcut.muteUnmute();
    break;
   case "stream.volume.inc":
    SoundShortcut.adjustGainNodeVolume(10);
    break;
   case "stream.volume.dec":
    SoundShortcut.adjustGainNodeVolume(-10);
    break;
   case "device.brightness.inc":
   case "device.brightness.dec":
   case "device.sound.toggle":
   case "device.volume.inc":
   case "device.volume.dec":
    AppInterface && AppInterface.runShortcut && AppInterface.runShortcut(action);
    break;
   case "mkb.toggle":
    if (STATES.currentStream.titleInfo?.details.hasMkbSupport) NativeMkbHandler.getInstance()?.toggle();
    else EmulatedMkbHandler.getInstance()?.toggle();
    break;
   case "ta.open":
    TrueAchievements.getInstance().open(!1);
    break;
   case "controller.xbox.press":
    VirtualControllerShortcut.pressXboxButton();
    break;
  }
 }
}
class ControllerShortcut {
 static buttonsCache = {};
 static buttonsStatus = {};
 static reset(index) {
  ControllerShortcut.buttonsCache[index] = [], ControllerShortcut.buttonsStatus[index] = [];
 }
 static handle(gamepad) {
  let controllerSettings = window.BX_STREAM_SETTINGS.controllers[gamepad.id];
  if (!controllerSettings) return !1;
  let gamepadIndex = gamepad.index;
  if (ControllerShortcut.buttonsCache[gamepadIndex] = ControllerShortcut.buttonsStatus[gamepadIndex]?.slice(0) || [], ControllerShortcut.buttonsStatus[gamepadIndex] = [], gamepad.buttons[9]?.pressed && gamepad.buttons[8]?.pressed) {
   if (ControllerShortcut.buttonsStatus[gamepadIndex][9] = !0, ControllerShortcut.buttonsStatus[gamepadIndex][8] = !0, !(ControllerShortcut.buttonsCache[gamepadIndex][9] && ControllerShortcut.buttonsCache[gamepadIndex][8])) window.setTimeout(() => ShortcutHandler.runAction("bx.settings.show"), 0);
   return !0;
  }
  let actions = controllerSettings.shortcuts;
  if (!actions) return !1;
  let pressed = [], otherButtonPressed = !1, entries = gamepad.buttons.entries(), index, button;
  for ([index, button] of entries)
   if (button.pressed && index !== 16) {
    if (otherButtonPressed = !0, pressed[index] = !0, actions[index] && !ControllerShortcut.buttonsCache[gamepadIndex][index]) {
     let idx = index;
     setTimeout(() => ShortcutHandler.runAction(actions[idx]), 0);
    }
   }
  return ControllerShortcut.buttonsStatus[gamepadIndex] = pressed, otherButtonPressed;
 }
}
var FeatureGates = {
 PwaPrompt: !1,
 EnableWifiWarnings: !1,
 EnableUpdateRequiredPage: !1,
 ShowForcedUpdateScreen: !1,
 EnableTakControlResizing: !0,
 EnableLazyLoadedHome: !1,
 EnableRemotePlay: !getGlobalPref("block.features").includes("remote-play"),
 EnableConsoles: !getGlobalPref("block.features").includes("remote-play")
}, nativeMkbMode = getGlobalPref("nativeMkb.mode");
if (nativeMkbMode !== "default") FeatureGates.EnableMouseAndKeyboard = nativeMkbMode === "on";
var blockFeatures = getGlobalPref("block.features");
if (blockFeatures.includes("chat")) FeatureGates.EnableGuideChatTab = !1;
if (blockFeatures.includes("friends")) FeatureGates.EnableFriendsAndFollowers = !1;
if (BX_FLAGS.FeatureGates) FeatureGates = Object.assign(BX_FLAGS.FeatureGates, FeatureGates);
class LocalCoOpManager {
 static instance;
 static getInstance = () => LocalCoOpManager.instance ?? (LocalCoOpManager.instance = new LocalCoOpManager);
 supportedIds;
 constructor() {
  BxEventBus.Script.once("list.localCoOp.updated", (e) => {
   this.supportedIds = e.ids;
  }), this.supportedIds = GhPagesUtils.getLocalCoOpList(), console.log("this.supportedIds", this.supportedIds);
 }
 isSupported(productId) {
  return this.supportedIds.has(productId);
 }
}
var BxExposed = {
 getTitleInfo: () => STATES.currentStream.titleInfo,
 modifyPreloadedState: (state) => {
  let LOG_TAG = "PreloadState";
  try {
   state.appContext.requestInfo.userAgent = window.navigator.userAgent;
  } catch (e) {
   BxLogger.error(LOG_TAG, e);
  }
  try {
   for (let exp in FeatureGates)
    state.experiments.overrideFeatureGates[exp.toLocaleLowerCase()] = FeatureGates[exp];
   BxLogger.info("state.experiments", state.experiments);
  } catch (e) {
   BxLogger.error(LOG_TAG, e);
  }
  try {
   let sigls = state.xcloud.sigls;
   if (STATES.userAgent.capabilities.touch) {
    let customList = TouchController.getCustomList(), siglId = "ce573635-7c18-4d0c-9d68-90b932393470";
    if (siglId in sigls) {
     let allGames = sigls[siglId].data.products;
     customList = customList.filter((id) => allGames.includes(id)), sigls["9c86f07a-f3e8-45ad-82a0-a1f759597059"]?.data.products.push(...customList);
    } else BxLogger.warning(LOG_TAG, "Sigl not found: " + siglId);
   }
  } catch (e) {
   BxLogger.error(LOG_TAG, e);
  }
  try {
   let sigls = state.xcloud.sigls;
   if (BX_FLAGS.ForceNativeMkbTitles) sigls["8fa264dd-124f-4af3-97e8-596fcdf4b486"]?.data.products.push(...BX_FLAGS.ForceNativeMkbTitles);
  } catch (e) {
   BxLogger.error(LOG_TAG, e);
  }
  try {
   state.uhf.headerMode = "Off", state.uhf.footerMode = "Off";
  } catch (e) {
   BxLogger.error(LOG_TAG, e);
  }
  try {
   let xCloud = state.xcloud.authentication.authStatusByStrategy.XCloud;
   if (xCloud.type === 3 && xCloud.error.type === "UnsupportedMarketError") window.stop(), window.location.href = "https://www.xbox.com/en-US/play";
  } catch (e) {
   BxLogger.error(LOG_TAG, e);
  }
  return state;
 },
 modifyTitleInfo: function(titleInfo) {
  titleInfo = deepClone(titleInfo);
  let supportedInputTypes = titleInfo.details.supportedInputTypes;
  if (BX_FLAGS.ForceNativeMkbTitles?.includes(titleInfo.details.productId)) supportedInputTypes.push("MKB");
  if (getGlobalPref("nativeMkb.mode") === "off") supportedInputTypes = supportedInputTypes.filter((i) => i !== "MKB");
  if (titleInfo.details.hasMkbSupport = supportedInputTypes.includes("MKB"), STATES.userAgent.capabilities.touch) {
   let touchControllerAvailability = getGlobalPref("touchController.mode");
   if (touchControllerAvailability !== "off" && getGlobalPref("touchController.autoOff")) {
    let gamepads = window.navigator.getGamepads(), gamepadFound = !1;
    for (let gamepad of gamepads)
     if (gamepad && gamepad.connected) {
      gamepadFound = !0;
      break;
     }
    gamepadFound && (touchControllerAvailability = "off");
   }
   if (touchControllerAvailability === "off") supportedInputTypes = supportedInputTypes.filter((i) => i !== "CustomTouchOverlay" && i !== "GenericTouch"), titleInfo.details.supportedTabs = [];
   if (titleInfo.details.hasNativeTouchSupport = supportedInputTypes.includes("NativeTouch"), titleInfo.details.hasTouchSupport = titleInfo.details.hasNativeTouchSupport || supportedInputTypes.includes("CustomTouchOverlay") || supportedInputTypes.includes("GenericTouch"), !titleInfo.details.hasTouchSupport && touchControllerAvailability === "all") titleInfo.details.hasFakeTouchSupport = !0, supportedInputTypes.push("GenericTouch");
   if (titleInfo.titleId === "FORZAHORIZON6") titleInfo.details.supportedTabs = [], titleInfo.details.hasTouchSupport = !1, supportedInputTypes = ["Controller"];
  }
  return titleInfo.details.supportedInputTypes = supportedInputTypes, STATES.currentStream.titleInfo = titleInfo, BxEventBus.Script.emit("titleInfo.ready", {}), titleInfo;
 },
 setupGainNode: ($media, audioStream) => {
  if ($media instanceof HTMLAudioElement) $media.muted = !0, $media.addEventListener("playing", (e) => {
    $media.muted = !0, $media.pause();
   });
  else $media.muted = !0, $media.addEventListener("playing", (e) => {
    $media.muted = !0;
   });
  try {
   let audioCtx = STATES.currentStream.audioContext, source = audioCtx.createMediaStreamSource(audioStream), gainNode = audioCtx.createGain();
   source.connect(gainNode).connect(audioCtx.destination);
  } catch (e) {
   BxLogger.error("setupGainNode", e), STATES.currentStream.audioGainNode = null;
  }
 },
 handleControllerShortcut: ControllerShortcut.handle,
 resetControllerShortcut: ControllerShortcut.reset,
 overrideSettings: {
  Tv_settings: {
   hasCompletedOnboarding: !0
  }
 },
 disableGamepadPolling: !1,
 openSettingsMenu: () => (window.dispatchEvent(new Event(BxEvent.OPEN_SETTINGS_MENU)), !0),
 backButtonPressed: () => {
  let navigationDialogManager = NavigationDialogManager.getInstance();
  if (navigationDialogManager.isShowing()) return navigationDialogManager.hide(), !0;
  let dict = {
   bubbles: !0,
   cancelable: !0,
   key: "XF86Back",
   code: "XF86Back",
   keyCode: 4,
   which: 4
  };
  return document.body.dispatchEvent(new KeyboardEvent("keydown", dict)), document.body.dispatchEvent(new KeyboardEvent("keyup", dict)), !1;
 },
 GameSlugRegexes: [
  /[;,/?:@&=+_`~$%#^*()!^™\xae\xa9]/g,
  / {2,}/g,
  / /g
 ],
 toggleLocalCoOp(enable) {},
 beforePageLoad: (page) => {
  BxLogger.info("beforePageLoad", page), Patcher.patchPage(page);
 },
 localCoOpManager: LocalCoOpManager.getInstance(),
 reactCreateElement: function(...args) {},
 reactUseEffect: function(...args) {},
 createReactLocalCoOpIcon: (attrs) => {
  let reactCE = window.BX_EXPOSED.reactCreateElement;
  return reactCE("svg", { xmlns: "http://www.w3.org/2000/svg", width: "1em", height: "1em", viewBox: "0 0 32 32", "fill-rule": "evenodd", "stroke-linecap": "round", "stroke-linejoin": "round", ...attrs }, reactCE("g", null, reactCE("path", { d: "M24.272 11.165h-3.294l-3.14 3.564c-.391.391-.922.611-1.476.611a2.1 2.1 0 0 1-2.087-2.088 2.09 2.09 0 0 1 .031-.362l1.22-6.274a3.89 3.89 0 0 1 3.81-3.206h6.57c1.834 0 3.439 1.573 3.833 3.295l1.205 6.185a2.09 2.09 0 0 1 .031.362 2.1 2.1 0 0 1-2.087 2.088c-.554 0-1.085-.22-1.476-.611l-3.14-3.564", fill: "none", stroke: "#fff", "stroke-width": "2" }), reactCE("circle", { cx: "22.625", cy: "5.874", r: ".879" }), reactCE("path", { d: "M11.022 24.415H7.728l-3.14 3.564c-.391.391-.922.611-1.476.611a2.1 2.1 0 0 1-2.087-2.088 2.09 2.09 0 0 1 .031-.362l1.22-6.274a3.89 3.89 0 0 1 3.81-3.206h6.57c1.834 0 3.439 1.573 3.833 3.295l1.205 6.185a2.09 2.09 0 0 1 .031.362 2.1 2.1 0 0 1-2.087 2.088c-.554 0-1.085-.22-1.476-.611l-3.14-3.564", fill: "none", stroke: "#fff", "stroke-width": "2" }), reactCE("circle", { cx: "9.375", cy: "19.124", r: ".879" })));
 },
 hasCustomTouchControl: TouchController.hasCustomControl,
 hasCustomNativeMkb: (productId) => BX_FLAGS.ForceNativeMkbTitles?.includes(productId)
};
class XhomeInterceptor {
 static consoleAddrs = {};
 static async handleLogin(request) {
  try {
   let obj = await request.clone().json();
   obj.offeringId = "xhome", request = new Request("https://xhome.gssv-play-prod.xboxlive.com/v2/login/user", {
    method: "POST",
    body: JSON.stringify(obj),
    headers: {
     "Content-Type": "application/json"
    }
   });
  } catch (e) {
   alert(e), console.log(e);
  }
  return NATIVE_FETCH(request);
 }
 static async handleConfiguration(request) {
  BxEventBus.Stream.emit("state.starting", {});
  let response = await NATIVE_FETCH(request), obj = await response.clone().json(), serverDetails = obj.serverDetails, pairs = [
   ["ipAddress", "port"],
   ["ipV4Address", "ipV4Port"],
   ["ipV6Address", "ipV6Port"]
  ];
  XhomeInterceptor.consoleAddrs = {};
  for (let pair of pairs) {
   let [keyAddr, keyPort] = pair;
   if (keyAddr && keyPort && serverDetails[keyAddr]) {
    let port = serverDetails[keyPort], ports = new Set;
    port && ports.add(port), ports.add(9002), XhomeInterceptor.consoleAddrs[serverDetails[keyAddr]] = Array.from(ports);
   }
  }
  return response.json = () => Promise.resolve(obj), response.text = () => Promise.resolve(JSON.stringify(obj)), response;
 }
 static async handleInputConfigs(request, opts) {
  let response = await NATIVE_FETCH(request);
  if (getGlobalPref("touchController.mode") !== "all") return response;
  let obj = await response.clone().json(), xboxTitleId = JSON.parse(opts.body).titleIds[0];
  TouchController.setXboxTitleId(xboxTitleId);
  let inputConfigs = obj[0], hasTouchSupport = inputConfigs.supportedTabs.length > 0;
  if (!hasTouchSupport) {
   let supportedInputTypes = inputConfigs.supportedInputTypes;
   hasTouchSupport = supportedInputTypes.includes("NativeTouch") || supportedInputTypes.includes("CustomTouchOverlay");
  }
  if (hasTouchSupport) TouchController.disable(), BxEvent.dispatch(window, BxEvent.CUSTOM_TOUCH_LAYOUTS_LOADED, {
    data: null
   });
  else TouchController.enable(), TouchController.requestCustomLayouts();
  return response.json = () => Promise.resolve(obj), response.text = () => Promise.resolve(JSON.stringify(obj)), response;
 }
 static async handleTitles(request) {
  let clone = request.clone(), headers = {};
  for (let pair of clone.headers.entries())
   headers[pair[0]] = pair[1];
  let index = request.url.indexOf(".xboxlive.com");
  return request = new Request("https://wus.core.gssv-play-prod" + request.url.substring(index), {
   method: clone.method,
   body: await clone.text(),
   headers
  }), NATIVE_FETCH(request);
 }
 static async handlePlay(request) {
  BxEventBus.Stream.emit("state.loading", {});
  let body = await request.clone().json(), newRequest = new Request(request, {
   body: JSON.stringify(body)
  });
  return NATIVE_FETCH(newRequest);
 }
 static async handle(request) {
  TouchController.disable();
  let clone = request.clone(), headers = {};
  for (let pair of clone.headers.entries())
   headers[pair[0]] = pair[1];
  let osName = getOsNameFromResolution(getGlobalPref("xhome.video.resolution"));
  headers["x-ms-device-info"] = JSON.stringify(generateMsDeviceInfo(osName));
  let opts = {
   method: clone.method,
   headers
  };
  if (clone.method === "POST") opts.body = await clone.text();
  let url = request.url;
  if (request = new Request(url, opts), url.includes("/configuration")) return XhomeInterceptor.handleConfiguration(request);
  else if (url.endsWith("/sessions/home/play")) return XhomeInterceptor.handlePlay(request);
  else if (url.includes("inputconfigs")) return XhomeInterceptor.handleInputConfigs(request, opts);
  else if (url.includes("/login/user")) return XhomeInterceptor.handleLogin(request);
  else if (url.endsWith("/titles")) return XhomeInterceptor.handleTitles(request);
  else if (url && url.endsWith("/ice") && url.includes("/sessions/") && request.method === "GET") return patchIceCandidates(request, XhomeInterceptor.consoleAddrs);
  return await NATIVE_FETCH(request);
 }
}
function getPreferredServerRegion(shortName = !1) {
 let preferredRegion = getGlobalPref("server.region"), serverRegions = STATES.serverRegions;
 if (preferredRegion in serverRegions) if (shortName && serverRegions[preferredRegion].shortName) return serverRegions[preferredRegion].shortName;
  else return preferredRegion;
 for (let regionName in serverRegions) {
  let region = serverRegions[regionName];
  if (!region.isDefault) continue;
  if (shortName && region.shortName) return region.shortName;
  else return regionName;
 }
 return null;
}
class LoadingScreen {
 static ROCKET_VIDEO_URL = "https://assets.play.xbox.com/playxbox/static/media/RocketAnimationVideo.3a70e3be.mp4";
 static XBOX_SPLASH_VIDEO_URL = "https://assets.play.xbox.com/playxbox/static/media/XboxSplashScreen.417c50bc.mp4";
 static $bgStyle;
 static $waitTimeBox;
 static $rocketVideo;
 static $xboxSplashVideo;
 static $leaveQueueButton;
 static rocketRequested = !1;
 static guideFallbackInstalled = !1;
 static waitTimeInterval = null;
 static orgWebTitle;
 static secondsToString(seconds) {
  let m = Math.floor(seconds / 60), s = Math.floor(seconds % 60), mDisplay = m > 0 ? `${m}m` : "", sDisplay = `${s}s`.padStart(s >= 0 ? 3 : 4, "0");
  return mDisplay + sDisplay;
 }
 static setup() {
  LoadingScreen.rocketRequested = !0, LoadingScreen.installLoadingGuideFallback();
  let titleInfo = STATES.currentStream.titleInfo;
  if (!LoadingScreen.$bgStyle) {
   let $bgStyle = CE("style");
   document.documentElement.appendChild($bgStyle), LoadingScreen.$bgStyle = $bgStyle;
  }
  if (getGlobalPref("loadingScreen.gameArt.show") && titleInfo?.product) LoadingScreen.setBackground(titleInfo.product.heroImageUrl || titleInfo.product.titledHeroImageUrl || titleInfo.product.tileImageUrl);
  else LoadingScreen.$bgStyle.textContent += "#game-stream [class*=ConnectingHeroArtBackdrop-module__backdrop],#game-stream [class*=ConnectingHeroArtBackdrop]{display:none !important}";
  if (!getGlobalPref("loadingScreen.rocket")) LoadingScreen.hideRocket();
  else LoadingScreen.showOriginalRocket();
 }
 static installLoadingGuideFallback() {
  if (LoadingScreen.guideFallbackInstalled) return;
  LoadingScreen.guideFallbackInstalled = !0, document.addEventListener("click", (event) => {
   if (!event.target?.closest("button[class*=GuideButton-module__button]") || STATES.isPlaying) return;
   window.setTimeout(() => {
    if (!document.querySelector("#gamepass-dialog-root [role=dialog]")) window.BX_EXPOSED.showStreamMenu?.();
   }, 250);
  }, !0);
 }
 static showOriginalRocket(retry = 0) {
  let mount = document.querySelector("#game-stream");
  if (!LoadingScreen.rocketRequested) return;
  if (LoadingScreen.$rocketVideo?.isConnected) {
   LoadingScreen.ensureRocketPlayback(LoadingScreen.$rocketVideo);
   return;
  }
  let $screens = mount?.querySelector("[class*=PureScreens-module__screens]"), $heroArt = $screens?.querySelector("[class*=ConnectingHeroArtBackdrop-module__backdrop], [class*=ConnectingHeroArtBackdrop]"), needsHeroArt = getGlobalPref("loadingScreen.gameArt.show");
  if (!mount || needsHeroArt && (!$screens || !$heroArt) && retry < 12) {
   if (retry < 12) window.setTimeout(() => LoadingScreen.showOriginalRocket(retry + 1), 100);
   return;
  }
  let $video = CE("video", {
   class: "bx-original-rocket-video",
   autoplay: !0,
   loop: !0,
   muted: !0,
   playsinline: !0,
   preload: "auto",
   "aria-hidden": "true"
  });
  if ($video.muted = !0, $video.defaultMuted = !0, $video.src = LoadingScreen.ROCKET_VIDEO_URL, $heroArt) $heroArt.insertAdjacentElement("afterend", $video);
  else if ($screens) $screens.prepend($video);
  else mount.prepend($video);
  LoadingScreen.$rocketVideo = $video, $video.addEventListener("loadeddata", () => LoadingScreen.ensureRocketPlayback($video), { once: !0 }), $video.addEventListener("canplay", () => LoadingScreen.ensureRocketPlayback($video), { once: !0 }), LoadingScreen.ensureRocketPlayback($video);
 }
 static ensureRocketPlayback($video, retry = 0) {
  if (!LoadingScreen.rocketRequested || !$video.isConnected) return;
  $video.muted = !0;
  let retryPlayback = () => {
   if (retry < 8) window.setTimeout(() => LoadingScreen.ensureRocketPlayback($video, retry + 1), 150);
  };
  if ($video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
   retryPlayback();
   return;
  }
  $video.play().catch(retryPlayback);
 }
 static removeOriginalRocket() {
  LoadingScreen.rocketRequested = !1;
  let $video = LoadingScreen.$rocketVideo;
  if (!$video) return;
  $video.pause(), $video.removeAttribute("src"), $video.load(), $video.remove(), LoadingScreen.$rocketVideo = void 0;
 }
 static showXboxSplash() {
  if (getGlobalPref("ui.splashVideo.skip") || LoadingScreen.$xboxSplashVideo?.isConnected) return;
  let mount = document.querySelector("#game-stream");
  if (!mount) return;
  let $video = CE("video", {
   class: "bx-original-xbox-splash-video",
   playsinline: !0,
   preload: "auto",
   "aria-hidden": "true"
  }), remove = () => {
   if ($video.pause(), $video.removeAttribute("src"), $video.load(), $video.remove(), LoadingScreen.$xboxSplashVideo === $video) LoadingScreen.$xboxSplashVideo = void 0;
  };
  $video.src = LoadingScreen.XBOX_SPLASH_VIDEO_URL, $video.addEventListener("ended", remove, { once: !0 }), $video.addEventListener("error", remove, { once: !0 }), mount.appendChild($video), LoadingScreen.$xboxSplashVideo = $video, $video.play().catch(() => {
   $video.muted = !0, $video.play().catch(remove);
  });
 }
 static hideRocket() {
  LoadingScreen.removeOriginalRocket();
  let $bgStyle = LoadingScreen.$bgStyle;
  $bgStyle.textContent += "#game-stream div[class*=RocketAnimation-module__container] > svg{display:none}#game-stream video[class*=RocketAnimationVideo-module__video]{display:none}";
 }
 static setBackground(imageUrl) {
  let $bgStyle = LoadingScreen.$bgStyle;
  imageUrl = imageUrl + "?w=1920";
  let imageQuality = getGlobalPref("ui.imageQuality");
  if (imageQuality !== 90) imageUrl += "&q=" + imageQuality;
  $bgStyle.textContent += '#game-stream{background-color:transparent !important;background-position:center center !important;background-repeat:no-repeat !important;background-size:cover !important}#game-stream rect[width="800"]{transition:opacity .3s ease-in-out !important}' + `#game-stream {background-image: linear-gradient(#00000033, #000000e6), url(${imageUrl}) !important;}`;
  let bg = new Image;
  bg.onload = (e) => {
   $bgStyle.textContent += '#game-stream rect[width="800"]{opacity:0 !important}';
  }, bg.src = imageUrl;
 }
 static setupWaitTime(waitTime) {
  LoadingScreen.showLeaveQueueButton(), LoadingScreen.waitTimeInterval && clearInterval(LoadingScreen.waitTimeInterval);
  let secondsLeft = waitTime, $countDown, $estimated;
  LoadingScreen.orgWebTitle = document.title;
  let endDate = new Date(Date.now() + waitTime * 1000), pad = (value) => value.toString().padStart(2, "0"), endDateStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())} ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:${pad(endDate.getSeconds())}`;
  endDateStr += ` (${LoadingScreen.secondsToString(waitTime)})`;
  let $waitTimeBox = LoadingScreen.$waitTimeBox;
  if (!$waitTimeBox) $waitTimeBox = CE("div", { class: "bx-wait-time-box" }, CE("label", !1, t("server")), CE("span", !1, getPreferredServerRegion()), CE("label", !1, t("wait-time-estimated")), $estimated = CE("span", { class: "bx-wait-time-estimated" }), CE("label", !1, t("wait-time-countdown")), $countDown = CE("span", { class: "bx-wait-time-countdown" })), document.documentElement.appendChild($waitTimeBox), LoadingScreen.$waitTimeBox = $waitTimeBox;
  else $waitTimeBox.classList.remove("bx-gone"), $estimated = $waitTimeBox.querySelector(".bx-wait-time-estimated"), $countDown = $waitTimeBox.querySelector(".bx-wait-time-countdown");
  $estimated.textContent = endDateStr, $countDown.textContent = LoadingScreen.secondsToString(secondsLeft), document.title = `[${$countDown.textContent}] ${LoadingScreen.orgWebTitle}`, LoadingScreen.waitTimeInterval = window.setInterval(() => {
   if (secondsLeft--, secondsLeft <= 0) {
    $countDown.textContent = "Aguardando servidor", document.title = LoadingScreen.orgWebTitle, LoadingScreen.waitTimeInterval && clearInterval(LoadingScreen.waitTimeInterval), LoadingScreen.waitTimeInterval = null;
    return;
   }
   $countDown.textContent = LoadingScreen.secondsToString(secondsLeft), document.title = `[${$countDown.textContent}] ${LoadingScreen.orgWebTitle}`;
  }, 1000);
 }
 static showLeaveQueueButton() {
  let $button = LoadingScreen.$leaveQueueButton;
  if (!$button) $button = CE("button", {
    class: "bx-leave-queue-button",
    type: "button"
   }, "Sair da fila"), $button.addEventListener("click", () => {
    LoadingScreen.reset();
    let locale = window.location.pathname.match(/^\/([a-z]{2}-[a-z]{2})\//i)?.[1] || "pt-BR";
    window.location.assign(`${window.location.origin}/${locale}/play`);
   }), document.documentElement.appendChild($button), LoadingScreen.$leaveQueueButton = $button;
  $button.classList.remove("bx-gone");
 }
 static hide() {
  if (LoadingScreen.removeOriginalRocket(), LoadingScreen.showXboxSplash(), LoadingScreen.orgWebTitle && (document.title = LoadingScreen.orgWebTitle), LoadingScreen.$waitTimeBox && LoadingScreen.$waitTimeBox.classList.add("bx-gone"), LoadingScreen.$leaveQueueButton && LoadingScreen.$leaveQueueButton.classList.add("bx-gone"), getGlobalPref("loadingScreen.gameArt.show") && LoadingScreen.$bgStyle) {
   let $rocketBg = document.querySelector('#game-stream rect[width="800"]');
   $rocketBg && $rocketBg.addEventListener("transitionend", (e) => {
    LoadingScreen.$bgStyle.textContent += "#game-stream{background:#000 !important}";
   }), LoadingScreen.$bgStyle.textContent += '#game-stream rect[width="800"]{opacity:1 !important}';
  }
  setTimeout(LoadingScreen.reset, 2000);
 }
 static reset() {
  LoadingScreen.removeOriginalRocket(), LoadingScreen.$bgStyle && (LoadingScreen.$bgStyle.textContent = ""), LoadingScreen.$waitTimeBox && LoadingScreen.$waitTimeBox.classList.add("bx-gone"), LoadingScreen.$leaveQueueButton && LoadingScreen.$leaveQueueButton.classList.add("bx-gone"), LoadingScreen.waitTimeInterval && clearInterval(LoadingScreen.waitTimeInterval), LoadingScreen.waitTimeInterval = null;
 }
}
function localRedirect(path) {
 let url = window.location.href.substring(0, 31) + path, $pageContent = document.getElementById("PageContent");
 if (!$pageContent) return;
 let $anchor = CE("a", {
  href: url,
  class: "bx-hidden bx-offscreen"
 }, "");
 $anchor.addEventListener("click", (e) => {
  window.setTimeout(() => {
   $pageContent.removeChild($anchor);
  }, 1000);
 }), $pageContent.appendChild($anchor), $anchor.click();
}
window.localRedirect = localRedirect;
var nativeRequestFullscreen = HTMLElement.prototype.requestFullscreen, nativeExitFullscreen = Document.prototype.exitFullscreen, nativeFullscreenElementGetter = (() => {
 let prototype = document;
 while (prototype = Object.getPrototypeOf(prototype)) {
  let descriptor = Object.getOwnPropertyDescriptor(prototype, "fullscreenElement");
  if (descriptor?.get) return descriptor.get;
 }
})();
class HeaderSection {
 static instance;
 static getInstance = () => HeaderSection.instance ?? (HeaderSection.instance = new HeaderSection);
 LOG_TAG = "HeaderSection";
 $btnRemotePlay;
 $btnSettings;
 $btnFullscreen;
 $buttonsWrapper;
 $localeButton = null;
 headerRestoreTimers = [];
 headerRestoreInterval = null;
 headerObserver;
 headerCheckQueued = !1;
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()"), this.$btnRemotePlay = createButton({
   classes: ["bx-header-remote-play-button", "bx-gone"],
   icon: BxIcon.REMOTE_PLAY,
   title: t("remote-play"),
   style: 8 | 64 | 2048,
   onClick: (e) => RemotePlayManager.getInstance()?.togglePopup()
  });
  let $btnSettings = this.$btnSettings = createButton({
   classes: ["bx-header-settings-button", "bx-gone"],
   label: t("better-xcloud"),
   style: 16 | 32 | 64 | 256,
   onClick: (e) => SettingsDialog.getInstance().show()
  });
  this.$btnFullscreen = createButton({
   classes: ["bx-hub-fullscreen-button"],
   icon: BxIcon.DISPLAY,
   title: t("fullscreen"),
   style: 16 | 32 | 64 | 4096,
   onClick: this.onFullscreenClick
  }), document.addEventListener("fullscreenchange", this.syncFullscreenButton), window.addEventListener(BxEvent.POPSTATE, () => window.setTimeout(this.updateFullscreenButton)), window.addEventListener(BxEvent.POPSTATE, this.scheduleHeaderRestore), BxEventBus.Stream.on("state.stopped", this.scheduleHeaderRestore), this.$buttonsWrapper = CE("div", !1, !getGlobalPref("block.features").includes("remote-play") ? this.$btnRemotePlay : null, this.$btnSettings), this.observeHeaderReplacement(), window.addEventListener("bx-server-region-changed", () => {
   this.updateServerButton(), this.decorateLocaleButtons();
  }), window.setTimeout(() => this.decorateLocaleButtons(), 500), BxEventBus.Script.on("xcloud.server", ({ status }) => {
   if (status === "ready") STATES.isSignedIn = !0, this.updateServerButton();
   else if (status === "error") Toast.show(t("server-list-error"), "❌", { instant: !0 });
   else if (status === "unavailable") {
    if (STATES.supportedRegion = !1, document.querySelector("div[class^=UnsupportedMarketPage-module__container]")) SettingsDialog.getInstance().show();
   }
   $btnSettings.classList.remove("bx-gone");
  });
 }
 checkHeader = () => {
  this.decorateLocaleButtons();
  let $header = document.querySelector("#gamepass-root header[class^=Header-module__header]");
  if (!$header) return;
  let $target = $header.querySelector("div[class*=EdgewaterHeader-module__rightSectionSpacing], div[class*=RemotePlayHeader-module__rightSectionSpacing]");
  if (!$target) $target = document.querySelector("div[class^=UnsupportedMarketPage-module__buttons]");
  if (!$target) $target = Array.from($header.querySelectorAll("button")).filter(($button) => !$button.classList.contains("bx-header-settings-button")).at(-1)?.parentElement || $header.lastElementChild;
  if ($target?.appendChild(this.$buttonsWrapper), !STATES.isSignedIn) BxEventBus.Script.emit("xcloud.server", { status: "signed-out" });
  this.updateFullscreenButton();
 };
 decorateLocaleButtons() {
  document.querySelectorAll("button").forEach(($button) => {
   if (/^[a-z]{2}\s[a-z]{3}$/i.test($button.textContent?.trim() || "")) this.addLocaleFlag($button);
  });
 }
 getSelectedServerFlagCode() {
  let regionName = getPreferredServerRegion(), region = regionName ? STATES.serverRegions[regionName] : void 0, code = region?.flagCode || [...region?.flag || ""].map((char) => String.fromCharCode(char.codePointAt(0) - 127462 + 65)).join("").toLowerCase();
  return code.length === 2 ? code : "";
 }
 updateServerButton() {
  let regionName = getPreferredServerRegion(), region = regionName ? STATES.serverRegions[regionName] : void 0, flagCode = this.getSelectedServerFlagCode(), serverName = region?.shortName.replace(region.flag || "", "").trim() || getPreferredServerRegion(!0) || t("better-xcloud");
  this.$btnSettings.querySelector("span").replaceChildren(flagCode ? CE("img", {
   class: "bx-server-menu-flag",
   src: `https://flagcdn.com/w40/${flagCode}.png`,
   alt: ""
  }) : "", document.createTextNode(serverName));
 }
 scheduleHeaderRestore = () => {
  if (this.headerRestoreTimers.forEach((timer) => clearTimeout(timer)), this.headerRestoreInterval !== null) clearInterval(this.headerRestoreInterval);
  this.headerRestoreTimers = [80, 350, 900].map((delay) => window.setTimeout(() => {
   this.checkHeader();
  }, delay));
  let attempts = 0;
  this.headerRestoreInterval = window.setInterval(() => {
   if (this.checkHeader(), attempts++, attempts >= 30) clearInterval(this.headerRestoreInterval), this.headerRestoreInterval = null;
  }, 250);
 };
 observeHeaderReplacement() {
  if (this.headerObserver) return;
  this.headerObserver = new MutationObserver(() => {
   this.decorateLocaleButtons();
   let $header = document.querySelector("#gamepass-root header[class^=Header-module__header]");
   if (!$header) return;
   if ($header.contains(this.$buttonsWrapper) || this.headerCheckQueued) return;
   this.headerCheckQueued = !0, window.setTimeout(() => {
    this.headerCheckQueued = !1, this.checkHeader();
   }, 0);
  }), this.headerObserver.observe(document.documentElement, { childList: !0, subtree: !0 });
 }
 isHubPage = () => /^\/[a-zA-Z]{2}-[a-zA-Z]{2}\/play\/?$/.test(window.location.pathname);
 syncFullscreenButton = () => {
  let isFullscreen = nativeFullscreenElementGetter?.call(document) === document.documentElement;
  this.$btnFullscreen.title = t("fullscreen"), this.$btnFullscreen.setAttribute("aria-label", t("fullscreen")), this.$btnFullscreen.classList.toggle("bx-hub-fullscreen-active", isFullscreen);
 };
 onFullscreenClick = (e) => {
  e.preventDefault(), e.stopImmediatePropagation(), this.toggleFullscreen();
 };
 toggleFullscreen = async () => {
  try {
   if (nativeFullscreenElementGetter?.call(document) === document.documentElement) await nativeExitFullscreen.call(document);
   else await nativeRequestFullscreen.call(document.documentElement);
  } catch {}
  this.syncFullscreenButton();
 };
 updateFullscreenButton = () => {
  let $header = document.querySelector("#gamepass-root header[class^=Header-module__header]");
  if (!this.isHubPage() || !$header) {
   this.$btnFullscreen.remove(), window.BX_EXPOSED.hubFullscreenButton = null;
   return;
  }
  let $localeButton = $header.querySelector("button[class*=Locale], button[class*=locale], button[class*=Region], button[class*=region], button[class*=Market], button[class*=market]") || Array.from($header.querySelectorAll("button")).find(($button) => /^[a-z]{2}\s[a-z]{3}$/i.test($button.textContent?.trim() || ""));
  if ($localeButton?.parentElement) this.addLocaleFlag($localeButton), $localeButton.parentElement.insertBefore(this.$btnFullscreen, $localeButton), this.$localeButton = $localeButton;
  else $header.appendChild(this.$btnFullscreen), this.$localeButton = null;
  window.BX_EXPOSED.hubFullscreenButton = this.$btnFullscreen;
  let normalize = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  Array.from(document.querySelectorAll("button")).find(($button) => {
   let text = normalize($button.textContent?.trim() || "");
   return text.includes("experimentar a nova experiencia") || text.includes("try the new experience");
  })?.classList.add("bx-hide-in-browser-fullscreen"), this.syncFullscreenButton();
 };
 addLocaleFlag($button) {
  let countryCode = this.getSelectedServerFlagCode() || $button.textContent?.trim().match(/^([a-z]{2})\s/i)?.[1]?.toLowerCase();
  if (!countryCode) return;
  let $existingFlag = $button.querySelector(".bx-locale-flag");
  if ($existingFlag) $existingFlag.src = `https://flagcdn.com/w40/${countryCode}.png`;
  else $button.prepend(CE("img", {
    class: "bx-locale-flag",
    src: `https://flagcdn.com/w40/${countryCode}.png`,
    alt: ""
   }));
 }
 showRemotePlayButton() {
  this.$btnRemotePlay?.classList.remove("bx-gone");
 }
}
class RemotePlayDialog extends NavigationDialog {
 static instance;
 static getInstance = () => RemotePlayDialog.instance ?? (RemotePlayDialog.instance = new RemotePlayDialog);
 LOG_TAG = "RemotePlayNavigationDialog";
 STATE_LABELS = {
  On: t("powered-on"),
  Off: t("powered-off"),
  ConnectedStandby: t("standby"),
  Unknown: t("unknown")
 };
 $container;
 constructor() {
  super();
  BxLogger.info(this.LOG_TAG, "constructor()"), this.setupDialog();
 }
 setupDialog() {
  let $fragment = CE("div", { class: "bx-centered-dialog" }, CE("div", { class: "bx-dialog-title" }, CE("p", !1, t("remote-play")))), $settingNote = CE("p", {}), currentResolution = getGlobalPref("xhome.video.resolution"), $resolutions = CE("select", !1, CE("option", { value: "720p" }, "720p"), CE("option", { value: "1080p" }, "1080p"), CE("option", { value: "1080p-hq" }, "1080p (HQ)"));
  $resolutions = BxSelectElement.create($resolutions), $resolutions.addEventListener("input", (e) => {
   let value = e.target.value;
   $settingNote.textContent = `✅ ${t("xbox-360-games")} ${value === "1080p-hq" ? "❌" : "✅"} ${t("xbox-apps")}`, setGlobalPref("xhome.video.resolution", value, "ui");
  }), $resolutions.value = currentResolution, BxEvent.dispatch($resolutions, "input", {
   manualTrigger: !0
  });
  let $qualitySettings = CE("div", {
   class: "bx-remote-play-settings"
  }, CE("div", !1, CE("label", !1, t("target-resolution"), $settingNote), $resolutions), CE("div", !1, CE("label", { for: `bx_setting_${escapeCssSelector("xhome.ipv6.prefer")}` }, t("prefer-ipv6-server")), SettingElement.fromPref("xhome.ipv6.prefer")));
  $fragment.appendChild($qualitySettings);
  let manager = RemotePlayManager.getInstance(), consoles = manager.getConsoles(), createConsoleShortcut = (e) => {
   let { serverId, deviceName } = e.target.dataset, optionsJson = JSON.stringify({
    resolution: getGlobalPref("xhome.video.resolution")
   });
   AppInterface?.createConsoleShortcut(serverId, deviceName, optionsJson);
  };
  for (let con of consoles) {
   let $connect, $child = CE("div", {
    class: "bx-remote-play-device-wrapper"
   }, CE("div", { class: "bx-remote-play-device-info" }, CE("div", !1, CE("span", { class: "bx-remote-play-device-name" }, con.deviceName), CE("span", { class: "bx-remote-play-console-type" }, con.consoleType.replace("Xbox", ""))), CE("div", { class: "bx-remote-play-power-state" }, this.STATE_LABELS[con.powerState])), AppInterface ? createButton({
    attributes: {
     "data-server-id": con.serverId,
     "data-device-name": con.deviceName
    },
    icon: BxIcon.CREATE_SHORTCUT,
    style: 8 | 64,
    title: t("create-shortcut"),
    onClick: createConsoleShortcut
   }) : null, $connect = createButton({
    classes: ["bx-remote-play-connect-button"],
    label: t("console-connect"),
    style: 1 | 64,
    onClick: (e) => manager.play(con.serverId)
   }));
   setNearby($child, {
    orientation: "horizontal",
    focus: $connect
   }), $fragment.appendChild($child);
  }
  $fragment.appendChild(CE("div", {
   class: "bx-remote-play-buttons",
   _nearby: {
    orientation: "horizontal"
   }
  }, createButton({
   style: 8 | 64,
   label: t("close"),
   onClick: (e) => this.hide()
  }))), this.$container = $fragment;
 }
 getDialog() {
  return this;
 }
 getContent() {
  return this.$container;
 }
 focusIfNeeded() {
  let $btnConnect = this.$container.querySelector(".bx-remote-play-device-wrapper button:last-of-type");
  $btnConnect && $btnConnect.focus();
 }
}
class RemotePlayManager {
 static instance;
 static getInstance() {
  if (typeof RemotePlayManager.instance > "u") if (!getGlobalPref("block.features").includes("remote-play")) RemotePlayManager.instance = new RemotePlayManager;
   else RemotePlayManager.instance = null;
  return RemotePlayManager.instance;
 }
 LOG_TAG = "RemotePlayManager";
 isInitialized = !1;
 XCLOUD_TOKEN;
 XHOME_TOKEN;
 consoles;
 regions = [];
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()");
 }
 initialize() {
  if (this.isInitialized) return;
  this.isInitialized = !0, this.requestXhomeToken(() => {
   this.getConsolesList(() => {
    BxLogger.info(this.LOG_TAG, "Consoles", this.consoles), STATES.supportedRegion && HeaderSection.getInstance().showRemotePlayButton(), BxEvent.dispatch(window, BxEvent.REMOTE_PLAY_READY);
   });
  });
 }
 getXcloudToken() {
  return this.XCLOUD_TOKEN;
 }
 setXcloudToken(token) {
  this.XCLOUD_TOKEN = token;
 }
 getXhomeToken() {
  return this.XHOME_TOKEN;
 }
 getConsoles() {
  return this.consoles;
 }
 requestXhomeToken(callback) {
  if (this.XHOME_TOKEN) {
   callback();
   return;
  }
  let GSSV_TOKEN;
  try {
   GSSV_TOKEN = JSON.parse(localStorage.getItem("xboxcom_xbl_user_info")).tokens["http://gssv.xboxlive.com/"].token;
  } catch (e) {
   let today = new Date;
   for (let i = 0;i < localStorage.length; i++) {
    let key = localStorage.key(i);
    if (!key.startsWith("Auth.User.")) continue;
    let authUser = JSON.parse(localStorage.getItem(key));
    for (let token of authUser.tokens) {
     if (!token.relyingParty.includes("gssv.xboxlive.com")) continue;
     let tokenData = token.tokenData;
     if (new Date(tokenData.expiration) > today) {
      GSSV_TOKEN = tokenData.token;
      break;
     }
    }
    if (GSSV_TOKEN) break;
   }
  }
  if (!GSSV_TOKEN) {
   console.error("xHome: Could not get GSSV_TOKEN");
   return;
  }
  let request = new Request("https://xhome.gssv-play-prod.xboxlive.com/v2/login/user", {
   method: "POST",
   body: JSON.stringify({
    offeringId: "xhome",
    token: GSSV_TOKEN
   }),
   headers: {
    "Content-Type": "application/json; charset=utf-8"
   }
  });
  fetch(request).then((resp) => resp.json()).then((json) => {
   this.regions = json.offeringSettings.regions, this.XHOME_TOKEN = json.gsToken, callback();
  });
 }
 async getConsolesList(callback) {
  if (this.consoles) {
   callback();
   return;
  }
  let options = {
   method: "GET",
   headers: {
    Authorization: `Bearer ${this.XHOME_TOKEN}`
   }
  };
  this.regions.sort((a, b) => a.isDefault ? -1 : 0);
  for (let region of this.regions)
   try {
    let request = new Request(`${region.baseUri}/v6/servers/home?mr=50`, options), json = await (await fetch(request)).json();
    if (json.results.length === 0) continue;
    this.consoles = json.results, STATES.remotePlay.server = region.baseUri;
    break;
   } catch (e) {}
  if (!STATES.remotePlay.server) this.consoles = [];
  callback();
 }
 play(serverId, resolution) {
  if (resolution) setGlobalPref("xhome.video.resolution", resolution, "ui");
  localRedirect("/consoles/launch/" + serverId);
 }
 togglePopup(force = null) {
  if (!this.isReady()) {
   Toast.show(t("getting-consoles-list"));
   return;
  }
  if (this.consoles.length === 0) {
   Toast.show(t("no-consoles-found"), "", { instant: !0 });
   return;
  }
  RemotePlayDialog.getInstance().show();
 }
 isReady() {
  return this.consoles !== null;
 }
}
class GuideMenu {
 static instance;
 static getInstance = () => GuideMenu.instance ?? (GuideMenu.instance = new GuideMenu);
 $renderedButtons;
 closeGuideMenu() {
  if (window.BX_EXPOSED.dialogRoutes) {
   window.BX_EXPOSED.dialogRoutes.closeAll();
   return;
  }
  let $btnClose = document.querySelector("#gamepass-dialog-root button[class^=Header-module__closeButton]");
  $btnClose && $btnClose.click();
 }
 renderButtons() {
  if (this.$renderedButtons) return this.$renderedButtons;
  let buttons = {
   scriptSettings: createButton({
    label: t("better-xcloud"),
    icon: BxIcon.BETTER_XCLOUD,
    style: 128 | 64 | 1,
    onClick: () => {
     BxEventBus.Script.once("dialog.dismissed", () => {
      setTimeout(() => SettingsDialog.getInstance().show(), 50);
     }), this.closeGuideMenu();
    }
   }),
   closeApp: AppInterface && createButton({
    icon: BxIcon.POWER,
    label: t("close-app"),
    title: t("close-app"),
    style: 128 | 64 | 4,
    onClick: (e) => {
     AppInterface.closeApp();
    },
    attributes: {
     "data-state": "normal"
    }
   }),
   reloadPage: createButton({
    icon: BxIcon.REFRESH,
    label: t("reload-page"),
    title: t("reload-page"),
    style: 128 | 64,
    onClick: () => {
     if (this.closeGuideMenu(), STATES.isPlaying) confirm(t("confirm-reload-stream")) && window.location.reload();
     else window.location.reload();
    }
   }),
   backToHome: createButton({
    icon: BxIcon.HOME,
    label: t("back-to-home"),
    title: t("back-to-home"),
    style: 128 | 64,
    onClick: () => {
     this.closeGuideMenu(), confirm(t("back-to-home-confirm")) && (window.location.href = window.location.href.substring(0, 31));
    },
    attributes: {
     "data-state": "playing"
    }
   })
  }, buttonsLayout = [
   buttons.scriptSettings,
   [
    buttons.backToHome,
    buttons.reloadPage,
    buttons.closeApp
   ]
  ], $div = CE("div", {
   class: "bx-guide-home-buttons"
  });
  if (STATES.userAgent.isTv || getGlobalPref("ui.layout") === "tv") document.body.dataset.bxMediaType = "tv";
  for (let $button of buttonsLayout) {
   if (!$button) continue;
   if ($button instanceof HTMLElement) $div.appendChild($button);
   else if (Array.isArray($button)) {
    let $wrapper = CE("div", {});
    for (let $child of $button)
     $child && $wrapper.appendChild($child);
    $div.appendChild($wrapper);
   }
  }
  return this.$renderedButtons = $div, $div;
 }
 injectHome($root, isPlaying = !1) {
  let $buttons = this.renderButtons();
  if ($root.contains($buttons)) return;
  let $target = null;
  if (isPlaying) {
   $target = $root.querySelector("a[class*=QuitGameButton]");
   let $btnXcloudHome = $root.querySelector("div[class^=HomeButtonWithDivider]");
   $btnXcloudHome && ($btnXcloudHome.style.display = "none");
  } else {
   let $dividers = $root.querySelectorAll("div[class*=Divider-module__divider]");
   if ($dividers) $target = $dividers[$dividers.length - 1];
  }
  if (!$target) return !1;
  $buttons.dataset.isPlaying = isPlaying.toString(), $target.insertAdjacentElement("afterend", $buttons);
 }
}
class StreamBadges {
 static instance;
 static getInstance = () => StreamBadges.instance ?? (StreamBadges.instance = new StreamBadges);
 LOG_TAG = "StreamBadges";
 serverInfo = {};
 videoCodec = "";
 badges = {
  playtime: {
   name: t("playtime"),
   icon: BxIcon.PLAYTIME,
   color: "#ff004d"
  },
  battery: {
   name: t("battery"),
   icon: BxIcon.BATTERY,
   color: "#00b543"
  },
  download: {
   name: t("download"),
   icon: BxIcon.DOWNLOAD,
   color: "#29adff"
  },
  upload: {
   name: t("upload"),
   icon: BxIcon.UPLOAD,
   color: "#ff77a8"
  },
  server: {
   name: t("server"),
   icon: BxIcon.SERVER,
   color: "#ff6c24"
  },
  video: {
   name: t("video"),
   icon: BxIcon.DISPLAY,
   color: "#742f29"
  },
  audio: {
   name: t("audio"),
   icon: BxIcon.AUDIO,
   color: "#5f574f"
  }
 };
 $container;
 intervalId;
 REFRESH_INTERVAL = 3000;
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()");
 }
 setRegion(region) {
  this.serverInfo.server = {
   region
  };
 }
 renderBadge(name, value) {
  let badgeInfo = this.badges[name], $badge;
  if (badgeInfo.$element) return $badge = badgeInfo.$element, $badge.lastElementChild.textContent = value, $badge;
  if ($badge = CE("div", { class: "bx-badge", title: badgeInfo.name }, CE("span", { class: "bx-badge-name" }, createSvgIcon(badgeInfo.icon)), CE("span", { class: "bx-badge-value", style: `background-color: ${badgeInfo.color}` }, value)), name === "battery") $badge.classList.add("bx-badge-battery");
  return this.badges[name].$element = $badge, $badge;
 }
 updateBadges = async (forceUpdate = !1) => {
  if (!this.$container || !forceUpdate && !this.$container.isConnected) {
   this.stop();
   return;
  }
  let statsCollector = StreamStatsCollector.getInstance();
  await statsCollector.collect();
  let play = statsCollector.getStat("play"), batt = statsCollector.getStat("batt"), dl = statsCollector.getStat("dl"), ul = statsCollector.getStat("ul"), res = statsCollector.getStat("res"), badges = {
   video: this.formatVideoBadge(res.toString()),
   download: dl.toString(),
   upload: ul.toString(),
   playtime: play.toString(),
   battery: batt.toString()
  }, name;
  for (name in badges) {
   let value = badges[name];
   if (value === null) continue;
   let $elm = this.badges[name].$element;
   if (!$elm) continue;
   if ($elm.lastElementChild.textContent = value, name === "battery") if (batt.current === 100 && batt.start === 100) $elm.classList.add("bx-gone");
    else $elm.dataset.charging = batt.isCharging.toString(), $elm.classList.remove("bx-gone");
  }
 };
 formatVideoBadge(sourceResolution) {
  let sourceHeight = Number.parseInt(sourceResolution, 10), outputHeight = STATES.currentStream.streamPlayerManager?.getCanvasPlayer()?.getCanvas().height || 0;
  return (sourceHeight && outputHeight > sourceHeight ? `${sourceResolution} → ${outputHeight}p` : sourceResolution) + (this.videoCodec ? "/" + this.videoCodec : "");
 }
 async start() {
  await this.updateBadges(!0), this.stop(), this.intervalId = window.setInterval(this.updateBadges, this.REFRESH_INTERVAL);
 }
 stop() {
  this.intervalId && clearInterval(this.intervalId), this.intervalId = null;
 }
 destroy() {
  this.serverInfo = {}, delete this.$container;
 }
 async render() {
  if (this.$container) return this.start(), this.$container;
  await this.getServerStats();
  let batteryLevel = "";
  if (STATES.browser.capabilities.batteryApi) batteryLevel = "100%";
  let BADGES = [
   ["playtime", "1m"],
   ["battery", batteryLevel],
   ["download", humanFileSize(0)],
   ["upload", humanFileSize(0)],
   this.badges.server.$element ?? ["server", "?"],
   this.serverInfo.video ? this.badges.video.$element : ["video", "?"],
   this.serverInfo.audio ? this.badges.audio.$element : ["audio", "?"]
  ], $container = CE("div", { class: "bx-badges" });
  for (let item2 of BADGES) {
   if (!item2) continue;
   let $badge;
   if (!(item2 instanceof HTMLElement)) $badge = this.renderBadge(...item2);
   else $badge = item2;
   $container.appendChild($badge);
  }
  return this.$container = $container, await this.start(), $container;
 }
 async getServerStats() {
  let stats = await STATES.currentStream.peerConnection.getStats(), allVideoCodecs = {}, videoCodecId, allAudioCodecs = {}, audioCodecId, allCandidatePairs = {}, allRemoteCandidates = {}, candidatePairId;
  if (stats.forEach((stat) => {
   if (stat.type === "codec") {
    let mimeType = stat.mimeType.split("/")[0];
    if (mimeType === "video") allVideoCodecs[stat.id] = stat;
    else if (mimeType === "audio") allAudioCodecs[stat.id] = stat;
   } else if (stat.type === "inbound-rtp" && stat.packetsReceived > 0) {
    if (stat.kind === "video") videoCodecId = stat.codecId;
    else if (stat.kind === "audio") audioCodecId = stat.codecId;
   } else if (stat.type === "transport" && stat.selectedCandidatePairId) candidatePairId = stat.selectedCandidatePairId;
   else if (stat.type === "candidate-pair") allCandidatePairs[stat.id] = stat.remoteCandidateId;
   else if (stat.type === "remote-candidate") allRemoteCandidates[stat.id] = stat.address;
  }), videoCodecId) {
   let videoStat = allVideoCodecs[videoCodecId], video = {
    codec: videoStat.mimeType.substring(6)
   };
   if (video.codec === "H264") {
    let match = /profile-level-id=([0-9a-f]{6})/.exec(videoStat.sdpFmtpLine);
    match && (video.profile = match[1]);
   }
   if (this.videoCodec = video.codec, video.profile) {
    let profile = video.profile, quality = profile;
    if (profile.startsWith("4d")) quality = t("visual-quality-high");
    else if (profile.startsWith("42e")) quality = t("visual-quality-normal");
    else if (profile.startsWith("420")) quality = t("visual-quality-low");
    this.videoCodec += ` (${quality})`;
   }
   this.badges.video.$element = this.renderBadge("video", this.videoCodec), this.serverInfo.video = video;
  }
  if (audioCodecId) {
   let audioStat = allAudioCodecs[audioCodecId], audio = {
    codec: audioStat.mimeType.substring(6),
    bitrate: audioStat.clockRate
   }, bitrate = audio.bitrate / 1000, text = `${audio.codec} (${bitrate} kHz)`;
   this.badges.audio.$element = this.renderBadge("audio", text), this.serverInfo.audio = audio;
  }
  if (candidatePairId) {
   BxLogger.info("candidate", candidatePairId, allCandidatePairs);
   let text = "", isIpv6 = allRemoteCandidates[allCandidatePairs[candidatePairId]].includes(":"), server = this.serverInfo.server;
   if (server && server.region) text += server.region;
   text += "@" + (isIpv6 ? "IPv6" : "IPv4"), this.badges.server.$element = this.renderBadge("server", text);
  }
 }
 static setupEvents() {}
}
class XcloudInterceptor {
 static SERVER_EXTRA_INFO = {
  EASTUS: ["🇺🇸", "East US", "america-north"],
  EASTUS2: ["🇺🇸", "East US 2", "america-north"],
  NORTHCENTRALUS: ["🇺🇸", "North Central US", "america-north"],
  SOUTHCENTRALUS: ["🇺🇸", "South Central US", "america-north"],
  WESTUS: ["🇺🇸", "West US", "america-north"],
  WESTUS2: ["🇺🇸", "West US 2", "america-north"],
  WESTUS3: ["🇺🇸", "West US 3", "america-north"],
  MEXICOCENTRAL: ["🇲🇽", "Mexico Central", "america-north"],
  BRAZILSOUTH: ["🇧🇷", "Brazil South", "america-south"],
  CHILECENTRAL: ["🇨🇱", "Chile Central", "america-south"],
  JAPANEAST: ["🇯🇵", "Japan East", "asia"],
  KOREACENTRAL: ["🇰🇷", "Korea Central", "asia"],
  CENTRALINDIA: ["🇮🇳", "Central India", "asia"],
  SOUTHINDIA: ["🇮🇳", "South India", "asia"],
  AUSTRALIAEAST: ["🇦🇺", "Australia East", "australia"],
  AUSTRALIASOUTHEAST: ["🇦🇺", "Australia South East", "australia"],
  SWEDENCENTRAL: ["🇸🇪", "Sweden Central", "europe"],
  UKSOUTH: ["🇬🇧", "UK South", "europe"],
  WESTEUROPE: ["🇳🇱", "West Europe", "europe"]
 };
 static async handleLogin(request, init) {
  let bypassServer = getGlobalPref("server.bypassRestriction");
  if (bypassServer !== "off") {
   let ip = BypassServerIps[bypassServer];
   ip && request.headers.set("X-Forwarded-For", ip);
  }
  let response;
  try {
   response = await NATIVE_FETCH(request, init);
  } catch (e) {
   BxEventBus.Script.emit("xcloud.server", { status: "error" });
   return;
  }
  if (response.status !== 200) return !STATES.serverRegions && BxEventBus.Script.emit("xcloud.server", { status: "unavailable" }), response;
  let obj = await response.clone().json();
  RemotePlayManager.getInstance()?.setXcloudToken(obj.gsToken);
  let serverRegex = /\/\/(\w+)\./, serverExtra = XcloudInterceptor.SERVER_EXTRA_INFO, serverOrder = Object.keys(serverExtra), region;
  for (region of obj.offeringSettings.regions) {
   let regionName = region.name.toUpperCase(), shortName = region.name;
   if (region.isDefault) STATES.selectedRegion = Object.assign({}, region);
   let match = serverRegex.exec(region.baseUri);
   if (match) if (shortName = match[1], serverExtra[regionName]) {
     let info = serverExtra[regionName];
     region.flag = info[0], region.flagCode = [...info[0]].map((char) => String.fromCharCode(char.codePointAt(0) - 127462 + 65)).join("").toLowerCase(), shortName = info[0] + " " + shortName, region.displayName = info[1], region.contintent = info[2];
    } else region.contintent = "other", serverOrder.push(regionName), BX_FLAGS.Debug && alert("New server: " + regionName);
   region.shortName = shortName.toUpperCase(), STATES.serverRegions[region.name] = Object.assign({}, region);
  }
  STATES.serverRegions = Object.fromEntries(serverOrder.filter((k) => (k in STATES.serverRegions)).map((k) => [k, STATES.serverRegions[k]]));
  let preferredRegion = getPreferredServerRegion();
  if (preferredRegion && preferredRegion in STATES.serverRegions) {
   let tmp = Object.assign({}, STATES.serverRegions[preferredRegion]);
   tmp.isDefault = !0, obj.offeringSettings.regions = [tmp], STATES.selectedRegion = tmp;
  }
  return STATES.gsToken = obj.gsToken, BxEventBus.Script.emit("xcloud.server", { status: "ready" }), response.json = () => Promise.resolve(obj), response;
 }
 static async handlePlay(request, init) {
  BxEventBus.Stream.emit("state.loading", {});
  let PREF_STREAM_TARGET_RESOLUTION = getGlobalPref("stream.video.resolution"), PREF_STREAM_PREFERRED_LOCALE = getGlobalPref("stream.locale"), url = typeof request === "string" ? request : request.url, parsedUrl = new URL(url), badgeRegion = parsedUrl.host.split(".", 1)[0];
  for (let regionName in STATES.serverRegions) {
   let region = STATES.serverRegions[regionName];
   if (region && parsedUrl.origin === region.baseUri) {
    badgeRegion = regionName;
    break;
   }
  }
  StreamBadges.getInstance().setRegion(badgeRegion);
  let clone = request.clone(), body = await clone.json(), headers = {};
  for (let pair of clone.headers.entries())
   headers[pair[0]] = pair[1];
  if (PREF_STREAM_TARGET_RESOLUTION !== "auto") {
   let osName = getOsNameFromResolution(PREF_STREAM_TARGET_RESOLUTION);
   headers["x-ms-device-info"] = JSON.stringify(generateMsDeviceInfo(osName)), body.settings.osName = osName;
  }
  if (PREF_STREAM_PREFERRED_LOCALE !== "default") body.settings.locale = PREF_STREAM_PREFERRED_LOCALE;
  let newRequest = new Request(request, {
   body: JSON.stringify(body),
   headers
  });
  return NATIVE_FETCH(newRequest);
 }
 static async handleWaitTime(request, init) {
  let response = await NATIVE_FETCH(request, init);
  if (getGlobalPref("loadingScreen.waitTime.show")) try {
    let json = await response.clone().json(), values = [json, json?.data, json?.waitTime, json?.data?.waitTime], firstDuration = (key) => values.map((value) => value?.[key]).find((value) => Number.isFinite(value) && value > 0), total = firstDuration("estimatedTotalWaitTimeInSeconds"), allocation = firstDuration("estimatedAllocationTimeInSeconds"), provisioning = firstDuration("estimatedProvisioningTimeInSeconds"), waitTime = total ?? (allocation && provisioning ? allocation + provisioning : void 0) ?? allocation ?? provisioning ?? firstDuration("estimatedWaitTimeInSeconds") ?? firstDuration("waitTimeInSeconds");
    if (waitTime) LoadingScreen.setupWaitTime(waitTime);
   } catch {}
  return response;
 }
 static async handleConfiguration(request, init) {
  if (request.method !== "GET") return NATIVE_FETCH(request, init);
  if (getGlobalPref("touchController.mode") === "all") if (STATES.currentStream.titleInfo?.details.hasTouchSupport) TouchController.disable();
   else TouchController.enable();
  let response = await NATIVE_FETCH(request, init), text = await response.clone().text();
  if (!text.length) return response;
  BxEventBus.Stream.emit("state.starting", {});
  let obj = JSON.parse(text), overrides = JSON.parse(obj.clientStreamingConfigOverrides || "{}") || {};
  if (overrides.inputConfiguration = overrides.inputConfiguration || {}, overrides.inputConfiguration.enableVibration = !0, getStreamPref("localCoOp.enabled")) overrides.inputConfiguration.useUnreliableInput = !1;
  let overrideMkb = null;
  if (getGlobalPref("nativeMkb.mode") === "on" || STATES.currentStream.titleInfo && BX_FLAGS.ForceNativeMkbTitles?.includes(STATES.currentStream.titleInfo.details.productId)) overrideMkb = !0;
  if (getGlobalPref("nativeMkb.mode") === "off") overrideMkb = !1;
  if (overrideMkb !== null) overrides.inputConfiguration = Object.assign(overrides.inputConfiguration, {
    enableMouseInput: overrideMkb,
    enableKeyboardInput: overrideMkb
   });
  if (TouchController.isEnabled()) overrides.inputConfiguration.enableTouchInput = !0, overrides.inputConfiguration.maxTouchPoints = 10;
  if (getGlobalPref("audio.mic.onPlaying")) overrides.audioConfiguration = overrides.audioConfiguration || {}, overrides.audioConfiguration.enableMicrophone = !0;
  return obj.clientStreamingConfigOverrides = JSON.stringify(overrides), response.json = () => Promise.resolve(obj), response.text = () => Promise.resolve(JSON.stringify(obj)), response;
 }
 static async handle(request, init) {
  let url = typeof request === "string" ? request : request.url;
  if (url.endsWith("/v2/login/user")) return XcloudInterceptor.handleLogin(request, init);
  else if (url.endsWith("/sessions/cloud/play")) return XcloudInterceptor.handlePlay(request, init);
  else if (url.includes("xboxlive.com") && /\/wait(?:-|_)?time(?:\/|\?|$)/i.test(url)) return XcloudInterceptor.handleWaitTime(request, init);
  else if (url.endsWith("/configuration")) return XcloudInterceptor.handleConfiguration(request, init);
  else if (url && url.endsWith("/ice") && url.includes("/sessions/") && request.method === "GET") return patchIceCandidates(request);
  return NATIVE_FETCH(request, init);
 }
}
function clearApplicationInsightsBuffers() {
 window.sessionStorage.removeItem("AI_buffer"), window.sessionStorage.removeItem("AI_sentBuffer");
}
function clearDbLogs(dbName, table) {
 let request = window.indexedDB.open(dbName);
 request.onsuccess = (e) => {
  let db = e.target.result;
  try {
   let objectStoreRequest = db.transaction(table, "readwrite").objectStore(table).clear();
   objectStoreRequest.onsuccess = () => BxLogger.info("clearDbLogs", `Cleared ${dbName}.${table}`);
  } catch (ex) {}
 };
}
function clearAllLogs() {
 clearApplicationInsightsBuffers(), clearDbLogs("StreamClientLogHandler", "logs"), clearDbLogs("XCloudAppLogs", "logs");
}
function updateIceCandidates(candidates, options) {
 let pattern = new RegExp(/a=candidate:(?<foundation>\d+) (?<component>\d+) UDP (?<priority>\d+) (?<ip>[^\s]+) (?<port>\d+) (?<the_rest>.*)/), lst = [];
 for (let item2 of candidates) {
  if (item2.candidate == "a=end-of-candidates") continue;
  let match = pattern.exec(item2.candidate);
  if (match && match.groups) {
   let groups = match.groups;
   lst.push(groups);
  }
 }
 if (options.preferIpv6Server) lst.sort((a, b) => {
   let firstIp = a.ip, secondIp = b.ip;
   return !firstIp.includes(":") && secondIp.includes(":") ? 1 : -1;
  });
 let newCandidates = [], foundation = 1, newCandidate = (candidate) => ({
  candidate,
  messageType: "iceCandidate",
  sdpMLineIndex: "0",
  sdpMid: "0"
 });
 if (lst.forEach((item2) => {
  item2.foundation = foundation, item2.priority = foundation == 1 ? 2130706431 : 1, newCandidates.push(newCandidate(`a=candidate:${item2.foundation} 1 UDP ${item2.priority} ${item2.ip} ${item2.port} ${item2.the_rest}`)), ++foundation;
 }), options.consoleAddrs)
  for (let ip in options.consoleAddrs)
   for (let port of options.consoleAddrs[ip])
    newCandidates.push(newCandidate(`a=candidate:${newCandidates.length + 1} 1 UDP 1 ${ip} ${port} typ host`));
 return newCandidates.push(newCandidate("a=end-of-candidates")), BxLogger.info("ICE Candidates", newCandidates), newCandidates;
}
async function patchIceCandidates(request, consoleAddrs) {
 let response = await NATIVE_FETCH(request), text = await response.clone().text();
 if (!text.length) return response;
 let options = {
  preferIpv6Server: getGlobalPref(consoleAddrs ? "xhome.ipv6.prefer" : "server.ipv6.prefer"),
  consoleAddrs
 }, obj = JSON.parse(text), exchangeResponse = JSON.parse(obj.exchangeResponse);
 return exchangeResponse = updateIceCandidates(exchangeResponse, options), obj.exchangeResponse = JSON.stringify(exchangeResponse), response.json = () => Promise.resolve(obj), response.text = () => Promise.resolve(JSON.stringify(obj)), response;
}
function interceptHttpRequests() {
 let BLOCKED_URLS = [];
 if (getGlobalPref("block.tracking")) clearAllLogs(), BLOCKED_URLS.push("https://arc.msn.com", "https://browser.events.data.microsoft.com", "https://dc.services.visualstudio.com", "https://2c06dea3f26c40c69b8456d319791fd0@o427368.ingest.sentry.io", "https://mscom.demdex.net");
 let blockFeatures = getGlobalPref("block.features");
 if (blockFeatures.includes("chat")) BLOCKED_URLS.push("https://xblmessaging.xboxlive.com/network/xbox/users/me/inbox");
 if (blockFeatures.includes("friends")) BLOCKED_URLS.push("https://peoplehub.xboxlive.com/users/me/people/social", "https://peoplehub.xboxlive.com/users/me/people/recommendations");
 if (blockAllNotifications()) BLOCKED_URLS.push("https://notificationinbox.xboxlive.com/");
 let xhrPrototype = XMLHttpRequest.prototype, { open: nativeXhrOpen, send: nativeXhrSend } = xhrPrototype;
 xhrPrototype.open = function(method, url) {
  return this._url = url, nativeXhrOpen.apply(this, arguments);
 }, xhrPrototype.send = function(...arg) {
  for (let url of BLOCKED_URLS)
   if (this._url.startsWith(url)) {
    if (url === "https://dc.services.visualstudio.com") window.setTimeout(clearAllLogs, 1000);
    return BxLogger.warning("Blocked URL", url), !1;
   }
  return nativeXhrSend.apply(this, arguments);
 };
 let gamepassAllGames = [], IGNORED_DOMAINS = [
  "accounts.xboxlive.com",
  "chat.xboxlive.com",
  "notificationinbox.xboxlive.com",
  "peoplehub.xboxlive.com",
  "peoplehub-public.xboxlive.com",
  "rta.xboxlive.com",
  "userpresence.xboxlive.com",
  "xblmessaging.xboxlive.com",
  "consent.config.office.com",
  "arc.msn.com",
  "browser.events.data.microsoft.com",
  "dc.services.visualstudio.com",
  "2c06dea3f26c40c69b8456d319791fd0@o427368.ingest.sentry.io"
 ];
 window.BX_FETCH = window.fetch = async (request, init) => {
  let url = typeof request === "string" ? request : request.url;
  for (let blocked of BLOCKED_URLS)
   if (url.startsWith(blocked)) return BxLogger.warning("Blocked URL", url), new Response('{"acc":1,"webResult":{}}', {
     status: 200,
     statusText: "200 OK"
    });
  try {
   let domain = new URL(url).hostname;
   if (IGNORED_DOMAINS.includes(domain)) return NATIVE_FETCH(request, init);
  } catch (e) {
   return NATIVE_FETCH(request, init);
  }
  if (url.startsWith("https://emerald.xboxservices.com/xboxcomfd/experimentation")) try {
    let response = await NATIVE_FETCH(request, init), json = await response.json();
    if (json && json.exp && json.exp.treatments) for (let key in FeatureGates)
      json.exp.treatments[key] = FeatureGates[key];
    return response.json = () => Promise.resolve(json), response;
   } catch (e) {
    return console.log(e), NATIVE_FETCH(request, init);
   }
  if (STATES.userAgent.capabilities.touch && url.includes("catalog.gamepass.com/sigls/")) {
   let response = await NATIVE_FETCH(request, init), obj = await response.clone().json();
   if (url.includes("29a81209-df6f-41fd-a528-2ae6b91f719c") || url.includes("ce573635-7c18-4d0c-9d68-90b932393470")) for (let i = 1;i < obj.length; i++)
     gamepassAllGames.push(obj[i].id);
   else if (url.includes("9c86f07a-f3e8-45ad-82a0-a1f759597059")) try {
     let customList = TouchController.getCustomList();
     customList = customList.filter((id) => gamepassAllGames.includes(id));
     let newCustomList = customList.map((item2) => ({ id: item2 }));
     obj.push(...newCustomList);
    } catch (e) {
     console.log(e);
    }
   return response.json = () => Promise.resolve(obj), response;
  }
  if (BX_FLAGS.ForceNativeMkbTitles && url.includes("catalog.gamepass.com/sigls/") && url.includes("8fa264dd-124f-4af3-97e8-596fcdf4b486")) {
   let response = await NATIVE_FETCH(request, init), obj = await response.clone().json();
   try {
    let newCustomList = BX_FLAGS.ForceNativeMkbTitles.map((item2) => ({ id: item2 }));
    obj.push(...newCustomList);
   } catch (e) {
    console.log(e);
   }
   return response.json = () => Promise.resolve(obj), response;
  }
  let requestType;
  if (url.includes("/sessions/home") || url.includes("xhome.") || window.location.pathname.includes("/play/consoles/launch/") && url.endsWith("/inputconfigs")) requestType = "xhome";
  else requestType = "xcloud";
  if (requestType === "xhome") return XhomeInterceptor.handle(request);
  return XcloudInterceptor.handle(request, init);
 };
}
function generateMsDeviceInfo(osName) {
 return {
  appInfo: {
   env: {
    clientAppId: window.location.host,
    clientAppType: "browser",
    clientAppVersion: "26.1.97",
    clientSdkVersion: "10.3.7",
    httpEnvironment: "prod",
    sdkInstallId: ""
   }
  },
  dev: {
   os: { name: osName, ver: "22631.2715", platform: "desktop" },
   hw: { make: "Microsoft", model: "unknown", sdktype: "web" },
   browser: { browserName: "chrome", browserVersion: "140.0.3485.54" },
   displayInfo: {
    dimensions: { widthInPixels: 4096, heightInPixels: 2160 },
    pixelDensity: { dpiX: 1, dpiY: 1 }
   }
  }
 };
}
function getOsNameFromResolution(resolution) {
 let osName;
 switch (resolution) {
  case "1080p-hq":
   osName = "tizen";
   break;
  case "1080p":
   osName = "windows";
   break;
  default:
   osName = "android";
   break;
 }
 return osName;
}
class MouseCursorHider {
 static instance;
 static getInstance() {
  if (typeof MouseCursorHider.instance > "u") if (!getGlobalPref("mkb.enabled") && getGlobalPref("mkb.cursor.hideIdle")) MouseCursorHider.instance = new MouseCursorHider;
   else MouseCursorHider.instance = null;
  return MouseCursorHider.instance;
 }
 timeoutId;
 isCursorVisible = !0;
 show() {
  document.body && (document.body.style.cursor = "unset"), this.isCursorVisible = !0;
 }
 hide() {
  document.body && (document.body.style.cursor = "none"), this.timeoutId = null, this.isCursorVisible = !1;
 }
 onMouseMove = (e) => {
  !this.isCursorVisible && this.show(), this.timeoutId && clearTimeout(this.timeoutId), this.timeoutId = window.setTimeout(this.hide, 3000);
 };
 start() {
  this.show(), document.addEventListener("mousemove", this.onMouseMove);
 }
 stop() {
  this.timeoutId && clearTimeout(this.timeoutId), this.timeoutId = null, document.removeEventListener("mousemove", this.onMouseMove), this.show();
 }
}
function patchHistoryMethod(type) {
 let orig = window.history[type];
 return function(...args) {
  return BxEvent.dispatch(window, BxEvent.POPSTATE, {
   arguments: args
  }), orig.apply(this, arguments);
 };
}
function onHistoryChanged(e) {
 if (e && e.arguments && e.arguments[0] && e.arguments[0].origin === "better-xcloud") return;
 NavigationDialogManager.getInstance().hide(), LoadingScreen.reset(), BxEventBus.Stream.emit("state.stopped", {});
}
function setCodecPreferences(sdp, preferredCodec) {
 let h264Pattern = /a=fmtp:(\d+).*profile-level-id=([0-9a-f]{6})/g, profilePrefix = preferredCodec === "high" ? "4d" : preferredCodec === "low" ? "420" : "42e", preferredCodecIds = [], matches = sdp.matchAll(h264Pattern) || [];
 for (let match of matches) {
  let id = match[1];
  if (match[2].startsWith(profilePrefix)) preferredCodecIds.push(id);
 }
 if (!preferredCodecIds.length) return sdp;
 let lines = sdp.split(`\r
`);
 for (let lineIndex = 0;lineIndex < lines.length; lineIndex++) {
  let line = lines[lineIndex];
  if (!line.startsWith("m=video")) continue;
  let tmp = line.trim().split(" "), ids = tmp.slice(3);
  ids = ids.filter((item2) => !preferredCodecIds.includes(item2)), ids = preferredCodecIds.concat(ids), lines[lineIndex] = tmp.slice(0, 3).concat(ids).join(" ");
  break;
 }
 return lines.join(`\r
`);
}
function patchSdpBitrate(sdp, video, audio) {
 let lines = sdp.split(`\r
`), mediaSet = new Set;
 !!video && mediaSet.add("video"), !!audio && mediaSet.add("audio");
 let bitrate = {
  video,
  audio
 };
 for (let lineNumber = 0;lineNumber < lines.length; lineNumber++) {
  let media = "", line = lines[lineNumber];
  if (!line.startsWith("m=")) continue;
  for (let m of mediaSet)
   if (line.startsWith(`m=${m}`)) {
    media = m, mediaSet.delete(media);
    break;
   }
  if (!media) continue;
  let bLine = `b=AS:${bitrate[media]}`;
  while (lineNumber++, lineNumber < lines.length) {
   if (line = lines[lineNumber], line.startsWith("i=") || line.startsWith("c=")) continue;
   if (line.startsWith("b=AS:")) {
    lines[lineNumber] = bLine;
    break;
   }
   if (line.startsWith("m=")) {
    lines.splice(lineNumber, 0, bLine);
    break;
   }
  }
 }
 return lines.join(`\r
`);
}
class WebGL2Player extends BaseCanvasPlayer {
 gl = null;
 resources = [];
 program = null;
 currentTexture = null;
 previousTexture = null;
 historyTexture = null;
 copyFramebuffer = null;
 hasPreviousFrame = !1;
 generatedFrameIds = [];
 lastSourceFrameAt = 0;
 estimatedSourceFps = 60;
 renderedFrameTimes = [];
 textureWidth = 0;
 textureHeight = 0;
 constructor($video) {
  super("webgl2", $video, "WebGL2Player");
 }
 updateCanvas() {
  let gl = this.gl, program = this.program, filterId = this.toFilterId(this.options.processing), latencyOptions = this.getLatencyProtectedOptions();
  this.syncOutputResolution(), gl.viewport(0, 0, this.$canvas.width, this.$canvas.height), gl.uniform2f(gl.getUniformLocation(program, "iResolution"), this.$canvas.width, this.$canvas.height), gl.uniform2f(gl.getUniformLocation(program, "iSourceResolution"), this.$video.videoWidth, this.$video.videoHeight), gl.uniform1i(gl.getUniformLocation(program, "filterId"), filterId), gl.uniform1i(gl.getUniformLocation(program, "qualityMode"), this.options.processingMode === "quality" ? 1 : 0), gl.uniform1f(gl.getUniformLocation(program, "sharpenFactor"), this.options.sharpness / (this.options.processingMode === "quality" ? 1 : 1.2)), gl.uniform1f(gl.getUniformLocation(program, "brightness"), this.options.brightness / 100), gl.uniform1f(gl.getUniformLocation(program, "contrast"), this.options.contrast / 100), gl.uniform1f(gl.getUniformLocation(program, "saturation"), this.options.saturation / 100), gl.uniform1f(gl.getUniformLocation(program, "artifactReduction"), latencyOptions.artifactReduction / 100), gl.uniform1i(gl.getUniformLocation(program, "antiAliasing"), latencyOptions.antiAliasing === "fxaa-strong" ? 3 : latencyOptions.antiAliasing === "fxaa-quality" ? 2 : latencyOptions.antiAliasing === "fxaa" ? 1 : 0), gl.uniform1i(gl.getUniformLocation(program, "generateFrame"), 0), gl.uniform1f(gl.getUniformLocation(program, "interpolation"), 1), gl.uniform1i(gl.getUniformLocation(program, "adaptiveSharpen"), this.options.vxAdaptiveSharpen ? 1 : 0), gl.uniform1i(gl.getUniformLocation(program, "dynamicReconstruction"), this.options.vxDynamicReconstruction ? 1 : 0), gl.uniform1i(gl.getUniformLocation(program, "temporalSuperResolution"), latencyOptions.temporalSuperResolution ? 1 : 0), gl.uniform1i(gl.getUniformLocation(program, "hudProtection"), this.options.vxHudProtection ? 1 : 0), gl.uniform1f(gl.getUniformLocation(program, "fineDetailReconstruction"), latencyOptions.fineDetailReconstruction / 100), gl.uniform1i(gl.getUniformLocation(program, "upscaleAlgorithm"), this.options.vxUpscaleAlgorithm === "fsr1" ? 1 : this.options.vxUpscaleAlgorithm === "nis" ? 2 : 0), gl.uniform1i(gl.getUniformLocation(program, "hasPreviousFrame"), this.hasPreviousFrame ? 1 : 0);
 }
 updateFrame() {
  if (!this.ensureTextureStorage()) return;
  let now = performance.now();
  if (this.lastSourceFrameAt) {
   let instantaneousFps = 1000 / Math.max(1, now - this.lastSourceFrameAt);
   this.estimatedSourceFps = Math.min(120, Math.max(15, this.estimatedSourceFps * 0.8 + instantaneousFps * 0.2));
  }
  this.lastSourceFrameAt = now;
  let gl = this.gl;
  gl.activeTexture(gl.TEXTURE0), gl.bindTexture(gl.TEXTURE_2D, this.currentTexture), gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.$video);
  let multiplier = this.getFrameGenerationMultiplier(), shouldGenerate = this.hasPreviousFrame && multiplier > 1;
  if (this.cancelGeneratedFrames(), shouldGenerate) this.presentGeneratedFrames(multiplier, () => this.copyCurrentFrame());
  else this.renderTextureFrame(!1, 1), this.copyCurrentFrame();
  this.hasPreviousFrame = !0;
 }
 ensureTextureStorage() {
  let gl = this.gl, width = this.$video.videoWidth, height = this.$video.videoHeight;
  if (!gl || !width || !height || !this.currentTexture || !this.previousTexture || !this.historyTexture) return !1;
  if (this.textureWidth === width && this.textureHeight === height) return !0;
  let allocate = (unit, texture) => {
   gl.activeTexture(unit), gl.bindTexture(gl.TEXTURE_2D, texture), gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
  };
  return allocate(gl.TEXTURE0, this.currentTexture), allocate(gl.TEXTURE1, this.previousTexture), allocate(gl.TEXTURE2, this.historyTexture), this.textureWidth = width, this.textureHeight = height, this.hasPreviousFrame = !1, this.updateCanvas(), !0;
 }
 renderTextureFrame(generated, interpolation) {
  let gl = this.gl, program = this.program, latencyOptions = this.getLatencyProtectedOptions();
  gl.useProgram(program), gl.uniform1i(gl.getUniformLocation(program, "generateFrame"), generated ? 1 : 0), gl.uniform1f(gl.getUniformLocation(program, "interpolation"), interpolation), gl.uniform1i(gl.getUniformLocation(program, "adaptiveSharpen"), this.options.vxAdaptiveSharpen ? 1 : 0), gl.uniform1i(gl.getUniformLocation(program, "dynamicReconstruction"), this.options.vxDynamicReconstruction ? 1 : 0), gl.uniform1i(gl.getUniformLocation(program, "temporalSuperResolution"), latencyOptions.temporalSuperResolution ? 1 : 0), gl.uniform1i(gl.getUniformLocation(program, "hudProtection"), this.options.vxHudProtection ? 1 : 0), gl.uniform1f(gl.getUniformLocation(program, "fineDetailReconstruction"), latencyOptions.fineDetailReconstruction / 100), gl.uniform1f(gl.getUniformLocation(program, "artifactReduction"), latencyOptions.artifactReduction / 100), gl.uniform1i(gl.getUniformLocation(program, "antiAliasing"), latencyOptions.antiAliasing === "fxaa-strong" ? 3 : latencyOptions.antiAliasing === "fxaa-quality" ? 2 : latencyOptions.antiAliasing === "fxaa" ? 1 : 0), gl.uniform1i(gl.getUniformLocation(program, "hasPreviousFrame"), this.hasPreviousFrame ? 1 : 0), gl.drawArrays(gl.TRIANGLES, 0, 3), this.recordLocalRender();
 }
 recordLocalRender() {
  let now = performance.now();
  this.renderedFrameTimes.push(now);
  while (this.renderedFrameTimes[0] < now - 1000)
   this.renderedFrameTimes.shift();
 }
 getLocalRenderFps() {
  let now = performance.now();
  while (this.renderedFrameTimes[0] < now - 1000)
   this.renderedFrameTimes.shift();
  return this.renderedFrameTimes.length || null;
 }
 getFrameGenerationMultiplier() {
  let maxMultiplier = this.options.vxFrameGeneration === "4x" ? 4 : this.options.vxFrameGeneration === "3x" ? 3 : this.options.vxFrameGeneration === "2x" ? 2 : this.options.vxFrameGeneration === "custom" ? 8 : 1, baseFps = this.targetFps > 0 && this.targetFps < 60 ? this.targetFps : this.estimatedSourceFps, targetMultiplier = Math.max(1, Math.ceil(this.options.vxFrameTargetFps / Math.max(1, baseFps))), requestedMultiplier = this.options.vxFrameGeneration === "custom" ? Math.min(maxMultiplier, targetMultiplier) : maxMultiplier;
  return Math.min(requestedMultiplier, this.getLatencyProtectedOptions().frameGenerationLimit);
 }
 presentGeneratedFrames(multiplier, onComplete) {
  let step = 1, sourceFps = this.targetFps > 0 && this.targetFps < 60 ? this.targetFps : this.estimatedSourceFps, requestedOutputFps = this.options.vxFrameGeneration === "custom" ? this.options.vxFrameTargetFps : sourceFps * multiplier, presentationInterval = 1000 / Math.max(1, requestedOutputFps), startedAt = performance.now(), scheduleAt = (targetAt, callback) => {
   if (this.options.vxFrameGeneration !== "off") {
    let delay = Math.max(0, targetAt - performance.now()), id = window.setTimeout(() => {
     if (!this.isStopped) callback();
    }, delay);
    this.generatedFrameIds.push({ id, timer: !0 });
    return;
   }
   let waitForPresentation = () => {
    if (this.isStopped) return;
    let earlyPresentationTolerance = Math.min(4, Math.max(1, presentationInterval * 0.25));
    if (performance.now() + earlyPresentationTolerance >= targetAt) {
     callback();
     return;
    }
    this.generatedFrameIds.push({ id: requestAnimationFrame(waitForPresentation), timer: !1 });
   };
   this.generatedFrameIds.push({ id: requestAnimationFrame(waitForPresentation), timer: !1 });
  }, presentNext = () => {
   if (this.isStopped) return;
   if (step < multiplier) this.renderTextureFrame(!0, step / multiplier), step++, scheduleAt(startedAt + presentationInterval * (step - 1), presentNext);
   else this.renderTextureFrame(!1, 1), onComplete();
  };
  presentNext();
 }
 cancelGeneratedFrames() {
  this.generatedFrameIds.forEach(({ id, timer }) => timer ? clearTimeout(id) : cancelAnimationFrame(id)), this.generatedFrameIds = [];
 }
 copyCurrentFrame() {
  let gl = this.gl;
  if (!this.copyFramebuffer || !this.currentTexture || !this.previousTexture) return;
  let copyTexture = (source, destination) => {
   gl.bindFramebuffer(gl.FRAMEBUFFER, this.copyFramebuffer), gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, source, 0), gl.bindTexture(gl.TEXTURE_2D, destination), gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, this.$video.videoWidth, this.$video.videoHeight);
  };
  if (this.hasPreviousFrame && this.historyTexture) copyTexture(this.previousTexture, this.historyTexture);
  copyTexture(this.currentTexture, this.previousTexture), gl.bindFramebuffer(gl.FRAMEBUFFER, null), gl.activeTexture(gl.TEXTURE0), gl.bindTexture(gl.TEXTURE_2D, this.currentTexture), gl.activeTexture(gl.TEXTURE1), gl.bindTexture(gl.TEXTURE_2D, this.previousTexture), gl.activeTexture(gl.TEXTURE2), gl.bindTexture(gl.TEXTURE_2D, this.historyTexture);
 }
 async setupShaders() {
  let gl = this.$canvas.getContext("webgl2", {
   isBx: !0,
   antialias: !0,
   alpha: !1,
   depth: !1,
   preserveDrawingBuffer: !1,
   stencil: !1,
   powerPreference: getStreamPref("video.player.powerPreference")
  });
  this.gl = gl, gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  let vShader = gl.createShader(gl.VERTEX_SHADER);
  if (gl.shaderSource(vShader, `#version 300 es
in vec4 position;void main() {gl_Position = position;}`), gl.compileShader(vShader), !gl.getShaderParameter(vShader, gl.COMPILE_STATUS))
   throw Error(`Vertex shader VX inválido: ${gl.getShaderInfoLog(vShader) || "erro desconhecido"}`);
  let fShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (gl.shaderSource(fShader, `#version 300 es\r
precision mediump float;uniform sampler2D data;uniform sampler2D previousData;uniform sampler2D historyData;uniform vec2 iResolution;uniform vec2 iSourceResolution;const int FILTER_UNSHARP_MASKING = 1;const int FILTER_CAS = 2;const float CAS_CONTRAST_PEAK = 0.8 * -3.0 + 8.0;const vec3 LUMINOSITY_FACTOR = vec3(0.299, 0.587, 0.114);uniform int filterId;uniform bool qualityMode;uniform float sharpenFactor;uniform float brightness;uniform float contrast;uniform float saturation;uniform float artifactReduction;uniform bool generateFrame;uniform float interpolation;uniform bool adaptiveSharpen;uniform bool dynamicReconstruction;uniform bool temporalSuperResolution;uniform bool hudProtection;uniform float fineDetailReconstruction;uniform int upscaleAlgorithm;uniform int antiAliasing;uniform bool hasPreviousFrame;out vec4 fragColor;float luma(vec3 color);vec3 clarityBoost(sampler2D tex, vec2 coord, vec3 e) {vec2 texelSize = 1.0 / iSourceResolution.xy;vec3 b = texture(tex, coord + texelSize * vec2(0, 1)).rgb;vec3 d = texture(tex, coord + texelSize * vec2(-1, 0)).rgb;vec3 f = texture(tex, coord + texelSize * vec2(1, 0)).rgb;vec3 h = texture(tex, coord + texelSize * vec2(0, -1)).rgb;vec3 a;vec3 c;vec3 g;vec3 i;if (filterId == FILTER_UNSHARP_MASKING || qualityMode) {a = texture(tex, coord + texelSize * vec2(-1, 1)).rgb;c = texture(tex, coord + texelSize * vec2(1, 1)).rgb;g = texture(tex, coord + texelSize * vec2(-1, -1)).rgb;i = texture(tex, coord + texelSize * vec2(1, -1)).rgb;}if (filterId == FILTER_UNSHARP_MASKING) {vec3 gaussianBlur = (a + c + g + i) * 1.0 + (b + d + f + h) * 2.0 + e * 4.0;gaussianBlur /= 16.0;return e + (e - gaussianBlur) * sharpenFactor / 3.0;}vec3 minRgb = min(min(min(d, e), min(f, b)), h);vec3 maxRgb = max(max(max(d, e), max(f, b)), h);if (qualityMode) {minRgb += min(min(a, c), min(g, i));maxRgb += max(max(a, c), max(g, i));}vec3 reciprocalMaxRgb = 1.0 / maxRgb;vec3 amplifyRgb = clamp(min(minRgb, 2.0 - maxRgb) * reciprocalMaxRgb, 0.0, 1.0);amplifyRgb = inversesqrt(amplifyRgb);vec3 weightRgb = -(1.0 / (amplifyRgb * CAS_CONTRAST_PEAK));vec3 reciprocalWeightRgb = 1.0 / (4.0 * weightRgb + 1.0);vec3 window = b + d + f + h;vec3 outColor = clamp((window * weightRgb + e) * reciprocalWeightRgb, 0.0, 1.0);return mix(e, outColor, sharpenFactor / 2.0);}vec3 fsr1Upscale(sampler2D tex, vec2 uv) {vec2 t = 1.0 / iSourceResolution.xy;vec3 c = texture(tex, uv).rgb;vec3 n = texture(tex, uv + vec2(0.0, t.y)).rgb;vec3 s = texture(tex, uv - vec2(0.0, t.y)).rgb;vec3 e = texture(tex, uv + vec2(t.x, 0.0)).rgb;vec3 w = texture(tex, uv - vec2(t.x, 0.0)).rgb;float gx = abs(luma(e) - luma(w));float gy = abs(luma(n) - luma(s));vec3 directional = gx > gy ? (n + s) * 0.5 : (e + w) * 0.5;float edge = smoothstep(0.012, 0.14, max(gx, gy));vec3 easu = mix((n + s + e + w) * 0.25, directional, edge);vec3 rcas = c + (c - easu) * (0.22 + edge * 0.18);return clamp(mix(c, rcas, 0.82), 0.0, 1.0);}vec3 nisUpscale(sampler2D tex, vec2 uv) {vec2 t = 1.0 / iSourceResolution.xy;vec3 c = texture(tex, uv).rgb;vec3 n = texture(tex, uv + vec2(0.0, t.y)).rgb;vec3 s = texture(tex, uv - vec2(0.0, t.y)).rgb;vec3 e = texture(tex, uv + vec2(t.x, 0.0)).rgb;vec3 w = texture(tex, uv - vec2(t.x, 0.0)).rgb;vec3 ne = texture(tex, uv + t).rgb;vec3 sw = texture(tex, uv - t).rgb;float horizontalEdge = abs(luma(e) - luma(w));float verticalEdge = abs(luma(n) - luma(s));vec3 tangent = horizontalEdge > verticalEdge ? (n + s + ne + sw) * 0.25 : (e + w + ne + sw) * 0.25;float contrast = smoothstep(0.01, 0.16, max(horizontalEdge, verticalEdge));vec3 directional = mix((n + s + e + w) * 0.25, tangent, contrast);return clamp(c + (c - directional) * (0.42 + contrast * 0.32), 0.0, 1.0);}vec3 applyUpscaleAlgorithm(sampler2D tex, vec2 uv) {if (upscaleAlgorithm == 1) return fsr1Upscale(tex, uv);if (upscaleAlgorithm == 2) return nisUpscale(tex, uv);return texture(tex, uv).rgb;}vec3 reduceArtifacts(sampler2D tex, vec2 coord, vec3 center) {vec2 texel = 1.0 / iSourceResolution.xy;vec3 north = texture(tex, coord + vec2(0.0, texel.y)).rgb;vec3 south = texture(tex, coord - vec2(0.0, texel.y)).rgb;vec3 east = texture(tex, coord + vec2(texel.x, 0.0)).rgb;vec3 west = texture(tex, coord - vec2(texel.x, 0.0)).rgb;vec3 average = (north + south + east + west) * 0.25;float edge = length(center - average);float upscalePressure = max(iResolution.x / iSourceResolution.x, iResolution.y / iSourceResolution.y) - 1.0;float reconstructionBoost = dynamicReconstruction ? 1.0 + clamp(upscalePressure, 0.0, 2.0) * 0.35 : 1.0;float amount = artifactReduction * reconstructionBoost * (1.0 - smoothstep(0.025, 0.12, edge));return mix(center, average, amount * 0.45);}float luma(vec3 color) {return dot(color, LUMINOSITY_FACTOR);}vec3 interpolateMotion(sampler2D previous, sampler2D current, vec2 uv) {vec2 texel = 2.0 / iSourceResolution.xy;float bestError = 1000.0;vec2 bestOffset = vec2(0.0);float currentCenter = luma(texture(current, uv).rgb);vec2 offsets[5] = vec2[5](vec2(0.0), vec2(-texel.x, 0.0), vec2(texel.x, 0.0), vec2(0.0, -texel.y), vec2(0.0, texel.y));for (int i = 0; i < 5; ++i) {vec2 offset = offsets[i];float error = abs(currentCenter - luma(texture(previous, uv + offset).rgb));if (error < bestError) {bestError = error;bestOffset = offset;}}vec3 previousColor = texture(previous, uv).rgb;vec3 previousWarped = texture(previous, uv + bestOffset * (1.0 - interpolation)).rgb;vec3 currentColor = texture(current, uv).rgb;float confidence = 1.0 - smoothstep(0.035, 0.12, bestError);vec3 interpolated = mix(previousWarped, currentColor, interpolation);vec3 temporalFallback = mix(previousColor, currentColor, interpolation);vec3 generatedColor = mix(temporalFallback, interpolated, confidence);float sceneChange = smoothstep(0.18, 0.40, abs(luma(currentColor) - luma(previousColor)));generatedColor = mix(generatedColor, currentColor, sceneChange);vec2 hudTexel = 1.0 / iSourceResolution.xy;float localEdge = abs(luma(texture(current, uv + vec2(hudTexel.x, 0.0)).rgb) - luma(texture(current, uv - vec2(hudTexel.x, 0.0)).rgb))+ abs(luma(texture(current, uv + vec2(0.0, hudTexel.y)).rgb) - luma(texture(current, uv - vec2(0.0, hudTexel.y)).rgb));float stableHud = hudProtection ? smoothstep(0.08, 0.22, localEdge) * (1.0 - smoothstep(0.01, 0.055, abs(luma(currentColor) - luma(texture(previous, uv).rgb)))) : 0.0;return mix(generatedColor, currentColor, stableHud);}vec3 temporalReconstruct(vec3 currentColor, vec2 uv) {if (!temporalSuperResolution || !hasPreviousFrame) return currentColor;vec3 previous = texture(previousData, uv).rgb;vec3 history = texture(historyData, uv).rgb;float delta = max(abs(luma(currentColor) - luma(previous)), abs(luma(currentColor) - luma(history)));float stability = 1.0 - smoothstep(0.018, 0.095, delta);vec3 temporalAverage = (currentColor * 0.65 + previous * 0.23 + history * 0.12);return mix(currentColor, temporalAverage, stability * 0.35);}vec3 reconstructFineDetails(sampler2D tex, vec2 uv, vec3 center) {if (fineDetailReconstruction <= 0.0) return center;vec2 texel = 1.0 / iSourceResolution.xy;vec3 north = texture(tex, uv + vec2(0.0, texel.y)).rgb;vec3 south = texture(tex, uv - vec2(0.0, texel.y)).rgb;vec3 east = texture(tex, uv + vec2(texel.x, 0.0)).rgb;vec3 west = texture(tex, uv - vec2(texel.x, 0.0)).rgb;vec3 localAverage = (north + south + east + west) * 0.25;vec3 detail = center - localAverage;float edgeMask = smoothstep(0.012, 0.10, length(detail));float haloGuard = 1.0 - smoothstep(0.22, 0.52, length(detail));return clamp(center + detail * fineDetailReconstruction * edgeMask * haloGuard * 0.65, 0.0, 1.0);}vec3 applyFxaa(sampler2D tex, vec2 uv, vec3 color) {if (antiAliasing == 0) return color;vec2 t = 1.0 / iSourceResolution.xy;vec3 rgbNW = texture(tex, uv + vec2(-t.x, t.y)).rgb;vec3 rgbNE = texture(tex, uv + vec2(t.x, t.y)).rgb;vec3 rgbSW = texture(tex, uv + vec2(-t.x, -t.y)).rgb;vec3 rgbSE = texture(tex, uv + vec2(t.x, -t.y)).rgb;float lumaNW = luma(rgbNW);float lumaNE = luma(rgbNE);float lumaSW = luma(rgbSW);float lumaSE = luma(rgbSE);float lumaM = luma(color);float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));vec2 dir = vec2(-((lumaNW + lumaNE) - (lumaSW + lumaSE)), ((lumaNW + lumaSW) - (lumaNE + lumaSE)));float reduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * 0.03125, 0.0078125);float directionScale = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);float span = antiAliasing == 1 ? 4.0 : antiAliasing == 2 ? 8.0 : 12.0;dir = clamp(dir * directionScale, vec2(-span), vec2(span)) * t;vec3 rgbA = 0.5 * (texture(tex, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(tex, uv + dir * (2.0 / 3.0 - 0.5)).rgb);vec3 rgbB = rgbA * 0.5 + 0.25 * (texture(tex, uv + dir * -0.5).rgb + texture(tex, uv + dir * 0.5).rgb);vec3 fxaa = (luma(rgbB) < lumaMin || luma(rgbB) > lumaMax) ? rgbA : rgbB;float blend = antiAliasing == 1 ? 0.55 : antiAliasing == 2 ? 0.8 : 1.0;return mix(color, fxaa, blend);}void main() {vec2 uv = gl_FragCoord.xy / iResolution.xy;vec3 color = generateFrame ? interpolateMotion(previousData, data, uv) : applyUpscaleAlgorithm(data, uv);if (artifactReduction > 0.0) {color = reduceArtifacts(data, uv, color);}color = temporalReconstruct(color, uv);color = reconstructFineDetails(data, uv, color);color = applyFxaa(data, uv, color);if (sharpenFactor > 0.0) {float motion = hasPreviousFrame ? abs(luma(texture(data, uv).rgb) - luma(texture(previousData, uv).rgb)) : 0.0;float motionFactor = adaptiveSharpen ? 1.0 - smoothstep(0.025, 0.18, motion) * 0.75 : 1.0;color = clarityBoost(data, uv, color) * motionFactor + color * (1.0 - motionFactor);}color = mix(vec3(dot(color, LUMINOSITY_FACTOR)), color, saturation);color = contrast * (color - 0.5) + 0.5;color = brightness * color;fragColor = vec4(color, 1.0);}`), gl.compileShader(fShader), !gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) throw Error(`Shader de efeitos VX inválido: ${gl.getShaderInfoLog(fShader) || "erro desconhecido"}`);
  let program = gl.createProgram();
  if (this.program = program, gl.attachShader(program, vShader), gl.attachShader(program, fShader), gl.linkProgram(program), gl.useProgram(program), !gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(`Programa VX não pôde ser iniciado: ${gl.getProgramInfoLog(program) || "erro desconhecido"}`);
  this.updateCanvas();
  let buffer = gl.createBuffer();
  this.resources.push(buffer), gl.bindBuffer(gl.ARRAY_BUFFER, buffer), gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
   -1,
   -1,
   3,
   -1,
   -1,
   3
  ]), gl.STATIC_DRAW), gl.enableVertexAttribArray(0), gl.vertexAttribPointer(0, 2, gl.FLOAT, !1, 0, 0);
  let setupTexture = (texture) => {
   gl.bindTexture(gl.TEXTURE_2D, texture), gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !0), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR), gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };
  this.currentTexture = gl.createTexture(), this.previousTexture = gl.createTexture(), this.historyTexture = gl.createTexture(), this.copyFramebuffer = gl.createFramebuffer(), this.resources.push(this.currentTexture, this.previousTexture, this.historyTexture, this.copyFramebuffer), setupTexture(this.currentTexture), setupTexture(this.previousTexture), setupTexture(this.historyTexture), gl.activeTexture(gl.TEXTURE0), gl.bindTexture(gl.TEXTURE_2D, this.currentTexture), gl.uniform1i(gl.getUniformLocation(program, "data"), 0), gl.uniform1i(gl.getUniformLocation(program, "previousData"), 1), gl.uniform1i(gl.getUniformLocation(program, "historyData"), 2), gl.activeTexture(gl.TEXTURE1), gl.bindTexture(gl.TEXTURE_2D, this.previousTexture), gl.activeTexture(gl.TEXTURE2), gl.bindTexture(gl.TEXTURE_2D, this.historyTexture);
 }
 destroy() {
  this.cancelGeneratedFrames(), super.destroy();
  let gl = this.gl;
  if (!gl) return;
  gl.getExtension("WEBGL_lose_context")?.loseContext(), gl.useProgram(null);
  for (let resource of this.resources)
   if (resource instanceof WebGLProgram) gl.deleteProgram(resource);
   else if (resource instanceof WebGLShader) gl.deleteShader(resource);
   else if (resource instanceof WebGLTexture) gl.deleteTexture(resource);
   else if (resource instanceof WebGLBuffer) gl.deleteBuffer(resource);
   else if (resource instanceof WebGLFramebuffer) gl.deleteFramebuffer(resource);
  this.gl = null, this.currentTexture = null, this.previousTexture = null, this.historyTexture = null, this.copyFramebuffer = null, this.renderedFrameTimes = [];
 }
 refreshPlayer() {
  this.updateCanvas();
 }
}
class VideoPlayer extends BaseStreamPlayer {
 $videoCss;
 $usmMatrix;
 constructor($video, logTag) {
  super("default", "video", $video, logTag);
 }
 init() {
  super.init();
  let xmlns = "http://www.w3.org/2000/svg", $svg = CE("svg", {
   id: "bx-video-filters",
   class: "bx-gone",
   xmlns
  }, CE("defs", { xmlns: "http://www.w3.org/2000/svg" }, CE("filter", {
   id: "bx-filter-usm",
   xmlns
  }, this.$usmMatrix = CE("feConvolveMatrix", {
   id: "bx-filter-usm-matrix",
   order: "3",
   xmlns
  }))));
  this.$videoCss = CE("style", { id: "bx-video-css" });
  let $fragment = document.createDocumentFragment();
  $fragment.append(this.$videoCss, $svg), document.documentElement.appendChild($fragment);
 }
 setupRendering() {}
 forceDrawFrame() {}
 updateCanvas() {}
 refreshPlayer() {
  let filters = this.getVideoPlayerFilterStyle(), videoCss = "";
  if (filters) videoCss += `filter: ${filters} !important;`;
  if (getGlobalPref("screenshot.applyFilters")) ScreenshotManager.getInstance().updateCanvasFilters(filters);
  let css = "";
  if (videoCss) css = `#game-stream video { ${videoCss} }`;
  this.$videoCss.textContent = css;
 }
 clearFilters() {
  this.$videoCss.textContent = "";
 }
 getVideoPlayerFilterStyle() {
  let filters = [], sharpness = this.options.sharpness || 0;
  if (this.options.processing === "usm" && sharpness != 0) {
   let matrix = `0 -1 0 -1 ${(7 - (sharpness / 2 - 1) * 0.5).toFixed(1)} -1 0 -1 0`;
   this.$usmMatrix?.setAttributeNS(null, "kernelMatrix", matrix), filters.push("url(#bx-filter-usm)");
  }
  let saturation = this.options.saturation || 100;
  if (saturation != 100) filters.push(`saturate(${saturation}%)`);
  let contrast = this.options.contrast || 100;
  if (contrast != 100) filters.push(`contrast(${contrast}%)`);
  let brightness = this.options.brightness || 100;
  if (brightness != 100) filters.push(`brightness(${brightness}%)`);
  return filters.join(" ");
 }
}
class StreamPlayerManager {
 static instance;
 static getInstance = () => StreamPlayerManager.instance ?? (StreamPlayerManager.instance = new StreamPlayerManager);
 $video;
 videoPlayer;
 canvasPlayer;
 playerType = "default";
 canvasPlayerReady = !1;
 playerOptions = {};
 canvasViewportRect = null;
 constructor() {}
 setVideoElement($video) {
  if (this.$video && this.$video !== $video) this.cleanUpCanvasPlayer(), this.playerType = "default", this.playerOptions = {}, this.canvasViewportRect = null;
  this.$video = $video, this.videoPlayer = new VideoPlayer($video, "VideoPlayer"), this.videoPlayer.init();
 }
 resizePlayer() {
  let PREF_RATIO = getStreamPref("video.ratio"), $video = this.$video, isNativeTouchGame = STATES.currentStream.titleInfo?.details.hasNativeTouchSupport, targetWidth, targetHeight, targetObjectFit;
  if (PREF_RATIO.includes(":")) {
   let tmp = PREF_RATIO.split(":"), videoRatio = parseFloat(tmp[0]) / parseFloat(tmp[1]), width = 0, height = 0, parentRect = $video.parentElement.getBoundingClientRect();
   if (parentRect.width / parentRect.height > videoRatio) height = parentRect.height, width = height * videoRatio;
   else width = parentRect.width, height = width / videoRatio;
   width = Math.ceil(Math.min(parentRect.width, width)), height = Math.ceil(Math.min(parentRect.height, height)), $video.dataset.width = width.toString(), $video.dataset.height = height.toString();
   let $parent = $video.parentElement, position = getStreamPref("video.position");
   if ($parent.style.removeProperty("padding-top"), $parent.dataset.position = position, position === "top-half" || position === "bottom-half") {
    let padding = Math.floor((window.innerHeight - height) / 4);
    if (padding > 0) {
     if (position === "bottom-half") padding *= 3;
     $parent.style.paddingTop = padding + "px";
    }
   }
   targetWidth = `${width}px`, targetHeight = `${height}px`, targetObjectFit = PREF_RATIO === "16:9" ? "contain" : "fill";
  } else targetWidth = "100%", targetHeight = "100%", targetObjectFit = PREF_RATIO, $video.dataset.width = window.innerWidth.toString(), $video.dataset.height = window.innerHeight.toString();
  if ($video.style.width = targetWidth, $video.style.height = targetHeight, $video.style.objectFit = targetObjectFit, this.canvasPlayer) {
   let $canvas = this.canvasPlayer.getCanvas();
   $canvas.style.width = targetWidth, $canvas.style.height = targetHeight, $canvas.style.objectFit = targetObjectFit, this.syncCanvasLayoutFromVideo(), $video.dispatchEvent(new Event("resize"));
  }
  if (isNativeTouchGame && this.playerType !== "default") window.BX_EXPOSED.streamSession.updateDimensions();
 }
 switchPlayerType(type, refreshPlayer = !1) {
  if (this.playerType !== type) {
   let videoClass = ["android-tv", "android-handheld", "android"].includes(BX_FLAGS.DeviceInfo.deviceType) ? "bx-pixel" : "bx-gone";
   if (this.cleanUpCanvasPlayer(), type === "default") this.$video.classList.remove(videoClass);
   else {
    if (BX_FLAGS.EnableWebGPURenderer && type === "webgpu") this.canvasPlayer = new WebGPUPlayer(this.$video);
    else this.canvasPlayer = new WebGL2Player(this.$video);
    let canvasPlayer = this.canvasPlayer;
    this.canvasPlayerReady = !1, canvasPlayer.init().then(() => {
     if (this.canvasPlayer === canvasPlayer) this.resizePlayer(), this.syncCanvasLayoutFromVideo(), this.canvasPlayerReady = !0, canvasPlayer.updateOptions(this.playerOptions, !0), this.videoPlayer.clearFilters(), this.$video.classList.add(videoClass);
    }).catch((error) => {
     if (console.error("[Better xCloud VX] Canvas renderer disabled after initialization failure", error), this.canvasPlayer === canvasPlayer) this.cleanUpCanvasPlayer(), this.playerType = "default", this.$video.classList.remove(videoClass);
    });
   }
   this.playerType = type;
  }
  refreshPlayer && this.refreshPlayer();
 }
 updateOptions(options, refreshPlayer = !1) {
  if (Object.assign(this.playerOptions, options), this.canvasPlayer && !this.canvasPlayerReady) return;
  (this.canvasPlayer || this.videoPlayer).updateOptions(options, refreshPlayer);
 }
 getPlayerElement(elementType) {
  if (typeof elementType > "u") elementType = this.playerType === "default" ? "video" : "canvas";
  if (elementType !== "video") return this.canvasPlayer?.getCanvas();
  return this.$video;
 }
 getCanvasPlayer() {
  return this.canvasPlayer;
 }
 refreshPlayer() {
  if (this.playerType === "default") this.videoPlayer.refreshPlayer();
  else if (this.canvasPlayerReady) ScreenshotManager.getInstance().updateCanvasFilters("none"), this.canvasPlayer?.refreshPlayer();
  this.resizePlayer();
 }
 getVideoPlayerFilterStyle() {
  throw Error("Method not implemented.");
 }
 syncCanvasLayoutFromVideo() {
  let $canvas = this.canvasPlayer?.getCanvas();
  if (!$canvas || !this.$video.isConnected) return;
  let style = getComputedStyle(this.$video), rect = this.$video.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) this.canvasViewportRect = rect;
  if (BX_FLAGS.DeviceInfo.deviceType === "android-handheld" && this.canvasViewportRect) {
   let viewportRect = this.canvasViewportRect;
   $canvas.style.position = "fixed", $canvas.style.left = `${viewportRect.left}px`, $canvas.style.top = `${viewportRect.top}px`, $canvas.style.right = "auto", $canvas.style.bottom = "auto", $canvas.style.width = `${viewportRect.width}px`, $canvas.style.height = `${viewportRect.height}px`, $canvas.style.margin = "0", $canvas.style.transform = "none", $canvas.style.transformOrigin = "center", $canvas.style.objectFit = style.objectFit, $canvas.style.zIndex = style.zIndex === "auto" ? "0" : style.zIndex, $canvas.style.pointerEvents = "none";
   return;
  }
  for (let property of ["position", "top", "right", "bottom", "left", "transform", "transform-origin", "object-position", "z-index"])
   $canvas.style.setProperty(property, style.getPropertyValue(property));
  $canvas.style.pointerEvents = "none";
 }
 cleanUpCanvasPlayer() {
  this.canvasPlayer?.destroy(), this.canvasPlayer = null, this.canvasPlayerReady = !1;
 }
 destroy() {
  this.cleanUpCanvasPlayer(), this.playerType = "default", this.playerOptions = {}, this.canvasViewportRect = null;
 }
}
function patchVideoApi() {
 let PREF_SKIP_SPLASH_VIDEO = getGlobalPref("ui.splashVideo.skip"), showFunc = function() {
  if (this.style.visibility = "visible", !this.videoWidth) return;
  let playerOptions = {
   processing: getStreamPref("video.processing"),
   processingMode: getStreamPref("video.processing.mode"),
   sharpness: getStreamPref("video.processing.sharpness"),
   saturation: getStreamPref("video.saturation"),
   contrast: getStreamPref("video.contrast"),
   brightness: getStreamPref("video.brightness"),
   vxUpscaleTarget: getStreamPref("vx.upscale.target"),
   vxUpscaleAlgorithm: getStreamPref("vx.upscale.algorithm"),
   vxAntiAliasing: getStreamPref("vx.antiAliasing"),
   vxArtifactReduction: getStreamPref("vx.artifactReduction"),
   vxFrameGeneration: getStreamPref("vx.frameGeneration"),
   vxLatencyBudget: getStreamPref("vx.latencyBudget"),
   vxAdaptiveSharpen: getStreamPref("vx.adaptiveSharpen"),
   vxDynamicReconstruction: getStreamPref("vx.dynamicReconstruction"),
   vxTemporalSuperResolution: getStreamPref("vx.temporalSuperResolution"),
   vxHudProtection: getStreamPref("vx.hudProtection"),
   vxFrameTargetFps: getStreamPref("vx.frameTargetFps"),
   vxFineDetailReconstruction: getStreamPref("vx.fineDetailReconstruction")
  };
  playerOptions = applyCompetitiveMode(playerOptions);
  let streamPlayerManager = StreamPlayerManager.getInstance();
  streamPlayerManager.setVideoElement(this), streamPlayerManager.updateOptions(playerOptions, !1), streamPlayerManager.switchPlayerType(getEffectiveVideoPlayerType()), STATES.currentStream.streamPlayerManager = streamPlayerManager, VxVideoEngine.getInstance().initialize(this), BxEventBus.Stream.emit("state.playing", {
   $video: this
  });
 }, nativePlay = HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.nativePlay = nativePlay, HTMLMediaElement.prototype.play = function() {
  if (this.className && this.className.startsWith("XboxSplashVideo")) {
   if (PREF_SKIP_SPLASH_VIDEO) return this.volume = 0, this.style.display = "none", this.dispatchEvent(new Event("ended")), new Promise(() => {});
   return nativePlay.apply(this);
  }
  let $parent = this.parentElement;
  if (!this.src && $parent?.dataset.testid === "media-container") this.addEventListener("loadedmetadata", showFunc, { once: !0 });
  return nativePlay.apply(this);
 };
}
function patchRtcCodecs() {
 if (getGlobalPref("stream.video.codecProfile") === "default") return;
 if (typeof RTCRtpTransceiver > "u" || !("setCodecPreferences" in RTCRtpTransceiver.prototype)) return !1;
}
function patchRtcPeerConnection() {
 let nativeCreateDataChannel = RTCPeerConnection.prototype.createDataChannel;
 RTCPeerConnection.prototype.createDataChannel = function() {
  let dataChannel = nativeCreateDataChannel.apply(this, arguments);
  return BxEventBus.Stream.emit("dataChannelCreated", { dataChannel }), dataChannel;
 };
 let maxVideoBitrateDef = getGlobalPrefDefinition("stream.video.maxBitrate"), configuredVideoBitrate = getGlobalPref("stream.video.maxBitrate"), hasUnlimitedVideoBitrate = configuredVideoBitrate >= maxVideoBitrateDef.max, maxVideoBitrate = hasUnlimitedVideoBitrate ? 0 : configuredVideoBitrate, codec = getGlobalPref("stream.video.codecProfile");
 if (codec !== "default" || !hasUnlimitedVideoBitrate) {
  let nativeSetLocalDescription = RTCPeerConnection.prototype.setLocalDescription;
  RTCPeerConnection.prototype.setLocalDescription = function(description) {
   if (codec !== "default") arguments[0].sdp = setCodecPreferences(arguments[0].sdp, codec);
   try {
    if (!hasUnlimitedVideoBitrate && maxVideoBitrate > 0 && description) arguments[0].sdp = patchSdpBitrate(arguments[0].sdp, Math.round(maxVideoBitrate / 1000));
   } catch (e) {
    BxLogger.error("setLocalDescription", e);
   }
   return nativeSetLocalDescription.apply(this, arguments);
  };
 }
 let OrgRTCPeerConnection = window.RTCPeerConnection;
 window.RTCPeerConnection = function() {
  let conn = new OrgRTCPeerConnection;
  return STATES.currentStream.peerConnection = conn, conn.addEventListener("connectionstatechange", (e) => {
   BxLogger.info("connectionstatechange", conn.connectionState);
  }), conn;
 };
}
function patchAudioContext() {
 let OrgAudioContext = window.AudioContext, nativeCreateGain = OrgAudioContext.prototype.createGain;
 window.AudioContext = function(options) {
  if (options && options.latencyHint) options.latencyHint = 0;
  let ctx = new OrgAudioContext(options);
  return BxLogger.info("patchAudioContext", ctx, options), ctx.createGain = function() {
   let gainNode = nativeCreateGain.apply(this);
   return gainNode.gain.value = getStreamPref("audio.volume") / 100, STATES.currentStream.audioGainNode = gainNode, gainNode;
  }, STATES.currentStream.audioContext = ctx, ctx;
 };
}
function patchMeControl() {
 let overrideConfigs = {
  enableAADTelemetry: !1,
  enableTelemetry: !1,
  telEvs: "",
  oneDSUrl: ""
 }, MSA = {
  MeControl: {
   API: {
    setDisplayMode: () => {},
    setMobileState: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
   }
  }
 }, MeControl = {}, MsaHandler = {
  get(target, prop, receiver) {
   return target[prop];
  },
  set(obj, prop, value) {
   if (prop === "MeControl" && value.Config) value.Config = Object.assign(value.Config, overrideConfigs);
   return obj[prop] = value, !0;
  }
 }, MeControlHandler = {
  get(target, prop, receiver) {
   return target[prop];
  },
  set(obj, prop, value) {
   if (prop === "Config") value = Object.assign(value, overrideConfigs);
   return obj[prop] = value, !0;
  }
 };
 window.MSA = new Proxy(MSA, MsaHandler), window.MeControl = new Proxy(MeControl, MeControlHandler);
}
function disableAdobeAudienceManager() {
 Object.defineProperty(window, "adobe", {
  get() {
   return Object.freeze({});
  }
 });
}
function patchCanvasContext() {
 let nativeGetContext = HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
  if (contextType.includes("webgl")) {
   if (contextAttributes = contextAttributes || {}, !contextAttributes.isBx) {
    if (contextAttributes.antialias = !1, contextAttributes.powerPreference === "high-performance") contextAttributes.powerPreference = "low-power";
   }
  }
  return nativeGetContext.apply(this, [contextType, contextAttributes]);
 };
}
function patchPointerLockApi() {
 Object.defineProperty(document, "fullscreenElement", {
  configurable: !0,
  get() {
   return document.documentElement;
  }
 }), HTMLElement.prototype.requestFullscreen = function(options) {
  return Promise.resolve();
 };
 let pointerLockElement = null;
 Object.defineProperty(document, "pointerLockElement", {
  configurable: !0,
  get() {
   return pointerLockElement;
  }
 }), HTMLElement.prototype.requestPointerLock = function() {
  pointerLockElement = document.documentElement, window.dispatchEvent(new Event(BxEvent.POINTER_LOCK_REQUESTED));
 }, Document.prototype.exitPointerLock = function() {
  pointerLockElement = null, window.dispatchEvent(new Event(BxEvent.POINTER_LOCK_EXITED));
 };
}
class BaseGameBarAction {
 constructor() {}
 reset() {}
 onClick(e) {
  BxEventBus.Stream.emit("gameBar.activated", {});
 }
 render() {
  return this.$content;
 }
}
class ScreenshotAction extends BaseGameBarAction {
 $content;
 constructor() {
  super();
  this.$content = createButton({
   style: 8,
   icon: BxIcon.SCREENSHOT,
   title: t("take-screenshot"),
   onClick: this.onClick
  });
 }
 onClick = (e) => {
  super.onClick(e), ScreenshotManager.getInstance().takeScreenshot();
 };
}
class TouchControlAction extends BaseGameBarAction {
 $content;
 constructor() {
  super();
  let $btnEnable = createButton({
   style: 8,
   icon: BxIcon.TOUCH_CONTROL_ENABLE,
   title: t("show-touch-controller"),
   onClick: this.onClick
  }), $btnDisable = createButton({
   style: 8,
   icon: BxIcon.TOUCH_CONTROL_DISABLE,
   title: t("hide-touch-controller"),
   onClick: this.onClick,
   classes: ["bx-activated"]
  });
  this.$content = CE("div", !1, $btnEnable, $btnDisable);
 }
 onClick = (e) => {
  super.onClick(e);
  let isVisible = TouchController.toggleVisibility();
  this.$content.dataset.activated = (!isVisible).toString();
 };
 reset() {
  this.$content.dataset.activated = "false";
 }
}
class MicrophoneAction extends BaseGameBarAction {
 $content;
 constructor() {
  super();
  let $btnDefault = createButton({
   style: 8,
   icon: BxIcon.MICROPHONE,
   onClick: this.onClick,
   classes: ["bx-activated"]
  }), $btnMuted = createButton({
   style: 8,
   icon: BxIcon.MICROPHONE_MUTED,
   onClick: this.onClick
  });
  this.$content = CE("div", !1, $btnMuted, $btnDefault), BxEventBus.Stream.on("microphone.state.changed", (payload) => {
   let enabled = payload.state === "Enabled";
   this.$content.dataset.activated = enabled.toString(), this.$content.classList.remove("bx-gone");
  });
 }
 onClick = (e) => {
  super.onClick(e);
  let enabled = MicrophoneShortcut.toggle(!1);
  this.$content.dataset.activated = enabled.toString();
 };
 reset() {
  this.$content.classList.add("bx-gone"), this.$content.dataset.activated = "false";
 }
}
class TrueAchievementsAction extends BaseGameBarAction {
 $content;
 constructor() {
  super();
  this.$content = createButton({
   style: 8,
   icon: BxIcon.TRUE_ACHIEVEMENTS,
   onClick: this.onClick
  });
 }
 onClick = (e) => {
  super.onClick(e), TrueAchievements.getInstance().open(!1);
 };
}
class SpeakerAction extends BaseGameBarAction {
 $content;
 constructor() {
  super();
  let $btnEnable = createButton({
   style: 8,
   icon: BxIcon.AUDIO,
   onClick: this.onClick
  }), $btnMuted = createButton({
   style: 8,
   icon: BxIcon.SPEAKER_MUTED,
   onClick: this.onClick,
   classes: ["bx-activated"]
  });
  this.$content = CE("div", !1, $btnEnable, $btnMuted), BxEventBus.Stream.on("speaker.state.changed", (payload) => {
   let enabled = payload.state === 0;
   this.$content.dataset.activated = (!enabled).toString();
  });
 }
 onClick = (e) => {
  super.onClick(e), SoundShortcut.muteUnmute();
 };
 reset() {
  this.$content.dataset.activated = "false";
 }
}
class RendererAction extends BaseGameBarAction {
 $content;
 constructor() {
  super();
  let $btnDefault = createButton({
   style: 8,
   icon: BxIcon.EYE,
   onClick: this.onClick
  }), $btnActivated = createButton({
   style: 8,
   icon: BxIcon.EYE_SLASH,
   onClick: this.onClick,
   classes: ["bx-activated"]
  });
  this.$content = CE("div", !1, $btnDefault, $btnActivated), BxEventBus.Stream.on("video.visibility.changed", (payload) => {
   this.$content.dataset.activated = (!payload.isVisible).toString();
  });
 }
 onClick = (e) => {
  super.onClick(e), RendererShortcut.toggleVisibility();
 };
 reset() {
  this.$content.dataset.activated = "false";
 }
}
class GameBar {
 static instance;
 static getInstance() {
  if (typeof GameBar.instance > "u") if (getGlobalPref("gameBar.position") !== "off") GameBar.instance = new GameBar;
   else GameBar.instance = null;
  return GameBar.instance;
 }
 LOG_TAG = "GameBar";
 static VISIBLE_DURATION = 2000;
 $gameBar;
 $container;
 timeoutId = null;
 actions = [];
 constructor() {
  BxLogger.info(this.LOG_TAG, "constructor()");
  let $container, position = getGlobalPref("gameBar.position"), $gameBar = CE("div", { id: "bx-game-bar", class: "bx-gone", "data-position": position }, $container = CE("div", { class: "bx-game-bar-container bx-offscreen" }), createSvgIcon(position === "bottom-left" ? BxIcon.CARET_RIGHT : BxIcon.CARET_LEFT));
  if (this.actions = [
   new ScreenshotAction,
   ...STATES.userAgent.capabilities.touch && getGlobalPref("touchController.mode") !== "off" ? [new TouchControlAction] : [],
   new SpeakerAction,
   new RendererAction,
   new MicrophoneAction,
   new TrueAchievementsAction
  ], position === "bottom-right")
   this.actions.reverse();
  for (let action of this.actions)
   $container.appendChild(action.render());
  $gameBar.addEventListener("click", (e) => {
   if (e.target !== $gameBar) return;
   $container.classList.contains("bx-show") ? this.hideBar() : this.showBar();
  }), BxEventBus.Stream.on("gameBar.activated", this.hideBar), $container.addEventListener("pointerover", this.clearHideTimeout), $container.addEventListener("pointerout", this.beginHideTimeout), $container.addEventListener("transitionend", (e) => {
   $container.classList.replace("bx-hide", "bx-offscreen");
  }), document.documentElement.appendChild($gameBar), this.$gameBar = $gameBar, this.$container = $container, position !== "off" && window.addEventListener(BxEvent.XCLOUD_POLLING_MODE_CHANGED, ((e) => {
   if (STATES.isPlaying) window.BX_STREAM_SETTINGS.xCloudPollingMode !== "none" ? this.disable() : this.enable();
  }).bind(this));
 }
 beginHideTimeout = () => {
  this.clearHideTimeout(), this.timeoutId = window.setTimeout(() => {
   this.timeoutId = null, this.hideBar();
  }, GameBar.VISIBLE_DURATION);
 };
 clearHideTimeout = () => {
  this.timeoutId && clearTimeout(this.timeoutId), this.timeoutId = null;
 };
 enable() {
  this.$gameBar.classList.remove("bx-gone");
 }
 disable() {
  this.hideBar(), this.$gameBar.classList.add("bx-gone");
 }
 showBar() {
  this.$container.classList.remove("bx-offscreen", "bx-hide", "bx-gone"), this.$container.classList.add("bx-show"), this.beginHideTimeout();
 }
 hideBar = () => {
  this.clearHideTimeout(), this.$container.classList.replace("bx-show", "bx-hide");
 };
 reset() {
  for (let action of this.actions)
   action.reset();
 }
}
class HubGameLaunchAnimation {
 static isReplayingClick = !1;
 static setup() {
  document.addEventListener("click", HubGameLaunchAnimation.onGameCardClick, !0);
 }
 static onGameCardClick = (event) => {
  if (HubGameLaunchAnimation.isReplayingClick || event.defaultPrevented || !HubGameLaunchAnimation.isHubPage()) return;
  let target = event.target;
  if (!(target instanceof Element)) return;
  let $card = target.closest('button[class*="MruGameCard"], a[class*="GameCard"], a[class*="GameItem"]');
  if (!$card) return;
  event.preventDefault(), event.stopImmediatePropagation(), $card.classList.add("bx-hub-game-launching"), document.documentElement.dataset.bxGameLaunching = "true";
  let duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
  window.setTimeout(() => {
   document.documentElement.removeAttribute("data-bx-game-launching"), HubGameLaunchAnimation.isReplayingClick = !0, target.dispatchEvent(new MouseEvent("click", {
    bubbles: !0,
    cancelable: !0,
    view: window
   })), HubGameLaunchAnimation.isReplayingClick = !1;
  }, duration);
 };
 static isHubPage() {
  return /\/play\/?$/i.test(window.location.pathname);
 }
}
class ProductDetailsPage {
 static $btnShortcut = AppInterface && createButton({
  icon: BxIcon.CREATE_SHORTCUT,
  label: t("create-shortcut"),
  style: 64,
  onClick: (e) => {
   AppInterface.createShortcut(window.location.pathname.substring(6));
  }
 });
 static $btnWallpaper = AppInterface && createButton({
  icon: BxIcon.DOWNLOAD,
  label: t("wallpaper"),
  style: 64,
  onClick: (e) => {
   let details = parseDetailsPath(window.location.pathname);
   details && AppInterface.downloadWallpapers(details.titleSlug, details.productId);
  }
 });
 static injectTimeoutId = null;
 static injectButtons() {
  document.documentElement.dataset.bxProductDetails = "true", ProductDetailsPage.injectTimeoutId && clearTimeout(ProductDetailsPage.injectTimeoutId), ProductDetailsPage.injectTimeoutId = window.setTimeout(() => {
   let { productId } = parseDetailsPath(window.location.pathname), $inputsContainer = document.querySelector('div[class*="Header-module__gamePassAndInputsContainer"]');
   if ($inputsContainer && !$inputsContainer.dataset.bxInjected) {
    if ($inputsContainer.dataset.bxInjected = "true", LocalCoOpManager.getInstance().isSupported(productId || "")) $inputsContainer.insertAdjacentElement("afterend", CE("div", {
      class: "bx-product-details-icons bx-frosted"
     }, createSvgIcon(BxIcon.LOCAL_CO_OP), t("local-co-op")));
   }
   let $container = document.querySelector("div[class*=ActionButtons-module__container]");
   if (AppInterface) {
    if ($container && $container.parentElement) $container.parentElement.appendChild(CE("div", {
      class: "bx-product-details-buttons"
     }, ["android-handheld", "android"].includes(BX_FLAGS.DeviceInfo.deviceType) && ProductDetailsPage.$btnShortcut, ProductDetailsPage.$btnWallpaper));
   }
  }, 500);
 }
}
class KeyboardShortcutHandler {
 static instance;
 static getInstance = () => KeyboardShortcutHandler.instance ?? (KeyboardShortcutHandler.instance = new KeyboardShortcutHandler);
 start() {
  window.addEventListener("keydown", this.onKeyDown);
 }
 stop() {
  window.removeEventListener("keydown", this.onKeyDown);
 }
 onKeyDown = (e) => {
  if (window.BX_STREAM_SETTINGS.xCloudPollingMode !== "none") return;
  if (e.repeat) return;
  let fullKeyCode = KeyHelper.getFullKeyCodeFromEvent(e);
  if (!fullKeyCode) return;
  let action = window.BX_STREAM_SETTINGS.keyboardShortcuts?.[fullKeyCode];
  if (action) e.preventDefault(), e.stopPropagation(), ShortcutHandler.runAction(action);
 };
}
var VIBRATION_DATA_MAP = {
 gamepadIndex: 8,
 leftMotorPercent: 8,
 rightMotorPercent: 8,
 leftTriggerMotorPercent: 8,
 rightTriggerMotorPercent: 8,
 durationMs: 16
};
class DeviceVibrationManager {
 static instance;
 static getInstance() {
  if (typeof DeviceVibrationManager.instance > "u") if (STATES.browser.capabilities.deviceVibration) DeviceVibrationManager.instance = new DeviceVibrationManager;
   else DeviceVibrationManager.instance = null;
  return DeviceVibrationManager.instance;
 }
 dataChannel = null;
 boundOnMessage;
 constructor() {
  this.boundOnMessage = this.onMessage.bind(this), BxEventBus.Stream.on("dataChannelCreated", (payload) => {
   let { dataChannel } = payload;
   if (dataChannel?.label === "input") this.reset(), this.dataChannel = dataChannel, this.setupDataChannel();
  }), BxEventBus.Stream.on("deviceVibration.updated", () => this.setupDataChannel());
 }
 setupDataChannel() {
  if (!this.dataChannel) return;
  if (this.removeEventListeners(), window.BX_STREAM_SETTINGS.deviceVibrationIntensity > 0) this.dataChannel.addEventListener("message", this.boundOnMessage);
 }
 playVibration(data) {
  let vibrationIntensity = StreamSettings.settings.deviceVibrationIntensity;
  if (AppInterface) {
   AppInterface.vibrate(JSON.stringify(data), vibrationIntensity);
   return;
  }
  let realIntensity = Math.min(100, data.leftMotorPercent + data.rightMotorPercent / 2) * vibrationIntensity;
  if (realIntensity === 0 || realIntensity === 100) {
   window.navigator.vibrate(realIntensity ? data.durationMs : 0);
   return;
  }
  let pulseDuration = 200, onDuration = Math.floor(pulseDuration * realIntensity / 100), offDuration = pulseDuration - onDuration, repeats = Math.ceil(data.durationMs / pulseDuration), pulses = Array(repeats).fill([onDuration, offDuration]).flat();
  window.navigator.vibrate(pulses);
 }
 onMessage(e) {
  if (typeof e !== "object" || !(e.data instanceof ArrayBuffer)) return;
  let dataView = new DataView(e.data), offset = 0, messageType;
  if (dataView.byteLength === 13) messageType = dataView.getUint16(offset, !0), offset += Uint16Array.BYTES_PER_ELEMENT;
  else messageType = dataView.getUint8(offset), offset += Uint8Array.BYTES_PER_ELEMENT;
  if (!(messageType & 128)) return;
  let vibrationType = dataView.getUint8(offset);
  if (offset += Uint8Array.BYTES_PER_ELEMENT, vibrationType !== 0) return;
  let data = {}, key;
  for (key in VIBRATION_DATA_MAP)
   if (VIBRATION_DATA_MAP[key] === 16) data[key] = dataView.getUint16(offset, !0), offset += Uint16Array.BYTES_PER_ELEMENT;
   else data[key] = dataView.getUint8(offset), offset += Uint8Array.BYTES_PER_ELEMENT;
  this.playVibration(data);
 }
 removeEventListeners() {
  try {
   this.dataChannel?.removeEventListener("message", this.boundOnMessage);
  } catch (e) {}
 }
 reset() {
  this.removeEventListeners(), this.dataChannel = null;
 }
}
var nativeRequestFullscreen2 = HTMLElement.prototype.requestFullscreen, nativeExitFullscreen2 = Document.prototype.exitFullscreen, nativeFullscreenElementGetter2 = (() => {
 let prototype = document;
 while (prototype = Object.getPrototypeOf(prototype)) {
  let descriptor = Object.getOwnPropertyDescriptor(prototype, "fullscreenElement");
  if (descriptor?.get) return descriptor.get;
 }
})();
class StreamUiHandler {
 static $btnStreamSettings;
 static $btnStreamStats;
 static $btnStreamFullscreen;
 static $btnRefresh;
 static $btnHome;
 static cloneStreamHudButton($btnOrg, label, svgIcon) {
  if (!$btnOrg) return null;
  let $container = $btnOrg.cloneNode(!0), timeout;
  if (STATES.browser.capabilities.touch) {
   let onTransitionStart = (e) => {
    if (e.propertyName !== "opacity") return;
    timeout && clearTimeout(timeout), e.target.style.pointerEvents = "none";
   }, onTransitionEnd = (e) => {
    if (e.propertyName !== "opacity") return;
    let $streamHud = e.target.closest("#StreamHud");
    if (!$streamHud) return;
    if ($streamHud.style.left === "0px") {
     let $target = e.target;
     timeout && clearTimeout(timeout), timeout = window.setTimeout(() => {
      $target.style.pointerEvents = "auto";
     }, 100);
    }
   };
   $container.addEventListener("transitionstart", onTransitionStart), $container.addEventListener("transitionend", onTransitionEnd);
  }
  let $button = $container.querySelector("button");
  if (!$button) return null;
  $button.setAttribute("title", label);
  let $orgSvg = $button.querySelector("svg");
  if (!$orgSvg) return null;
  let $svg = createSvgIcon(svgIcon);
  return $svg.style.fill = "none", $svg.setAttribute("class", $orgSvg.getAttribute("class") || ""), $svg.ariaHidden = "true", $orgSvg.replaceWith($svg), $container;
 }
 static cloneCloseButton($btnOrg, icon, className, onChange) {
  if (!$btnOrg) return null;
  let $btn = $btnOrg.cloneNode(!0), $svg = createSvgIcon(icon);
  return $svg.setAttribute("class", $btn.firstElementChild.getAttribute("class") || ""), $svg.style.fill = "none", $btn.classList.add(className), $btn.removeChild($btn.firstElementChild), $btn.appendChild($svg), $btn.addEventListener("click", onChange), $btn;
 }
 static async handleStreamMenu() {
  let $btnCloseHud = document.querySelector("button[class*=StreamMenu-module__backButton]");
  if (!$btnCloseHud) return;
  let { $btnRefresh, $btnHome } = StreamUiHandler;
  if (typeof $btnRefresh > "u") $btnRefresh = StreamUiHandler.cloneCloseButton($btnCloseHud, BxIcon.REFRESH, "bx-stream-refresh-button", () => {
    confirm(t("confirm-reload-stream")) && window.location.reload();
   });
  if (typeof $btnHome > "u") $btnHome = StreamUiHandler.cloneCloseButton($btnCloseHud, BxIcon.HOME, "bx-stream-home-button", () => {
    confirm(t("back-to-home-confirm")) && (window.location.href = window.location.href.substring(0, 31));
   });
  if ($btnRefresh && $btnHome) $btnCloseHud.insertAdjacentElement("afterend", $btnRefresh), $btnRefresh.insertAdjacentElement("afterend", $btnHome);
  document.querySelector("div[class*=StreamMenu-module__menuContainer] > div[class*=Menu-module]")?.appendChild(await StreamBadges.getInstance().render());
 }
 static handleSystemMenu($streamHud) {
  let $orgButton = $streamHud.querySelector("div[class^=HUDButton]");
  if (!$orgButton) return;
  if (StreamUiHandler.$btnStreamSettings && $streamHud.contains(StreamUiHandler.$btnStreamSettings)) return;
  let hideGripHandle = () => {
   let $gripHandle = document.querySelector("#StreamHud button[class^=GripHandle]");
   if ($gripHandle && $gripHandle.ariaExpanded === "true") $gripHandle.dispatchEvent(new PointerEvent("pointerdown")), $gripHandle.click(), $gripHandle.dispatchEvent(new PointerEvent("pointerdown")), $gripHandle.click();
  }, $btnStreamSettings = StreamUiHandler.$btnStreamSettings;
  if (typeof $btnStreamSettings > "u") $btnStreamSettings = StreamUiHandler.cloneStreamHudButton($orgButton, t("better-xcloud"), BxIcon.BETTER_XCLOUD), $btnStreamSettings?.addEventListener("click", (e) => {
    hideGripHandle(), e.preventDefault(), SettingsDialog.getInstance().show();
   }), StreamUiHandler.$btnStreamSettings = $btnStreamSettings;
  let streamStats = StreamStats.getInstance(), $btnStreamStats = StreamUiHandler.$btnStreamStats;
  if (typeof $btnStreamStats > "u") $btnStreamStats = StreamUiHandler.cloneStreamHudButton($orgButton, t("stream-stats"), BxIcon.STREAM_STATS), $btnStreamStats?.addEventListener("click", async (e) => {
    hideGripHandle(), e.preventDefault(), await streamStats.toggle();
    let btnStreamStatsOn = !streamStats.isHidden() && !streamStats.isGlancing();
    $btnStreamStats.classList.toggle("bx-stream-menu-button-on", btnStreamStatsOn);
   }), StreamUiHandler.$btnStreamStats = $btnStreamStats;
  let syncFullscreenButton = () => {
   let $button = StreamUiHandler.$btnStreamFullscreen;
   if (!$button) return;
   let isFullscreen = nativeFullscreenElementGetter2?.call(document) === document.documentElement, label = isFullscreen ? t("exit-fullscreen") : t("fullscreen");
   $button.classList.toggle("bx-stream-menu-button-on", isFullscreen), $button.querySelector("button")?.setAttribute("title", label), $button.querySelector("button")?.setAttribute("aria-label", label);
  }, $btnStreamFullscreen = StreamUiHandler.$btnStreamFullscreen;
  if (typeof $btnStreamFullscreen > "u") $btnStreamFullscreen = StreamUiHandler.cloneStreamHudButton($orgButton, t("fullscreen"), BxIcon.DISPLAY), $btnStreamFullscreen?.addEventListener("click", async (e) => {
    e.preventDefault(), e.stopPropagation();
    try {
     if (nativeFullscreenElementGetter2?.call(document) === document.documentElement) await nativeExitFullscreen2.call(document);
     else await nativeRequestFullscreen2.call(document.documentElement);
    } catch {}
    syncFullscreenButton();
   }), document.addEventListener("fullscreenchange", syncFullscreenButton), StreamUiHandler.$btnStreamFullscreen = $btnStreamFullscreen;
  let $btnParent = $orgButton.parentElement;
  if ($btnStreamSettings && $btnStreamStats) {
   let btnStreamStatsOn = !streamStats.isHidden() && !streamStats.isGlancing();
   $btnStreamStats.classList.toggle("bx-stream-menu-button-on", btnStreamStatsOn), $btnParent.insertBefore($btnStreamStats, $btnParent.lastElementChild), $btnParent.insertBefore($btnStreamSettings, $btnStreamStats), $btnStreamFullscreen && $btnParent.insertBefore($btnStreamFullscreen, $btnStreamStats), syncFullscreenButton();
  }
  let $dotsButton = $btnParent.lastElementChild;
  $dotsButton.parentElement.insertBefore($dotsButton, $dotsButton.parentElement.firstElementChild);
 }
 static reset() {
  StreamUiHandler.$btnStreamSettings = void 0, StreamUiHandler.$btnStreamStats = void 0, StreamUiHandler.$btnStreamFullscreen = void 0, StreamUiHandler.$btnRefresh = void 0, StreamUiHandler.$btnHome = void 0;
 }
}
function handleDeepLink() {
 let deepLinkData = JSON.parse(AppInterface.getDeepLinkData());
 if (console.log("deepLinkData", deepLinkData), !deepLinkData.host) return;
 let onReady = () => {
  if (deepLinkData.host === "PLAY") localRedirect("/launch/" + deepLinkData.data.join("/"));
  else if (deepLinkData.host === "DEVICE_CODE") localRedirect("/login/deviceCode");
  else if (deepLinkData.host === "REMOTE_PLAY") {
   let serverId = deepLinkData.data[0], resolution = deepLinkData.data[1] || "1080p", manager = RemotePlayManager.getInstance();
   if (!manager) return;
   if (manager.isReady()) {
    manager.play(serverId, resolution);
    return;
   }
   window.addEventListener(BxEvent.REMOTE_PLAY_READY, () => {
    manager.play(serverId, resolution);
   });
  }
 }, handled = !1, observer = new MutationObserver((mutationList) => {
  mutationList.forEach((mutation) => {
   if (handled || mutation.type !== "childList") return;
   let $target = mutation.target;
   if (!handled && $target.className && $target.className.startsWith && $target.className.includes("HomePage-module__homePage")) {
    handled = !0, observer.disconnect(), setTimeout(onReady, 1000);
    return;
   }
  });
 });
 observer.observe(document.documentElement, { subtree: !0, childList: !0 });
}
class VxOverlay {
 static instance;
 static getInstance = () => this.instance ?? (this.instance = new VxOverlay);
 show() {}
 destroy() {}
}
class CloudKeepAlive {
 static observer;
 static lastConfirmationAt = 0;
 static initialize() {
  if (CloudKeepAlive.observer) return;
  CloudKeepAlive.observer = new MutationObserver(() => CloudKeepAlive.confirmInactivityPrompt()), CloudKeepAlive.observer.observe(document.documentElement, { childList: !0, subtree: !0 }), CloudKeepAlive.confirmInactivityPrompt();
 }
 static confirmInactivityPrompt() {
  if (!getGlobalPref("stream.cloud.keepAlive") || !window.location.pathname.includes("/play/launch/")) return;
  let $button = [...document.querySelectorAll("button")].find((button) => {
   let text = button.textContent?.trim().toLocaleLowerCase() || "";
   return text === "ainda estou aqui" || text === "i'm still here" || text === "i am still here";
  });
  if (!$button || $button.disabled) return;
  let now = Date.now();
  if (now - CloudKeepAlive.lastConfirmationAt < 2000) return;
  CloudKeepAlive.lastConfirmationAt = now, $button.click(), Toast.show(t("cloud-session-kept-alive"), "✓", { instant: !0 });
 }
}
class WelcomeTutorial {
 static STORAGE_VALUE = "12";
 static replayListenerRegistered = !1;
 static lockedElements = new Map;
 static setup() {
  if (!WelcomeTutorial.replayListenerRegistered) WelcomeTutorial.replayListenerRegistered = !0, window.addEventListener(BxEvent.SHOW_WELCOME_TUTORIAL, () => {
    WelcomeTutorial.clearHighlightAndFocus(), window.setTimeout(() => WelcomeTutorial.render(), 250);
   });
  if (window.localStorage.getItem("BetterXcloud.Tutorial.Dismissed") === WelcomeTutorial.STORAGE_VALUE) return;
  let show = () => window.setTimeout(() => WelcomeTutorial.render(), 350);
  if (document.body) show();
  else window.addEventListener("DOMContentLoaded", show, { once: !0 });
 }
 static render() {
  if (document.querySelector(".bx-welcome-tutorial")) return;
  let steps = [
   { title: "tutorial-intro-title", body: "tutorial-intro-body", showMenu: !1 },
   { title: "tutorial-about-title", body: "tutorial-about-body", tab: "global", showMenu: !0 },
   { title: "tutorial-server-title", body: "tutorial-server-body", tab: "global", pref: "server.region" },
   { title: "tutorial-stream-title", body: "tutorial-stream-body", tab: "global", pref: "stream.video.resolution" },
   { title: "tutorial-image-title", body: "tutorial-image-body", tab: "stream", pref: "video.processing.sharpness" },
   { title: "tutorial-vx-title", body: "tutorial-vx-body", tab: "vx", pref: "vx.upscale.target" },
   { title: "tutorial-controls-title", body: "tutorial-controls-body", tab: "controller" },
   { title: "tutorial-controller-navigation-title", body: "tutorial-controller-navigation-body", tab: "controller", controllerIcons: !0 },
   { title: "tutorial-stats-title", body: "tutorial-stats-body", tab: "stats", pref: "stats.showWhenPlaying" },
   { title: "tutorial-explore-title", body: "tutorial-explore-body", showMenu: !1 }
  ], step = 0, settingsShown = !1, $title = CE("h2", !1, ""), $body = CE("p", !1, ""), $progress = CE("div", { class: "bx-welcome-tutorial-progress" }), $continue = createButton({
   label: t("tutorial-continue"),
   style: 1 | 64 | 4096
  }), $back = createButton({
   label: t("tutorial-back"),
   style: 16 | 64 | 4096
  }), $backdrop = CE("div", { class: "bx-welcome-tutorial-backdrop" }), $overlay = CE("div", { class: "bx-welcome-tutorial" }, CE("div", { class: "bx-welcome-tutorial-card" }, CE("span", { class: "bx-welcome-tutorial-kicker" }, "BETTER XCLOUD PLUS"), $title, $body, $progress, CE("div", { class: "bx-welcome-tutorial-actions" }, createButton({
   label: t("tutorial-skip"),
   style: 8 | 64 | 4096,
   onClick: () => WelcomeTutorial.dismiss($overlay, $backdrop, releaseInputLock)
  }), $back, $continue))), blockKeyboardOutsideTutorial = (event) => {
   if ($overlay.contains(event.target)) {
    event.stopImmediatePropagation();
    return;
   }
   event.preventDefault(), event.stopImmediatePropagation();
  }, keepFocusInTutorial = (event) => {
   if (!$overlay.contains(event.target)) $continue.focus();
  }, releaseInputLock = () => {
   document.removeEventListener("keydown", blockKeyboardOutsideTutorial, !0), document.removeEventListener("keyup", blockKeyboardOutsideTutorial, !0), document.removeEventListener("keypress", blockKeyboardOutsideTutorial, !0), document.removeEventListener("focusin", keepFocusInTutorial, !0), WelcomeTutorial.unlockPage();
  }, update = () => {
   let currentStep = steps[step];
   if ($title.textContent = t(currentStep.title), "controllerIcons" in currentStep && currentStep.controllerIcons) WelcomeTutorial.renderControllerIcons($body);
   else $body.textContent = t(currentStep.body);
   $progress.replaceChildren(...steps.map((_, index) => CE("i", {
    _dataset: { active: index === step, complete: index < step }
   }))), $back.toggleAttribute("disabled", step === 0), $continue.querySelector("span").textContent = t(step === steps.length - 1 ? "tutorial-start" : "tutorial-continue");
   let shouldShowMenu = currentStep.showMenu !== !1;
   if ($overlay.classList.toggle("bx-welcome-tutorial-at-corner", shouldShowMenu), !shouldShowMenu) {
    if (WelcomeTutorial.clearHighlightAndFocus(), settingsShown) settingsShown = !1, WelcomeTutorial.hideSettingsWithAnimation(), window.setTimeout(() => document.body.classList.remove("bx-welcome-tutorial-active"), 230);
    else document.body.classList.remove("bx-welcome-tutorial-active");
    return;
   }
   if (!settingsShown) {
    settingsShown = !0, document.body.classList.add("bx-welcome-tutorial-active"), SettingsDialog.getInstance().show(), window.setTimeout(() => {
     let $dialog = document.querySelector(".bx-settings-dialog");
     $dialog && WelcomeTutorial.lockElement($dialog), WelcomeTutorial.highlight(currentStep.tab, currentStep.pref);
    }, 50);
    return;
   }
   WelcomeTutorial.highlight(currentStep.tab, currentStep.pref);
  };
  $continue.addEventListener("click", () => {
   if (step === steps.length - 1) {
    WelcomeTutorial.dismiss($overlay, $backdrop, releaseInputLock);
    return;
   }
   step++, update();
  }), $back.addEventListener("click", () => {
   if (step === 0) return;
   step--, update();
  }), document.body.append($backdrop, $overlay), WelcomeTutorial.lockPage($overlay, $backdrop), document.addEventListener("keydown", blockKeyboardOutsideTutorial, !0), document.addEventListener("keyup", blockKeyboardOutsideTutorial, !0), document.addEventListener("keypress", blockKeyboardOutsideTutorial, !0), document.addEventListener("focusin", keepFocusInTutorial, !0), $continue.focus(), window.setTimeout(update, 50);
 }
 static renderControllerIcons($body) {
  let icon = (value) => CE("span", {
   class: "bx-welcome-tutorial-gamepad-icon",
   ariaHidden: "true"
  }, value), row = (icons, label) => CE("span", {
   class: "bx-welcome-tutorial-controller-row"
  }, CE("span", { class: "bx-welcome-tutorial-controller-icons" }, ...icons), CE("span", !1, label));
  $body.replaceChildren(row([
   icon("⇻"),
   CE("span", { class: "bx-welcome-tutorial-controller-plus" }, "+"),
   icon("⇺")
  ], t("tutorial-controller-navigation-open-action")), row([
   icon("≺"),
   icon("≻"),
   icon("≽"),
   icon("≼"),
   CE("span", { class: "bx-welcome-tutorial-controller-or" }, "/"),
   icon("⇱")
  ], t("tutorial-controller-navigation-move-action")), row([icon("⇓")], t("tutorial-controller-navigation-select-action")), row([icon("⇒")], t("tutorial-controller-navigation-back-action")), CE("span", { class: "bx-welcome-tutorial-controller-note" }, t("tutorial-controller-navigation-shortcuts-note")));
 }
 static highlight(tab, pref) {
  let $dialog = document.querySelector(".bx-settings-dialog");
  if (!$dialog) return;
  $dialog.querySelectorAll(".bx-tutorial-highlight").forEach(($element) => $element.classList.remove("bx-tutorial-highlight"));
  let $tab = $dialog.querySelector(`.bx-settings-tab[data-group=${tab}]`);
  if ($tab?.dispatchEvent(new Event("click")), $tab?.classList.add("bx-tutorial-highlight"), !pref) return;
  let $row = Array.from($dialog.querySelectorAll(".bx-settings-row")).find(($element) => $element.prefKey === pref);
  if (!$row) return;
  $row.classList.add("bx-tutorial-highlight"), $row.scrollIntoView({ block: "center", behavior: "smooth" });
 }
 static hideSettingsWithAnimation() {
  let $dialog = document.querySelector(".bx-settings-dialog");
  if (!$dialog) {
   SettingsDialog.getInstance().hide();
   return;
  }
  $dialog.classList.add("bx-settings-menu-closing"), window.setTimeout(() => SettingsDialog.getInstance().hide(), 220);
 }
 static clearHighlightAndFocus() {
  document.querySelectorAll(".bx-tutorial-highlight").forEach(($element) => $element.classList.remove("bx-tutorial-highlight"));
  let $activeElement = document.activeElement;
  if ($activeElement instanceof HTMLElement && $activeElement.closest(".bx-settings-dialog")) $activeElement.blur();
 }
 static lockPage($overlay, $backdrop) {
  for (let $element of document.body.children)
   if ($element !== $overlay && $element !== $backdrop) WelcomeTutorial.lockElement($element);
 }
 static lockElement($element) {
  if (!WelcomeTutorial.lockedElements.has($element)) WelcomeTutorial.lockedElements.set($element, $element.hasAttribute("inert")), $element.setAttribute("inert", "");
 }
 static unlockPage() {
  for (let [$element, wasAlreadyInert] of WelcomeTutorial.lockedElements)
   if (!wasAlreadyInert) $element.removeAttribute("inert");
  WelcomeTutorial.lockedElements.clear();
 }
 static dismiss($overlay, $backdrop, releaseInputLock) {
  window.localStorage.setItem("BetterXcloud.Tutorial.Dismissed", WelcomeTutorial.STORAGE_VALUE), document.body.classList.remove("bx-welcome-tutorial-active"), WelcomeTutorial.clearHighlightAndFocus(), releaseInputLock(), $overlay.classList.add("bx-welcome-tutorial-closing"), $backdrop.classList.add("bx-welcome-tutorial-closing"), window.setTimeout(() => {
   $overlay.remove(), $backdrop.remove();
  }, 160);
 }
}
SettingsManager.getInstance();
CloudKeepAlive.initialize();
if (window.location.pathname.includes("/auth/msa")) {
 let nativePushState = window.history.pushState;
 throw window.history.pushState = function(...args) {
  let url = args[2];
  if (url && (url.startsWith("/play") || url.substring(6).startsWith("/play"))) {
   console.log("Redirecting to xbox.com/play"), window.stop(), window.location.href = "https://www.xbox.com" + url;
   return;
  }
  return nativePushState.apply(this, arguments);
 }, Error("[Better xCloud] Refreshing the page after logging in");
}
BxLogger.info("readyState", document.readyState);
if (BX_FLAGS.SafariWorkaround && document.readyState !== "loading") {
 window.stop();
 let css = "";
 css += '.bx-reload-overlay{position:fixed;top:0;bottom:0;left:0;right:0;display:flex;align-items:center;background:rgba(0,0,0,0.8);z-index:9999;color:#fff;text-align:center;font-weight:400;font-family:"Segoe UI",Arial,Helvetica,sans-serif;font-size:1.3rem}.bx-reload-overlay *:focus{outline:none !important}.bx-reload-overlay > div{margin:0 auto}.bx-reload-overlay a{text-decoration:none;display:inline-block;background:#107c10;color:#fff;border-radius:4px;padding:6px}';
 let isSafari = UserAgent.isSafari(), $secondaryAction;
 if (isSafari) $secondaryAction = CE("p", !1, t("settings-reloading"));
 else $secondaryAction = CE("p", !1, "🤓 " + t("how-to-fix"));
 let $fragment = document.createDocumentFragment();
 throw $fragment.appendChild(CE("style", !1, css)), $fragment.appendChild(CE("div", {
  class: "bx-reload-overlay"
 }, CE("div", !1, CE("p", !1, t("load-failed-message")), $secondaryAction))), document.documentElement.appendChild($fragment), isSafari && window.location.reload(!0), Error("[Better xCloud] Executing workaround for Safari");
}
if (!window.location.pathname.match(/^\/[a-zA-Z]{2}-[a-zA-Z]{2}\/play/)) throw Error("[Better xCloud] Not xCloud page");
window.addEventListener("load", (e) => {
 window.setTimeout(() => {
  if (document.body.classList.contains("legacyBackground")) window.stop(), window.location.reload(!0);
 }, 3000);
});
document.addEventListener("readystatechange", (e) => {
 if (document.readyState !== "interactive") return;
 if (STATES.isSignedIn = !!window.xbcUser?.isSignedIn, STATES.isSignedIn) RemotePlayManager.getInstance()?.initialize();
 if (getGlobalPref("ui.hideSections").includes("friends") || getGlobalPref("block.features").includes("friends")) {
  let $parent = document.querySelector("div[class*=PlayWithFriendsSkeleton]")?.closest("div[class*=HomePage-module]");
  $parent && ($parent.style.display = "none");
 }
 preloadFonts();
});
if (AppInterface) window.addEventListener(BxEvent.XCLOUD_ROUTER_HISTORY_READY, (e) => {
  if (window.location.pathname.includes("/fireos-browser-update")) localRedirect("/play");
  else handleDeepLink();
 }, { once: !0 });
window.BX_EXPOSED = BxExposed;
window.addEventListener(BxEvent.OPEN_SETTINGS_MENU, () => {
 SettingsDialog.getInstance().show();
});
NavigationDialogManager.getInstance();
window.addEventListener(BxEvent.POPSTATE, onHistoryChanged);
window.addEventListener("popstate", onHistoryChanged);
window.history.pushState = patchHistoryMethod("pushState");
window.history.replaceState = patchHistoryMethod("replaceState");
BxEventBus.Script.on("ui.header.rendered", () => {
 HeaderSection.getInstance().checkHeader();
});
BxEventBus.Stream.on("state.loading", () => {
 if (window.location.pathname.includes("/launch/") && STATES.currentStream.titleInfo) STATES.currentStream.titleSlug = productTitleToSlug(STATES.currentStream.titleInfo.product.title);
 else STATES.currentStream.titleSlug = "remote-play";
});
(getGlobalPref("loadingScreen.gameArt.show") || getGlobalPref("loadingScreen.rocket")) && BxEventBus.Script.on("titleInfo.ready", LoadingScreen.setup);
BxEventBus.Stream.on("state.starting", () => {
 LoadingScreen.hide();
 {
  let cursorHider = MouseCursorHider.getInstance();
  if (cursorHider) cursorHider.start(), cursorHider.hide();
 }
});
BxEventBus.Stream.on("state.playing", (payload) => {
 window.BX_STREAM_SETTINGS = StreamSettings.settings, StreamSettings.refreshAllSettings(), STATES.isPlaying = !0;
 {
  let gameBar = GameBar.getInstance();
  if (gameBar) gameBar.reset(), gameBar.enable(), gameBar.showBar();
  KeyboardShortcutHandler.getInstance().start();
  let $video = payload.$video;
  if (ScreenshotManager.getInstance().updateCanvasSize($video.videoWidth, $video.videoHeight), getStreamPref("localCoOp.enabled")) BxExposed.toggleLocalCoOp(!0), Toast.show(t("local-co-op"), t("enabled"));
 }
 updateVideoPlayer();
});
BxEventBus.Script.on("ui.error.rendered", () => {
 BxEventBus.Stream.emit("state.stopped", {});
});
BxEventBus.Script.on("ui.guideHome.rendered", () => {
 let $root = document.querySelector("#gamepass-dialog-root div[role=dialog] div[role=tabpanel] div[class*=HomeLandingPage]");
 $root && GuideMenu.getInstance().injectHome($root, STATES.isPlaying);
});
BxEventBus.Script.on("ui.guideAchievementProgress.rendered", () => {
 let $elm = document.querySelector("#gamepass-dialog-root button[class*=AchievementsButton-module__progressBarContainer]");
 if ($elm) TrueAchievements.getInstance().injectAchievementsProgress($elm);
});
BxEventBus.Script.on("ui.guideAchievementDetail.rendered", () => {
 let $elm = document.querySelector("#gamepass-dialog-root div[class^=AchievementDetailPage-module]");
 if ($elm) TrueAchievements.getInstance().injectAchievementDetailPage($elm);
});
BxEventBus.Stream.on("ui.streamMenu.rendered", async () => {
 await StreamUiHandler.handleStreamMenu();
});
BxEventBus.Stream.on("ui.streamHud.rendered", async () => {
 let $elm = document.querySelector("#StreamHud");
 $elm && StreamUiHandler.handleSystemMenu($elm);
});
window.addEventListener(BxEvent.XCLOUD_RENDERING_COMPONENT, (e) => {
 if (e.component === "product-detail") ProductDetailsPage.injectButtons();
});
BxEventBus.Stream.on("dataChannelCreated", (payload) => {
 let { dataChannel } = payload;
 if (dataChannel?.label !== "message") return;
 dataChannel.addEventListener("message", async (msg) => {
  if (msg.origin === "better-xcloud" || typeof msg.data !== "string") return;
  if (!msg.data.includes("/titleinfo")) return;
  let currentStream = STATES.currentStream, json = JSON.parse(JSON.parse(msg.data).content), currentId = currentStream.xboxTitleId ?? null, newId = parseInt(json.titleid, 16);
  if (window.location.pathname.includes("/play/consoles/launch/")) if (currentStream.titleSlug = "remote-play", json.focused) {
    let productTitle = await XboxApi.getProductTitle(newId);
    if (productTitle) currentStream.titleSlug = productTitleToSlug(productTitle);
    else newId = -1;
   } else newId = 0;
  if (currentId !== newId) currentStream.xboxTitleId = newId, BxEventBus.Stream.emit("xboxTitleId.changed", {
    id: newId
   });
 });
});
function unload() {
 if (!STATES.isPlaying) return;
 BxLogger.warning("Unloading"), KeyboardShortcutHandler.getInstance().stop(), EmulatedMkbHandler.getInstance()?.destroy(), NativeMkbHandler.getInstance()?.destroy(), DeviceVibrationManager.getInstance()?.reset(), VxVideoEngine.getInstance().destroy(STATES.currentStream.streamPlayerManager?.getPlayerElement("video")), STATES.currentStream.streamPlayerManager?.destroy(), STATES.isPlaying = !1, STATES.currentStream = {}, window.BX_EXPOSED.shouldShowSensorControls = !1, window.BX_EXPOSED.stopTakRendering = !1, NavigationDialogManager.getInstance().hide(), StreamStats.getInstance().destroy(), StreamBadges.getInstance().destroy(), VxOverlay.getInstance().destroy(), MouseCursorHider.getInstance()?.stop(), TouchController.reset(), GameBar.getInstance()?.disable(), BxEventBus.Stream.emit("xboxTitleId.changed", { id: -1 });
}
BxEventBus.Stream.on("state.stopped", unload);
BxEventBus.Stream.on("state.playing", () => VxOverlay.getInstance().show());
window.addEventListener("pagehide", (e) => {
 BxEventBus.Stream.emit("state.stopped", {});
});
window.addEventListener(BxEvent.CAPTURE_SCREENSHOT, (e) => {
 ScreenshotManager.getInstance().takeScreenshot();
});
function main() {
 if (GhPagesUtils.fetchLatestCommit(), getGlobalPref("nativeMkb.mode") !== "off") {
  let customList = getGlobalPref("nativeMkb.forcedGames");
  BX_FLAGS.ForceNativeMkbTitles.push(...customList);
 }
 if (StreamSettings.setup(), patchRtcPeerConnection(), patchRtcCodecs(), interceptHttpRequests(), patchVideoApi(), patchCanvasContext(), AppInterface && patchPointerLockApi(), getGlobalPref("audio.volume.booster.enabled") && patchAudioContext(), getGlobalPref("block.tracking")) patchMeControl(), disableAdobeAudienceManager();
 if (addCss(), HubGameLaunchAnimation.setup(), WelcomeTutorial.setup(), getGlobalPref("ui.feedbackDialog.disabled")) document.addEventListener("bx-feedback-skipped", () => {
   Toast.show("Avaliação da experiência pulada", "✓", { instant: !0 });
  });
 if (StreamStatsCollector.setupEvents(), StreamBadges.setupEvents(), StreamStats.setupEvents(), WebGPUPlayer.prepare(), STATES.userAgent.capabilities.touch && TouchController.updateCustomList(), DeviceVibrationManager.getInstance(), Patcher.init(), disablePwa(), getGlobalPref("touchController.mode") === "all") TouchController.setup();
 if (AppInterface && (getGlobalPref("mkb.enabled") || getGlobalPref("nativeMkb.mode") === "on")) STATES.pointerServerPort = AppInterface.startPointerServer() || 9269, BxLogger.info("startPointerServer", "Port", STATES.pointerServerPort.toString());
 if (EmulatedMkbHandler.setupEvents(), getGlobalPref("ui.controllerStatus.show")) window.addEventListener("gamepadconnected", (e) => showGamepadToast(e.gamepad)), window.addEventListener("gamepaddisconnected", (e) => showGamepadToast(e.gamepad));
}
main();
