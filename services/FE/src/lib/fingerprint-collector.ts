/**
 * Fingerprint Collector for Camoufox
 * Uses browser-info-generator.js (YandexBrowserInfo) for comprehensive fingerprint collection
 *
 * This wrapper:
 * 1. Loads and uses the YandexBrowserInfo.asyncGenerate() method
 * 2. Returns raw browser info for display on frontend
 * 3. Converts collected data to Camoufox config format for spoofing
 *
 * IMPORTANT: Only outputs properties that are valid in Camoufox's properties.json
 */

import type {
  YandexBrowserInfoAPI,
  CamoufoxConfig as CamoufoxConfigType,
  AsyncBrowserInfoResult,
  AsyncDetectionResult,
  PlatformAPIs,
  FingerprintComponents,
} from "./browser-info-types";

// Re-export CamoufoxConfig type for convenience
export type CamoufoxConfig = CamoufoxConfigType;

// Version bump: consolidating from fingerprint-detector.ts to fingerprint-collector.ts
export const DETECTOR_VERSION = 3;
export const COLLECTOR_VERSION = DETECTOR_VERSION; // Alias for backwards compat

/**
 * Result from collecting fingerprint data
 */
export interface CollectionResult {
  // For Camoufox configuration
  config: CamoufoxConfig;

  // For display on frontend
  browserInfo: AsyncBrowserInfoResult;

  // Summary info
  unavailable: string[];
  platformAPIs: PlatformAPIs;
  fingerprintComponents: FingerprintComponents;
  asyncData: AsyncDetectionResult;
}

export interface CollectionOptions {
  skipGeolocation?: boolean;
}

/**
 * Check if YandexBrowserInfo is loaded
 */
function getBrowserInfoAPI(): YandexBrowserInfoAPI | null {
  if (typeof window !== "undefined" && window.YandexBrowserInfo) {
    return window.YandexBrowserInfo;
  }
  return null;
}

/**
 * Load browser-info-generator.js script dynamically
 */
async function loadBrowserInfoScript(): Promise<YandexBrowserInfoAPI> {
  const existing = getBrowserInfoAPI();
  if (existing) return existing;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/browser-info-generator.js";
    script.async = true;
    script.onload = () => {
      const api = getBrowserInfoAPI();
      if (api) {
        resolve(api);
      } else {
        reject(new Error("YandexBrowserInfo not found after script load"));
      }
    };
    script.onerror = () => {
      reject(new Error("Failed to load browser-info-generator.js"));
    };
    document.head.appendChild(script);
  });
}

/**
 * Convert YandexBrowserInfo asyncGenerate output to Camoufox config format
 * Only outputs valid Camoufox properties from settings/properties.json
 */
