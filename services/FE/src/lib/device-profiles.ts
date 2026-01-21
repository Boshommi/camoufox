/**
 * Device Profile Templates for Camoufox
 * Predefined configurations for different browser/device combinations
 *
 * These profiles include:
 * - Navigator properties matching real browsers
 * - WebGL vendor/renderer for the device's GPU
 * - :hide flags for browser-specific APIs that should be hidden
 * - Media query values for touch devices
 */

import type { CamoufoxConfig } from "./fingerprint-collector";

export type DeviceType = "ios-safari" | "macos-safari" | "android-chrome";

/**
 * iOS Safari profile (iPhone 15 Pro, iOS 18.3)
 */
export const IOS_SAFARI_PROFILE: CamoufoxConfig = {
  // Navigator properties
  "navigator.userAgent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1",
  "navigator.appCodeName": "Mozilla",
  "navigator.appName": "Netscape",
  "navigator.appVersion":
    "5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1",
  "navigator.language": "en-US",
  "navigator.platform": "iPhone",
  "navigator.product": "Gecko",
  "navigator.productSub": "20030107",
  "navigator.languages": ["en-US"],
  "navigator.vendor": "Apple Computer, Inc.",
  "navigator.vendorSub": "",
  "navigator.webdriver": false,
  "navigator.userAgentData": false,
  "navigator.hardwareConcurrency": 8,

  // Touch support (critical for iOS Safari detection)
  "navigator.maxTouchPoints": 5,
  "window.TouchEvent": true,

  // Media queries for touch device (critical for iOS Safari detection)
  "mediaQuery:hover": "none",
  "mediaQuery:pointer": "coarse",
  "mediaQuery:any-hover": "none",
  "mediaQuery:any-pointer": "coarse",

  // Hide Firefox-specific navigator properties
  "navigator.buildID:hide": true,
  "navigator.oscpu:hide": true,
  "navigator.doNotTrack:hide": true,
  "navigator.globalPrivacyControl:hide": true,
  "navigator.getBattery:hide": true,
  "navigator.connection:hide": true,
  "window.InstallTrigger:hide": true,

  // Safari-specific APIs
  "window.webkit": false, // iOS Safari on data: URLs reports false
  "window.safari": false, // iOS Safari doesn't expose window.safari

  // Hide SharedArrayBuffer (iOS Safari doesn't have it)
  "window.SharedArrayBuffer:hide": true,

  // WebGL spoofing for Safari (using numeric parameter keys)
  // GL_VENDOR = 0x1F00 = 7936, GL_RENDERER = 0x1F01 = 7937
  // UNMASKED_VENDOR_WEBGL = 0x9245 = 37445, UNMASKED_RENDERER_WEBGL = 0x9246 = 37446
  // SHADING_LANGUAGE_VERSION = 0x8B8C = 35724
  "webGl:parameters": {
    "7936": "WebKit", // GL_VENDOR
    "7937": "WebKit WebGL", // GL_RENDERER
    "37445": "Apple Inc.", // UNMASKED_VENDOR_WEBGL
    "37446": "Apple GPU", // UNMASKED_RENDERER_WEBGL
    "35724": "WebGL GLSL ES 1.0 (1.0)", // SHADING_LANGUAGE_VERSION
  },

  // WebGL extensions list for iOS Safari (29 extensions)
  "webGl:supportedExtensions": [
    "ANGLE_instanced_arrays",
    "EXT_blend_minmax",
    "EXT_clip_control",
    "EXT_color_buffer_half_float",
    "EXT_depth_clamp",
    "EXT_frag_depth",
    "EXT_polygon_offset_clamp",
    "EXT_sRGB",
    "EXT_shader_texture_lod",
    "EXT_texture_filter_anisotropic",
    "EXT_texture_mirror_clamp_to_edge",
    "KHR_parallel_shader_compile",
    "OES_element_index_uint",
    "OES_fbo_render_mipmap",
    "OES_standard_derivatives",
    "OES_texture_float",
    "OES_texture_half_float",
    "OES_texture_half_float_linear",
    "OES_vertex_array_object",
    "WEBGL_blend_func_extended",
    "WEBGL_color_buffer_float",
    "WEBGL_compressed_texture_astc",
    "WEBGL_compressed_texture_etc",
    "WEBGL_compressed_texture_etc1",
    "WEBGL_debug_renderer_info",
    "WEBGL_debug_shaders",
    "WEBGL_depth_texture",
    "WEBGL_draw_buffers",
    "WEBGL_lose_context",
    "WEBGL_multi_draw",
    "WEBGL_polygon_mode",
  ],

  // Screen dimensions (iPhone 15 Pro)
  "screen.width": 393,
  "screen.height": 852,
  "screen.availWidth": 393,
  "screen.availHeight": 852,
  "screen.colorDepth": 24,
  "screen.pixelDepth": 24,

  // Window dimensions (Safari mobile viewport)
  "window.innerWidth": 980,
  "window.innerHeight": 1643,
  "window.outerWidth": 393,
  "window.outerHeight": 852,
  "window.devicePixelRatio": 3,

  // Voices - block all since iOS Safari returns empty on data: URLs
  voices: [],
  "voices:blockIfNotDefined": true,
};

