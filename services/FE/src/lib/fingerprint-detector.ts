/**
 * Fingerprint Detector for Camoufox
 * Detects browser fingerprint properties and outputs config compatible with test.py
 */

/**
 * Detector version - increment when detection logic changes:
 * - Adding new properties to detect
 * - Changing how existing properties are detected
 * - Fixing bugs in detection that change output
 */
export const DETECTOR_VERSION = 2;

// Type definitions for browser APIs not in standard TypeScript
declare global {
  interface Navigator {
    oscpu?: string;
    buildID?: string;
    globalPrivacyControl?: boolean;
    connection?: NetworkInformation;
    getBattery?: () => Promise<BatteryManager>;
    userAgentData?: NavigatorUAData;
    pdfViewerEnabled?: boolean;
  }

  interface NetworkInformation {
    type?: string;
    effectiveType?: string;
    downlink?: number;
    downlinkMax?: number;
    rtt?: number;
    saveData?: boolean;
  }

  interface BatteryManager {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
  }

  interface NavigatorUAData {
    brands: Array<{ brand: string; version: string }>;
    mobile: boolean;
    platform: string;
    getHighEntropyValues: (hints: string[]) => Promise<UADataValues>;
  }

  interface UADataValues {
    architecture?: string;
    bitness?: string;
    model?: string;
    platformVersion?: string;
    fullVersionList?: Array<{ brand: string; version: string }>;
    wow64?: boolean;
  }

  interface Window {
    scrollMinX?: number;
    scrollMinY?: number;
    scrollMaxX?: number;
    scrollMaxY?: number;
  }

  interface Screen {
    availTop?: number;
    availLeft?: number;
  }
}

export interface CamoufoxConfig {
  [key: string]: unknown;
}

export interface BrowserAPIDetection {
  // Chrome-specific
  hasUserAgentData: boolean;
  hasWindowChrome: boolean;
  hasPerformanceMemory: boolean;

  // Safari-specific
  hasWindowWebkit: boolean;

  // Firefox-specific
  hasInstallTrigger: boolean;

  // Opera-specific
  hasWindowOpera: boolean;

  // Vendor info (helps identify browser)
  vendor: string;
  vendorSub: string;

  // Detected browser based on APIs
  detectedBrowser: "chrome" | "safari" | "firefox" | "opera" | "edge" | "unknown";
}

export interface DetectionResult {
  config: CamoufoxConfig;
  unavailable: string[];
  errors: string[];
}

