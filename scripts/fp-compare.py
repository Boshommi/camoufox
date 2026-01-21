#!/usr/bin/env python3
"""
Fingerprint Comparison Script for Camoufox

Compares fingerprints between:
1. Real iOS Safari (via iOS Simulator + Appium)
2. Spoofed Camoufox (via Playwright Firefox driver)

Usage:
    python3 scripts/fp-compare.py [--real-only] [--spoofed-only] [--output path]
"""

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict

# Paths
SCRIPT_DIR = Path(__file__).parent.absolute()
PROJECT_ROOT = SCRIPT_DIR.parent
DETECTOR_JS = PROJECT_ROOT / "services" / "browser-info-generator.js"  # Use browser-info-generator
OUTPUT_DIR = PROJECT_ROOT / ".planning" / "fp"
COMPARISON_FILE = OUTPUT_DIR / "comparison.json"

# Default Camoufox executable path
DEFAULT_CAMOUFOX_EXEC = PROJECT_ROOT / "dist" / "Camoufox.app" / "Contents" / "MacOS" / "camoufox"

# Safari iOS config to spoof (iPhone 15 Pro, iOS 18.3)
SAFARI_IOS_CONFIG = {
    # Navigator properties
    "navigator.userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1",
    "navigator.appCodeName": "Mozilla",
    "navigator.appName": "Netscape",
    "navigator.appVersion": "5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1",
    "navigator.language": "en-US",
    "navigator.platform": "iPhone",
    "navigator.product": "Gecko",
    "navigator.productSub": "20030107",
    "navigator.languages": ["en-US"],
    "navigator.vendor": "Apple Computer, Inc.",
    "navigator.vendorSub": "",
    "navigator.webdriver": False,
    "navigator.userAgentData": False,
    "navigator.hardwareConcurrency": 8,

    # Touch support (critical for iOS Safari detection)
    "navigator.maxTouchPoints": 5,
    "window.TouchEvent": True,

    # Media queries for touch device (critical for iOS Safari detection)
    "mediaQuery:hover": "none",
    "mediaQuery:pointer": "coarse",
    "mediaQuery:any-hover": "none",
    "mediaQuery:any-pointer": "coarse",

    # Hide Firefox-specific navigator properties
    "navigator.buildID:hide": True,
    "navigator.oscpu:hide": True,
    "navigator.doNotTrack:hide": True,
    "navigator.globalPrivacyControl:hide": True,
    "navigator.getBattery:hide": True,
    "navigator.connection:hide": True,
    "window.InstallTrigger:hide": True,

    # Safari-specific APIs
    "window.webkit": False,  # iOS Safari on data: URLs reports false
    "window.safari": False,  # iOS Safari doesn't expose window.safari

    # Hide SharedArrayBuffer (iOS Safari doesn't have it)
    "window.SharedArrayBuffer:hide": True,

    # WebGL spoofing for Safari (using numeric parameter keys)
    # GL_VENDOR = 7937, GL_RENDERER = 7936
    "webGl:parameters": {
        "7937": "WebKit",        # GL_VENDOR
        "7936": "WebKit WebGL",  # GL_RENDERER
    },

    # Screen dimensions (iPhone 15 Pro)
    "screen.width": 393,
    "screen.height": 852,
    "screen.availWidth": 393,
    "screen.availHeight": 852,
    "screen.colorDepth": 24,
    "screen.pixelDepth": 24,

    # Window dimensions (Safari mobile viewport)
    "window.innerWidth": 980,
    "window.innerHeight": 1643,
    "window.outerWidth": 393,
    "window.outerHeight": 852,
    "window.devicePixelRatio": 3,

    # Voices - block all since iOS Safari returns empty on data: URLs
    "voices": [],
    "voices:blockIfNotDefined": True,
}

