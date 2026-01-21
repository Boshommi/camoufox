/**
 * Browser Info Detector for Camoufox
 * Port of browser-info-generator.js fingerprint components to TypeScript
 * Used for comparing fingerprints between original and spoofed devices
 */

// Font list for fingerprinting
const FONT_LIST = [
  "Andale Mono", "Arial", "Arial Black", "Arial Hebrew", "Arial MT",
  "Arial Narrow", "Arial Rounded MT Bold", "Arial Unicode MS",
  "Bitstream Vera Sans Mono", "Book Antiqua", "Bookman Old Style",
  "Calibri", "Cambria", "Cambria Math", "Century", "Century Gothic",
  "Century Schoolbook", "Comic Sans", "Comic Sans MS", "Consolas",
  "Courier", "Courier New", "Garamond", "Geneva", "Georgia", "Helvetica",
  "Helvetica Neue", "Impact", "Lucida Bright", "Lucida Calligraphy",
  "Lucida Console", "Lucida Fax", "LUCIDA GRANDE", "Lucida Handwriting",
  "Lucida Sans", "Lucida Sans Typewriter", "Lucida Sans Unicode",
  "Microsoft Sans Serif", "Monaco", "Monotype Corsiva", "MS Gothic",
  "MS Outlook", "MS PGothic", "MS Reference Sans Serif", "MS Sans Serif",
  "MS Serif", "MYRIAD", "MYRIAD PRO", "Palatino", "Palatino Linotype",
  "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Light",
  "Segoe UI Semibold", "Segoe UI Symbol", "Tahoma", "Times",
  "Times New Roman", "Times New Roman PS", "Trebuchet MS", "Verdana",
  "Wingdings", "Wingdings 2", "Wingdings 3",
];

// WebGL parameters to collect
const WEBGL_PARAMS = [
  "ALIASED_LINE_WIDTH_RANGE", "ALIASED_POINT_SIZE_RANGE", "ALPHA_BITS",
  "BLUE_BITS", "DEPTH_BITS", "GREEN_BITS", "MAX_COMBINED_TEXTURE_IMAGE_UNITS",
  "MAX_CUBE_MAP_TEXTURE_SIZE", "MAX_FRAGMENT_UNIFORM_VECTORS",
  "MAX_RENDERBUFFER_SIZE", "MAX_TEXTURE_IMAGE_UNITS", "MAX_TEXTURE_SIZE",
  "MAX_VARYING_VECTORS", "MAX_VERTEX_ATTRIBS", "MAX_VERTEX_TEXTURE_IMAGE_UNITS",
  "MAX_VERTEX_UNIFORM_VECTORS", "MAX_VIEWPORT_DIMS", "RED_BITS", "RENDERER",
  "SHADING_LANGUAGE_VERSION", "STENCIL_BITS", "VENDOR", "VERSION",
];

// Shader precision combinations
const SHADER_PRECISION_FORMATS: [string, string][] = [
  ["VERTEX_SHADER", "HIGH_FLOAT"], ["VERTEX_SHADER", "MEDIUM_FLOAT"],
  ["VERTEX_SHADER", "LOW_FLOAT"], ["FRAGMENT_SHADER", "HIGH_FLOAT"],
  ["FRAGMENT_SHADER", "MEDIUM_FLOAT"], ["FRAGMENT_SHADER", "LOW_FLOAT"],
  ["VERTEX_SHADER", "HIGH_INT"], ["VERTEX_SHADER", "MEDIUM_INT"],
  ["VERTEX_SHADER", "LOW_INT"], ["FRAGMENT_SHADER", "HIGH_INT"],
  ["FRAGMENT_SHADER", "MEDIUM_INT"], ["FRAGMENT_SHADER", "LOW_INT"],
];

// Navigator properties for fingerprinting
const NAVIGATOR_PROPS = [
  "userAgent", "language", "languages", "platform", "hardwareConcurrency",
  "deviceMemory", "maxTouchPoints", "cpuClass", "oscpu", "vendor",
  "vendorSub", "product", "productSub", "doNotTrack", "cookieEnabled",
  "appCodeName", "appName", "appVersion", "buildID",
];