// Helper to safely get a value
function safeGet<T>(fn: () => T, fallback?: T): T | undefined {
  try {
    const value = fn();
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Detect Navigator properties
 */
export function detectNavigator(): CamoufoxConfig {
  const config: CamoufoxConfig = {};

  // String properties
  config["navigator.userAgent"] = safeGet(() => navigator.userAgent);
  config["navigator.doNotTrack"] = safeGet(() => navigator.doNotTrack);
  config["navigator.appCodeName"] = safeGet(() => navigator.appCodeName);
  config["navigator.appName"] = safeGet(() => navigator.appName);
  config["navigator.appVersion"] = safeGet(() => navigator.appVersion);
  config["navigator.oscpu"] = safeGet(() => navigator.oscpu);
  config["navigator.language"] = safeGet(() => navigator.language);
  config["navigator.platform"] = safeGet(() => navigator.platform);
  config["navigator.product"] = safeGet(() => navigator.product);
  config["navigator.productSub"] = safeGet(() => navigator.productSub);
  config["navigator.buildID"] = safeGet(() => navigator.buildID);

  // Array properties
  config["navigator.languages"] = safeGet(() => Array.from(navigator.languages));

  // Numeric properties
  config["navigator.hardwareConcurrency"] = safeGet(
    () => navigator.hardwareConcurrency
  );
  config["navigator.maxTouchPoints"] = safeGet(() => navigator.maxTouchPoints);

  // Boolean properties
  config["navigator.cookieEnabled"] = safeGet(() => navigator.cookieEnabled);
  config["navigator.onLine"] = safeGet(() => navigator.onLine);
  config["navigator.globalPrivacyControl"] = safeGet(
    () => navigator.globalPrivacyControl
  );

  // Plugins - complex structure
  const plugins = safeGet(() => {
    const result: Array<{
      name: string;
      description: string;
      filename: string;
      mimeTypes: Array<{ type: string; description: string; suffixes: string }>;
    }> = [];

    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      if (!plugin) continue;

      const mimeTypes: Array<{
        type: string;
        description: string;
        suffixes: string;
      }> = [];

      for (let j = 0; j < plugin.length; j++) {
        const mime = plugin[j];
        if (mime) {
          mimeTypes.push({
            type: mime.type,
            description: mime.description,
            suffixes: mime.suffixes,
          });
        }
      }

      result.push({
        name: plugin.name,
        description: plugin.description,
        filename: plugin.filename,
        mimeTypes,
      });
    }

    return result;
  });

  if (plugins && plugins.length > 0) {
    config["navigator.plugins"] = plugins;
  }

  // PDF Viewer
  config["pdfViewerEnabled"] = safeGet(() => navigator.pdfViewerEnabled);

  return config;
}

/**
 * Detect Screen properties
 */
export function detectScreen(): CamoufoxConfig {
  const config: CamoufoxConfig = {};

  config["screen.availHeight"] = safeGet(() => screen.availHeight);
  config["screen.availWidth"] = safeGet(() => screen.availWidth);
  config["screen.availTop"] = safeGet(() => screen.availTop);
  config["screen.availLeft"] = safeGet(() => screen.availLeft);
  config["screen.height"] = safeGet(() => screen.height);
  config["screen.width"] = safeGet(() => screen.width);
  config["screen.colorDepth"] = safeGet(() => screen.colorDepth);
  config["screen.pixelDepth"] = safeGet(() => screen.pixelDepth);

  // These are actually on window, but listed under screen in properties.json
  config["screen.pageXOffset"] = safeGet(() => window.pageXOffset);
  config["screen.pageYOffset"] = safeGet(() => window.pageYOffset);

  return config;
}

/**
 * Detect Window properties
 */
export function detectWindow(): CamoufoxConfig {
  const config: CamoufoxConfig = {};

  config["window.scrollMinX"] = safeGet(() => window.scrollMinX ?? 0);
  config["window.scrollMinY"] = safeGet(() => window.scrollMinY ?? 0);
  config["window.scrollMaxX"] = safeGet(
    () => window.scrollMaxX ?? document.documentElement.scrollWidth - window.innerWidth
  );
  config["window.scrollMaxY"] = safeGet(
    () => window.scrollMaxY ?? document.documentElement.scrollHeight - window.innerHeight
  );
  config["window.outerHeight"] = safeGet(() => window.outerHeight);
  config["window.outerWidth"] = safeGet(() => window.outerWidth);
  config["window.innerHeight"] = safeGet(() => window.innerHeight);
  config["window.innerWidth"] = safeGet(() => window.innerWidth);
  config["window.screenX"] = safeGet(() => window.screenX);
  config["window.screenY"] = safeGet(() => window.screenY);
  config["window.history.length"] = safeGet(() => window.history.length);
  config["window.devicePixelRatio"] = safeGet(() => window.devicePixelRatio);

  return config;
}

/**
 * Detect Document Body properties
 */
export function detectDocument(): CamoufoxConfig {
  const config: CamoufoxConfig = {};

  config["document.body.clientWidth"] = safeGet(
    () => document.body?.clientWidth ?? document.documentElement.clientWidth
  );
  config["document.body.clientHeight"] = safeGet(
    () => document.body?.clientHeight ?? document.documentElement.clientHeight
  );
  config["document.body.clientTop"] = safeGet(
    () => document.body?.clientTop ?? 0
  );
  config["document.body.clientLeft"] = safeGet(
    () => document.body?.clientLeft ?? 0
  );

  return config;
}

/**
 * Detect Battery API (async)
 */
export async function detectBattery(): Promise<CamoufoxConfig> {
  const config: CamoufoxConfig = {};

  if (!navigator.getBattery) {
    return config;
  }

  try {
    const battery = await navigator.getBattery();
    config["battery:charging"] = battery.charging;
    config["battery:chargingTime"] = battery.chargingTime;
    config["battery:dischargingTime"] = battery.dischargingTime;
    config["battery:level"] = battery.level;
  } catch {
    // Battery API not available
  }

  return config;
}

/**
 * Detect Geolocation (async, requires permission)
 */
export async function detectGeolocation(): Promise<CamoufoxConfig> {
  const config: CamoufoxConfig = {};

  if (!navigator.geolocation) {
    return config;
  }

  try {
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 0,
        });
      }
    );

    config["geolocation:latitude"] = position.coords.latitude;
    config["geolocation:longitude"] = position.coords.longitude;
    config["geolocation:accuracy"] = position.coords.accuracy;
  } catch {
    // Permission denied or timeout
  }

  return config;
}

