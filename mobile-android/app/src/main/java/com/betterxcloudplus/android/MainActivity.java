package com.betterxcloudplus.android;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Locale;

/**
 * Full-screen Xbox Cloud Gaming wrapper. It deliberately uses the official
 * web experience and injects the local Better xCloud Plus build only into
 * Xbox pages. No account credentials or stream data leave the WebView.
 */
public final class MainActivity extends Activity {
    private static final String XBOX_PLAY_URL = "https://www.xbox.com/pt-BR/play";
    /*
     * Xbox Cloud Gaming intentionally declines the Android WebView user agent
     * (it contains "; wv").  Use the desktop Edge identifier so xbox.com
     * serves the supported web client instead of an empty/black page.
     */
    private static final String XBOX_USER_AGENT =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            + "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0";
    private static final int AUDIO_PERMISSION_REQUEST = 20;

    private WebView webView;
    private String injectedScript;
    private boolean documentStartInjectionAvailable;

    @Override
    @SuppressLint({"SetJavaScriptEnabled", "ObsoleteSdkInt"})
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enableImmersiveMode();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        setContentView(webView);
        webView.addJavascriptInterface(new AndroidBridge(), "BetterXcloudPlusAndroid");

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setUseWideViewPort(false);
        settings.setLoadWithOverviewMode(false);
        settings.setTextZoom(100);
        settings.setOffscreenPreRaster(true);
        settings.setUserAgentString(XBOX_USER_AGENT);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        injectedScript = wrapScript(readAsset("better-xcloud-plus.user.js"));
        installDocumentStartScript();
        webView.setWebChromeClient(new XboxChromeClient());
        webView.setWebViewClient(new XboxWebViewClient());