// Media queries to test
const MEDIA_QUERIES = [
  "(prefers-color-scheme: dark)", "(prefers-color-scheme: light)",
  "(prefers-reduced-motion: reduce)", "(prefers-reduced-motion: no-preference)",
  "(inverted-colors: inverted)", "(inverted-colors: none)",
  "(forced-colors: active)", "(forced-colors: none)",
  "(prefers-contrast: high)", "(prefers-contrast: low)",
  "(prefers-contrast: no-preference)", "(monochrome)", "(color)",
  "(hover: hover)", "(hover: none)", "(pointer: fine)", "(pointer: coarse)",
  "(pointer: none)", "(any-hover: hover)", "(any-hover: none)",
  "(any-pointer: fine)", "(any-pointer: coarse)", "(any-pointer: none)",
];

// Media codec types
const MEDIA_TYPES = [
  "video/ogg", "video/mp4", "video/webm", "audio/x-aiff", "audio/x-m4a",
  "audio/mpeg", "audio/aac", "audio/wav", "audio/ogg", "audio/mp4",
];

// Codec strings for canPlayType testing
const MEDIA_CODECS = [
  "theora", "vorbis", "1", "avc1.4D401E", "mp4a.40.2", "vp8.0", "mp4a.40.5",
];

// MurmurHash3 32-bit implementation
export function murmurhash3_32(key: string, seed = 0): number {
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  for (let i = 0; i < key.length; i++) {
    let k1 = key.charCodeAt(i);
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }

  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

export interface BrowserInfoComponent {
  name: string;
  hash: string;
  rawValue: string;
}

export interface BrowserInfoResult {
  components: BrowserInfoComponent[];
  combinedHash: string;
}

// 1. Canvas Fingerprint
export function getCanvasFingerprint(): BrowserInfoComponent {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 280;
    canvas.height = 60;

    const ctx = canvas.getContext("2d");
    if (!ctx) return { name: "Canvas", hash: "", rawValue: "" };

    ctx.fillStyle = "rgb(102, 204, 0)";
    ctx.fillRect(0, 0, 280, 60);

    ctx.fillStyle = "#f60";
    ctx.font = "18pt Arial";
    ctx.fillText("Cwm fjordbank glyphs vext quiz", 2, 20);

    ctx.fillStyle = "rgba(102, 204, 170, 0.7)";
    ctx.font = "18pt Arial";
    ctx.fillText("Cwm fjordbank glyphs vext quiz", 4, 40);

    ctx.strokeStyle = "rgb(120, 186, 176)";
    ctx.arc(50, 50, 15, 0, Math.PI * 2, true);
    ctx.stroke();

    const dataUrl = canvas.toDataURL();
    const hash = murmurhash3_32(dataUrl).toString(36);

    return { name: "Canvas", hash, rawValue: dataUrl.slice(0, 100) + "..." };
  } catch {
    return { name: "Canvas", hash: "", rawValue: "error" };
  }
}

// 2. Plugin Fingerprint
export function getPluginFingerprint(): BrowserInfoComponent {
  try {
    const plugins = navigator.plugins;
    if (!plugins || !plugins.length) return { name: "Plugins", hash: "", rawValue: "none" };

    const pluginList: string[] = [];
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      if (!plugin) continue;
      const mimeTypes: string[] = [];

      for (let j = 0; j < plugin.length; j++) {
        const mime = plugin[j];
        if (mime) {
          mimeTypes.push([mime.description, mime.suffixes, mime.type].join("~"));
        }
      }

      pluginList.push([plugin.name, plugin.description, mimeTypes.join(";")].join(","));
    }

    pluginList.sort();
    const rawValue = pluginList.join("|");
    const hash = murmurhash3_32(rawValue).toString(36);

    return { name: "Plugins", hash, rawValue: rawValue.slice(0, 200) + (rawValue.length > 200 ? "..." : "") };
  } catch {
    return { name: "Plugins", hash: "", rawValue: "error" };
  }
}