/**
 * Detect Timezone and Locale
 */
export function detectTimezoneLocale(): CamoufoxConfig {
  const config: CamoufoxConfig = {};

  // Timezone
  config["timezone"] = safeGet(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // Locale parsing
  const locale = navigator.language || "en-US";
  const parts = locale.split("-");

  config["locale:language"] = parts[0];
  config["locale:region"] = parts[1] || "";
  config["locale:script"] = ""; // Script is rarely in navigator.language
  config["locale:all"] = locale;

  return config;
}

/**
 * Detect Audio Context properties
 */
export function detectAudioContext(): CamoufoxConfig {
  const config: CamoufoxConfig = {};

  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return config;

    const ctx = new AudioContextClass();

    config["AudioContext:sampleRate"] = ctx.sampleRate;
    config["AudioContext:maxChannelCount"] = ctx.destination.maxChannelCount;

    // outputLatency may not be available in all browsers
    if ("outputLatency" in ctx) {
      config["AudioContext:outputLatency"] = (ctx as { outputLatency: number }).outputLatency;
    }

    ctx.close();
  } catch {
    // AudioContext not available
  }

  return config;
}

/**
 * Detect WebGL properties
 */
export function detectWebGL(): CamoufoxConfig {
  const config: CamoufoxConfig = {};

  const canvas = document.createElement("canvas");

  // WebGL 1
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
  if (gl) {
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      config["webGl:renderer"] = gl.getParameter(
        debugInfo.UNMASKED_RENDERER_WEBGL
      );
      config["webGl:vendor"] = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    }

    config["webGl:supportedExtensions"] = gl.getSupportedExtensions() || [];
    config["webGl:contextAttributes"] = gl.getContextAttributes() || {};

    // Get WebGL parameters
    config["webGl:parameters"] = getWebGLParameters(gl);
    config["webGl:shaderPrecisionFormats"] = getShaderPrecisionFormats(gl);
  }

  // WebGL 2
  const gl2 = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
  if (gl2) {
    config["webGl2:supportedExtensions"] = gl2.getSupportedExtensions() || [];
    config["webGl2:contextAttributes"] = gl2.getContextAttributes() || {};
    config["webGl2:parameters"] = getWebGLParameters(gl2);
    config["webGl2:shaderPrecisionFormats"] = getShaderPrecisionFormats(gl2);
  }

  return config;
}

/**
 * Get WebGL parameters as hex-keyed dict
 */