function convertToCamoufoxConfig(
  result: AsyncBrowserInfoResult
): { config: CamoufoxConfig; unavailable: string[] } {
  const unavailable: string[] = [];
  const config: CamoufoxConfig = {};
  const asyncData = result.asyncDetection;

  const nav = window.navigator;

  // ============================================
  // Navigator properties (all valid in Camoufox)
  // ============================================
  config["navigator.userAgent"] = nav.userAgent;
  config["navigator.appCodeName"] = nav.appCodeName;
  config["navigator.appName"] = nav.appName;
  config["navigator.appVersion"] = nav.appVersion;
  config["navigator.language"] = nav.language;
  config["navigator.languages"] = [...nav.languages];
  config["navigator.platform"] = nav.platform;
  config["navigator.product"] = nav.product;
  config["navigator.productSub"] = nav.productSub;
  config["navigator.vendor"] = nav.vendor;
  config["navigator.vendorSub"] = nav.vendorSub;
  config["navigator.webdriver"] = nav.webdriver;
  config["navigator.cookieEnabled"] = nav.cookieEnabled;
  config["navigator.hardwareConcurrency"] = nav.hardwareConcurrency;
  config["navigator.maxTouchPoints"] = nav.maxTouchPoints;
  config["navigator.onLine"] = nav.onLine;

  // Firefox-specific properties
  if ("buildID" in nav) {
    config["navigator.buildID"] = (nav as Navigator & { buildID?: string }).buildID;
  }
  if ("oscpu" in nav) {
    config["navigator.oscpu"] = (nav as Navigator & { oscpu?: string }).oscpu;
  }
  if ("doNotTrack" in nav && nav.doNotTrack !== null) {
    config["navigator.doNotTrack"] = nav.doNotTrack;
  }
  if ("globalPrivacyControl" in nav) {
    config["navigator.globalPrivacyControl"] = (nav as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
  }

  // Plugins (deprecated but still fingerprinted)
  const plugins = nav.plugins;
  if (plugins && plugins.length > 0) {
    const pluginList: Array<{ name: string; description: string; filename: string; mimeTypes: Array<{ type: string; description: string; suffixes: string }> }> = [];
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      if (!plugin) continue;
      const mimeTypes: Array<{ type: string; description: string; suffixes: string }> = [];
      for (let j = 0; j < plugin.length; j++) {
        const mime = plugin[j];
        if (!mime) continue;
        mimeTypes.push({
          type: mime.type,
          description: mime.description,
          suffixes: mime.suffixes,
        });
      }
      pluginList.push({
        name: plugin.name,
        description: plugin.description,
        filename: plugin.filename,
        mimeTypes,
      });
    }
    config["navigator.plugins"] = pluginList;
  }

  // ============================================
  // Screen properties (all valid in Camoufox)
  // ============================================
  const screen = window.screen;
  config["screen.width"] = screen.width;
  config["screen.height"] = screen.height;
  config["screen.availWidth"] = screen.availWidth;
  config["screen.availHeight"] = screen.availHeight;
  config["screen.availTop"] = (screen as Screen & { availTop?: number }).availTop ?? 0;
  config["screen.availLeft"] = (screen as Screen & { availLeft?: number }).availLeft ?? 0;
  config["screen.colorDepth"] = screen.colorDepth;
  config["screen.pixelDepth"] = screen.pixelDepth;
  config["screen.pageXOffset"] = window.pageXOffset;
  config["screen.pageYOffset"] = window.pageYOffset;

  // ============================================
  // Window properties (all valid in Camoufox)
  // ============================================
  config["window.innerWidth"] = window.innerWidth;
  config["window.innerHeight"] = window.innerHeight;
  config["window.outerWidth"] = window.outerWidth;
  config["window.outerHeight"] = window.outerHeight;
  config["window.screenX"] = window.screenX;
  config["window.screenY"] = window.screenY;
  config["window.devicePixelRatio"] = window.devicePixelRatio;
  config["window.scrollMinX"] = (window as Window & { scrollMinX?: number }).scrollMinX ?? 0;
  config["window.scrollMinY"] = (window as Window & { scrollMinY?: number }).scrollMinY ?? 0;
  config["window.scrollMaxX"] = (window as Window & { scrollMaxX?: number }).scrollMaxX ?? 0;
  config["window.scrollMaxY"] = (window as Window & { scrollMaxY?: number }).scrollMaxY ?? 0;
  config["window.history.length"] = window.history.length;

  // Touch support
  config["window.TouchEvent"] = "TouchEvent" in window;

  // ============================================
  // Document properties (valid in Camoufox)
  // ============================================
  if (document.body) {
    config["document.body.clientWidth"] = document.body.clientWidth;
    config["document.body.clientHeight"] = document.body.clientHeight;
    config["document.body.clientTop"] = document.body.clientTop;
    config["document.body.clientLeft"] = document.body.clientLeft;
  }

  // ============================================
  // PDF Viewer
  // ============================================
  config["pdfViewerEnabled"] = nav.pdfViewerEnabled ?? true;

  // ============================================
  // Timezone (just "timezone", not "timezone.name")
  // ============================================
  config["timezone"] = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // ============================================
  // Locale (using : not .)
  // ============================================
  const langParts = nav.language.split("-");
  config["locale:language"] = langParts[0] ?? "en";
  config["locale:region"] = langParts[1] ?? "";
  config["locale:script"] = "";
  config["locale:all"] = nav.language;

  // ============================================
  // Audio Context
  // ============================================
  if (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) {
    try {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        config["AudioContext:sampleRate"] = ctx.sampleRate;
        config["AudioContext:maxChannelCount"] = ctx.destination.maxChannelCount;
        config["AudioContext:outputLatency"] = (ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0;
        ctx.close();
      }
    } catch (e) {
      unavailable.push("AudioContext");
    }
  } else {
    unavailable.push("AudioContext");
  }

  // ============================================
  // WebGL parameters - use decimal string keys for Camoufox compatibility
  // ============================================
  const webGlParams = collectWebGLParameters();
  if (webGlParams) {
    config["webGl:parameters"] = webGlParams.parameters;
    config["webGl:supportedExtensions"] = webGlParams.extensions;
    config["webGl:vendor"] = webGlParams.vendor;
    config["webGl:renderer"] = webGlParams.renderer;
    config["webGl:contextAttributes"] = webGlParams.contextAttributes;
    config["webGl:shaderPrecisionFormats"] = webGlParams.shaderPrecisionFormats;
  } else {
    unavailable.push("WebGL");
  }

  // WebGL2
  const webGl2Params = collectWebGL2Parameters();
  if (webGl2Params) {
    config["webGl2:parameters"] = webGl2Params.parameters;
    config["webGl2:supportedExtensions"] = webGl2Params.extensions;
  }

  // ============================================
  // Speech synthesis voices
  // ============================================
  if (asyncData?.voices && asyncData.voices.list.length > 0) {
    config["voices"] = asyncData.voices.list.map((v) => ({
      name: v.name,
      lang: v.lang,
      voiceUri: v.voiceURI,
      isDefault: v.default,
      isLocalService: v.localService,
    }));
  } else if (window.speechSynthesis) {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      config["voices"] = voices.map((v) => ({
        name: v.name,
        lang: v.lang,
        voiceUri: v.voiceURI,
        isDefault: v.default,
        isLocalService: v.localService,
      }));
    }
  }

  // ============================================
  // Media queries (all valid in Camoufox)
  // ============================================
  if (window.matchMedia) {
    const mediaQueryTests: [string, string, string][] = [
      ["prefers-color-scheme", "dark", "light"],
      ["prefers-reduced-motion", "reduce", "no-preference"],
      ["prefers-contrast", "high", "no-preference"],
      ["forced-colors", "active", "none"],
      ["inverted-colors", "inverted", "none"],
      ["hover", "hover", "none"],
      ["pointer", "fine", "coarse"],
      ["any-hover", "hover", "none"],
      ["any-pointer", "fine", "coarse"],
    ];
    for (const [name, val1, val2] of mediaQueryTests) {
      if (window.matchMedia(`(${name}: ${val1})`).matches) {
        config[`mediaQuery:${name}`] = val1;
      } else if (window.matchMedia(`(${name}: ${val2})`).matches) {
        config[`mediaQuery:${name}`] = val2;
      }
    }
    // Boolean media queries
    config["mediaQuery:monochrome"] = window.matchMedia("(monochrome)").matches;
    config["mediaQuery:color"] = window.matchMedia("(color)").matches;
  }

  // ============================================
  // Network Info API (valid in Camoufox as net-info-api:*)
  // ============================================
  if ("connection" in nav && nav.connection) {
    const conn = nav.connection as NetworkInformation;
    config["net-info-api:effectiveType"] = conn.effectiveType;
    config["net-info-api:downlink"] = conn.downlink;
    config["net-info-api:rtt"] = conn.rtt;
    config["net-info-api:saveData"] = conn.saveData;
  }

  // ============================================
  // User Agent Data (Chrome-only, Camoufox supports separate properties)
  // ============================================
  if ("userAgentData" in nav && nav.userAgentData) {
    const uad = nav.userAgentData as NavigatorUAData;
    config["navigator.userAgentData"] = true;
    config["navigator.userAgentData:brands"] = uad.brands?.map((b) => ({ brand: b.brand, version: b.version })) || [];
    config["navigator.userAgentData:mobile"] = uad.mobile;
    config["navigator.userAgentData:platform"] = uad.platform;

    // High entropy values from async detection
    if (asyncData?.userAgentClientHints) {
      const hints = asyncData.userAgentClientHints;
      config["navigator.userAgentData:architecture"] = hints.architecture;
      config["navigator.userAgentData:bitness"] = hints.bitness;
      config["navigator.userAgentData:model"] = hints.model;
      config["navigator.userAgentData:platformVersion"] = hints.platformVersion;
      config["navigator.userAgentData:fullVersionList"] = hints.fullVersionList;
      config["navigator.userAgentData:wow64"] = false;
    }
  } else {
    config["navigator.userAgentData"] = false;
  }

  // ============================================
  // Media Codec overrides (placeholder - user should configure)
  // ============================================
  config["mediaCodec:overrides"] = {
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
  };

  // ============================================
  // Media Devices (counts only)
  // ============================================
  // These default to 1 each - user should configure based on their setup
  config["mediaDevices:micros"] = 1;
  config["mediaDevices:webcams"] = 1;
  config["mediaDevices:speakers"] = 1;

  return { config, unavailable };
}