// 3. Navigator Fingerprint
export function getNavigatorFingerprint(): BrowserInfoComponent {
  try {
    const nav = navigator as unknown as Record<string, unknown>;
    const result: string[] = [];

    for (const prop of NAVIGATOR_PROPS) {
      try {
        let value = nav[prop];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value = value.join(",");
          }
          result.push(prop + ":" + value);
        }
      } catch { /* skip */ }
    }

    // Add screen properties
    result.push(
      "screen:" + [
        screen.width, screen.height, screen.colorDepth, screen.pixelDepth,
        screen.availWidth, screen.availHeight,
      ].join(",")
    );

    result.push("timezone:" + new Date().getTimezoneOffset());
    result.push("touchPoints:" + (navigator.maxTouchPoints || 0));

    if (navigator.hardwareConcurrency) {
      result.push("cores:" + navigator.hardwareConcurrency);
    }

    const rawValue = result.join("|");
    const hash = murmurhash3_32(rawValue).toString(36);

    return { name: "Navigator", hash, rawValue: rawValue.slice(0, 200) + (rawValue.length > 200 ? "..." : "") };
  } catch {
    return { name: "Navigator", hash: "", rawValue: "error" };
  }
}

// 4. Gamepad Fingerprint
export function getGamepadFingerprint(): BrowserInfoComponent {
  try {
    if (!navigator.getGamepads) return { name: "Gamepad", hash: "", rawValue: "unavailable" };

    const gamepads = navigator.getGamepads();
    const count = gamepads ? gamepads.length.toString() : "0";
    const hash = murmurhash3_32(count).toString(36);

    return { name: "Gamepad", hash, rawValue: count };
  } catch {
    return { name: "Gamepad", hash: "", rawValue: "error" };
  }
}

// 5. Font Fingerprint
export function getFontFingerprint(): BrowserInfoComponent {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { name: "Fonts", hash: "", rawValue: "" };

    const testString = "mmmmmmmmmmlli";
    const baseFonts = ["monospace", "sans-serif", "serif"];
    const baseWidths: Record<string, number> = {};

    for (const font of baseFonts) {
      ctx.font = "72px " + font;
      baseWidths[font] = ctx.measureText(testString).width;
    }

    const detected: string[] = [];

    for (const font of FONT_LIST) {
      let fontDetected = false;
      for (const baseFont of baseFonts) {
        ctx.font = '72px "' + font + '",' + baseFont;
        const width = ctx.measureText(testString).width;
        if (width !== baseWidths[baseFont]) {
          fontDetected = true;
          break;
        }
      }
      detected.push(fontDetected ? "1" : "0");
    }

    const rawValue = detected.join("");
    const hash = murmurhash3_32(rawValue).toString(36);
    const detectedCount = detected.filter(d => d === "1").length;

    return { name: "Fonts", hash, rawValue: `${detectedCount}/${FONT_LIST.length} fonts detected` };
  } catch {
    return { name: "Fonts", hash: "", rawValue: "error" };
  }
}

// 6. Audio Fingerprint
export function getAudioFingerprint(): BrowserInfoComponent {
  try {
    const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return { name: "Audio", hash: "", rawValue: "unavailable" };

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gainNode = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

    analyser.fftSize = 2048;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    gainNode.gain.setValueAtTime(0, context.currentTime);

    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(0);

    const bins = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(bins);

    oscillator.disconnect();
    void context.close();

    let sum = 0;
    for (let i = 0; i < bins.length; i++) {
      const bin = bins[i];
      if (bin !== undefined) {
        sum += Math.abs(bin);
      }
    }

    const rawValue = sum.toFixed(2);
    const hash = murmurhash3_32(rawValue).toString(36);

    return { name: "Audio", hash, rawValue };
  } catch {
    return { name: "Audio", hash: "", rawValue: "error" };
  }
}