function getWebGLParameters(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  // Common parameters to capture
  const paramIds = [
    gl.MAX_TEXTURE_SIZE,
    gl.MAX_VIEWPORT_DIMS,
    gl.MAX_VERTEX_ATTRIBS,
    gl.MAX_VERTEX_UNIFORM_VECTORS,
    gl.MAX_VARYING_VECTORS,
    gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
    gl.MAX_TEXTURE_IMAGE_UNITS,
    gl.MAX_FRAGMENT_UNIFORM_VECTORS,
    gl.MAX_CUBE_MAP_TEXTURE_SIZE,
    gl.MAX_RENDERBUFFER_SIZE,
    gl.ALIASED_LINE_WIDTH_RANGE,
    gl.ALIASED_POINT_SIZE_RANGE,
    gl.RED_BITS,
    gl.GREEN_BITS,
    gl.BLUE_BITS,
    gl.ALPHA_BITS,
    gl.DEPTH_BITS,
    gl.STENCIL_BITS,
    gl.SUBPIXEL_BITS,
  ];

  for (const paramId of paramIds) {
    if (paramId !== undefined) {
      try {
        const value = gl.getParameter(paramId);
        const hexKey = "0x" + paramId.toString(16).toUpperCase().padStart(4, "0");
        if (value instanceof Float32Array || value instanceof Int32Array) {
          params[hexKey] = Array.from(value);
        } else {
          params[hexKey] = value;
        }
      } catch {
        // Skip unavailable parameters
      }
    }
  }

  return params;
}

/**
 * Get shader precision formats
 */
function getShaderPrecisionFormats(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): Record<string, unknown> {
  const formats: Record<string, unknown> = {};

  const shaderTypes = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER];
  const precisionTypes = [gl.LOW_FLOAT, gl.MEDIUM_FLOAT, gl.HIGH_FLOAT, gl.LOW_INT, gl.MEDIUM_INT, gl.HIGH_INT];

  for (const shaderType of shaderTypes) {
    const shaderKey = shaderType === gl.VERTEX_SHADER ? "vertex" : "fragment";
    formats[shaderKey] = {};

    for (const precisionType of precisionTypes) {
      try {
        const format = gl.getShaderPrecisionFormat(shaderType, precisionType);
        if (format) {
          const precisionKey = getPrecisionName(gl, precisionType);
          (formats[shaderKey] as Record<string, unknown>)[precisionKey] = {
            rangeMin: format.rangeMin,
            rangeMax: format.rangeMax,
            precision: format.precision,
          };
        }
      } catch {
        // Skip
      }
    }
  }

  return formats;
}

function getPrecisionName(gl: WebGLRenderingContext | WebGL2RenderingContext, precision: number): string {
  switch (precision) {
    case gl.LOW_FLOAT:
      return "lowFloat";
    case gl.MEDIUM_FLOAT:
      return "mediumFloat";
    case gl.HIGH_FLOAT:
      return "highFloat";
    case gl.LOW_INT:
      return "lowInt";
    case gl.MEDIUM_INT:
      return "mediumInt";
    case gl.HIGH_INT:
      return "highInt";
    default:
      return `unknown_${precision}`;
  }
}

/**
 * Detect Media Devices (async)
 */
export async function detectMediaDevices(): Promise<CamoufoxConfig> {
  const config: CamoufoxConfig = {};

  if (!navigator.mediaDevices?.enumerateDevices) {
    return config;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    let micros = 0;
    let webcams = 0;
    let speakers = 0;

    for (const device of devices) {
      if (device.kind === "audioinput") micros++;
      else if (device.kind === "videoinput") webcams++;
      else if (device.kind === "audiooutput") speakers++;
    }

    config["mediaDevices:micros"] = micros;
    config["mediaDevices:webcams"] = webcams;
    config["mediaDevices:speakers"] = speakers;
  } catch {
    // Permission denied
  }

  return config;
}

/**
 * Detect Media Queries
 */