/**
 * Collect WebGL parameters with decimal string keys
 */
function collectWebGLParameters(): {
  parameters: Record<string, unknown>;
  extensions: string[];
  vendor: string;
  renderer: string;
  contextAttributes: Record<string, unknown>;
  shaderPrecisionFormats: Record<string, Record<string, { rangeMin: number; rangeMax: number; precision: number }>>;
} | null {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) return null;

    const params: Record<string, unknown> = {};

    // Standard parameters with decimal keys
    const standardParams = [
      7936, // GL_VENDOR
      7937, // GL_RENDERER
      7938, // GL_VERSION
      35724, // SHADING_LANGUAGE_VERSION
      3379, // MAX_TEXTURE_SIZE
      34076, // MAX_CUBE_MAP_TEXTURE_SIZE
      34024, // MAX_RENDERBUFFER_SIZE
      34921, // MAX_VERTEX_ATTRIBS
      35660, // MAX_VERTEX_TEXTURE_IMAGE_UNITS
      35661, // MAX_VERTEX_UNIFORM_VECTORS
      36347, // MAX_VARYING_VECTORS
      35657, // MAX_COMBINED_TEXTURE_IMAGE_UNITS
      34930, // MAX_TEXTURE_IMAGE_UNITS
      36348, // MAX_FRAGMENT_UNIFORM_VECTORS
      36349, // MAX_FRAGMENT_UNIFORM_COMPONENTS (WebGL2 but often available)
      3386, // MAX_VIEWPORT_DIMS
      3408, // SUBPIXEL_BITS
      3410, // RED_BITS
      3411, // GREEN_BITS
      3412, // BLUE_BITS
      3413, // ALPHA_BITS
      3414, // DEPTH_BITS
      3415, // STENCIL_BITS
      33901, // ALIASED_LINE_WIDTH_RANGE
      33902, // ALIASED_POINT_SIZE_RANGE
    ];

    for (const paramId of standardParams) {
      try {
        const value = gl.getParameter(paramId);
        const decimalKey = String(paramId);
        if (value instanceof Float32Array || value instanceof Int32Array) {
          params[decimalKey] = Array.from(value);
        } else if (value !== null) {
          params[decimalKey] = value;
        }
      } catch (e) {
        // Parameter not supported
      }
    }

    // Get unmasked vendor/renderer
    let vendor = "";
    let renderer = "";
    try {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "";
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
      }
    } catch (e) {
      // Extension not available
    }

    // Get context attributes
    const attrs = gl.getContextAttributes();
    const contextAttributes: Record<string, unknown> = {};
    if (attrs) {
      contextAttributes.alpha = attrs.alpha;
      contextAttributes.antialias = attrs.antialias;
      contextAttributes.depth = attrs.depth;
      contextAttributes.failIfMajorPerformanceCaveat = attrs.failIfMajorPerformanceCaveat;
      contextAttributes.powerPreference = attrs.powerPreference;
      contextAttributes.premultipliedAlpha = attrs.premultipliedAlpha;
      contextAttributes.preserveDrawingBuffer = attrs.preserveDrawingBuffer;
      contextAttributes.stencil = attrs.stencil;
    }

    // Get shader precision formats
    const shaderPrecisionFormats: Record<string, Record<string, { rangeMin: number; rangeMax: number; precision: number }>> = {
      vertex: {},
      fragment: {},
    };

    const precisionTypes = ["lowFloat", "mediumFloat", "highFloat", "lowInt", "mediumInt", "highInt"];
    const shaderTypes = [
      { name: "vertex", type: gl.VERTEX_SHADER },
      { name: "fragment", type: gl.FRAGMENT_SHADER },
    ];
    const precisionMap: Record<string, number> = {
      lowFloat: gl.LOW_FLOAT,
      mediumFloat: gl.MEDIUM_FLOAT,
      highFloat: gl.HIGH_FLOAT,
      lowInt: gl.LOW_INT,
      mediumInt: gl.MEDIUM_INT,
      highInt: gl.HIGH_INT,
    };

    for (const shader of shaderTypes) {
      for (const precName of precisionTypes) {
        try {
          const format = gl.getShaderPrecisionFormat(shader.type, precisionMap[precName]!);
          if (format) {
            shaderPrecisionFormats[shader.name]![precName] = {
              rangeMin: format.rangeMin,
              rangeMax: format.rangeMax,
              precision: format.precision,
            };
          }
        } catch (e) {
          // Not supported
        }
      }
    }

    // Get extensions
    const extensions = gl.getSupportedExtensions() || [];

    return {
      parameters: params,
      extensions: extensions.sort(),
      vendor,
      renderer,
      contextAttributes,
      shaderPrecisionFormats,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Collect WebGL2 parameters
 */
function collectWebGL2Parameters(): {
  parameters: Record<string, unknown>;
  extensions: string[];
} | null {
  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2");
    if (!gl2) return null;

    const params: Record<string, unknown> = {};

    // WebGL2-specific parameters
    const gl2Params = [
      35371, // MAX_3D_TEXTURE_SIZE
      35657, // MAX_COMBINED_TEXTURE_IMAGE_UNITS
      36203, // MAX_ARRAY_TEXTURE_LAYERS
      35658, // MAX_DRAW_BUFFERS
      35659, // MAX_COLOR_ATTACHMENTS
      35968, // MAX_SAMPLES
      36183, // MAX_SERVER_WAIT_TIMEOUT
      35373, // MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS
      35372, // MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS
      36388, // MAX_UNIFORM_BUFFER_BINDINGS
      35375, // MAX_UNIFORM_BLOCK_SIZE
    ];

    for (const paramId of gl2Params) {
      try {
        const value = gl2.getParameter(paramId);
        const decimalKey = String(paramId);
        if (value instanceof Float32Array || value instanceof Int32Array) {
          params[decimalKey] = Array.from(value);
        } else if (value !== null) {
          params[decimalKey] = value;
        }
      } catch (e) {
        // Parameter not supported
      }
    }

    const extensions = gl2.getSupportedExtensions() || [];

    return {
      parameters: params,
      extensions: extensions.sort(),
    };
  } catch (e) {
    return null;
  }
}