// 7. WebGL Fingerprint
export function getWebGLFingerprint(): BrowserInfoComponent {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
    if (!gl) return { name: "WebGL", hash: "", rawValue: "unavailable" };

    const result: string[] = [];

    // Collect WebGL parameters
    for (const param of WEBGL_PARAMS) {
      try {
        const glTyped = gl as unknown as Record<string, number>;
        const paramValue = glTyped[param];
        if (paramValue !== undefined) {
          const value = gl.getParameter(paramValue);
          if (value !== null && value !== undefined) {
            if (value instanceof Float32Array || value instanceof Int32Array) {
              result.push(param + ":" + Array.from(value).join(","));
            } else {
              result.push(param + ":" + String(value));
            }
          }
        }
      } catch { /* skip */ }
    }

    // Collect shader precision
    if (gl.getShaderPrecisionFormat) {
      for (const [shader, precision] of SHADER_PRECISION_FORMATS) {
        try {
          const glTyped = gl as unknown as Record<string, number>;
          const shaderType = glTyped[shader];
          const precisionType = glTyped[precision];
          if (shaderType !== undefined && precisionType !== undefined) {
            const format = gl.getShaderPrecisionFormat(shaderType, precisionType);
            if (format) {
              result.push(`${shader}_${precision}:${format.precision},${format.rangeMin},${format.rangeMax}`);
            }
          }
        } catch { /* skip */ }
      }
    }

    // Get unmasked renderer/vendor
    try {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        result.push("UNMASKED_VENDOR:" + gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        result.push("UNMASKED_RENDERER:" + gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    } catch { /* skip */ }

    // Get supported extensions
    try {
      const extensions = gl.getSupportedExtensions();
      if (extensions) {
        result.push("EXTENSIONS:" + extensions.sort().join(","));
      }
    } catch { /* skip */ }

    const rawValue = result.join("~");
    const hash = murmurhash3_32(rawValue).toString(36);

    return { name: "WebGL", hash, rawValue: rawValue.slice(0, 200) + (rawValue.length > 200 ? "..." : "") };
  } catch {
    return { name: "WebGL", hash: "", rawValue: "error" };
  }
}

// 8. Speech Voices Fingerprint
export function getSpeechVoicesFingerprint(): BrowserInfoComponent {
  try {
    const synthesis = window.speechSynthesis;
    if (!synthesis || !synthesis.getVoices) return { name: "Voices", hash: "", rawValue: "unavailable" };

    const voices = synthesis.getVoices();
    if (!voices || !voices.length) return { name: "Voices", hash: "", rawValue: "empty" };

    const voiceData: string[] = [];
    for (const voice of voices) {
      voiceData.push([voice.name, voice.lang, voice.localService, voice.voiceURI, voice.default].join(","));
    }

    const rawValue = voiceData.join("|");
    const hash = murmurhash3_32(rawValue).toString(36);

    return { name: "Voices", hash, rawValue: `${voices.length} voices` };
  } catch {
    return { name: "Voices", hash: "", rawValue: "error" };
  }
}

// 9. Touch Fingerprint
export function getTouchFingerprint(): BrowserInfoComponent {
  try {
    const result: (string | number)[] = [];

    result.push("ontouchstart" in window ? "1" : "0");
    result.push(navigator.maxTouchPoints || 0);
    result.push("TouchEvent" in window ? "1" : "0");

    const rawValue = result.join("x");
    const hash = murmurhash3_32(rawValue).toString(36);

    return { name: "Touch", hash, rawValue };
  } catch {
    return { name: "Touch", hash: "", rawValue: "error" };
  }
}

// 10. Media Queries Fingerprint
export function getMediaQueriesFingerprint(): BrowserInfoComponent {
  try {
    if (!window.matchMedia) return { name: "MediaQueries", hash: "", rawValue: "unavailable" };

    const results: string[] = [];
    for (const query of MEDIA_QUERIES) {
      try {
        const match = window.matchMedia(query);
        results.push(match.matches ? "1" : "0");
      } catch {
        results.push("0");
      }
    }

    const rawValue = results.join("");
    const hash = murmurhash3_32(rawValue).toString(36);

    return { name: "MediaQueries", hash, rawValue };
  } catch {
    return { name: "MediaQueries", hash: "", rawValue: "error" };
  }
}

// 11. Media Codec Fingerprint
export function getMediaCodecFingerprint(): BrowserInfoComponent {
  try {
    const video = document.createElement("video");
    if (!video || !video.canPlayType) return { name: "MediaCodecs", hash: "", rawValue: "unavailable" };

    const results: string[] = [];

    // Test each media type with each codec
    for (const type of MEDIA_TYPES) {
      for (const codec of MEDIA_CODECS) {
        try {
          const mimeWithCodec = type + '; codecs="' + codec + '"';
          const support = video.canPlayType(mimeWithCodec);
          if (support === "probably") {
            results.push("2");
          } else if (support === "maybe") {
            results.push("1");
          } else {
            results.push("0");
          }
        } catch {
          results.push("0");
        }
      }
    }

    // Also test base types without codecs
    for (const type of MEDIA_TYPES) {
      try {
        const support = video.canPlayType(type);
        if (support === "probably") {
          results.push("2");
        } else if (support === "maybe") {
          results.push("1");
        } else {
          results.push("0");
        }
      } catch {
        results.push("0");
      }
    }

    const rawValue = results.join("");
    const hash = murmurhash3_32(rawValue).toString(36);

    return { name: "MediaCodecs", hash, rawValue };
  } catch {
    return { name: "MediaCodecs", hash: "", rawValue: "error" };
  }
}

// 12. JS Heap Size Limit Fingerprint
export function getJsHeapSizeLimitFingerprint(): BrowserInfoComponent {
  try {
    const memory = (performance as { memory?: { jsHeapSizeLimit?: number } }).memory;
    const limit = memory?.jsHeapSizeLimit;
    const rawValue = limit ? limit.toString() : "";
    const hash = limit ? murmurhash3_32(rawValue).toString(36) : "";

    return { name: "JsHeap", hash, rawValue: rawValue || "unavailable" };
  } catch {
    return { name: "JsHeap", hash: "", rawValue: "error" };
  }
}

// 13. Screen Available Fingerprint
export function getScreenAvailableFingerprint(): BrowserInfoComponent {
  try {
    const s = screen as { availTop?: number };
    const values = [screen.availWidth, screen.availHeight, s.availTop ?? ""];
    const rawValue = values.join("x");
    const hash = murmurhash3_32(rawValue).toString(36);

    return { name: "ScreenAvail", hash, rawValue };
  } catch {
    return { name: "ScreenAvail", hash: "", rawValue: "error" };
  }
}

// 14. Do Not Track Fingerprint
export function getDoNotTrackFingerprint(): BrowserInfoComponent {
  try {
    const nav = navigator as { msDoNotTrack?: string };
    const rawValue = navigator.doNotTrack || nav.msDoNotTrack || "unknown";
    const hash = murmurhash3_32(rawValue).toString(36);

    return { name: "DNT", hash, rawValue };
  } catch {
    return { name: "DNT", hash: "", rawValue: "error" };
  }
}

// Collect all browser info fingerprints
export function collectBrowserInfoFingerprints(): BrowserInfoResult {
  const components = [
    getCanvasFingerprint(),
    getPluginFingerprint(),
    getNavigatorFingerprint(),
    getGamepadFingerprint(),
    getFontFingerprint(),
    getAudioFingerprint(),
    getWebGLFingerprint(),
    getSpeechVoicesFingerprint(),
    getTouchFingerprint(),
    getMediaQueriesFingerprint(),
    getMediaCodecFingerprint(),
    getJsHeapSizeLimitFingerprint(),
    getScreenAvailableFingerprint(),
    getDoNotTrackFingerprint(),
  ];

  const combinedValue = components.map(c => c.hash).join("-");
  const combinedHash = murmurhash3_32(combinedValue).toString(36);

  return { components, combinedHash };
}