# Safari macOS config to spoof (for --use-webkit mode)
SAFARI_MACOS_CONFIG = {
    # Navigator properties
    "navigator.userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
    "navigator.appCodeName": "Mozilla",
    "navigator.appName": "Netscape",
    "navigator.appVersion": "5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
    "navigator.language": "en-US",
    "navigator.platform": "MacIntel",
    "navigator.product": "Gecko",
    "navigator.productSub": "20030107",
    "navigator.languages": ["en-US"],
    "navigator.vendor": "Apple Computer, Inc.",
    "navigator.vendorSub": "",
    "navigator.webdriver": False,

    # Firefox-specific APIs to HIDE (Safari doesn't have these)
    "navigator.buildID:hide": True,
    "navigator.oscpu:hide": True,
    "navigator.doNotTrack:hide": True,
    "navigator.globalPrivacyControl:hide": True,
    "navigator.getBattery:hide": True,
    "navigator.connection:hide": True,

    # Chrome-specific APIs to HIDE
    "navigator.userAgentData": False,
    "window.chrome": False,
    "performance.memory": False,

    # Firefox-specific APIs to HIDE
    "window.InstallTrigger:hide": True,

    # Safari-specific APIs - macOS Safari does NOT expose window.webkit (only iOS does)
    "window.webkit": False,
    # macOS Safari has a window.safari object for push notifications
    "window.safari": True,
    # Safari exposes TouchEvent constructor even on non-touch devices
    "window.TouchEvent": True,
    # Safari doesn't expose SharedArrayBuffer in certain configurations
    "window.SharedArrayBuffer:hide": True,

    # WebGL spoofing for Safari
    "webGl:vendor": "Apple Inc.",
    "webGl:renderer": "Apple GPU",

    # Display
    "window.devicePixelRatio": 2,

    # macOS Safari voices (Apple TTS)
    "voices": [
        {"lang": "en-US", "name": "Samantha", "voiceUri": "com.apple.voice.compact.en-US.Samantha", "isDefault": True, "isLocalService": True},
        {"lang": "en-US", "name": "Alex", "voiceUri": "com.apple.speech.synthesis.voice.Alex", "isDefault": True, "isLocalService": True},
        {"lang": "en-US", "name": "Fred", "voiceUri": "com.apple.speech.synthesis.voice.Fred", "isDefault": True, "isLocalService": True},
        {"lang": "en-GB", "name": "Daniel", "voiceUri": "com.apple.voice.compact.en-GB.Daniel", "isDefault": True, "isLocalService": True},
        {"lang": "en-AU", "name": "Karen", "voiceUri": "com.apple.voice.compact.en-AU.Karen", "isDefault": True, "isLocalService": True},
        {"lang": "de-DE", "name": "Anna", "voiceUri": "com.apple.voice.compact.de-DE.Anna", "isDefault": True, "isLocalService": True},
        {"lang": "es-ES", "name": "Monica", "voiceUri": "com.apple.voice.compact.es-ES.Monica", "isDefault": True, "isLocalService": True},
        {"lang": "fr-FR", "name": "Thomas", "voiceUri": "com.apple.voice.compact.fr-FR.Thomas", "isDefault": True, "isLocalService": True},
        {"lang": "it-IT", "name": "Alice", "voiceUri": "com.apple.voice.compact.it-IT.Alice", "isDefault": True, "isLocalService": True},
        {"lang": "ja-JP", "name": "Kyoko", "voiceUri": "com.apple.voice.compact.ja-JP.Kyoko", "isDefault": True, "isLocalService": True},
        {"lang": "ko-KR", "name": "Yuna", "voiceUri": "com.apple.voice.compact.ko-KR.Yuna", "isDefault": True, "isLocalService": True},
        {"lang": "zh-CN", "name": "Tingting", "voiceUri": "com.apple.voice.compact.zh-CN.Tingting", "isDefault": True, "isLocalService": True},
        {"lang": "pt-BR", "name": "Luciana", "voiceUri": "com.apple.voice.compact.pt-BR.Luciana", "isDefault": True, "isLocalService": True},
        {"lang": "ru-RU", "name": "Milena", "voiceUri": "com.apple.voice.compact.ru-RU.Milena", "isDefault": True, "isLocalService": True},
        {"lang": "nl-NL", "name": "Xander", "voiceUri": "com.apple.voice.compact.nl-NL.Xander", "isDefault": True, "isLocalService": True},
    ],
    "voices:blockIfNotDefined": True,
}

# Default config (iOS Safari)
SAFARI_CONFIG = SAFARI_IOS_CONFIG


def load_detector_js() -> str:
    """Load the fingerprint detector JavaScript."""
    if not DETECTOR_JS.exists():
        raise FileNotFoundError(f"Detector JS not found at {DETECTOR_JS}")
    return DETECTOR_JS.read_text()


