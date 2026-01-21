import time
import argparse
import json

from camoufox import Camoufox, DefaultAddons

# Change this to your actual .app binary:
EXEC = "dist/Camoufox.app/Contents/MacOS/camoufox"  # not the .app folder

# Parse command line arguments
parser = argparse.ArgumentParser(description='Run Camoufox with a fingerprint config')
parser.add_argument('--config', '-c', type=str, help='Path to JSON config file')
parser.add_argument('--url', '-u', type=str, default='https://pixelscan.net/fingerprint-check', help='URL to navigate to')
args = parser.parse_args()

# Default config (used if no --config provided)
default_config = {
    # Navigator
    "navigator.userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1",
    "navigator.appCodeName": "Mozilla",
    "navigator.appName": "Netscape",
    "navigator.appVersion": "5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1",
    "navigator.language": "en-US",
    "navigator.platform": "iPhone",
    "navigator.product": "Gecko",
    "navigator.productSub": "20030107",
    "navigator.languages": ["en-US"],
    "navigator.hardwareConcurrency": 4,
    "navigator.maxTouchPoints": 5,
    "navigator.cookieEnabled": True,
    "navigator.onLine": True,
    "navigator.vendor": "Apple Computer, Inc.",
    "navigator.vendorSub": "",
    "navigator.webdriver": False,
    # Browser Detection - Safari specific
    "navigator.userAgentData": False,  # CRITICAL: Safari doesn't have this Chrome-only API
    "window.InstallTrigger:hide": True,  # Hide Firefox-specific API
    "window.webkit": True,  # Safari has window.webkit
    # Note: window.chrome and performance.memory are NOT set (Safari doesn't have them)
    "navigator.plugins": [
        {
            "name": "PDF Viewer",
            "description": "Portable Document Format",
            "filename": "internal-pdf-viewer",
            "mimeTypes": [
                {
                    "type": "application/pdf",
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                },
                {
                    "type": "text/pdf",
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                },
            ],
        },
        {
            "name": "Chrome PDF Viewer",
            "description": "Portable Document Format",
            "filename": "internal-pdf-viewer",
            "mimeTypes": [
                {
                    "type": "application/pdf",
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                },
                {
                    "type": "text/pdf",
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                },
            ],
        },
        {
            "name": "Chromium PDF Viewer",
            "description": "Portable Document Format",
            "filename": "internal-pdf-viewer",
            "mimeTypes": [
                {
                    "type": "application/pdf",
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                },
                {
                    "type": "text/pdf",
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                },
            ],
        },
        {
            "name": "Microsoft Edge PDF Viewer",
            "description": "Portable Document Format",
            "filename": "internal-pdf-viewer",
            "mimeTypes": [
                {
                    "type": "application/pdf",
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                },
                {
                    "type": "text/pdf",
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                },
            ],
        },
        {
            "name": "WebKit built-in PDF",
            "description": "Portable Document Format",
            "filename": "internal-pdf-viewer",
            "mimeTypes": [
                {
                    "type": "application/pdf",
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                },
                {
                    "type": "text/pdf",
                    "description": "Portable Document Format",
                    "suffixes": "pdf",
                },
            ],
        },
    ],
    # "navigator.plugins": [],
    # Screen
    "screen.availHeight": 956,
    "screen.availWidth": 440,
    "screen.availTop": 0,
    "screen.availLeft": 0,
    "screen.height": 956,
    "screen.width": 440,
    "screen.colorDepth": 24,
    "screen.pixelDepth": 24,
    "screen.pageXOffset": 0,
    "screen.pageYOffset": 0,
    # Window
    "window.scrollMinX": 0,
    "window.scrollMinY": 0,
    "window.scrollMaxX": 0,
    "window.scrollMaxY": 89,
    "window.outerHeight": 956,
    "window.outerWidth": 440,
    "window.innerHeight": 796,
    "window.innerWidth": 440,
    "window.screenX": 0,
    "window.screenY": 0,
    "window.history.length": 8,
    "window.devicePixelRatio": 3,
    # Document
    "document.body.clientWidth": 440,
    "document.body.clientHeight": 885,
    "document.body.clientTop": 0,
    "document.body.clientLeft": 0,
    # PDF Viewer
    "pdfViewerEnabled": True,
    # Timezone
    "timezone": "Europe/Moscow",
    # Locale
    "locale:language": "en",
    "locale:region": "US",
    "locale:script": "",
    "locale:all": "en-US",
    # Audio Context
    "AudioContext:sampleRate": 48000,
    "AudioContext:maxChannelCount": 2,
    "AudioContext:outputLatency": 0,
    # WebGL
    "webGl:renderer": "Apple GPU",
    "webGl:vendor": "Apple Inc.",
    "webGl:supportedExtensions": [
        "ANGLE_instanced_arrays",
        "EXT_blend_minmax",
        "EXT_clip_control",
        "EXT_color_buffer_half_float",
        "EXT_depth_clamp",
        "EXT_float_blend",
        "EXT_frag_depth",
        "EXT_polygon_offset_clamp",
        "EXT_shader_texture_lod",
        "EXT_texture_compression_bptc",
        "EXT_texture_compression_rgtc",
        "EXT_texture_filter_anisotropic",
        "EXT_texture_mirror_clamp_to_edge",
        "EXT_sRGB",
        "KHR_parallel_shader_compile",
        "OES_element_index_uint",
        "OES_fbo_render_mipmap",
        "OES_standard_derivatives",
        "OES_texture_float",
        "OES_texture_float_linear",
        "OES_texture_half_float",
        "OES_texture_half_float_linear",
        "OES_vertex_array_object",
        "WEBGL_blend_func_extended",
        "WEBGL_color_buffer_float",
        "WEBGL_compressed_texture_astc",
        "WEBGL_compressed_texture_etc",
        "WEBGL_compressed_texture_etc1",
        "WEBGL_compressed_texture_pvrtc",
        "WEBKIT_WEBGL_compressed_texture_pvrtc",
        "WEBGL_compressed_texture_s3tc",
        "WEBGL_compressed_texture_s3tc_srgb",
        "WEBGL_debug_renderer_info",
        "WEBGL_debug_shaders",
        "WEBGL_depth_texture",
        "WEBGL_draw_buffers",
        "WEBGL_lose_context",
        "WEBGL_multi_draw",
        "WEBGL_polygon_mode",
    ],
    "webGl:contextAttributes": {
        "alpha": True,
        "antialias": True,
        "depth": True,
        "failIfMajorPerformanceCaveat": False,
        "powerPreference": "default",
        "premultipliedAlpha": True,
        "preserveDrawingBuffer": False,
        "stencil": False,
    },
    "webGl:parameters": {
        "0x0D33": 16384,
        "0x0D3A": [16384, 16384],
        "0x8869": 16,
        "0x8DFB": 1024,
        "0x8DFC": 31,
        "0x8B4C": 16,
        "0x8872": 16,
        "0x8DFD": 1024,
        "0x851C": 16384,
        "0x84E8": 16384,
        "0x846E": [1, 1],
        "0x846D": [1, 511],
        "0x0D52": 8,
        "0x0D53": 8,
        "0x0D54": 8,
        "0x0D55": 8,
        "0x0D56": 24,
        "0x0D57": 0,
        "0x0D50": 4,
    },
    "webGl:shaderPrecisionFormats": {
        "vertex": {
            "lowFloat": {"rangeMin": 127, "rangeMax": 127, "precision": 23},
            "mediumFloat": {"rangeMin": 127, "rangeMax": 127, "precision": 23},
            "highFloat": {"rangeMin": 127, "rangeMax": 127, "precision": 23},
            "lowInt": {"rangeMin": 31, "rangeMax": 30, "precision": 0},
            "mediumInt": {"rangeMin": 31, "rangeMax": 30, "precision": 0},
            "highInt": {"rangeMin": 31, "rangeMax": 30, "precision": 0},
        },
        "fragment": {
            "lowFloat": {"rangeMin": 127, "rangeMax": 127, "precision": 23},
            "mediumFloat": {"rangeMin": 127, "rangeMax": 127, "precision": 23},
            "highFloat": {"rangeMin": 127, "rangeMax": 127, "precision": 23},
            "lowInt": {"rangeMin": 31, "rangeMax": 30, "precision": 0},
            "mediumInt": {"rangeMin": 31, "rangeMax": 30, "precision": 0},
            "highInt": {"rangeMin": 31, "rangeMax": 30, "precision": 0},
        },
    },
    # Media Devices
    "mediaDevices:micros": 1,
    "mediaDevices:webcams": 1,
    "mediaDevices:speakers": 0,
    # Media Queries
    "mediaQuery:prefers-color-scheme": "dark",
    "mediaQuery:prefers-reduced-motion": "no-preference",
    "mediaQuery:prefers-contrast": "no-preference",
    "mediaQuery:forced-colors": "none",
    "mediaQuery:inverted-colors": "none",
    "mediaQuery:pointer": "coarse",
    "mediaQuery:hover": "none",
    "mediaQuery:any-pointer": "coarse",
    "mediaQuery:any-hover": "none",
    "mediaQuery:monochrome": False,
    "mediaQuery:color": True,
    # Media Codecs
    "mediaCodec:overrides": {
        "video/mp4": "maybe",
        'video/mp4; codecs="avc1.42E01E"': "probably",
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"': "probably",
        "video/webm": "maybe",
        'video/webm; codecs="vp8"': "probably",
        'video/webm; codecs="vp9"': "probably",
        'video/webm; codecs="vp8, vorbis"': "probably",
        "audio/mpeg": "maybe",
        "audio/mp4": "maybe",
        'audio/mp4; codecs="mp4a.40.2"': "probably",
        "audio/ogg": "maybe",
        'audio/ogg; codecs="vorbis"': "probably",
        'audio/ogg; codecs="opus"': "probably",
        "audio/webm": "maybe",
        'audio/webm; codecs="vorbis"': "probably",
        'audio/webm; codecs="opus"': "probably",
        "audio/wav": "maybe",
        "audio/flac": "maybe",
        "audio/aac": "maybe",
    },
    # Canvas Fingerprints
}

# Load config from file if provided, otherwise use default
if args.config:
    print(f"Loading config from: {args.config}")
    with open(args.config, 'r') as f:
        config = json.load(f)
    print(f"Loaded {len(config)} config properties")
else:
    print("Using default config")
    config = default_config

with Camoufox(
    executable_path=EXEC,
    ff_version=144,  # matches your 142.x build
    exclude_addons=[DefaultAddons.UBO],  # prevent auto-downloads
    os=("windows"),
    debug=True,
    config=config,
) as browser:
    page = browser.new_page()
    page.goto(args.url)
    print(f"Navigated to: {args.url}")
    time.sleep(1000000)