export function detectMediaQueries(): CamoufoxConfig {
  const config: CamoufoxConfig = {};

  // prefers-color-scheme
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    config["mediaQuery:prefers-color-scheme"] = "dark";
  } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    config["mediaQuery:prefers-color-scheme"] = "light";
  } else {
    config["mediaQuery:prefers-color-scheme"] = "no-preference";
  }

  // prefers-reduced-motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    config["mediaQuery:prefers-reduced-motion"] = "reduce";
  } else {
    config["mediaQuery:prefers-reduced-motion"] = "no-preference";
  }

  // prefers-contrast
  if (window.matchMedia("(prefers-contrast: more)").matches) {
    config["mediaQuery:prefers-contrast"] = "more";
  } else if (window.matchMedia("(prefers-contrast: less)").matches) {
    config["mediaQuery:prefers-contrast"] = "less";
  } else if (window.matchMedia("(prefers-contrast: custom)").matches) {
    config["mediaQuery:prefers-contrast"] = "custom";
  } else {
    config["mediaQuery:prefers-contrast"] = "no-preference";
  }

  // forced-colors
  if (window.matchMedia("(forced-colors: active)").matches) {
    config["mediaQuery:forced-colors"] = "active";
  } else {
    config["mediaQuery:forced-colors"] = "none";
  }

  // inverted-colors
  if (window.matchMedia("(inverted-colors: inverted)").matches) {
    config["mediaQuery:inverted-colors"] = "inverted";
  } else {
    config["mediaQuery:inverted-colors"] = "none";
  }

  // pointer
  if (window.matchMedia("(pointer: fine)").matches) {
    config["mediaQuery:pointer"] = "fine";
  } else if (window.matchMedia("(pointer: coarse)").matches) {
    config["mediaQuery:pointer"] = "coarse";
  } else {
    config["mediaQuery:pointer"] = "none";
  }

  // hover
  if (window.matchMedia("(hover: hover)").matches) {
    config["mediaQuery:hover"] = "hover";
  } else {
    config["mediaQuery:hover"] = "none";
  }

  // any-pointer
  if (window.matchMedia("(any-pointer: fine)").matches) {
    config["mediaQuery:any-pointer"] = "fine";
  } else if (window.matchMedia("(any-pointer: coarse)").matches) {
    config["mediaQuery:any-pointer"] = "coarse";
  } else {
    config["mediaQuery:any-pointer"] = "none";
  }

  // any-hover
  if (window.matchMedia("(any-hover: hover)").matches) {
    config["mediaQuery:any-hover"] = "hover";
  } else {
    config["mediaQuery:any-hover"] = "none";
  }

  // monochrome
  config["mediaQuery:monochrome"] = window.matchMedia("(monochrome)").matches;

  // color
  config["mediaQuery:color"] = window.matchMedia("(color)").matches;

  return config;
}

/**
 * Detect Network Information API (Chrome only)
 */
export function detectNetworkInfo(): CamoufoxConfig {
  const config: CamoufoxConfig = {};

  const connection = navigator.connection;
  if (!connection) {
    return config;
  }

  if (connection.type !== undefined) {
    config["net-info-api:type"] = connection.type;
  }
  if (connection.effectiveType !== undefined) {
    config["net-info-api:effectiveType"] = connection.effectiveType;
  }
  if (connection.downlink !== undefined) {
    config["net-info-api:downlink"] = connection.downlink;
  }
  if (connection.downlinkMax !== undefined) {
    config["net-info-api:downlinkMax"] = connection.downlinkMax;
  }
  if (connection.rtt !== undefined) {
    config["net-info-api:rtt"] = connection.rtt;
  }
  if (connection.saveData !== undefined) {
    config["net-info-api:saveData"] = connection.saveData;
  }

  return config;
}

/**
 * Detect User Agent Client Hints (async, Chrome only)
 */