def run_detector_in_browser(page, detector_js: str) -> Dict[str, Any]:
    """Inject detector JS and run it in the browser."""
    # Inject the browser-info-generator
    page.evaluate(detector_js)

    # Wait for async operations to complete
    import time
    time.sleep(2)  # Give time for async voice loading etc.

    # Collect fingerprint data using YandexBrowserInfo API
    result = page.evaluate("""
        (async () => {
            const browser = new window.YandexBrowserInfo.BrowserDetector(window);
            const collector = new window.YandexBrowserInfo.FingerprintCollector(window);

            // Collect synchronous data
            const params = {};

            // Navigator properties
            params['navigator.userAgent'] = navigator.userAgent;
            params['navigator.appCodeName'] = navigator.appCodeName;
            params['navigator.appName'] = navigator.appName;
            params['navigator.appVersion'] = navigator.appVersion;
            params['navigator.language'] = navigator.language;
            params['navigator.languages'] = Array.from(navigator.languages || []);
            params['navigator.platform'] = navigator.platform;
            params['navigator.product'] = navigator.product;
            params['navigator.productSub'] = navigator.productSub;
            params['navigator.vendor'] = navigator.vendor;
            params['navigator.vendorSub'] = navigator.vendorSub;
            params['navigator.hardwareConcurrency'] = navigator.hardwareConcurrency;
            params['navigator.maxTouchPoints'] = navigator.maxTouchPoints;
            params['navigator.cookieEnabled'] = navigator.cookieEnabled;
            params['navigator.webdriver'] = navigator.webdriver;
            params['navigator.buildID'] = navigator.buildID;
            params['navigator.oscpu'] = navigator.oscpu;
            params['navigator.doNotTrack'] = navigator.doNotTrack;
            params['navigator.globalPrivacyControl'] = navigator.globalPrivacyControl;
            params['navigator.pdfViewerEnabled'] = navigator.pdfViewerEnabled;

            // Screen properties
            params['screen.width'] = screen.width;
            params['screen.height'] = screen.height;
            params['screen.availWidth'] = screen.availWidth;
            params['screen.availHeight'] = screen.availHeight;
            params['screen.availLeft'] = screen.availLeft;
            params['screen.availTop'] = screen.availTop;
            params['screen.colorDepth'] = screen.colorDepth;
            params['screen.pixelDepth'] = screen.pixelDepth;

            // Window properties
            params['window.innerWidth'] = window.innerWidth;
            params['window.innerHeight'] = window.innerHeight;
            params['window.outerWidth'] = window.outerWidth;
            params['window.outerHeight'] = window.outerHeight;
            params['window.screenX'] = window.screenX;
            params['window.screenY'] = window.screenY;
            params['window.devicePixelRatio'] = window.devicePixelRatio;

            // Browser-specific APIs
            params['window.InstallTrigger'] = typeof window.InstallTrigger !== 'undefined';
            params['window.chrome'] = typeof window.chrome !== 'undefined' && window.chrome !== null;
            params['window.webkit'] = typeof window.webkit !== 'undefined' && window.webkit !== null;
            params['window.safari'] = typeof window.safari !== 'undefined' && window.safari !== null;

            // Touch APIs
            params['touch.maxTouchPoints'] = navigator.maxTouchPoints || 0;
            params['touch.ontouchstart'] = 'ontouchstart' in window;
            params['touch.TouchEvent'] = typeof TouchEvent !== 'undefined';

            // SharedArrayBuffer
            params['hasSharedArrayBuffer'] = typeof SharedArrayBuffer !== 'undefined';

            // Plugins
            params['plugins.count'] = navigator.plugins ? navigator.plugins.length : 0;
            params['plugins.list'] = [];
            if (navigator.plugins) {
                for (let i = 0; i < Math.min(navigator.plugins.length, 10); i++) {
                    const p = navigator.plugins[i];
                    params['plugins.list'].push({
                        name: p.name,
                        description: p.description,
                        filename: p.filename
                    });
                }
            }

            // WebGL
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    params['webgl.vendor'] = gl.getParameter(gl.VENDOR);
                    params['webgl.renderer'] = gl.getParameter(gl.RENDERER);
                    params['webgl.version'] = gl.getParameter(gl.VERSION);
                    params['webgl.shadingLanguageVersion'] = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
                    params['webgl.maxTextureSize'] = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                    params['webgl.maxRenderbufferSize'] = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        params['webgl.unmaskedVendor'] = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                        params['webgl.unmaskedRenderer'] = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    }

                    const extensions = gl.getSupportedExtensions();
                    params['webgl.extensions'] = extensions ? extensions.sort() : [];
                    params['webgl.extensionsCount'] = extensions ? extensions.length : 0;
                }
            } catch (e) {}

            // Media queries
            params['mediaQuery.prefersColorSchemeDark'] = window.matchMedia('(prefers-color-scheme: dark)').matches;
            params['mediaQuery.prefersColorSchemeLight'] = window.matchMedia('(prefers-color-scheme: light)').matches;
            params['mediaQuery.prefersReducedMotion'] = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            params['mediaQuery.hoverHover'] = window.matchMedia('(hover: hover)').matches;
            params['mediaQuery.hoverNone'] = window.matchMedia('(hover: none)').matches;
            params['mediaQuery.pointerFine'] = window.matchMedia('(pointer: fine)').matches;
            params['mediaQuery.pointerCoarse'] = window.matchMedia('(pointer: coarse)').matches;
            params['mediaQuery.anyHoverHover'] = window.matchMedia('(any-hover: hover)').matches;
            params['mediaQuery.anyHoverNone'] = window.matchMedia('(any-hover: none)').matches;
            params['mediaQuery.anyPointerFine'] = window.matchMedia('(any-pointer: fine)').matches;
            params['mediaQuery.anyPointerCoarse'] = window.matchMedia('(any-pointer: coarse)').matches;

            // Timezone
            params['date.timezoneOffset'] = new Date().getTimezoneOffset();

            // Performance memory
            params['performance.memory.jsHeapSizeLimit'] = performance.memory ? performance.memory.jsHeapSizeLimit : null;

            // Voices (async)
            try {
                const synthesis = window.speechSynthesis;
                if (synthesis && synthesis.getVoices) {
                    // Try immediate
                    let voices = synthesis.getVoices();
                    if (!voices || voices.length === 0) {
                        // Wait for voiceschanged
                        await new Promise((resolve) => {
                            const onVoicesChanged = () => {
                                synthesis.removeEventListener('voiceschanged', onVoicesChanged);
                                resolve();
                            };
                            synthesis.addEventListener('voiceschanged', onVoicesChanged);
                            setTimeout(resolve, 1500);
                        });
                        voices = synthesis.getVoices();
                    }
                    params['voices.count'] = voices ? voices.length : 0;
                    params['voices.list'] = voices ? voices.map(v => ({
                        name: v.name,
                        lang: v.lang,
                        localService: v.localService,
                        voiceURI: v.voiceURI,
                        default: v.default
                    })) : [];
                }
            } catch (e) {}

            // Sync fingerprints
            const syncFP = {
                canvas: collector.getCanvasFingerprint(),
                audio: collector.getAudioFingerprint(),
                fonts: collector.getFontFingerprint(),
                plugins: collector.getPluginFingerprint(),
                navigator: collector.getNavigatorFingerprint(),
                voices: collector.getSpeechVoicesFingerprint(),
                touch: collector.getTouchFingerprint(),
                mediaQueries: collector.getMediaQueriesFingerprint(),
                gamepad: collector.getGamepadFingerprint(),
                mediaCodec: collector.getMediaCodecFingerprint(),
                jsHeapLimit: collector.getJsHeapSizeLimitFingerprint(),
                screenAvailable: collector.getScreenAvailableFingerprint(),
                doNotTrack: collector.getDoNotTrackFingerprint(),
                webgl: collector.getWebGLFingerprint(),
                fullFingerprint: collector.generateFullFingerprint(),
                fingerprintHash: collector.generateFingerprintHash()
            };

            // Async fingerprints
            const asyncFP = await window.YandexBrowserInfo.getAsyncDetection();

            // Platform APIs
            const platformAPIs = browser.getPlatformAPIs();

            // Flatten all params into config format expected by comparison
            const config = {...params};

            // Add platform APIs to config
            for (const [key, value] of Object.entries(platformAPIs)) {
                config['platform.' + key] = value;
            }

            return {
                config: config,
                unavailable: [],
                errors: [],
                raw: {
                    params: params,
                    sync: syncFP,
                    async: asyncFP,
                    platform: platformAPIs
                }
            };
        })()
    """)
    return result