/**
 * macOS Safari profile
 */
export const MACOS_SAFARI_PROFILE: CamoufoxConfig = {
  // Navigator properties
  "navigator.userAgent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  "navigator.appCodeName": "Mozilla",
  "navigator.appName": "Netscape",
  "navigator.appVersion":
    "5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  "navigator.language": "en-US",
  "navigator.platform": "MacIntel",
  "navigator.product": "Gecko",
  "navigator.productSub": "20030107",
  "navigator.languages": ["en-US"],
  "navigator.vendor": "Apple Computer, Inc.",
  "navigator.vendorSub": "",
  "navigator.webdriver": false,

  // Firefox-specific APIs to HIDE (Safari doesn't have these)
  "navigator.buildID:hide": true,
  "navigator.oscpu:hide": true,
  "navigator.doNotTrack:hide": true,
  "navigator.globalPrivacyControl:hide": true,
  "navigator.getBattery:hide": true,
  "navigator.connection:hide": true,

  // Chrome-specific APIs to HIDE
  "navigator.userAgentData": false,
  "window.chrome": false,
  "performance.memory": false,

  // Firefox-specific APIs to HIDE
  "window.InstallTrigger:hide": true,

  // Safari-specific APIs - macOS Safari does NOT expose window.webkit (only iOS does)
  "window.webkit": false,
  // macOS Safari has a window.safari object for push notifications
  "window.safari": true,
  // Safari exposes TouchEvent constructor even on non-touch devices
  "window.TouchEvent": true,
  // Safari doesn't expose SharedArrayBuffer in certain configurations
  "window.SharedArrayBuffer:hide": true,

  // WebGL spoofing for Safari
  "webGl:vendor": "Apple Inc.",
  "webGl:renderer": "Apple GPU",
  "webGl:parameters": {
    "7936": "WebKit",
    "7937": "WebKit WebGL",
    "37445": "Apple Inc.",
    "37446": "Apple GPU",
    "35724": "WebGL GLSL ES 1.0 (1.0)",
  },

  // Display
  "window.devicePixelRatio": 2,

  // macOS Safari voices (Apple TTS) - sample subset
  voices: [
    {
      lang: "en-US",
      name: "Samantha",
      voiceUri: "com.apple.voice.compact.en-US.Samantha",
      isDefault: true,
      isLocalService: true,
    },
    {
      lang: "en-US",
      name: "Alex",
      voiceUri: "com.apple.speech.synthesis.voice.Alex",
      isDefault: true,
      isLocalService: true,
    },
    {
      lang: "en-US",
      name: "Fred",
      voiceUri: "com.apple.speech.synthesis.voice.Fred",
      isDefault: true,
      isLocalService: true,
    },
    {
      lang: "en-GB",
      name: "Daniel",
      voiceUri: "com.apple.voice.compact.en-GB.Daniel",
      isDefault: true,
      isLocalService: true,
    },
    {
      lang: "en-AU",
      name: "Karen",
      voiceUri: "com.apple.voice.compact.en-AU.Karen",
      isDefault: true,
      isLocalService: true,
    },
  ],
  "voices:blockIfNotDefined": true,
};

/**
 * Android Chrome profile (Pixel 7)
 */