        if (savedInstanceState == null) {
            webView.loadUrl(XBOX_PLAY_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private void installDocumentStartScript() {
        documentStartInjectionAvailable = WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT);
        if (documentStartInjectionAvailable) {
            WebViewCompat.addDocumentStartJavaScript(
                webView,
                injectedScript,
                Collections.singleton("https://www.xbox.com")
            );
        }
    }

    private String readAsset(String fileName) {
        try (InputStream input = getAssets().open(fileName); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[16 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
            return output.toString(StandardCharsets.UTF_8.name());
        } catch (IOException error) {
            throw new IllegalStateException("Não foi possível carregar o Better xCloud Plus", error);
        }
    }

    private String wrapScript(String script) {
        // The native app is already immersive, so browser fullscreen controls
        // only cause a duplicate action on Android.  Route changes in xCloud
        // are handled as a SPA, therefore notify the activity continuously
        // when the stream launch route becomes active.
        String androidHelper = """
            (() => {
              window.BX_FLAGS = Object.assign(window.BX_FLAGS || {}, {
                DeviceInfo: Object.assign((window.BX_FLAGS || {}).DeviceInfo || {}, {
                  deviceType: 'android-handheld'
                })
              });
              document.documentElement?.setAttribute('data-bx-android-app', 'true');
              const bridge = window.BetterXcloudPlusAndroid;
              let previousStreaming;
              const syncOrientation = () => {
                const streaming = /\\/play\\/(?:consoles\\/)?launch\\//.test(location.pathname);
                if (streaming !== previousStreaming) {
                  previousStreaming = streaming;
                  bridge?.setStreaming(streaming);
                }
              };
              const installStyle = () => {
                const style = document.createElement('style');
                style.textContent = `
                  .bx-hub-fullscreen-button,.bx-stream-fullscreen-button{display:none!important}
                  html[data-bx-android-app=true] { -webkit-tap-highlight-color: transparent; }
                  @media (pointer:coarse) {
                    html[data-bx-android-app=true] .bx-settings-dialog {
                      width:100vw; max-width:100vw; min-height:100dvh; overflow:hidden;
                    }
                    html[data-bx-android-app=true] .bx-settings-tabs-container { width:56px; }
                    html[data-bx-android-app=true] .bx-settings-tabs .bx-settings-tab { min-height:52px; padding:12px; }
                    html[data-bx-android-app=true] .bx-settings-tabs .bx-settings-tab span { display:none; }
                    html[data-bx-android-app=true] .bx-settings-tab-contents {
                      width:calc(100vw - 56px); margin-left:56px; max-height:100dvh;
                      padding-bottom:env(safe-area-inset-bottom);
                    }
                    html[data-bx-android-app=true] .bx-settings-row { gap:12px; padding:14px 12px; }
                    html[data-bx-android-app=true] .bx-settings-row > span.bx-settings-label { font-size:15px; }
                    html[data-bx-android-app=true] .bx-settings-dialog :is(button,select,input) { min-height:40px; }
                    html[data-bx-android-app=true] .bx-number-stepper { min-height:44px; }
                    html[data-bx-android-app=true] .bx-multiple-options { max-width:100%; }
                    html[data-bx-android-app=true] .bx-vx-overlay {
                      right:10px; bottom:calc(10px + env(safe-area-inset-bottom)); max-width:calc(100vw - 20px);
                    }
                  }
                `;
                const target = document.head || document.documentElement;
                if (target) target.appendChild(style);
                else document.addEventListener('DOMContentLoaded', installStyle, { once:true });
              };
              installStyle();
              syncOrientation();
              window.setInterval(syncOrientation, 400);
            })();
            """;

        return androidHelper
            + "\nif (!window.__betterXcloudPlusAndroidInjected) { window.__betterXcloudPlusAndroidInjected = true;\n"
            + script + "\n}";
    }

    private final class AndroidBridge {
        @JavascriptInterface
        public void setStreaming(boolean streaming) {
            runOnUiThread(() -> setRequestedOrientation(streaming
                ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED));
        }
    }

    private void injectFallback(WebView view) {
        if (!documentStartInjectionAvailable && isXboxUrl(view.getUrl())) {
            view.evaluateJavascript(injectedScript, null);
        }
    }

    private boolean isXboxUrl(@Nullable String url) {
        if (url == null) return false;
        Uri uri = Uri.parse(url);
        return isXboxHost(uri.getHost());
    }

    private boolean isXboxHost(@Nullable String host) {
        if (host == null) return false;
        host = host.toLowerCase(Locale.ROOT);
        return host.equals("xbox.com") || host.endsWith(".xbox.com");
    }

    private boolean isAllowedHost(@Nullable String host) {
        if (host == null) return false;
        host = host.toLowerCase(Locale.ROOT);
        return isXboxHost(host)
            || host.equals("microsoft.com") || host.endsWith(".microsoft.com")
            // Microsoft account sign-in moves through this hostname. Keeping it
            // in this WebView preserves the authentication cookies for xbox.com.
            || host.equals("microsoftonline.com") || host.endsWith(".microsoftonline.com")
            || host.equals("live.com") || host.endsWith(".live.com")
            || host.equals("xboxlive.com") || host.endsWith(".xboxlive.com");
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (Exception ignored) {
            // Keep the game screen active if the device has no browser handler.
        }
    }

    private void enableImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) enableImmersiveMode();
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }

    private final class XboxWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isAllowedHost(uri.getHost())) return false;
            openExternal(uri);
            return true;
        }

        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            setRequestedOrientation(isStreamUrl(url)
                ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
            injectFallback(view);
        }

        @Override
        public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
            view.destroy();
            webView = new WebView(MainActivity.this);
            recreate();
            return true;
        }
    }

    private boolean isStreamUrl(@Nullable String url) {
        if (url == null) return false;
        String path = Uri.parse(url).getPath();
        return path != null && (path.contains("/play/launch/") || path.contains("/play/consoles/launch/"));
    }

    private final class XboxChromeClient extends WebChromeClient {
        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(() -> {
                boolean requestsAudio = false;
                for (String resource : request.getResources()) {
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                        requestsAudio = true;
                    }
                }

                if (requestsAudio && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, AUDIO_PERMISSION_REQUEST);
                    return;
                }
                if (requestsAudio) {
                    request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                } else {
                    request.deny();
                }
            });
        }
    }
}