def get_spoofed_fingerprint(
    exec_path: str = None,
    config: Dict[str, Any] = None,
    headless: bool = True
) -> Dict[str, Any]:
    """Get fingerprint from Camoufox (spoofed browser)."""
    from camoufox import Camoufox, DefaultAddons

    exec_path = exec_path or str(DEFAULT_CAMOUFOX_EXEC)
    config = config or SAFARI_CONFIG

    if not Path(exec_path).exists():
        raise FileNotFoundError(f"Camoufox executable not found at {exec_path}")

    detector_js = load_detector_js()

    print(f"  Config keys: {list(config.keys())}")
    print(f"  webGl:vendor = {config.get('webGl:vendor')}")
    print(f"  webGl:renderer = {config.get('webGl:renderer')}")

    with Camoufox(
        executable_path=exec_path,
        ff_version=144,
        exclude_addons=[DefaultAddons.UBO],
        os="macos",
        debug=True,
        config=config,
        headless=headless,
        i_know_what_im_doing=True,
    ) as browser:
        page = browser.new_page()
        page.goto("about:blank")
        time.sleep(0.5)  # Let page settle

        result = run_detector_in_browser(page, detector_js)
        page.close()

    return result


def get_real_safari_fingerprint(
    device_name: str = "iPhone 15 Pro",
    ios_version: str = "18.3",
    timeout: int = 60
) -> Dict[str, Any]:
    """Get fingerprint from real iOS Safari via Appium."""
    try:
        from appium import webdriver
        from appium.options.ios import XCUITestOptions
    except ImportError:
        print("ERROR: Appium not installed. Install with: pip install Appium-Python-Client")
        print("Also install XCUITest driver: appium driver install xcuitest")
        sys.exit(1)

    # Check if Appium server is running
    import urllib.request
    try:
        urllib.request.urlopen("http://localhost:4723/status", timeout=5)
    except Exception:
        print("ERROR: Appium server not running. Start with: appium")
        print("If not installed: npm install -g appium && appium driver install xcuitest")
        sys.exit(1)

    detector_js = load_detector_js()

    options = XCUITestOptions()
    options.platform_name = "iOS"
    options.platform_version = ios_version
    options.device_name = device_name
    options.browser_name = "Safari"
    options.automation_name = "XCUITest"
    options.no_reset = True
    # Reuse existing simulator if available
    options.set_capability("useSimulatorNow", True)
    options.set_capability("shouldTerminateApp", True)
    # Increase webview connect timeout (default 6232ms is often not enough)
    options.set_capability("webviewConnectTimeout", 30000)

    driver = None
    try:
        print(f"Connecting to iOS Simulator ({device_name}, iOS {ios_version})...")
        driver = webdriver.Remote("http://localhost:4723", options=options)
        driver.implicitly_wait(5)  # 5 seconds max for element waits
        driver.set_page_load_timeout(10)  # 10 seconds for page loads
        driver.set_script_timeout(5)  # 5 seconds for script execution

        print("Opening data URL page...")
        driver.get("data:text/html,<html><head></head><body></body></html>")

        print("Injecting detector as script element...")
        # Try to catch any errors during script execution
        inject_result = driver.execute_script("""
            try {
                var script = document.createElement('script');
                script.id = 'fp-detector';
                script.textContent = arguments[0];
                // Add error handler
                script.onerror = function(e) { window.__fpScriptError = e.toString(); };
                document.head.appendChild(script);
                return {injected: true, error: null};
            } catch(e) {
                return {injected: false, error: e.toString()};
            }
        """, detector_js)
        print(f"  Script inject result: {inject_result}")

        # Check for errors and detector
        error_check = driver.execute_script("return window.__fpScriptError;")
        if error_check:
            print(f"  Script error: {error_check}")

        # Check for YandexBrowserInfo (from browser-info-generator.js)
        detector_check = driver.execute_script("return typeof window.YandexBrowserInfo;")
        print(f"  YandexBrowserInfo type: {detector_check}")

        if detector_check == 'object':
            print("Running comprehensive fingerprint collection with getAsyncDetection...")
            driver.set_script_timeout(20)
            # Use execute_async_script with Promise.then() for full async detection
            result = driver.execute_async_script("""
                var done = arguments[arguments.length - 1];

                try {
                    var browser = new window.YandexBrowserInfo.BrowserDetector(window);
                    var collector = new window.YandexBrowserInfo.FingerprintCollector(window);
                    var params = {};

                    // Navigator properties
                    params['navigator.userAgent'] = navigator.userAgent;
                    params['navigator.appCodeName'] = navigator.appCodeName;
                    params['navigator.appName'] = navigator.appName;
                    params['navigator.appVersion'] = navigator.appVersion;
                    params['navigator.language'] = navigator.language;
                    params['navigator.languages'] = Array.from(navigator.languages || []);
                    params['navigator.platform'] = navigator.platform;
                    params['navigator.product'] = navigator.product;
                    params['navigator.productSub'] = navigator.productSub;
                    params['navigator.vendor'] = navigator.vendor;
                    params['navigator.vendorSub'] = navigator.vendorSub;
                    params['navigator.hardwareConcurrency'] = navigator.hardwareConcurrency;
                    params['navigator.maxTouchPoints'] = navigator.maxTouchPoints;
                    params['navigator.cookieEnabled'] = navigator.cookieEnabled;
                    params['navigator.webdriver'] = navigator.webdriver;
                    params['navigator.buildID'] = navigator.buildID;
                    params['navigator.oscpu'] = navigator.oscpu;
                    params['navigator.doNotTrack'] = navigator.doNotTrack;
                    params['navigator.globalPrivacyControl'] = navigator.globalPrivacyControl;
                    params['navigator.pdfViewerEnabled'] = navigator.pdfViewerEnabled;

                    // Screen properties
                    params['screen.width'] = screen.width;
                    params['screen.height'] = screen.height;
                    params['screen.availWidth'] = screen.availWidth;
                    params['screen.availHeight'] = screen.availHeight;
                    params['screen.availLeft'] = screen.availLeft;
                    params['screen.availTop'] = screen.availTop;
                    params['screen.colorDepth'] = screen.colorDepth;
                    params['screen.pixelDepth'] = screen.pixelDepth;

                    // Window properties
                    params['window.innerWidth'] = window.innerWidth;
                    params['window.innerHeight'] = window.innerHeight;
                    params['window.outerWidth'] = window.outerWidth;
                    params['window.outerHeight'] = window.outerHeight;
                    params['window.screenX'] = window.screenX;
                    params['window.screenY'] = window.screenY;
                    params['window.devicePixelRatio'] = window.devicePixelRatio;

                    // Browser-specific APIs
                    params['window.InstallTrigger'] = typeof window.InstallTrigger !== 'undefined';
                    params['window.chrome'] = typeof window.chrome !== 'undefined' && window.chrome !== null;
                    params['window.webkit'] = typeof window.webkit !== 'undefined' && window.webkit !== null;
                    params['window.safari'] = typeof window.safari !== 'undefined' && window.safari !== null;

                    // Touch APIs
                    params['touch.maxTouchPoints'] = navigator.maxTouchPoints || 0;
                    params['touch.ontouchstart'] = 'ontouchstart' in window;
                    params['touch.TouchEvent'] = typeof TouchEvent !== 'undefined';

                    // SharedArrayBuffer
                    params['hasSharedArrayBuffer'] = typeof SharedArrayBuffer !== 'undefined';

                    // Plugins
                    params['plugins.count'] = navigator.plugins ? navigator.plugins.length : 0;
                    params['plugins.list'] = [];
                    if (navigator.plugins) {
                        for (var i = 0; i < Math.min(navigator.plugins.length, 10); i++) {
                            var p = navigator.plugins[i];
                            params['plugins.list'].push({
                                name: p.name,
                                description: p.description,
                                filename: p.filename
                            });
                        }
                    }

                    // WebGL
                    try {
                        var canvas = document.createElement('canvas');
                        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                        if (gl) {
                            params['webgl.vendor'] = gl.getParameter(gl.VENDOR);
                            params['webgl.renderer'] = gl.getParameter(gl.RENDERER);
                            params['webgl.version'] = gl.getParameter(gl.VERSION);
                            params['webgl.shadingLanguageVersion'] = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
                            params['webgl.maxTextureSize'] = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                            params['webgl.maxRenderbufferSize'] = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

                            var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                            if (debugInfo) {
                                params['webgl.unmaskedVendor'] = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                                params['webgl.unmaskedRenderer'] = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                            }

                            var extensions = gl.getSupportedExtensions();
                            params['webgl.extensions'] = extensions ? extensions.sort() : [];
                            params['webgl.extensionsCount'] = extensions ? extensions.length : 0;
                        }
                    } catch(e) {}

                    // Media queries
                    params['mediaQuery.prefersColorSchemeDark'] = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    params['mediaQuery.prefersColorSchemeLight'] = window.matchMedia('(prefers-color-scheme: light)').matches;
                    params['mediaQuery.prefersReducedMotion'] = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    params['mediaQuery.hoverHover'] = window.matchMedia('(hover: hover)').matches;
                    params['mediaQuery.hoverNone'] = window.matchMedia('(hover: none)').matches;
                    params['mediaQuery.pointerFine'] = window.matchMedia('(pointer: fine)').matches;
                    params['mediaQuery.pointerCoarse'] = window.matchMedia('(pointer: coarse)').matches;
                    params['mediaQuery.anyHoverHover'] = window.matchMedia('(any-hover: hover)').matches;
                    params['mediaQuery.anyHoverNone'] = window.matchMedia('(any-hover: none)').matches;
                    params['mediaQuery.anyPointerFine'] = window.matchMedia('(any-pointer: fine)').matches;
                    params['mediaQuery.anyPointerCoarse'] = window.matchMedia('(any-pointer: coarse)').matches;

                    // Timezone
                    params['date.timezoneOffset'] = new Date().getTimezoneOffset();

                    // Performance memory
                    params['performance.memory.jsHeapSizeLimit'] = (performance.memory ? performance.memory.jsHeapSizeLimit : null);

                    // Platform APIs from BrowserDetector
                    var platformAPIs = browser.getPlatformAPIs();
                    for (var key in platformAPIs) {
                        params['platform.' + key] = platformAPIs[key];
                    }

                    // Use getAsyncDetection() for all async data (voices, clientHints, webRTC, etc.)
                    window.YandexBrowserInfo.getAsyncDetection().then(function(asyncData) {
                        // Add async detection results
                        if (asyncData.voices) {
                            params['voices.count'] = asyncData.voices.count || 0;
                            params['voices.list'] = asyncData.voices.list || [];
                        }
                        if (asyncData.userAgentClientHints) {
                            params['async.userAgentClientHints'] = asyncData.userAgentClientHints;
                        }
                        if (asyncData.webRTCLocalIP) {
                            params['async.webRTCLocalIP'] = asyncData.webRTCLocalIP;
                        }
                        if (asyncData.cookieDeprecationLabel) {
                            params['async.cookieDeprecationLabel'] = asyncData.cookieDeprecationLabel;
                        }
                        done({config: params, asyncData: asyncData});
                    }).catch(function(e) {
                        // Fallback if getAsyncDetection fails - still return sync data
                        params['voices.count'] = 0;
                        params['voices.list'] = [];
                        done({config: params, error: 'async failed: ' + e.toString()});
                    });
                } catch(e) {
                    done({error: e.toString()});
                }
            """)
        else:
            print("  YandexBrowserInfo not found, using inline fallback...")
            # Comprehensive inline collector that doesn't depend on browser-info-generator
            driver.set_script_timeout(15)
            result = driver.execute_async_script("""
                var done = arguments[arguments.length - 1];

                try {
                    var params = {};

                    // Navigator properties
                    params['navigator.userAgent'] = navigator.userAgent;
                    params['navigator.appCodeName'] = navigator.appCodeName;
                    params['navigator.appName'] = navigator.appName;
                    params['navigator.appVersion'] = navigator.appVersion;
                    params['navigator.language'] = navigator.language;
                    params['navigator.languages'] = Array.from(navigator.languages || []);
                    params['navigator.platform'] = navigator.platform;
                    params['navigator.product'] = navigator.product;
                    params['navigator.productSub'] = navigator.productSub;
                    params['navigator.vendor'] = navigator.vendor;
                    params['navigator.vendorSub'] = navigator.vendorSub;
                    params['navigator.hardwareConcurrency'] = navigator.hardwareConcurrency;
                    params['navigator.maxTouchPoints'] = navigator.maxTouchPoints;
                    params['navigator.cookieEnabled'] = navigator.cookieEnabled;
                    params['navigator.webdriver'] = navigator.webdriver;
                    params['navigator.buildID'] = navigator.buildID;
                    params['navigator.oscpu'] = navigator.oscpu;
                    params['navigator.doNotTrack'] = navigator.doNotTrack;
                    params['navigator.globalPrivacyControl'] = navigator.globalPrivacyControl;
                    params['navigator.pdfViewerEnabled'] = navigator.pdfViewerEnabled;

                    // Screen properties
                    params['screen.width'] = screen.width;
                    params['screen.height'] = screen.height;
                    params['screen.availWidth'] = screen.availWidth;
                    params['screen.availHeight'] = screen.availHeight;
                    params['screen.availLeft'] = screen.availLeft;
                    params['screen.availTop'] = screen.availTop;
                    params['screen.colorDepth'] = screen.colorDepth;
                    params['screen.pixelDepth'] = screen.pixelDepth;

                    // Window properties
                    params['window.innerWidth'] = window.innerWidth;
                    params['window.innerHeight'] = window.innerHeight;
                    params['window.outerWidth'] = window.outerWidth;
                    params['window.outerHeight'] = window.outerHeight;
                    params['window.screenX'] = window.screenX;
                    params['window.screenY'] = window.screenY;
                    params['window.devicePixelRatio'] = window.devicePixelRatio;

                    // Browser-specific APIs
                    params['window.InstallTrigger'] = typeof window.InstallTrigger !== 'undefined';
                    params['window.chrome'] = typeof window.chrome !== 'undefined' && window.chrome !== null;
                    params['window.webkit'] = typeof window.webkit !== 'undefined' && window.webkit !== null;
                    params['window.safari'] = typeof window.safari !== 'undefined' && window.safari !== null;

                    // Touch APIs
                    params['touch.maxTouchPoints'] = navigator.maxTouchPoints || 0;
                    params['touch.ontouchstart'] = 'ontouchstart' in window;
                    params['touch.TouchEvent'] = typeof TouchEvent !== 'undefined';

                    // SharedArrayBuffer
                    params['hasSharedArrayBuffer'] = typeof SharedArrayBuffer !== 'undefined';

                    // Platform APIs (manual detection)
                    params['platform.hasChrome'] = typeof window.chrome !== 'undefined' && window.chrome !== null;
                    params['platform.jsHeapLimit'] = (performance.memory ? performance.memory.jsHeapSizeLimit : null);
                    params['platform.hasPdfViewer'] = (function() {
                        var plugins = navigator.plugins;
                        if (!plugins || !plugins.length) return false;
                        for (var i = 0; i < plugins.length; i++) {
                            if (plugins[i].name && /Chrome PDF Viewer/.test(plugins[i].name)) return true;
                        }
                        return false;
                    })();
                    params['platform.applePay'] = (function() {
                        try {
                            if (!window.ApplePaySession) return null;
                            if (location.protocol !== 'https:') return null;
                            return {available: true, canMakePayments: window.ApplePaySession.canMakePayments ? window.ApplePaySession.canMakePayments() : false};
                        } catch(e) { return null; }
                    })();
                    params['platform.hasInstallTrigger'] = typeof window.InstallTrigger !== 'undefined';
                    params['platform.hasMozAppearance'] = !!(document.documentElement.style && 'MozAppearance' in document.documentElement.style);
                    params['platform.isOpera'] = !!(window.opr || window.opera);
                    params['platform.isBrave'] = !!(navigator.brave && typeof navigator.brave.isBrave === 'function');
                    params['platform.msDoNotTrack'] = navigator.msDoNotTrack || null;
                    params['platform.hasWebkitPerformance'] = !!window.webkitPerformance;
                    params['platform.hasWebkitNotifications'] = !!window.webkitNotifications;
                    params['platform.hasPermissions'] = !!navigator.permissions;
                    params['platform.hasCredentials'] = !!navigator.credentials;
                    params['platform.hasBluetooth'] = !!navigator.bluetooth;
                    params['platform.hasUSB'] = !!navigator.usb;
                    params['platform.hasSerial'] = !!navigator.serial;
                    params['platform.hasSharedArrayBuffer'] = typeof SharedArrayBuffer !== 'undefined';
                    params['platform.hasWebGL2'] = !!window.WebGL2RenderingContext;
                    params['platform.hasOffscreenCanvas'] = !!window.OffscreenCanvas;

                    // Plugins
                    params['plugins.count'] = navigator.plugins ? navigator.plugins.length : 0;
                    params['plugins.list'] = [];
                    if (navigator.plugins) {
                        for (var i = 0; i < Math.min(navigator.plugins.length, 10); i++) {
                            var p = navigator.plugins[i];
                            params['plugins.list'].push({name: p.name, description: p.description, filename: p.filename});
                        }
                    }

                    // WebGL
                    try {
                        var canvas = document.createElement('canvas');
                        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                        if (gl) {
                            params['webgl.vendor'] = gl.getParameter(gl.VENDOR);
                            params['webgl.renderer'] = gl.getParameter(gl.RENDERER);
                            params['webgl.version'] = gl.getParameter(gl.VERSION);
                            params['webgl.shadingLanguageVersion'] = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
                            params['webgl.maxTextureSize'] = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                            params['webgl.maxRenderbufferSize'] = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

                            var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                            if (debugInfo) {
                                params['webgl.unmaskedVendor'] = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                                params['webgl.unmaskedRenderer'] = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                            }

                            var extensions = gl.getSupportedExtensions();
                            params['webgl.extensions'] = extensions ? extensions.sort() : [];
                            params['webgl.extensionsCount'] = extensions ? extensions.length : 0;
                        }
                    } catch(e) {}

                    // Media queries
                    params['mediaQuery.prefersColorSchemeDark'] = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    params['mediaQuery.prefersColorSchemeLight'] = window.matchMedia('(prefers-color-scheme: light)').matches;
                    params['mediaQuery.prefersReducedMotion'] = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    params['mediaQuery.hoverHover'] = window.matchMedia('(hover: hover)').matches;
                    params['mediaQuery.hoverNone'] = window.matchMedia('(hover: none)').matches;
                    params['mediaQuery.pointerFine'] = window.matchMedia('(pointer: fine)').matches;
                    params['mediaQuery.pointerCoarse'] = window.matchMedia('(pointer: coarse)').matches;
                    params['mediaQuery.anyHoverHover'] = window.matchMedia('(any-hover: hover)').matches;
                    params['mediaQuery.anyHoverNone'] = window.matchMedia('(any-hover: none)').matches;
                    params['mediaQuery.anyPointerFine'] = window.matchMedia('(any-pointer: fine)').matches;
                    params['mediaQuery.anyPointerCoarse'] = window.matchMedia('(any-pointer: coarse)').matches;

                    // Timezone
                    params['date.timezoneOffset'] = new Date().getTimezoneOffset();

                    // Performance memory
                    params['performance.memory.jsHeapSizeLimit'] = (performance.memory ? performance.memory.jsHeapSizeLimit : null);

                    // Voices with async loading
                    var synthesis = window.speechSynthesis;
                    if (synthesis && synthesis.getVoices) {
                        var voices = synthesis.getVoices();
                        if (!voices || voices.length === 0) {
                            // Wait for voiceschanged event
                            var resolved = false;
                            var onVoicesChanged = function() {
                                if (resolved) return;
                                resolved = true;
                                synthesis.removeEventListener('voiceschanged', onVoicesChanged);
                                voices = synthesis.getVoices();
                                params['voices.count'] = voices ? voices.length : 0;
                                params['voices.list'] = voices ? voices.map(function(v) {
                                    return {name: v.name, lang: v.lang, localService: v.localService, voiceURI: v.voiceURI};
                                }) : [];
                                done({config: params});
                            };
                            synthesis.addEventListener('voiceschanged', onVoicesChanged);
                            setTimeout(function() {
                                if (!resolved) {
                                    resolved = true;
                                    synthesis.removeEventListener('voiceschanged', onVoicesChanged);
                                    voices = synthesis.getVoices() || [];
                                    params['voices.count'] = voices.length;
                                    params['voices.list'] = voices.map(function(v) {
                                        return {name: v.name, lang: v.lang, localService: v.localService, voiceURI: v.voiceURI};
                                    });
                                    done({config: params});
                                }
                            }, 2000);
                        } else {
                            params['voices.count'] = voices.length;
                            params['voices.list'] = voices.map(function(v) {
                                return {name: v.name, lang: v.lang, localService: v.localService, voiceURI: v.voiceURI};
                            });
                            done({config: params});
                        }
                    } else {
                        params['voices.count'] = 0;
                        params['voices.list'] = [];
                        done({config: params});
                    }
                } catch(e) {
                    done({error: e.toString()});
                }
            """)

        if result:
            if 'error' in result:
                print(f"  JS Error: {result.get('error')}")
            else:
                config = result.get('config', {})
                print(f"  Collected {len(config)} properties")
        else:
            print("  ERROR: Failed to collect fingerprint")

        return result

    finally:
        if driver:
            driver.quit()