export async function detectUAClientHints(): Promise<CamoufoxConfig> {
  const config: CamoufoxConfig = {};

  const uaData = navigator.userAgentData;
  if (!uaData) {
    return config;
  }

  // Low-entropy values (always available)
  config["navigator.userAgentData:brands"] = uaData.brands;
  config["navigator.userAgentData:mobile"] = uaData.mobile;
  config["navigator.userAgentData:platform"] = uaData.platform;

  // High-entropy values (require async call)
  try {
    const hints = await uaData.getHighEntropyValues([
      "architecture",
      "bitness",
      "model",
      "platformVersion",
      "fullVersionList",
      "wow64",
    ]);

    if (hints.architecture !== undefined) {
      config["navigator.userAgentData:architecture"] = hints.architecture;
    }
    if (hints.bitness !== undefined) {
      config["navigator.userAgentData:bitness"] = hints.bitness;
    }
    if (hints.model !== undefined) {
      config["navigator.userAgentData:model"] = hints.model;
    }
    if (hints.platformVersion !== undefined) {
      config["navigator.userAgentData:platformVersion"] = hints.platformVersion;
    }
    if (hints.fullVersionList !== undefined) {
      config["navigator.userAgentData:fullVersionList"] = hints.fullVersionList;
    }
    if (hints.wow64 !== undefined) {
      config["navigator.userAgentData:wow64"] = hints.wow64;
    }
  } catch {
    // High-entropy values not available
  }

  return config;
}

/**
 * Detect Media Codec support
 */
export function detectMediaCodecs(): CamoufoxConfig {
  const config: CamoufoxConfig = {};

  const video = document.createElement("video");
  const audio = document.createElement("audio");

  const codecs: Record<string, string> = {};

  // Video codecs
  const videoTypes = [
    "video/mp4",
    'video/mp4; codecs="avc1.42E01E"',
    'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    "video/webm",
    'video/webm; codecs="vp8"',
    'video/webm; codecs="vp9"',
    'video/webm; codecs="vp8, vorbis"',
    "video/ogg",
    'video/ogg; codecs="theora"',
  ];

  for (const type of videoTypes) {
    const result = video.canPlayType(type);
    if (result) {
      codecs[type] = result;
    }
  }

  // Audio codecs
  const audioTypes = [
    "audio/mpeg",
    "audio/mp4",
    'audio/mp4; codecs="mp4a.40.2"',
    "audio/ogg",
    'audio/ogg; codecs="vorbis"',
    'audio/ogg; codecs="opus"',
    "audio/webm",
    'audio/webm; codecs="vorbis"',
    'audio/webm; codecs="opus"',
    "audio/wav",
    "audio/flac",
    "audio/aac",
  ];

  for (const type of audioTypes) {
    const result = audio.canPlayType(type);
    if (result) {
      codecs[type] = result;
    }
  }

  config["mediaCodec:overrides"] = codecs;

  return config;
}

/**
 * Detect Speech Synthesis Voices (async)
 */
export async function detectVoices(): Promise<CamoufoxConfig> {
  const config: CamoufoxConfig = {};

  if (!window.speechSynthesis) {
    return config;
  }

  // Voices may not be immediately available
  const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      let voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      // Wait for voiceschanged event
      const handler = () => {
        voices = speechSynthesis.getVoices();
        speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve(voices);
      };

      speechSynthesis.addEventListener("voiceschanged", handler);

      // Timeout after 2 seconds
      setTimeout(() => {
        speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve(speechSynthesis.getVoices());
      }, 2000);
    });
  };

  try {
    const voices = await getVoices();

    config["voices"] = voices.map((voice) => ({
      lang: voice.lang,
      name: voice.name,
      uri: voice.voiceURI,
      isDefault: voice.default,
      isLocal: voice.localService,
    }));
  } catch {
    // Voices not available
  }

  return config;
}

/**
 * Detect browser-specific APIs
 * These APIs help identify which browser is actually being used,
 * regardless of what the User-Agent claims.
 */