/**
 * Collect all fingerprint data using YandexBrowserInfo.asyncGenerate()
 *
 * Returns:
 * - config: Camoufox-compatible configuration for spoofing
 * - browserInfo: Raw browser info for display on frontend
 */
export async function collectAll(
  options: CollectionOptions = {}
): Promise<CollectionResult> {
  // Load the browser info library
  const api = await loadBrowserInfoScript();

  // Use asyncGenerate to collect all data including async detection
  const browserInfo = await api.asyncGenerate({ window });

  // Convert to Camoufox config
  const { config, unavailable } = convertToCamoufoxConfig(browserInfo);

  return {
    config,
    browserInfo,
    unavailable,
    platformAPIs: browserInfo.platformAPIs,
    fingerprintComponents: browserInfo.fingerprintComponents,
    asyncData: browserInfo.asyncDetection,
  };
}

// Alias for backwards compatibility with fingerprint-detector.ts
export const detectAll = collectAll;

/**
 * Get just the platform APIs detection
 */
export async function getPlatformAPIs(): Promise<PlatformAPIs> {
  const api = await loadBrowserInfoScript();
  return api.getPlatformAPIs();
}

/**
 * Get the full fingerprint hash
 */
export async function getFingerprintHash(): Promise<string> {
  const api = await loadBrowserInfoScript();
  return api.getFingerprintHash();
}

/**
 * Get 128-bit fingerprint hash
 */
export async function getFingerprintHash128(): Promise<string> {
  const api = await loadBrowserInfoScript();
  return api.getFingerprintHash128();
}

// Type augmentation for Network Information API
interface NetworkInformation {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface Navigator {
  connection?: NetworkInformation;
  pdfViewerEnabled?: boolean;
}

interface NavigatorUAData {
  brands?: Array<{ brand: string; version: string }>;
  mobile: boolean;
  platform: string;
}

interface Navigator {
  userAgentData?: NavigatorUAData;
}