def get_real_webkit_fingerprint(headless: bool = True) -> Dict[str, Any]:
    """
    Fallback: Get fingerprint from Playwright WebKit.
    Note: This is NOT real Safari, but useful for comparison.
    """
    from playwright.sync_api import sync_playwright

    detector_js = load_detector_js()

    with sync_playwright() as p:
        browser = p.webkit.launch(headless=headless)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1",
            viewport={"width": 440, "height": 956},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
        )
        page = context.new_page()
        page.goto("about:blank")
        time.sleep(0.5)

        result = run_detector_in_browser(page, detector_js)

        page.close()
        context.close()
        browser.close()

    return result


def compare_fingerprints(
    real: Dict[str, Any],
    spoofed: Dict[str, Any]
) -> Dict[str, Any]:
    """Compare two fingerprint results and identify differences."""
    real_config = real.get("config", {})
    spoofed_config = spoofed.get("config", {})

    # All keys from both
    all_keys = set(real_config.keys()) | set(spoofed_config.keys())

    differences = []
    matches = []
    only_real = []
    only_spoofed = []

    for key in sorted(all_keys):
        in_real = key in real_config
        in_spoofed = key in spoofed_config

        if in_real and in_spoofed:
            real_val = real_config[key]
            spoofed_val = spoofed_config[key]

            if real_val == spoofed_val:
                matches.append({
                    "key": key,
                    "value": real_val
                })
            else:
                differences.append({
                    "key": key,
                    "real": real_val,
                    "spoofed": spoofed_val,
                    "type": type(real_val).__name__
                })
        elif in_real:
            only_real.append({
                "key": key,
                "value": real_config[key]
            })
        else:
            only_spoofed.append({
                "key": key,
                "value": spoofed_config[key]
            })

    return {
        "summary": {
            "total_keys": len(all_keys),
            "matches": len(matches),
            "differences": len(differences),
            "only_in_real": len(only_real),
            "only_in_spoofed": len(only_spoofed),
        },
        "differences": differences,
        "only_in_real": only_real,
        "only_in_spoofed": only_spoofed,
        "matches": matches,
        "metadata": {
            "real_unavailable": real.get("unavailable", []),
            "spoofed_unavailable": spoofed.get("unavailable", []),
            "real_errors": real.get("errors", []),
            "spoofed_errors": spoofed.get("errors", []),
            "detector_version": real.get("detectorVersion", "unknown"),
        }
    }