export function detectBrowserAPIs(): BrowserAPIDetection {
  const win = window as unknown as Record<string, unknown>;
  const perf = performance as unknown as Record<string, unknown>;

  // Check each browser-specific API
  const hasUserAgentData = "userAgentData" in navigator;
  const hasWindowChrome = "chrome" in win;
  const hasPerformanceMemory = "memory" in perf;
  const hasWindowWebkit = "webkit" in win;
  const hasInstallTrigger = "InstallTrigger" in win;
  const hasWindowOpera = "opera" in win || "opr" in win;

  // Determine browser from API presence
  let detectedBrowser: BrowserAPIDetection["detectedBrowser"] = "unknown";
  if (hasInstallTrigger) {
    detectedBrowser = "firefox";
  } else if (hasWindowWebkit && !hasWindowChrome) {
    detectedBrowser = "safari";
  } else if (hasWindowOpera) {
    detectedBrowser = "opera";
  } else if (hasWindowChrome && hasUserAgentData) {
    detectedBrowser = "chrome";
  } else if (hasWindowChrome) {
    // Chrome without userAgentData could be older Chrome or Edge
    detectedBrowser = "chrome";
  }

  return {
    hasUserAgentData,
    hasWindowChrome,
    hasPerformanceMemory,
    hasWindowWebkit,
    hasInstallTrigger,
    hasWindowOpera,
    vendor: navigator.vendor || "",
    vendorSub: navigator.vendorSub || "",
    detectedBrowser,
  };
}

/**
 * Detect all fingerprint properties
 */
export async function detectAll(
  options: {
    skipGeolocation?: boolean;
  } = {}
): Promise<DetectionResult> {
  const config: CamoufoxConfig = {};
  const unavailable: string[] = [];
  const errors: string[] = [];

  // Sync detectors
  Object.assign(config, detectNavigator());
  Object.assign(config, detectScreen());
  Object.assign(config, detectWindow());
  Object.assign(config, detectDocument());
  Object.assign(config, detectTimezoneLocale());
  Object.assign(config, detectAudioContext());
  Object.assign(config, detectWebGL());
  Object.assign(config, detectMediaQueries());
  Object.assign(config, detectNetworkInfo());
  Object.assign(config, detectMediaCodecs());

  // Browser-specific API detection
  const browserAPIs = detectBrowserAPIs();
  config["browserAPIs:hasUserAgentData"] = browserAPIs.hasUserAgentData;
  config["browserAPIs:hasWindowChrome"] = browserAPIs.hasWindowChrome;
  config["browserAPIs:hasPerformanceMemory"] = browserAPIs.hasPerformanceMemory;
  config["browserAPIs:hasWindowWebkit"] = browserAPIs.hasWindowWebkit;
  config["browserAPIs:hasInstallTrigger"] = browserAPIs.hasInstallTrigger;
  config["browserAPIs:hasWindowOpera"] = browserAPIs.hasWindowOpera;
  config["browserAPIs:vendor"] = browserAPIs.vendor;
  config["browserAPIs:vendorSub"] = browserAPIs.vendorSub;
  config["browserAPIs:detectedBrowser"] = browserAPIs.detectedBrowser;

  // Async detectors
  const asyncResults = await Promise.allSettled([
    detectBattery(),
    options.skipGeolocation ? Promise.resolve({}) : detectGeolocation(),
    detectMediaDevices(),
    detectUAClientHints(),
    detectVoices(),
  ]);

  for (const result of asyncResults) {
    if (result.status === "fulfilled") {
      Object.assign(config, result.value);
    } else {
      errors.push(result.reason?.message || "Unknown error");
    }
  }

  // Track unavailable APIs
  if (!navigator.getBattery) {
    unavailable.push("Battery API");
  }
  if (!navigator.connection) {
    unavailable.push("Network Information API");
  }
  if (!navigator.userAgentData) {
    unavailable.push("User Agent Client Hints");
  }
  if (!window.speechSynthesis) {
    unavailable.push("Speech Synthesis");
  }

  // Remove undefined values
  for (const key of Object.keys(config)) {
    if (config[key] === undefined) {
      delete config[key];
    }
  }

  return { config, unavailable, errors };
}