export const ANDROID_CHROME_PROFILE: CamoufoxConfig = {
  // Navigator properties
  "navigator.userAgent":
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "navigator.appCodeName": "Mozilla",
  "navigator.appName": "Netscape",
  "navigator.appVersion":
    "5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "navigator.language": "en-US",
  "navigator.platform": "Linux armv8l",
  "navigator.product": "Gecko",
  "navigator.productSub": "20030107",
  "navigator.languages": ["en-US", "en"],
  "navigator.vendor": "Google Inc.",
  "navigator.vendorSub": "",
  "navigator.webdriver": false,
  "navigator.hardwareConcurrency": 8,

  // Touch support
  "navigator.maxTouchPoints": 5,
  "window.TouchEvent": true,

  // Media queries for touch device
  "mediaQuery:hover": "none",
  "mediaQuery:pointer": "coarse",
  "mediaQuery:any-hover": "none",
  "mediaQuery:any-pointer": "coarse",

  // Hide Firefox-specific navigator properties
  "navigator.buildID:hide": true,
  "navigator.oscpu:hide": true,
  "window.InstallTrigger:hide": true,

  // Chrome has window.chrome object
  "window.chrome": true,

  // WebGL for Android (Qualcomm Adreno)
  "webGl:parameters": {
    "7936": "WebKit",
    "7937": "WebKit WebGL",
    "37445": "Qualcomm",
    "37446": "Adreno (TM) 730",
    "35724": "WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0)",
  },

  // Screen dimensions (Pixel 7)
  "screen.width": 412,
  "screen.height": 915,
  "screen.availWidth": 412,
  "screen.availHeight": 857,
  "screen.colorDepth": 24,
  "screen.pixelDepth": 24,

  // Window dimensions
  "window.innerWidth": 412,
  "window.innerHeight": 787,
  "window.outerWidth": 412,
  "window.outerHeight": 857,
  "window.devicePixelRatio": 2.625,
};

/**
 * Map of device types to their profiles
 */
export const DEVICE_PROFILES: Record<DeviceType, CamoufoxConfig> = {
  "ios-safari": IOS_SAFARI_PROFILE,
  "macos-safari": MACOS_SAFARI_PROFILE,
  "android-chrome": ANDROID_CHROME_PROFILE,
};

/**
 * Human-readable names for device types
 */
export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  "ios-safari": "iOS Safari (iPhone 15 Pro)",
  "macos-safari": "macOS Safari",
  "android-chrome": "Android Chrome (Pixel 7)",
};

/**
 * Get a device profile by type
 */
export function getDeviceProfile(deviceType: DeviceType): CamoufoxConfig {
  return { ...DEVICE_PROFILES[deviceType] };
}

/**
 * Get all available device types
 */
export function getAvailableDeviceTypes(): DeviceType[] {
  return Object.keys(DEVICE_PROFILES) as DeviceType[];
}

/**
 * Check if a device type is valid
 */
export function isValidDeviceType(type: string): type is DeviceType {
  return type in DEVICE_PROFILES;
}

/**
 * Merge a collected fingerprint with a device profile base
 * Device profile values take precedence for critical fingerprinting properties
 */
export function mergeWithDeviceProfile(
  fingerprint: CamoufoxConfig,
  deviceType: DeviceType
): CamoufoxConfig {
  const profile = getDeviceProfile(deviceType);

  // Start with fingerprint data
  const merged: CamoufoxConfig = { ...fingerprint };

  // Overlay device profile values (profile takes precedence for key spoofing properties)
  for (const [key, value] of Object.entries(profile)) {
    // Always apply :hide flags from profile
    if (key.endsWith(":hide")) {
      merged[key] = value;
    }
    // Always apply navigator properties from profile
    else if (key.startsWith("navigator.")) {
      merged[key] = value;
    }
    // Always apply WebGL spoofing from profile
    else if (key.startsWith("webGl:")) {
      merged[key] = value;
    }
    // Always apply window browser-specific properties from profile
    else if (
      key === "window.webkit" ||
      key === "window.safari" ||
      key === "window.chrome" ||
      key === "window.InstallTrigger:hide" ||
      key === "window.TouchEvent" ||
      key === "window.SharedArrayBuffer:hide"
    ) {
      merged[key] = value;
    }
    // Always apply media queries from profile
    else if (key.startsWith("mediaQuery:")) {
      merged[key] = value;
    }
    // Always apply voice settings from profile
    else if (key === "voices" || key === "voices:blockIfNotDefined") {
      merged[key] = value;
    }
    // For other keys, keep fingerprint value if it exists
    else if (!(key in merged)) {
      merged[key] = value;
    }
  }

  return merged;
}