def print_summary(comparison: Dict[str, Any]):
    """Print a human-readable summary of the comparison."""
    summary = comparison["summary"]
    differences = comparison["differences"]

    print("\n" + "=" * 60)
    print("FINGERPRINT COMPARISON SUMMARY")
    print("=" * 60)
    print(f"Total properties: {summary['total_keys']}")
    print(f"Matches:          {summary['matches']}")
    print(f"Differences:      {summary['differences']}")
    print(f"Only in real:     {summary['only_in_real']}")
    print(f"Only in spoofed:  {summary['only_in_spoofed']}")

    if differences:
        print("\n" + "-" * 60)
        print("DIFFERENCES (Real vs Spoofed):")
        print("-" * 60)
        for diff in differences:
            key = diff["key"]
            real_val = diff["real"]
            spoofed_val = diff["spoofed"]

            # Truncate long values
            real_str = str(real_val)
            spoofed_str = str(spoofed_val)
            if len(real_str) > 50:
                real_str = real_str[:47] + "..."
            if len(spoofed_str) > 50:
                spoofed_str = spoofed_str[:47] + "..."

            print(f"\n{key}:")
            print(f"  Real:    {real_str}")
            print(f"  Spoofed: {spoofed_str}")

    only_real = comparison["only_in_real"]
    if only_real:
        print("\n" + "-" * 60)
        print("ONLY IN REAL SAFARI (missing from spoofed):")
        print("-" * 60)
        for item in only_real:
            print(f"  {item['key']}")

    only_spoofed = comparison["only_in_spoofed"]
    if only_spoofed:
        print("\n" + "-" * 60)
        print("ONLY IN SPOOFED (extra in spoofed):")
        print("-" * 60)
        for item in only_spoofed:
            print(f"  {item['key']}")

    print("\n" + "=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Compare fingerprints between real Safari and spoofed Camoufox"
    )
    parser.add_argument(
        "--real-only",
        action="store_true",
        help="Only collect real Safari fingerprint"
    )
    parser.add_argument(
        "--spoofed-only",
        action="store_true",
        help="Only collect spoofed Camoufox fingerprint"
    )
    parser.add_argument(
        "--use-webkit",
        action="store_true",
        help="Use Playwright WebKit instead of real iOS Safari (faster but less accurate)"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=str(COMPARISON_FILE),
        help="Output file path for comparison JSON"
    )
    parser.add_argument(
        "--exec-path",
        type=str,
        default=str(DEFAULT_CAMOUFOX_EXEC),
        help="Path to Camoufox executable"
    )
    parser.add_argument(
        "--headful",
        action="store_true",
        help="Run browsers in headful mode (visible)"
    )
    parser.add_argument(
        "--device",
        type=str,
        default="iPhone 15 Pro",
        help="iOS device name for simulator"
    )
    parser.add_argument(
        "--ios-version",
        type=str,
        default="18.3",
        help="iOS version for simulator"
    )

    args = parser.parse_args()

    headless = not args.headful

    # Ensure output directory exists
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    real_result = None
    spoofed_result = None

    # Collect real fingerprint
    if not args.spoofed_only:
        print("\n[1/2] Collecting REAL Safari fingerprint...")
        try:
            if args.use_webkit:
                print("Using Playwright WebKit (not real Safari)")
                real_result = get_real_webkit_fingerprint(headless=headless)
            else:
                real_result = get_real_safari_fingerprint(
                    device_name=args.device,
                    ios_version=args.ios_version
                )
            print(f"  Collected {len(real_result.get('config', {}))} properties")
        except Exception as e:
            print(f"  ERROR: {e}")
            if not args.use_webkit:
                print("  TIP: Try --use-webkit for faster testing without iOS Simulator")
            real_result = {"config": {}, "unavailable": [], "errors": [str(e)]}

    # Collect spoofed fingerprint
    if not args.real_only:
        print("\n[2/2] Collecting SPOOFED Camoufox fingerprint...")
        # Use macOS config for webkit mode, iOS config otherwise
        spoof_config = SAFARI_MACOS_CONFIG if args.use_webkit else SAFARI_IOS_CONFIG
        print(f"  Using {'macOS' if args.use_webkit else 'iOS'} Safari config")
        try:
            spoofed_result = get_spoofed_fingerprint(
                exec_path=args.exec_path,
                config=spoof_config,
                headless=headless
            )
            print(f"  Collected {len(spoofed_result.get('config', {}))} properties")
        except Exception as e:
            print(f"  ERROR: {e}")
            spoofed_result = {"config": {}, "unavailable": [], "errors": [str(e)]}

    # Compare and output
    if real_result and spoofed_result:
        comparison = compare_fingerprints(real_result, spoofed_result)
        comparison["raw"] = {
            "real": real_result,
            "spoofed": spoofed_result
        }

        # Save to file
        with open(output_path, "w") as f:
            json.dump(comparison, f, indent=2, default=str)
        print(f"\nComparison saved to: {output_path}")

        # Print summary
        print_summary(comparison)

    elif real_result:
        # Save just real
        with open(output_path, "w") as f:
            json.dump({"real": real_result}, f, indent=2, default=str)
        print(f"\nReal fingerprint saved to: {output_path}")

    elif spoofed_result:
        # Save just spoofed
        with open(output_path, "w") as f:
            json.dump({"spoofed": spoofed_result}, f, indent=2, default=str)
        print(f"\nSpoofed fingerprint saved to: {output_path}")

    else:
        print("\nERROR: No fingerprints collected")
        sys.exit(1)


if __name__ == "__main__":
    main()
