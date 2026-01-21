/**
 * Yandex Metrica Browser-Info Parameter Generator
 * COMPLETE replica of the original watch_serp.js implementation
 * Including ALL fingerprinting functions
 *
 * For educational/analysis purposes only
 */

(function (window) {
  "use strict";

  // ============================================================
  // CONSTANTS
  // ============================================================

  const CONFIG = {
    scriptVersion: "2331",
    versionFingerprint: "1h8a0283oo1wlrv7ijjcrxe4n5o66",
    host: "mc.yandex.ru",
    protocol: "https:",
    maxTitleLength: 400,
    maxUrlLength: 2048,
    noindexValue: "noindex",
  };

  const NETWORK_TYPES = [
    "other",
    "none",
    "unknown",
    "wifi",
    "ethernet",
    "bluetooth",
    "cellular",
    "wimax",
    "mixed",
  ];

  // Font list for fingerprinting (dh array)
  const FONT_LIST = [
    "monospace",
    "sans-serif",
    "serif",
    "Andale Mono",
    "Arial",
    "Arial Black",
    "Arial Hebrew",
    "Arial MT",
    "Arial Narrow",
    "Arial Rounded MT Bold",
    "Arial Unicode MS",
    "Bitstream Vera Sans Mono",
    "Book Antiqua",
    "Bookman Old Style",
    "Calibri",
    "Cambria",
    "Cambria Math",
    "Century",
    "Century Gothic",
    "Century Schoolbook",
    "Comic Sans",
    "Comic Sans MS",
    "Consolas",
    "Courier",
    "Courier New",
    "Garamond",
    "Geneva",
    "Georgia",
    "Helvetica",
    "Helvetica Neue",
    "Impact",
    "Lucida Bright",
    "Lucida Calligraphy",
    "Lucida Console",
    "Lucida Fax",
    "LUCIDA GRANDE",
    "Lucida Handwriting",
    "Lucida Sans",
    "Lucida Sans Typewriter",
    "Lucida Sans Unicode",
    "Microsoft Sans Serif",
    "Monaco",
    "Monotype Corsiva",
    "MS Gothic",
    "MS Outlook",
    "MS PGothic",
    "MS Reference Sans Serif",
    "MS Sans Serif",
    "MS Serif",
    "MYRIAD",
    "MYRIAD PRO",
    "Palatino",
    "Palatino Linotype",
    "Segoe Print",
    "Segoe Script",
    "Segoe UI",
    "Segoe UI Light",
    "Segoe UI Semibold",
    "Segoe UI Symbol",
    "Tahoma",
    "Times",
    "Times New Roman",
    "Times New Roman PS",
    "Trebuchet MS",
    "Verdana",
    "Wingdings",
    "Wingdings 2",
    "Wingdings 3",
  ];

  // WebGL context types
  const WEBGL_CONTEXTS = ["webgl", "experimental-webgl"];

  // WebGL parameters to collect
  const WEBGL_PARAMS = [
    "ALIASED_LINE_WIDTH_RANGE",
    "ALIASED_POINT_SIZE_RANGE",
    "ALPHA_BITS",
    "BLUE_BITS",
    "DEPTH_BITS",
    "GREEN_BITS",
    "MAX_COMBINED_TEXTURE_IMAGE_UNITS",
    "MAX_CUBE_MAP_TEXTURE_SIZE",
    "MAX_FRAGMENT_UNIFORM_VECTORS",
    "MAX_RENDERBUFFER_SIZE",
    "MAX_TEXTURE_IMAGE_UNITS",
    "MAX_TEXTURE_SIZE",
    "MAX_VARYING_VECTORS",
    "MAX_VERTEX_ATTRIBS",
    "MAX_VERTEX_TEXTURE_IMAGE_UNITS",
    "MAX_VERTEX_UNIFORM_VECTORS",
    "MAX_VIEWPORT_DIMS",
    "RED_BITS",
    "RENDERER",
    "SHADING_LANGUAGE_VERSION",
    "STENCIL_BITS",
    "VENDOR",
    "VERSION",
  ];

  // Shader precision combinations
  const SHADER_PRECISION_FORMATS = [
    ["VERTEX_SHADER", "HIGH_FLOAT"],
    ["VERTEX_SHADER", "MEDIUM_FLOAT"],
    ["VERTEX_SHADER", "LOW_FLOAT"],
    ["FRAGMENT_SHADER", "HIGH_FLOAT"],
    ["FRAGMENT_SHADER", "MEDIUM_FLOAT"],
    ["FRAGMENT_SHADER", "LOW_FLOAT"],
    ["VERTEX_SHADER", "HIGH_INT"],
    ["VERTEX_SHADER", "MEDIUM_INT"],
    ["VERTEX_SHADER", "LOW_INT"],
    ["FRAGMENT_SHADER", "HIGH_INT"],
    ["FRAGMENT_SHADER", "MEDIUM_INT"],
    ["FRAGMENT_SHADER", "LOW_INT"],
  ];

  // Navigator properties for fingerprinting
  const NAVIGATOR_PROPS = [
    "userAgent",
    "language",
    "languages",
    "platform",
    "hardwareConcurrency",
    "deviceMemory",
    "maxTouchPoints",
    "cpuClass",
    "oscpu",
    "vendor",
    "vendorSub",
    "product",
    "productSub",
    "doNotTrack",
    "cookieEnabled",
    "appCodeName",
    "appName",
    "appVersion",
    "buildID",
  ];

  // Media queries to test
  const MEDIA_QUERIES = [
    "(prefers-color-scheme: dark)",
    "(prefers-color-scheme: light)",
    "(prefers-reduced-motion: reduce)",
    "(prefers-reduced-motion: no-preference)",
    "(inverted-colors: inverted)",
    "(inverted-colors: none)",
    "(forced-colors: active)",
    "(forced-colors: none)",
    "(prefers-contrast: high)",
    "(prefers-contrast: low)",
    "(prefers-contrast: no-preference)",
    "(monochrome)",
    "(color)",
    "(hover: hover)",
    "(hover: none)",
    "(pointer: fine)",
    "(pointer: coarse)",
    "(pointer: none)",
    "(any-hover: hover)",
    "(any-hover: none)",
    "(any-pointer: fine)",
    "(any-pointer: coarse)",
    "(any-pointer: none)",
  ];

  // Speech synthesis properties to collect
  const VOICE_PROPS = ["name", "lang", "localService", "voiceURI", "default"];

  // Media codec types for fingerprinting
  const MEDIA_TYPES = [
    "video/ogg",
    "video/mp4",
    "video/webm",
    "audio/x-aiff",
    "audio/x-m4a",
    "audio/mpeg",
    "audio/aac",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
  ];

  // Codec strings for canPlayType testing
  const MEDIA_CODECS = [
    "theora",
    "vorbis",
    "1",
    "avc1.4D401E",
    "mp4a.40.2",
    "vp8.0",
    "mp4a.40.5",
  ];

  // Screen available properties
  const SCREEN_AVAIL_PROPS = ["availWidth", "availHeight", "availTop"];

  // User Agent Client Hints properties
  const CLIENT_HINTS_PROPS = [
    "architecture",
    "bitness",
    "model",
    "platformVersion",
    "uaFullVersion",
    "fullVersionList",
  ];

  // WebRTC connection types
  const RTC_PEER_CONNECTIONS = [
    "RTCPeerConnection",
    "mozRTCPeerConnection",
    "webkitRTCPeerConnection",
  ];

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  function getProperty(obj, path) {
    if (!obj) return null;
    return path.split(".").reduce((acc, key) => {
      if (acc === null || acc === undefined) return null;
      try {
        return acc[key];
      } catch (e) {
        return null;
      }
    }, obj);
  }

  function isNullOrUndefined(val) {
    return val === null || val === undefined;
  }

  function isUndefined(val) {
    return val === undefined;
  }

  function isFunction(val) {
    return typeof val === "function";
  }

  function isString(val) {
    return typeof val === "string";
  }

  function hasLength(val) {
    return val && typeof val.length === "number";
  }

  function toBooleanInt(val) {
    return val ? 1 : null;
  }

  function toBinaryInt(val) {
    return val ? 1 : 0;
  }

  function padZero(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function randomInRange(min, max) {
    if (isUndefined(max)) {
      max = min;
      min = 1;
    }
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function contains(str, substr) {
    return str && str.indexOf(substr) !== -1;
  }

  function joinWith(separator, arr) {
    return Array.prototype.join.call(arr, separator);
  }

  function isNativeFunction(name, fn) {
    if (!fn || typeof fn !== "function") return false;
    try {
      const str = "" + fn;
      return str.indexOf("[native code]") !== -1;
    } catch (e) {
      return false;
    }
  }

  // ============================================================
  // MURMUR HASH (for fingerprint hashing)
  // ============================================================

  function murmurhash3_32(key, seed = 0) {
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

  // MurmurHash3 128-bit implementation (from tag.js Ll function)
  function murmurhash3_128(key, seed = 210) {
    // 64-bit math helper functions
    function mul64(a, b) {
      const a0 = [a[0] >>> 16, a[0] & 65535, a[1] >>> 16, a[1] & 65535];
      const b0 = [b[0] >>> 16, b[0] & 65535, b[1] >>> 16, b[1] & 65535];
      const c = [0, 0, 0, 0];
      c[3] += a0[3] * b0[3];
      c[2] += c[3] >>> 16;
      c[3] &= 65535;
      c[2] += a0[2] * b0[3];
      c[1] += c[2] >>> 16;
      c[2] &= 65535;
      c[2] += a0[3] * b0[2];
      c[1] += c[2] >>> 16;
      c[2] &= 65535;
      c[1] += a0[1] * b0[3];
      c[0] += c[1] >>> 16;
      c[1] &= 65535;
      c[1] += a0[2] * b0[2];
      c[0] += c[1] >>> 16;
      c[1] &= 65535;
      c[1] += a0[3] * b0[1];
      c[0] += c[1] >>> 16;
      c[1] &= 65535;
      c[0] += a0[0] * b0[3] + a0[1] * b0[2] + a0[2] * b0[1] + a0[3] * b0[0];
      c[0] &= 65535;
      return [(c[0] << 16) | c[1], (c[2] << 16) | c[3]];
    }

    function add64(a, b) {
      const a0 = [a[0] >>> 16, a[0] & 65535, a[1] >>> 16, a[1] & 65535];
      const b0 = [b[0] >>> 16, b[0] & 65535, b[1] >>> 16, b[1] & 65535];
      const c = [0, 0, 0, 0];
      c[3] += a0[3] + b0[3];
      c[2] += c[3] >>> 16;
      c[3] &= 65535;
      c[2] += a0[2] + b0[2];
      c[1] += c[2] >>> 16;
      c[2] &= 65535;
      c[1] += a0[1] + b0[1];
      c[0] += c[1] >>> 16;
      c[1] &= 65535;
      c[0] += a0[0] + b0[0];
      c[0] &= 65535;
      return [(c[0] << 16) | c[1], (c[2] << 16) | c[3]];
    }

    function rotl64(a, b) {
      b %= 64;
      if (b === 32) return [a[1], a[0]];
      if (b < 32) {
        return [
          (a[0] << b) | (a[1] >>> (32 - b)),
          (a[1] << b) | (a[0] >>> (32 - b)),
        ];
      }
      b -= 32;
      return [
        (a[1] << b) | (a[0] >>> (32 - b)),
        (a[0] << b) | (a[1] >>> (32 - b)),
      ];
    }

    function shl64(a, b) {
      b %= 64;
      if (b === 0) return a;
      if (b < 32) {
        return [(a[0] << b) | (a[1] >>> (32 - b)), a[1] << b];
      }
      return [a[1] << (b - 32), 0];
    }

    function xor64(a, b) {
      return [a[0] ^ b[0], a[1] ^ b[1]];
    }

    function fmix64(h) {
      h = xor64(h, [0, h[0] >>> 1]);
      h = mul64(h, [4283543511, 3981806797]);
      h = xor64(h, [0, h[0] >>> 1]);
      h = mul64(h, [3301882366, 444984403]);
      h = xor64(h, [0, h[0] >>> 1]);
      return h;
    }

    const c1 = [2277735313, 289559509];
    const c2 = [1291169091, 658871167];
    const str = key || "";
    const len = str.length;
    const nblocks = len - (len % 16);
    let h1 = [0, seed];
    let h2 = [0, seed];

    for (let i = 0; i < nblocks; i += 16) {
      let k1 = [
        (str.charCodeAt(i + 4) & 255) |
          ((str.charCodeAt(i + 5) & 255) << 8) |
          ((str.charCodeAt(i + 6) & 255) << 16) |
          ((str.charCodeAt(i + 7) & 255) << 24),
        (str.charCodeAt(i) & 255) |
          ((str.charCodeAt(i + 1) & 255) << 8) |
          ((str.charCodeAt(i + 2) & 255) << 16) |
          ((str.charCodeAt(i + 3) & 255) << 24),
      ];
      let k2 = [
        (str.charCodeAt(i + 12) & 255) |
          ((str.charCodeAt(i + 13) & 255) << 8) |
          ((str.charCodeAt(i + 14) & 255) << 16) |
          ((str.charCodeAt(i + 15) & 255) << 24),
        (str.charCodeAt(i + 8) & 255) |
          ((str.charCodeAt(i + 9) & 255) << 8) |
          ((str.charCodeAt(i + 10) & 255) << 16) |
          ((str.charCodeAt(i + 11) & 255) << 24),
      ];

      k1 = mul64(k1, c1);
      k1 = rotl64(k1, 31);
      k1 = mul64(k1, c2);
      h1 = xor64(h1, k1);
      h1 = rotl64(h1, 27);
      h1 = add64(h1, h2);
      h1 = add64(mul64(h1, [0, 5]), [0, 1390208809]);

      k2 = mul64(k2, c2);
      k2 = rotl64(k2, 33);
      k2 = mul64(k2, c1);
      h2 = xor64(h2, k2);
      h2 = rotl64(h2, 31);
      h2 = add64(h2, h1);
      h2 = add64(mul64(h2, [0, 5]), [0, 944331445]);
    }

    // Process remaining bytes
    const tail = len % 16;
    const tailStart = len - tail;
    let k1 = [0, 0];
    let k2 = [0, 0];

    /* eslint-disable no-fallthrough */
    switch (tail) {
      case 15:
        k2 = xor64(k2, shl64([0, str.charCodeAt(tailStart + 14)], 48));
      case 14:
        k2 = xor64(k2, shl64([0, str.charCodeAt(tailStart + 13)], 40));
      case 13:
        k2 = xor64(k2, shl64([0, str.charCodeAt(tailStart + 12)], 32));
      case 12:
        k2 = xor64(k2, shl64([0, str.charCodeAt(tailStart + 11)], 24));
      case 11:
        k2 = xor64(k2, shl64([0, str.charCodeAt(tailStart + 10)], 16));
      case 10:
        k2 = xor64(k2, shl64([0, str.charCodeAt(tailStart + 9)], 8));
      case 9:
        k2 = xor64(k2, [0, str.charCodeAt(tailStart + 8)]);
        k2 = mul64(k2, c2);
        k2 = rotl64(k2, 33);
        k2 = mul64(k2, c1);
        h2 = xor64(h2, k2);
      case 8:
        k1 = xor64(k1, shl64([0, str.charCodeAt(tailStart + 7)], 56));
      case 7:
        k1 = xor64(k1, shl64([0, str.charCodeAt(tailStart + 6)], 48));
      case 6:
        k1 = xor64(k1, shl64([0, str.charCodeAt(tailStart + 5)], 40));
      case 5:
        k1 = xor64(k1, shl64([0, str.charCodeAt(tailStart + 4)], 32));
      case 4:
        k1 = xor64(k1, shl64([0, str.charCodeAt(tailStart + 3)], 24));
      case 3:
        k1 = xor64(k1, shl64([0, str.charCodeAt(tailStart + 2)], 16));
      case 2:
        k1 = xor64(k1, shl64([0, str.charCodeAt(tailStart + 1)], 8));
      case 1:
        k1 = xor64(k1, [0, str.charCodeAt(tailStart)]);
        k1 = mul64(k1, c1);
        k1 = rotl64(k1, 31);
        k1 = mul64(k1, c2);
        h1 = xor64(h1, k1);
    }
    /* eslint-enable no-fallthrough */

    // Finalization
    h1 = xor64(h1, [0, len]);
    h2 = xor64(h2, [0, len]);
    h1 = add64(h1, h2);
    h2 = add64(h2, h1);
    h1 = fmix64(h1);
    h2 = fmix64(h2);
    h1 = add64(h1, h2);
    h2 = add64(h2, h1);

    // Return as hex string
    return (
      ("00000000" + (h1[0] >>> 0).toString(16)).slice(-8) +
      ("00000000" + (h1[1] >>> 0).toString(16)).slice(-8) +
      ("00000000" + (h2[0] >>> 0).toString(16)).slice(-8) +
      ("00000000" + (h2[1] >>> 0).toString(16)).slice(-8)
    );
  }

  // ============================================================
  // BASE64 ENCODING
  // ============================================================

  const BASE64_CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  function base64Encode(input) {
    let output = "";
    let i = 0;

    while (i < input.length) {
      const a = input.charCodeAt(i++);
      const b = input.charCodeAt(i++);
      const c = input.charCodeAt(i++);

      const enc1 = a >> 2;
      const enc2 = ((a & 3) << 4) | (b >> 4);
      const enc3 = isNaN(b) ? 64 : ((b & 15) << 2) | (c >> 6);
      const enc4 = isNaN(c) ? 64 : c & 63;

      output +=
        BASE64_CHARS[enc1] +
        BASE64_CHARS[enc2] +
        BASE64_CHARS[enc3] +
        BASE64_CHARS[enc4];
    }

    return output;
  }

  function utf8Encode(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c < 128) {
        result += String.fromCharCode(c);
      } else if (c < 2048) {
        result += String.fromCharCode((c >> 6) | 192);
        result += String.fromCharCode((c & 63) | 128);
      } else {
        result += String.fromCharCode((c >> 12) | 224);
        result += String.fromCharCode(((c >> 6) & 63) | 128);
        result += String.fromCharCode((c & 63) | 128);
      }
    }
    return result;
  }

  // ============================================================
  // STORAGE CLASSES
  // ============================================================

  class CookieStorage {
    constructor(win, prefix = "_ym_", suffix = "") {
      this.win = win;
      this.prefix = prefix;
      this.suffix = suffix ? "_" + suffix : "";
      this.domain = this._detectDomain();
    }

    _detectDomain() {
      const host = (this.win.location.host || "").split(".");
      if (host.length === 1) return host[0];
      for (let i = 2; i <= host.length; i++) {
        const domain = "." + host.slice(-i).join(".");
        this._set("metrika_enabled", "1", 0, domain, true);
        const cookies = this._parseCookies();
        if (cookies.metrika_enabled) {
          this._set("metrika_enabled", "", -100, domain, true);
          return domain;
        }
      }
      return "";
    }

    _parseCookies() {
      const result = {};
      try {
        const cookies = this.win.document.cookie || "";
        cookies.split(";").forEach((cookie) => {
          const [name, value] = cookie.trim().split("=");
          if (name) {
            try {
              result[name.trim()] = decodeURIComponent(value || "").trim();
            } catch (e) {
              result[name.trim()] = (value || "").trim();
            }
          }
        });
      } catch (e) {}
      return result;
    }

    _set(name, value, minutes, domain, skipPrefix) {
      const key = skipPrefix ? name : this.prefix + name + this.suffix;
      let cookie = key + "=" + encodeURIComponent(value) + ";";
      const ua = this.win.navigator.userAgent || "";
      const chromeMatch = ua.match(/Chrome\/(\d+)\./);
      if (
        chromeMatch &&
        parseInt(chromeMatch[1]) >= 76 &&
        this.win.location.protocol === "https:"
      ) {
        cookie += "SameSite=None;Secure;";
      }
      if (minutes) {
        const date = new Date();
        date.setTime(date.getTime() + minutes * 60000);
        cookie += "expires=" + date.toUTCString() + ";";
      }
      if (domain) {
        cookie += "domain=" + domain.replace(/:\d+$/, "") + ";";
      }
      try {
        this.win.document.cookie = cookie + "path=/";
      } catch (e) {}
    }

    get(name) {
      const cookies = this._parseCookies();
      return cookies[this.prefix + name + this.suffix] || null;
    }

    set(name, value, minutes, domain) {
      this._set(name, value, minutes, domain || this.domain);
      return this;
    }

    remove(name, domain) {
      this._set(name, "", -100, domain || this.domain);
      return this;
    }
  }

  class LocalStorageHelper {
    constructor(win, counterId, prefix = "_ym") {
      this.win = win;
      this.prefix = prefix + (counterId || "") + "_";
      this.blocked = this._checkBlocked();
    }

    _checkBlocked() {
      try {
        const ls = this.win.localStorage;
        ls.setItem("_ymBRC", "1");
        const blocked = ls.getItem("_ymBRC") !== "1";
        if (!blocked) ls.removeItem("_ymBRC");
        return blocked;
      } catch (e) {
        return true;
      }
    }

    _getStorage() {
      try {
        return this.win.localStorage;
      } catch (e) {
        return null;
      }
    }

    get(name, defaultValue) {
      try {
        const ls = this._getStorage();
        if (!ls) return defaultValue;
        const value = JSON.parse(ls.getItem(this.prefix + name));
        return value === null && !isUndefined(defaultValue)
          ? defaultValue
          : value;
      } catch (e) {
        return defaultValue;
      }
    }

    set(name, value) {
      try {
        const ls = this._getStorage();
        if (ls && value !== null) {
          ls.setItem(this.prefix + name, JSON.stringify(value));
        }
      } catch (e) {}
      return this;
    }

    remove(name) {
      try {
        const ls = this._getStorage();
        if (ls) ls.removeItem(this.prefix + name);
      } catch (e) {}
      return this;
    }
  }

  class GlobalState {
    constructor(win) {
      this.win = win;
      // Original uses window.Ya._metrika
      if (!win.Ya) win.Ya = {};
      if (!win.Ya._metrika) win.Ya._metrika = {};
      this.state = win.Ya._metrika;
    }

    get(key, defaultValue) {
      const value = this.state[key];
      return value !== undefined ? value : defaultValue;
    }

    set(key, value) {
      this.state[key] = value;
      return this;
    }
  }

  // ============================================================
  // TIME HELPER
  // ============================================================

  class TimeHelper {
    constructor(win) {
      this.win = win;
      const perf = win.performance || win.webkitPerformance;
      this.navigationStart = getProperty(perf, "timing.navigationStart");
      this.perfNow = getProperty(perf, "now");
      if (this.perfNow) this.perfNow = this.perfNow.bind(perf);
      this.unloadTime = 0;
    }

    getTime() {
      if (this.unloadTime !== 0) return this.unloadTime;
      if (!isNaN(this.navigationStart) && isFunction(this.perfNow)) {
        return Math.round(this.perfNow() + this.navigationStart);
      }
      return this.win.Date.now
        ? this.win.Date.now()
        : new this.win.Date().getTime();
    }

    getTimeSeconds() {
      return Math.round(this.getTime() / 1000);
    }

    getNavigationStart() {
      return this.navigationStart || this.getTime();
    }
  }

  // ============================================================
  // BROWSER DETECTOR
  // ============================================================

  class BrowserDetector {
    constructor(win) {
      this.win = win;
      this._cache = {};
    }

    _cached(key, fn) {
      if (!(key in this._cache)) this._cache[key] = fn();
      return this._cache[key];
    }

    getUserAgent() {
      return this._cached(
        "ua",
        () => getProperty(this.win, "navigator.userAgent") || "",
      );
    }

    isIOS() {
      return this._cached("ios", () =>
        /ipad|iphone|ipod/i.test(this.getUserAgent()),
      );
    }

    isFirefox() {
      return this._cached("ff", () => {
        const style = getProperty(this.win, "document.documentElement.style");
        const trigger = getProperty(this.win, "InstallTrigger");
        return !!(
          (style && "MozAppearance" in style) ||
          !isNullOrUndefined(trigger)
        );
      });
    }

    isSafari() {
      return this._cached("safari", () => {
        const nav = getProperty(this.win, "navigator") || {};
        const vendor = nav.vendor || "";
        const ua = nav.userAgent || "";
        return vendor.indexOf("Apple") > -1 && !ua.match("CriOS");
      });
    }

    isChrome76Plus() {
      return this._cached("ch76", () => {
        const match = this.getUserAgent().match(/Chrome\/(\d+)\./);
        return match ? parseInt(match[1]) >= 76 : false;
      });
    }

    isAndroidWebView() {
      return this._cached("awv", () => {
        const ua = this.getUserAgent();
        return /; wv\)/.test(ua) || /Android.*Version\/[0-9].*Chrome/.test(ua);
      });
    }

    isInIframe() {
      return this._cached("ifr", () => {
        try {
          return (getProperty(this.win, "top") || this.win) !== this.win;
        } catch (e) {
          return true;
        }
      });
    }

    hasTopAccess() {
      return this._cached(
        "top",
        () => !!getProperty(this.win, "top.contentWindow"),
      );
    }

    isYandexDomain() {
      return this._cached("yd", () => {
        const hostname = this.win.location.hostname || "";
        return /(?:^|\.)(?:(ya\.ru)|(?:yandex)\.(\w+|com?\.\w+))$/.test(
          hostname,
        );
      });
    }

    isPrerendering() {
      return (
        getProperty(this.win, "document.prerendering") ||
        getProperty(this.win, "document.visibilityState") === "prerender"
      );
    }

    isJavaEnabled() {
      try {
        return this.win.navigator.javaEnabled();
      } catch (e) {
        return false;
      }
    }

    isSelenium() {
      return this._cached("sel", () => {
        const props = [
          "_selenium",
          "callSelenium",
          "_Selenium_IDE_Recorder",
          "__webdriver_evaluate",
          "__selenium_evaluate",
          "__webdriver_script_function",
          "__driver_evaluate",
          "webdriver",
        ];
        for (const prop of props) {
          if (
            getProperty(this.win, prop) ||
            getProperty(this.win, "document." + prop)
          )
            return true;
        }
        if (getProperty(this.win, "navigator.webdriver")) return true;
        return false;
      });
    }

    isHeadless() {
      return this._cached("hl", () => {
        const props = ["_phantom", "__nightmare", "callPhantom"];
        for (const prop of props) {
          if (getProperty(this.win, prop)) return true;
        }
        if (/(PhantomJS)|(HeadlessChrome)/.test(this.getUserAgent()))
          return true;
        if (getProperty(this.win, "navigator.webdriver")) return true;
        return false;
      });
    }

    isInstantArticle() {
      return !!(
        getProperty(this.win, "ia_document.shareURL") &&
        getProperty(this.win, "ia_document.referrer")
      );
    }

    hasChromePdfViewer() {
      return this._cached("cpf", () => {
        const plugins = getProperty(this.win, "navigator.plugins");
        if (!plugins || !hasLength(plugins)) return false;
        for (let i = 0; i < plugins.length; i++) {
          if (plugins[i].name && /Chrome PDF Viewer/.test(plugins[i].name))
            return true;
        }
        return false;
      });
    }

    getNetworkType() {
      const type = getProperty(this.win, "navigator.connection.type");
      if (isUndefined(type)) return null;
      const index = NETWORK_TYPES.indexOf(type);
      return index === -1 ? type : "" + index;
    }

    getPlatform() {
      return getProperty(this.win, "navigator.platform") || "";
    }

    // -------------------- PLATFORM-SPECIFIC API DETECTION --------------------

    // Chrome-specific: window.chrome object
    hasChrome() {
      return !!getProperty(this.win, "chrome");
    }

    // Chrome-specific: performance.memory (only in Chrome)
    getJsHeapSizeLimit() {
      return getProperty(this.win, "performance.memory.jsHeapSizeLimit") || null;
    }

    // Safari-specific: ApplePaySession
    hasApplePay() {
      try {
        const ApplePaySession = getProperty(this.win, "ApplePaySession");
        if (!ApplePaySession) return null;
        if (this.win.location.protocol !== "https:") return null;
        return {
          available: true,
          canMakePayments: ApplePaySession.canMakePayments
            ? ApplePaySession.canMakePayments()
            : false,
          supportedVersions: this._getApplePayVersions(ApplePaySession),
        };
      } catch (e) {
        return null;
      }
    }

    _getApplePayVersions(ApplePaySession) {
      if (!ApplePaySession.supportsVersion) return "";
      let versions = "";
      for (let v = 1; v <= 20; v++) {
        try {
          versions += ApplePaySession.supportsVersion(v) ? v : "0";
        } catch (e) {
          versions += "0";
        }
      }
      return versions;
    }

    // Edge/IE specific: msDoNotTrack
    getMsDoNotTrack() {
      const nav = getProperty(this.win, "navigator") || {};
      return nav.msDoNotTrack || null;
    }

    // Opera-specific
    isOpera() {
      return !!(getProperty(this.win, "opr") || getProperty(this.win, "opera"));
    }

    // Brave-specific
    isBrave() {
      return this._cached("brave", () => {
        const nav = getProperty(this.win, "navigator") || {};
        return !!(nav.brave && isFunction(nav.brave.isBrave));
      });
    }

    // Collect all platform-specific API info
    getPlatformAPIs() {
      return {
        // Chrome
        hasChrome: this.hasChrome(),
        jsHeapLimit: this.getJsHeapSizeLimit(),
        hasPdfViewer: this.hasChromePdfViewer(),

        // Safari
        applePay: this.hasApplePay(),

        // Firefox
        hasInstallTrigger: !isNullOrUndefined(
          getProperty(this.win, "InstallTrigger"),
        ),
        hasMozAppearance: !!(
          getProperty(this.win, "document.documentElement.style") &&
          "MozAppearance" in this.win.document.documentElement.style
        ),

        // Opera
        isOpera: this.isOpera(),

        // Brave
        isBrave: this.isBrave(),

        // Microsoft
        msDoNotTrack: this.getMsDoNotTrack(),

        // WebKit
        hasWebkitPerformance: !!getProperty(this.win, "webkitPerformance"),
        hasWebkitNotifications: !!getProperty(this.win, "webkitNotifications"),

        // Permissions API
        hasPermissions: !!getProperty(this.win, "navigator.permissions"),

        // Credential Management
        hasCredentials: !!getProperty(this.win, "navigator.credentials"),

        // Web Bluetooth
        hasBluetooth: !!getProperty(this.win, "navigator.bluetooth"),

        // Web USB
        hasUSB: !!getProperty(this.win, "navigator.usb"),

        // Web Serial
        hasSerial: !!getProperty(this.win, "navigator.serial"),

        // Shared Array Buffer (security feature)
        hasSharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",

        // WebGL2
        hasWebGL2: !!getProperty(this.win, "WebGL2RenderingContext"),

        // OffscreenCanvas
        hasOffscreenCanvas: !!getProperty(this.win, "OffscreenCanvas"),
      };
    }

    // -------------------- NEW METHODS FROM tag.js --------------------

    // DoNotTrack string (bs function in tag.js)
    getDoNotTrack() {
      const nav = getProperty(this.win, "navigator") || {};
      return nav.doNotTrack || nav.msDoNotTrack || "unknown";
    }

    // Screen available dimensions (es function in tag.js)
    getScreenAvailable() {
      const screen = getProperty(this.win, "screen") || {};
      const values = SCREEN_AVAIL_PROPS.map((prop) => screen[prop]);
      return values.join("x");
    }

    // User Agent Client Hints (kt function in tag.js) - async
    getUserAgentClientHints() {
      return new Promise((resolve, reject) => {
        const getHEV = getProperty(
          this.win,
          "navigator.userAgentData.getHighEntropyValues",
        );
        if (!getHEV || !isNativeFunction("getHighEntropyValues", getHEV)) {
          return reject("not supported");
        }
        try {
          this.win.navigator.userAgentData
            .getHighEntropyValues(CLIENT_HINTS_PROPS)
            .then((data) => {
              resolve({
                architecture: data.architecture || "",
                bitness: data.bitness || "",
                model: data.model || "",
                platformVersion: data.platformVersion || "",
                uaFullVersion: data.uaFullVersion || "",
                fullVersionList: data.fullVersionList || [],
                mobile: data.mobile,
                platform: data.platform || "",
              });
            })
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      });
    }

    // WebRTC Local IP Detection (vs function in tag.js) - async
    getWebRTCLocalIP() {
      return new Promise((resolve) => {
        // Find RTCPeerConnection constructor
        let RTCPeer = null;
        for (const name of RTC_PEER_CONNECTIONS) {
          RTCPeer = getProperty(this.win, name);
          if (RTCPeer && getProperty(RTCPeer, "prototype.constructor.name")) {
            break;
          }
        }

        if (!RTCPeer || !getProperty(this.win, "navigator.onLine")) {
          return resolve(null);
        }

        try {
          const pc = new RTCPeer({ iceServers: [] });
          const createDataChannel = getProperty(pc, "createDataChannel");
          if (!isFunction(createDataChannel)) {
            return resolve(null);
          }

          createDataChannel.call(pc, "y.metrika");

          const createOffer = getProperty(pc, "createOffer");
          if (!isFunction(createOffer) || createOffer.length !== 0) {
            return resolve(null);
          }

          const offer = createOffer.call(pc);
          const offerThen = getProperty(offer, "then");
          if (!isFunction(offerThen)) {
            return resolve(null);
          }

          offerThen.call(offer, (desc) => {
            const setLocalDesc = getProperty(pc, "setLocalDescription");
            if (isFunction(setLocalDesc)) {
              setLocalDesc.call(pc, desc);
            }
          });

          pc.onicecandidate = () => {
            const close = getProperty(pc, "close");
            if (isFunction(close)) {
              try {
                const sdp = getProperty(pc, "localDescription.sdp");
                const match = sdp && sdp.match(/c=IN\s[\w\d]+\s([\w\d:.]+)/);
                if (match && match.length > 1) {
                  close.call(pc);
                  return resolve(match[1]);
                }
              } catch (e) {
                pc.onicecandidate = null;
                if (pc.iceConnectionState !== "closed") {
                  close.call(pc);
                }
              }
            }
            resolve(null);
          };

          // Timeout fallback
          setTimeout(() => {
            try {
              const close = getProperty(pc, "close");
              if (isFunction(close) && pc.iceConnectionState !== "closed") {
                close.call(pc);
              }
            } catch (e) {}
            resolve(null);
          }, 3000);
        } catch (e) {
          resolve(null);
        }
      });
    }

    // Tizen TV detection (tag.js lines 5697-5722)
    isTizen() {
      return this._cached("tizen", () => {
        return /tizen/i.test(this.getUserAgent());
      });
    }

    getTizenInfo() {
      if (!this.isTizen()) return null;

      const result = {};

      // Try to get TIFA (Tizen Identifier for Advertising)
      const getTIFA = getProperty(this.win, "webapis.adinfo.getTIFA");
      if (isFunction(getTIFA)) {
        try {
          result.tifa = getTIFA();
        } catch (e) {}
      }

      // Try to get Tizen ID
      const getCapability = getProperty(
        this.win,
        "tizen.systeminfo.getCapability",
      );
      if (isFunction(getCapability)) {
        try {
          result.tizenId = getCapability("http://tizen.org/system/tizenid");
        } catch (e) {}
      }

      // Try to get DUID
      const getCapabilities = getProperty(
        this.win,
        "tizen.systeminfo.getCapabilities",
      );
      if (isFunction(getCapabilities)) {
        try {
          const caps = getCapabilities();
          if (caps && caps.duid) {
            result.duid = caps.duid;
          }
        } catch (e) {}
      }

      return Object.keys(result).length > 0 ? result : null;
    }

    // WebOS (LG TV) detection (tag.js lines 5726-5745)
    isWebOS() {
      return this._cached("webos", () => {
        return /webos|web0s/i.test(this.getUserAgent());
      });
    }

    getWebOSInfo() {
      return new Promise((resolve) => {
        if (!this.isWebOS()) {
          return resolve(null);
        }

        const serviceRequest = getProperty(this.win, "webOS.service.request");
        if (!isFunction(serviceRequest)) {
          return resolve(null);
        }

        try {
          serviceRequest("luna://com.webos.service.sm", {
            method: "deviceid/getIDs",
            parameters: { idType: ["LGUDID"] },
            onSuccess: (result) => {
              const lgudid = getProperty(result, "idList.0.idValue");
              resolve(lgudid ? { lgudid } : null);
            },
            onFailure: () => resolve(null),
          });

          // Timeout fallback
          setTimeout(() => resolve(null), 3000);
        } catch (e) {
          resolve(null);
        }
      });
    }

    // Cookie Deprecation Label (tag.js lines 17498-17507) - async
    getCookieDeprecationLabel() {
      return new Promise((resolve) => {
        const cdl = getProperty(this.win, "navigator.cookieDeprecationLabel");
        if (!cdl || !isFunction(cdl.getValue)) {
          return resolve(null);
        }
        try {
          cdl
            .getValue()
            .then((value) => resolve(value))
            .catch(() => resolve("error"));
        } catch (e) {
          resolve("error");
        }
      });
    }

    // Speech Voices - async with voiceschanged event
    // Voices may not be available immediately due to IPC in content processes
    getSpeechVoicesAsync() {
      return new Promise((resolve) => {
        try {
          const synthesis = this.win.speechSynthesis;
          if (!synthesis || !synthesis.getVoices) {
            return resolve({ count: 0, list: [] });
          }

          // Try to get voices immediately
          let voices = synthesis.getVoices();
          if (voices && voices.length > 0) {
            return resolve({
              count: voices.length,
              list: voices.map((v) => ({
                name: v.name,
                lang: v.lang,
                localService: v.localService,
                voiceURI: v.voiceURI,
                default: v.default,
              })),
            });
          }

          // If no voices yet, wait for voiceschanged event
          let resolved = false;
          const onVoicesChanged = () => {
            if (resolved) return;
            resolved = true;
            synthesis.removeEventListener("voiceschanged", onVoicesChanged);
            const newVoices = synthesis.getVoices();
            resolve({
              count: newVoices ? newVoices.length : 0,
              list: newVoices
                ? newVoices.map((v) => ({
                    name: v.name,
                    lang: v.lang,
                    localService: v.localService,
                    voiceURI: v.voiceURI,
                    default: v.default,
                  }))
                : [],
            });
          };

          synthesis.addEventListener("voiceschanged", onVoicesChanged);

          // Timeout fallback (2 seconds)
          setTimeout(() => {
            if (resolved) return;
            resolved = true;
            synthesis.removeEventListener("voiceschanged", onVoicesChanged);
            const fallbackVoices = synthesis.getVoices();
            resolve({
              count: fallbackVoices ? fallbackVoices.length : 0,
              list: fallbackVoices
                ? fallbackVoices.map((v) => ({
                    name: v.name,
                    lang: v.lang,
                    localService: v.localService,
                    voiceURI: v.voiceURI,
                    default: v.default,
                  }))
                : [],
            });
          }, 2000);
        } catch (e) {
          resolve({ count: 0, list: [], error: e.message });
        }
      });
    }
  }

  // ============================================================
  // FINGERPRINT COLLECTOR
  // ============================================================

  class FingerprintCollector {
    constructor(win) {
      this.win = win;
    }

    // -------------------- CANVAS FINGERPRINT (Wi) --------------------

    getCanvasFingerprint() {
      try {
        const canvas = this.win.document.createElement("canvas");
        canvas.width = 280;
        canvas.height = 60;

        const ctx = canvas.getContext("2d");
        if (!ctx) return "";

        // Draw text with various styles
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
        return murmurhash3_32(dataUrl).toString(36);
      } catch (e) {
        return "";
      }
    }

    // -------------------- WEBGL FINGERPRINT (Vi) --------------------

    getWebGLFingerprint() {
      try {
        const canvas = this.win.document.createElement("canvas");
        let gl = null;

        for (const type of WEBGL_CONTEXTS) {
          try {
            gl = canvas.getContext(type);
            if (gl) break;
          } catch (e) {}
        }

        if (!gl) return "";

        const result = [];

        // Collect WebGL parameters
        for (const param of WEBGL_PARAMS) {
          try {
            const value = gl.getParameter(gl[param]);
            if (value !== null && value !== undefined) {
              if (
                value instanceof Float32Array ||
                value instanceof Int32Array
              ) {
                result.push(param + ":" + Array.from(value).join(","));
              } else {
                result.push(param + ":" + value);
              }
            }
          } catch (e) {}
        }

        // Collect shader precision
        if (gl.getShaderPrecisionFormat) {
          for (const [shader, precision] of SHADER_PRECISION_FORMATS) {
            try {
              const format = gl.getShaderPrecisionFormat(
                gl[shader],
                gl[precision],
              );
              if (format) {
                result.push(
                  shader +
                    "_" +
                    precision +
                    ":" +
                    format.precision +
                    "," +
                    format.rangeMin +
                    "," +
                    format.rangeMax,
                );
              }
            } catch (e) {}
          }
        }

        // Get unmasked renderer/vendor
        try {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            result.push(
              "UNMASKED_VENDOR:" +
                gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
            );
            result.push(
              "UNMASKED_RENDERER:" +
                gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
            );
          }
        } catch (e) {}

        // Get supported extensions
        try {
          const extensions = gl.getSupportedExtensions();
          if (extensions) {
            result.push("EXTENSIONS:" + extensions.sort().join(","));
          }
        } catch (e) {}

        // Render a small triangle for additional fingerprinting
        const triangleFp = this._renderWebGLTriangle(gl, canvas);
        if (triangleFp) result.push("TRIANGLE:" + triangleFp);

        return murmurhash3_32(result.join("~")).toString(36);
      } catch (e) {
        return "";
      }
    }

    _renderWebGLTriangle(gl, canvas) {
      try {
        const vertices = new Float32Array([
          -0.2, -0.9, 0, 0.4, -0.26, 0, 0, 0.732134444, 0,
        ]);

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(
          vertexShader,
          "attribute vec2 attrVertex;varying vec2 varyinTexCoordinate;uniform vec2 uniformOffset;" +
            "void main(){varyinTexCoordinate=attrVertex+uniformOffset;gl_Position=vec4(attrVertex,0,1);}",
        );
        gl.compileShader(vertexShader);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(
          fragmentShader,
          "precision mediump float;varying vec2 varyinTexCoordinate;" +
            "void main(){gl_FragColor=vec4(varyinTexCoordinate,0,1);}",
        );
        gl.compileShader(fragmentShader);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const attrVertex = gl.getAttribLocation(program, "attrVertex");
        const uniformOffset = gl.getUniformLocation(program, "uniformOffset");

        gl.enableVertexAttribArray(attrVertex);
        gl.vertexAttribPointer(attrVertex, 3, gl.FLOAT, false, 0, 0);
        gl.uniform2f(uniformOffset, 1, 1);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

        const pixels = new Uint8Array(canvas.width * canvas.height * 4);
        gl.readPixels(
          0,
          0,
          canvas.width,
          canvas.height,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels,
        );

        return murmurhash3_32(
          String.fromCharCode.apply(null, pixels.slice(0, 1000)),
        ).toString(36);
      } catch (e) {
        return "";
      }
    }

    // -------------------- FONT FINGERPRINT (Xi) --------------------

    getFontFingerprint() {
      try {
        const canvas = this.win.document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return "";

        const testString = "mmmmmmmmmmlli";
        const baseFonts = ["monospace", "sans-serif", "serif"];
        const baseWidths = {};

        // Get base widths
        for (const font of baseFonts) {
          ctx.font = "72px " + font;
          baseWidths[font] = ctx.measureText(testString).width;
        }

        const detected = [];

        for (const font of FONT_LIST) {
          if (baseFonts.includes(font)) continue;

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

        return detected.join("");
      } catch (e) {
        return "";
      }
    }

    // -------------------- PLUGIN FINGERPRINT ($i) --------------------

    getPluginFingerprint() {
      try {
        const plugins = getProperty(this.win, "navigator.plugins");
        if (!plugins || !hasLength(plugins)) return "";

        const pluginList = [];
        for (let i = 0; i < plugins.length; i++) {
          const plugin = plugins[i];
          const mimeTypes = [];

          if (plugin.length) {
            for (let j = 0; j < plugin.length; j++) {
              const mime = plugin[j];
              mimeTypes.push(
                [mime.description, mime.suffixes, mime.type].join("~"),
              );
            }
          }

          pluginList.push(
            [plugin.name, plugin.description, mimeTypes.join(";")].join(","),
          );
        }

        pluginList.sort();
        return pluginList.join("|");
      } catch (e) {
        return "";
      }
    }

    // -------------------- AUDIO FINGERPRINT (zi) --------------------

    getAudioFingerprint() {
      try {
        const AudioContext =
          this.win.AudioContext || this.win.webkitAudioContext;
        if (!AudioContext) return "";

        const context = new AudioContext();
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
        context.close();

        // Hash the frequency data
        let sum = 0;
        for (let i = 0; i < bins.length; i++) {
          sum += Math.abs(bins[i]);
        }

        return sum.toFixed(2);
      } catch (e) {
        return "";
      }
    }

    // -------------------- NAVIGATOR FINGERPRINT (Ti) --------------------

    getNavigatorFingerprint() {
      try {
        const nav = this.win.navigator || {};
        const result = [];

        for (const prop of NAVIGATOR_PROPS) {
          try {
            let value = nav[prop];
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                value = value.join(",");
              }
              result.push(prop + ":" + value);
            }
          } catch (e) {}
        }

        // Add screen properties
        const screen = this.win.screen;
        if (screen) {
          result.push(
            "screen:" +
              [
                screen.width,
                screen.height,
                screen.colorDepth,
                screen.pixelDepth,
                screen.availWidth,
                screen.availHeight,
              ].join(","),
          );
        }

        // Add timezone
        result.push("timezone:" + new Date().getTimezoneOffset());

        // Add touch support
        result.push("touchPoints:" + (nav.maxTouchPoints || 0));

        // Hardware concurrency
        if (nav.hardwareConcurrency) {
          result.push("cores:" + nav.hardwareConcurrency);
        }

        // Device memory
        if (nav.deviceMemory) {
          result.push("memory:" + nav.deviceMemory);
        }

        return result.join("|");
      } catch (e) {
        return "";
      }
    }

    // -------------------- SPEECH VOICES FINGERPRINT (cj) --------------------

    getSpeechVoicesFingerprint() {
      try {
        const synthesis = this.win.speechSynthesis;
        if (!synthesis || !synthesis.getVoices) return "";

        const voices = synthesis.getVoices();
        if (!voices || !voices.length) return "";

        const voiceData = [];
        for (const voice of voices) {
          const props = [];
          for (const prop of VOICE_PROPS) {
            props.push(voice[prop] || "");
          }
          voiceData.push(props.join(","));
        }

        return voiceData.join("|");
      } catch (e) {
        return "";
      }
    }

    // -------------------- MEDIA QUERIES FINGERPRINT (Zi) --------------------

    getMediaQueriesFingerprint() {
      try {
        if (!this.win.matchMedia) return "";

        const results = [];
        for (const query of MEDIA_QUERIES) {
          try {
            const match = this.win.matchMedia(query);
            results.push(match.matches ? "1" : "0");
          } catch (e) {
            results.push("0");
          }
        }

        return results.join("");
      } catch (e) {
        return "";
      }
    }

    // -------------------- TOUCH SUPPORT (dj) --------------------

    getTouchFingerprint() {
      try {
        const result = [];

        result.push("ontouchstart" in this.win ? "1" : "0");
        result.push(this.win.navigator.maxTouchPoints || 0);
        result.push("TouchEvent" in this.win ? "1" : "0");

        return result.join("x");
      } catch (e) {
        return "";
      }
    }

    // -------------------- GAMEPADS (ui) --------------------

    getGamepadFingerprint() {
      try {
        const getGamepads = getProperty(this.win, "navigator.getGamepads");
        if (!getGamepads || !isNativeFunction("getGamepads", getGamepads))
          return "";

        const gamepads = this.win.navigator.getGamepads();
        return gamepads ? gamepads.length.toString() : "0";
      } catch (e) {
        return "";
      }
    }

    // -------------------- JS HEAP SIZE LIMIT (cs) --------------------
    // Source: tag.js line 11433

    getJsHeapSizeLimitFingerprint() {
      try {
        const limit = getProperty(this.win, "performance.memory.jsHeapSizeLimit");
        return limit ? limit.toString() : "";
      } catch (e) {
        return "";
      }
    }

    // -------------------- SCREEN AVAILABLE DIMENSIONS (es) --------------------
    // Source: tag.js lines 11434-11438

    getScreenAvailableFingerprint() {
      try {
        const screen = this.win.screen;
        if (!screen) return "";

        const values = [];
        for (const prop of SCREEN_AVAIL_PROPS) {
          const val = screen[prop];
          values.push(val !== undefined ? val : "");
        }
        return values.join("x");
      } catch (e) {
        return "";
      }
    }

    // -------------------- DO NOT TRACK (bs) --------------------
    // Source: tag.js lines 11429-11432

    getDoNotTrackFingerprint() {
      try {
        const nav = this.win.navigator || {};
        return nav.doNotTrack || nav.msDoNotTrack || "unknown";
      } catch (e) {
        return "unknown";
      }
    }

    // -------------------- MEDIA CODEC FINGERPRINT (ss) --------------------
    // Source: tag.js lines 5617-5630

    getMediaCodecFingerprint() {
      try {
        const video = this.win.document.createElement("video");
        if (!video || !video.canPlayType) return "";

        const results = [];

        // Test each media type with each codec
        for (const type of MEDIA_TYPES) {
          for (const codec of MEDIA_CODECS) {
            try {
              const mimeWithCodec = type + '; codecs="' + codec + '"';
              const support = video.canPlayType(mimeWithCodec);
              // Returns: "", "maybe", or "probably"
              if (support === "probably") {
                results.push("2");
              } else if (support === "maybe") {
                results.push("1");
              } else {
                results.push("0");
              }
            } catch (e) {
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
          } catch (e) {
            results.push("0");
          }
        }

        return results.join("");
      } catch (e) {
        return "";
      }
    }

    // -------------------- COMBINED FINGERPRINT --------------------

    generateFullFingerprint() {
      const components = [
        this.getCanvasFingerprint(), // Wi
        this.getPluginFingerprint(), // $i
        this.getNavigatorFingerprint(), // Ti
        this.getGamepadFingerprint(), // ui
        this.getFontFingerprint(), // Xi
        this.getAudioFingerprint(), // zi
        this.getWebGLFingerprint(), // vi + xi
        this.getSpeechVoicesFingerprint(), // cj
        this.getTouchFingerprint(), // dj
        this.getMediaQueriesFingerprint(), // Zi
        this.getMediaCodecFingerprint(), // ss - media codec support
        this.getJsHeapSizeLimitFingerprint(), // cs - jsHeapSizeLimit
        this.getScreenAvailableFingerprint(), // es - screen available dimensions
        this.getDoNotTrackFingerprint(), // bs - doNotTrack
      ];

      return components.join("-");
    }

    generateFingerprintHash() {
      const fp = this.generateFullFingerprint();
      return murmurhash3_32(fp).toString(36);
    }
  }

  // ============================================================
  // MAIN BROWSER INFO GENERATOR
  // ============================================================

  class BrowserInfoGenerator {
    constructor(options = {}) {
      this.win = options.window || window;
      this.counterId = options.counterId || 0;
      this.counterType = options.counterType || "0";
      this.counterKey = this.counterId + ":" + this.counterType;

      this.pageUrl = options.pageUrl || this.win.location.href;
      this.pageRef = options.pageRef || this.win.document.referrer;
      this.isPageView = options.isPageView !== false;
      this.isAutoRequest = options.isAutoRequest || false;
      this.noCookies = options.noCookies || false;

      this.state = new GlobalState(this.win);
      this.time = new TimeHelper(this.win);
      this.browser = new BrowserDetector(this.win);
      this.cookies = new CookieStorage(this.win);
      this.localStorage = new LocalStorageHelper(this.win, this.counterId);
      // Original uses just counterId for localStorage prefix: "_ym<counterId>_"
      this.counterStorage = new LocalStorageHelper(this.win, this.counterId);
      this.fingerprint = new FingerprintCollector(this.win);
    }

    generate() {
      const fields = {};

      // Core fields
      if (this.isPageView) fields.pv = 1;
      if (this.isAutoRequest) fields.ar = 1;

      fields.vf = CONFIG.versionFingerprint;

      const nt = this.browser.getNetworkType();
      if (nt !== null) fields.nt = nt;

      fields.fu = this._getUrlChangeFlag();
      fields.en = this._getEncoding();
      fields.la = this._getLanguage();
      fields.v = CONFIG.scriptVersion;
      fields.cn = this._getCounterNumber();

      fields.dp = this._getDevicePower();

      fields.ls = this._getLocalStorageId();
      fields.hid = this._getHitId();

      const phid = this._getParentHitId();
      if (phid !== null) fields.phid = phid;

      fields.z = this._getTimezone();
      fields.i = this._getCurrentDateTime();
      fields.et = this.time.getTimeSeconds();

      const c = this._getCookiesEnabled();
      if (c !== null) fields.c = c;

      fields.rn = randomInRange(1073741824);

      const rqn = this._getRequestNumber();
      if (rqn !== null) fields.rqn = rqn;

      fields.u = this._getUserId();
      fields.w = this._getWindowSize();

      const s = this._getScreenInfo();
      if (s !== null) fields.s = s;

      const sk = this._getDevicePixelRatio();
      if (sk !== null) fields.sk = sk;

      // Qa: returns 1 for truthy, null for falsy
      const ifr = this.browser.isInIframe() ? 1 : null;
      if (ifr !== null) fields.ifr = ifr;

      const j = this.browser.isJavaEnabled() ? 1 : null;
      if (j !== null) fields.j = j;

      const sti = this._getSafeTopIframe();
      if (sti !== null) fields.sti = sti;

      // Extended fields
      const bu = this._getBusinessUid();
      if (bu !== null) fields.bu = bu;

      const pri = this._getPrivateMode();
      if (pri !== null) fields.pri = pri;

      const co = this._getConnectionStatus();
      if (co !== null) fields.co = co;

      const td = this._getTurboDomainUid();
      if (td !== null) fields.td = td;

      // These use Qa (returns 1 for truthy, null for falsy)
      const iss = this.browser.isSelenium() ? 1 : null;
      if (iss !== null) fields.iss = iss;

      const hdl = this.browser.isHeadless() ? 1 : null;
      if (hdl !== null) fields.hdl = hdl;

      const iia = this.browser.isInstantArticle() ? 1 : null;
      if (iia !== null) fields.iia = iia;

      const cpf = this.browser.hasChromePdfViewer() ? 1 : null;
      if (cpf !== null) fields.cpf = cpf;

      const ntf = this._getNotificationPermission();
      if (ntf !== null) fields.ntf = ntf;

      const eu = this._getIsEU();
      if (eu !== null) fields.eu = eu;

      fields.ns = this.time.getNavigationStart();

      const np = this._getNavigatorPlatformHash();
      if (np !== null) fields.np = np;

      const bl = this.state.get("bl", null);
      if (bl !== null) fields.bl = bl;

      const ntq = this.state.get("ntq", null);
      if (ntq !== null) fields.ntq = ntq;

      if (this.browser.isPrerendering()) fields.pr = "1";

      // Document statistics (navigation timing)
      const ds = this._getDocumentStatistics();
      if (ds) fields.ds = ds;

      // Ad blocker detection: "1" = detected, "2" = not detected
      const adb = this._getAdBlockStatus();
      if (adb) fields.adb = adb;

      fields.rqnl = 1;
      fields.st = this.time.getTimeSeconds();
      fields.t = this._getPageTitle();

      // Generate fingerprint
      const fip = this._getOrGenerateFingerprint();

      // Telemetry fields (separate from browser-info)
      // These go into a separate 't' parameter, not browser-info
      const telemetry = {};

      const oo = this.state.get("oo", null);
      if (oo !== null) telemetry.oo = oo;

      const pmc = this.state.get("cmc", null);
      if (pmc !== null) telemetry.pmc = pmc;

      // Qa: returns 1 for truthy, null for falsy
      const re = this._isRestoredUser() ? 1 : null;
      if (re !== null) telemetry.re = re;

      const aw = this._getAwayState();
      if (aw !== null) telemetry.aw = aw;

      const rcm = this._getResourceTransferSize();
      if (rcm !== null) telemetry.rcm = rcm;

      const yu = this._getYandexUid();
      if (yu !== null) telemetry.yu = yu;

      const oms = this.state.get("oms", null);
      if (oms !== null) telemetry.oms = oms;

      return {
        browserInfo: this._formatFields(fields),
        telemetry: this._formatFields(telemetry),
        fingerprint: fip,
        fields: fields,
        telemetryFields: telemetry,
        fingerprintComponents: {
          canvas: this.fingerprint.getCanvasFingerprint(),
          webgl: this.fingerprint.getWebGLFingerprint(),
          fonts: this.fingerprint.getFontFingerprint(),
          plugins: this.fingerprint.getPluginFingerprint(),
          audio: this.fingerprint.getAudioFingerprint(),
          navigator: this.fingerprint.getNavigatorFingerprint(),
          voices: this.fingerprint.getSpeechVoicesFingerprint(),
          touch: this.fingerprint.getTouchFingerprint(),
          mediaQueries: this.fingerprint.getMediaQueriesFingerprint(),
          gamepads: this.fingerprint.getGamepadFingerprint(),
          mediaCodecs: this.fingerprint.getMediaCodecFingerprint(),
          jsHeapSizeLimit: this.fingerprint.getJsHeapSizeLimitFingerprint(),
          screenAvailable: this.fingerprint.getScreenAvailableFingerprint(),
          doNotTrack: this.fingerprint.getDoNotTrackFingerprint(),
        },
        platformAPIs: this.browser.getPlatformAPIs(),
        // New browser detection fields (sync)
        doNotTrack: this.browser.getDoNotTrack(),
        screenAvailable: this.browser.getScreenAvailable(),
        tizenInfo: this.browser.getTizenInfo(),
        // Async detection fields (return Promises)
        asyncDetection: {
          userAgentClientHints: this.browser.getUserAgentClientHints(),
          webRTCLocalIP: this.browser.getWebRTCLocalIP(),
          webOSInfo: this.browser.getWebOSInfo(),
          cookieDeprecationLabel: this.browser.getCookieDeprecationLabel(),
        },
      };
    }

    async asyncGenerate() {
      const result = this.generate();
      const asyncDetection = result.asyncDetection || {};

      const [
        userAgentClientHints,
        webRTCLocalIP,
        webOSInfo,
        cookieDeprecationLabel,
        voices,
      ] = await Promise.all([
        asyncDetection.userAgentClientHints
          ? asyncDetection.userAgentClientHints.catch(() => null)
          : this.browser.getUserAgentClientHints().catch(() => null),
        asyncDetection.webRTCLocalIP
          ? asyncDetection.webRTCLocalIP.catch(() => null)
          : this.browser.getWebRTCLocalIP().catch(() => null),
        asyncDetection.webOSInfo
          ? asyncDetection.webOSInfo.catch(() => null)
          : this.browser.getWebOSInfo().catch(() => null),
        asyncDetection.cookieDeprecationLabel
          ? asyncDetection.cookieDeprecationLabel.catch(() => null)
          : this.browser.getCookieDeprecationLabel().catch(() => null),
        this.browser.getSpeechVoicesAsync
          ? this.browser.getSpeechVoicesAsync().catch(() => ({ count: 0, list: [] }))
          : Promise.resolve({ count: 0, list: [] }),
      ]);

      result.asyncDetection = {
        userAgentClientHints,
        webRTCLocalIP,
        webOSInfo,
        cookieDeprecationLabel,
        voices,
      };

      return result;
    }

    // Field implementations
    _getUrlChangeFlag() {
      const docRef = (this.win.document.referrer || "").replace(/\/$/, "");
      const pageRef = (this.pageRef || "").replace(/\/$/, "");
      const currentHref = this.win.location.href;
      const urlChanged = currentHref !== this.pageUrl;
      const refChanged = docRef !== pageRef;
      if (urlChanged && refChanged) return 3;
      if (refChanged) return 1;
      if (urlChanged) return 2;
      return 0;
    }

    _getEncoding() {
      const doc = getProperty(this.win, "document") || {};
      return ((doc.characterSet || doc.charset || "utf-8") + "").toLowerCase();
    }

    _getLanguage() {
      const nav = getProperty(this.win, "navigator") || {};
      return (
        nav.language ||
        nav.userLanguage ||
        nav.browserLanguage ||
        nav.systemLanguage ||
        ""
      );
    }

    _getCounterNumber() {
      const num = this.state.get("counterNum", 0) + 1;
      this.state.set("counterNum", num);
      return num;
    }

    _getDevicePower() {
      const bt = this.state.get("bt", {});
      if (isUndefined(this.state.get("bt"))) {
        const getBattery = getProperty(this.win, "navigator.getBattery");
        if (getBattery) {
          try {
            bt.p = getBattery.call(this.win.navigator);
            this.state.set("bt", bt);
            if (bt.p && bt.p.then) {
              bt.p
                .then((battery) => {
                  bt.charging = battery.charging && battery.chargingTime === 0;
                })
                .catch(() => {});
            }
          } catch (e) {}
        }
      }
      // Ra(c.Vb) returns 0 for falsy (including undefined), 1 for truthy
      return toBinaryInt(bt.charging);
    }

    _getLocalStorageId() {
      let lsid = this.counterStorage.get("lsid");
      if (lsid) return lsid;
      lsid = randomInRange(0, this.time.getTime());
      this.counterStorage.set("lsid", lsid);
      return lsid;
    }

    _getHitId() {
      let hitId = this.state.get("hitId");
      if (!hitId) {
        hitId = randomInRange(1073741824);
        this.state.set("hitId", hitId);
      }
      return hitId;
    }

    _getParentHitId() {
      if (!this.browser.isInIframe()) return null;
      return null;
    }

    _getTimezone() {
      return -new this.win.Date().getTimezoneOffset();
    }

    _getCurrentDateTime() {
      const now = new this.win.Date();
      return (
        "" +
        now.getFullYear() +
        padZero(now.getMonth() + 1) +
        padZero(now.getDate()) +
        padZero(now.getHours()) +
        padZero(now.getMinutes()) +
        padZero(now.getSeconds())
      );
    }

    _getCookiesEnabled() {
      // Qa returns 1 for truthy, null for falsy
      const enabled = getProperty(this.win, "navigator.cookieEnabled");
      return enabled ? 1 : null;
    }

    _getRequestNumber() {
      if (this.isAutoRequest) return null;
      const reqNum = (this.counterStorage.get("reqNum", 0) || 0) + 1;
      this.counterStorage.set("reqNum", reqNum);
      if (this.counterStorage.get("reqNum") === reqNum) return reqNum;
      this.counterStorage.remove("reqNum");
      return null;
    }

    _getUserId() {
      const uidKey = "uid";
      const dateKey = "d";
      let cookieUid = this.cookies.get(uidKey);
      let lsUid = this.localStorage.get(uidKey);
      let lastDate = this.cookies.get(dateKey);
      const currentTime = this.time.getTimeSeconds();

      let needsUpdate = false;
      if (!cookieUid && lsUid) {
        cookieUid = lsUid;
        needsUpdate = true;
      }
      if (!cookieUid) {
        cookieUid = "" + currentTime + randomInRange(1000000, 999999999);
        needsUpdate = true;
      } else if (!lastDate || 15768000 < currentTime - parseInt(lastDate)) {
        needsUpdate = true;
      }
      if (needsUpdate && !this.noCookies) {
        this.cookies.set(uidKey, cookieUid, 525600);
        this.cookies.set(dateKey, "" + currentTime, 525600);
      }
      this.localStorage.set(uidKey, cookieUid);
      return cookieUid;
    }

    _getWindowSize() {
      let width, height;
      const vv = getProperty(this.win, "visualViewport");
      if (vv && !isNullOrUndefined(vv.width) && !isNullOrUndefined(vv.height)) {
        width = Math.round(Math.floor(vv.width) * vv.scale);
        height = Math.round(Math.floor(vv.height) * vv.scale);
        return width + "x" + height;
      }
      const doc = getProperty(this.win, "document") || {};
      let docEl = doc.documentElement;
      if (doc.compatMode !== "CSS1Compat") {
        try {
          const body = doc.getElementsByTagName("body")[0];
          if (body) docEl = body;
        } catch (e) {}
      }
      width = getProperty(docEl, "clientWidth") || this.win.innerWidth;
      height = getProperty(docEl, "clientHeight") || this.win.innerHeight;
      return width + "x" + height;
    }

    _getScreenInfo() {
      const screen = getProperty(this.win, "screen");
      if (!screen) return null;
      return joinWith("x", [
        screen.width,
        screen.height,
        screen.colorDepth || screen.pixelDepth,
      ]);
    }

    _getDevicePixelRatio() {
      return getProperty(this.win, "devicePixelRatio");
    }

    _getSafeTopIframe() {
      return this.browser.isInIframe() && this.browser.hasTopAccess()
        ? "1"
        : null;
    }

    _getBusinessUid() {
      const getSiteUid = getProperty(this.win, "yandex.getSiteUid");
      if (isFunction(getSiteUid)) {
        try {
          return this.win.yandex.getSiteUid();
        } catch (e) {}
      }
      return null;
    }

    _getPrivateMode() {
      if (this.browser.isAndroidWebView()) return null;
      const cached = this.state.get("privateMode");
      return cached ? 1 : null;
    }

    _getConnectionStatus() {
      return toBinaryInt(this.state.get("jn"));
    }

    _getTurboDomainUid() {
      const search = this.win.location.search;
      const match = search.match(/(\?|&)turbo_uid=([\w\d]+)($|&)/);
      if (match && match.length >= 3) {
        const uid = match[2];
        if (!this.noCookies) this.cookies.set("turbo_uid", uid);
        return uid;
      }
      return this.cookies.get("turbo_uid");
    }

    _getNotificationPermission() {
      const permission = getProperty(this.win, "Notification.permission");
      if (permission === "denied") return 1;
      if (permission === "granted") return 2;
      return null;
    }

    _getIsEU() {
      // Check if already determined
      let eu = this.state.get("isEU");
      if (eu !== undefined) return eu;

      // Check is_gdpr URL parameter (original: Qc(a, "is_gdpr"))
      const url = this.win.location.href;
      const gdprMatch = url.match(/[?&]is_gdpr=(\d)/);
      if (gdprMatch) {
        const gdprVal = parseInt(gdprMatch[1], 10);
        if (gdprVal === 0 || gdprVal === 1) {
          this.state.set("isEU", gdprVal);
          return gdprVal;
        }
      }

      // Default to 0 (not EU) if not explicitly set
      // The original gets this from sync response, but we default to 0
      this.state.set("isEU", 0);
      return 0;
    }

    _getNavigatorPlatformHash() {
      if (randomInRange(0, 100)) return null;
      const platform = this.browser.getPlatform();
      if (!platform) return null;
      return base64Encode(utf8Encode(platform.substring(0, 100)));
    }

    _isRestoredUser() {
      const lsUid = this.localStorage.get("uid");
      const cookieUid = this.cookies.get("uid");
      return !this.noCookies && !cookieUid && !!lsUid;
    }

    _getAwayState() {
      const doc = this.win.document;
      const hidden =
        doc.hidden !== undefined
          ? doc.hidden
          : doc.msHidden !== undefined
            ? doc.msHidden
            : doc.webkitHidden;
      if (isNullOrUndefined(hidden)) return null;
      return toBinaryInt(!hidden);
    }

    _getResourceTransferSize() {
      try {
        const perf = getProperty(this.win, "performance");
        if (!perf || !isFunction(perf.getEntriesByType)) return null;
        const resources = perf.getEntriesByType("resource");
        const metrikaResource = resources.find(
          (r) => r.name && r.name.indexOf("mc.yandex") !== -1,
        );
        if (metrikaResource && metrikaResource.transferSize !== undefined) {
          return Math.round(metrikaResource.transferSize);
        }
      } catch (e) {}
      return null;
    }

    _getYandexUid() {
      const yuid = new CookieStorage(this.win, "").get("yandexuid");
      return yuid ? yuid.substring(0, 25) : null;
    }

    _getPageTitle() {
      let title = this.win.document.title;
      if (typeof title !== "string") {
        try {
          const titleEl = this.win.document.getElementsByTagName("title")[0];
          title = titleEl ? titleEl.innerHTML : "";
        } catch (e) {
          title = "";
        }
      }
      return (title || "").slice(0, CONFIG.maxTitleLength);
    }

    _getDocumentStatistics() {
      try {
        const perf = getProperty(this.win, "performance");
        if (!perf) return null;

        let timing = null;
        let metrics = null;

        // Try Navigation Timing Level 2 first
        if (isFunction(perf.getEntriesByType)) {
          const navEntries = perf.getEntriesByType("navigation");
          if (navEntries && navEntries[0]) {
            timing = navEntries[0];
            // Navigation Timing v2 metrics (absolute values or simple diffs)
            metrics = [
              ["domainLookupEnd", "domainLookupStart"],
              ["connectEnd", "connectStart"],
              ["responseStart", "requestStart"],
              ["responseEnd", "responseStart"],
              ["fetchStart"], // Just the value
              ["redirectEnd", "redirectStart"],
              ["redirectCount"], // Just the value
              ["domInteractive", "responseEnd"],
              ["domContentLoadedEventEnd", "domContentLoadedEventStart"],
              ["domComplete"], // Just the value
              ["loadEventStart"], // Just the value
              ["loadEventEnd", "loadEventStart"],
              ["domContentLoadedEventStart"], // Just the value
            ];
          }
        }

        // Fall back to Navigation Timing Level 1
        if (!timing && perf.timing) {
          timing = perf.timing;
          metrics = [
            ["domainLookupEnd", "domainLookupStart"],
            ["connectEnd", "connectStart"],
            ["responseStart", "requestStart"],
            ["responseEnd", "responseStart"],
            ["fetchStart", "navigationStart"],
            ["redirectEnd", "redirectStart"],
            ["redirectCount"], // From performance.navigation
            ["domInteractive", "domLoading"],
            ["domContentLoadedEventEnd", "domContentLoadedEventStart"],
            ["domComplete", "navigationStart"],
            ["loadEventStart", "navigationStart"],
            ["loadEventEnd", "loadEventStart"],
            ["domContentLoadedEventStart", "navigationStart"],
          ];
        }

        if (!timing || !metrics) return null;

        const results = [];
        for (const metric of metrics) {
          if (metric.length === 1) {
            // Single value (redirectCount or absolute timing for v2)
            const key = metric[0];
            if (key === "redirectCount") {
              const nav = perf.navigation || {};
              results.push(nav.redirectCount || 0);
            } else {
              const val = timing[key];
              results.push(val ? Math.round(val) : null);
            }
          } else {
            // Difference between two timing values
            const [end, start] = metric;
            const endVal = timing[end];
            const startVal = timing[start];

            if (endVal && startVal) {
              const diff = Math.round(endVal) - Math.round(startVal);
              // Sanity check: should be >= 0 and < 1 hour
              results.push(diff >= 0 && diff < 3600000 ? diff : null);
            } else if (endVal === 0 && startVal === 0) {
              results.push(0);
            } else {
              results.push(null);
            }
          }
        }

        // Return as comma-separated, filtering unchanged values
        const hasValues = results.some((v) => v !== null);
        return hasValues ? results.join(",") : null;
      } catch (e) {
        return null;
      }
    }

    _getAdBlockStatus() {
      // Check if already detected (from cookie or previous detection)
      let adStatus = this.state.get("adBlockEnabled");
      if (adStatus) return adStatus;

      // Check cookie first (original stores in _ym cookies with key 'isad')
      const cookieStatus = this.cookies.get("isad");
      if (cookieStatus && (cookieStatus === "1" || cookieStatus === "2")) {
        this.state.set("adBlockEnabled", cookieStatus);
        return cookieStatus;
      }

      // Synchronous detection method: check for common ad blocker artifacts
      // This mirrors the original's approach but in a synchronous way
      try {
        // Method 1: Check if common ad-related elements would be hidden
        const testAd = this.win.document.createElement("div");
        testAd.innerHTML = "&nbsp;";
        testAd.className =
          "adsbox ad-banner pub_300x250 pub_300x250m pub_728x90 text-ad textAd";
        testAd.style.cssText =
          "width:1px!important;height:1px!important;position:absolute!important;left:-10000px!important;top:-1000px!important;";
        this.win.document.body.appendChild(testAd);

        const isBlocked =
          testAd.offsetHeight === 0 ||
          testAd.offsetParent === null ||
          testAd.clientHeight === 0;

        this.win.document.body.removeChild(testAd);

        // Method 2: Check for bait script blocking
        const baitUrl =
          "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        let scriptBlocked = false;

        // Check if AdSense-like objects are blocked
        if (typeof this.win.adsbygoogle === "undefined") {
          scriptBlocked = true;
        }

        adStatus = isBlocked || scriptBlocked ? "1" : "2";
      } catch (e) {
        // If detection fails, assume no ad blocker
        adStatus = "2";
      }

      this.state.set("adBlockEnabled", adStatus);
      // Store in cookie for future use (1200 seconds = 20 minutes expiry like original)
      this.cookies.set("isad", adStatus, 1200);

      return adStatus;
    }

    _getOrGenerateFingerprint() {
      let fip = this.localStorage.get("fip");
      if (!fip) {
        fip = this.fingerprint.generateFullFingerprint();
        this.localStorage.set("fip", fip);
      }
      return fip;
    }

    _formatFields(fields) {
      const parts = [];
      let titlePart = "";
      for (const [key, value] of Object.entries(fields)) {
        if (value === null || value === undefined || value === "") continue;
        const part = key + ":" + value;
        if (key === "t") titlePart = part;
        else parts.push(part);
      }
      if (titlePart) parts.push(titlePart);
      return parts.join(":");
    }
  }

  // ============================================================
  // EXPORTS
  // ============================================================

  window.YandexBrowserInfo = {
    Generator: BrowserInfoGenerator,
    FingerprintCollector: FingerprintCollector,
    BrowserDetector: BrowserDetector,
    CookieStorage: CookieStorage,
    LocalStorageHelper: LocalStorageHelper,
    GlobalState: GlobalState,
    TimeHelper: TimeHelper,
    CONFIG: CONFIG,
    FONT_LIST: FONT_LIST,
    WEBGL_PARAMS: WEBGL_PARAMS,
    MEDIA_QUERIES: MEDIA_QUERIES,
    // New constants for added fingerprinting
    MEDIA_TYPES: MEDIA_TYPES,
    MEDIA_CODECS: MEDIA_CODECS,
    SCREEN_AVAIL_PROPS: SCREEN_AVAIL_PROPS,
    CLIENT_HINTS_PROPS: CLIENT_HINTS_PROPS,
    RTC_PEER_CONNECTIONS: RTC_PEER_CONNECTIONS,

    /**
     * Returns a comprehensive schema of all collected values with descriptive names,
     * data types, and example values from the current browser.
     */
    getCollectedDataSchema: function () {
      const generator = new BrowserInfoGenerator({ window: window });
      const browser = new BrowserDetector(window);
      const fingerprint = new FingerprintCollector(window);
      const time = new TimeHelper(window);

      return {
        browserInfoFields: {
          pv: {
            name: "Page View",
            description: "Flag indicating this is a page view event",
            type: "integer",
            possibleValues: [1, null],
            currentValue: 1,
          },
          ar: {
            name: "Auto Request",
            description: "Flag indicating this is an automatic request (not user-initiated)",
            type: "integer",
            possibleValues: [1, null],
            currentValue: null,
          },
          vf: {
            name: "Version Fingerprint",
            description: "Script version fingerprint hash for cache busting",
            type: "string",
            currentValue: CONFIG.versionFingerprint,
          },
          nt: {
            name: "Network Type",
            description: "Connection type from Navigator.connection API",
            type: "string",
            possibleValues: NETWORK_TYPES.map((t, i) => `${i} (${t})`),
            currentValue: browser.getNetworkType(),
          },
          fu: {
            name: "URL Change Flag",
            description: "Indicates if URL or referrer changed since page load",
            type: "integer",
            possibleValues: [
              "0 = no change",
              "1 = referrer changed",
              "2 = URL changed",
              "3 = both changed",
            ],
            currentValue: generator._getUrlChangeFlag(),
          },
          en: {
            name: "Document Encoding",
            description: "Character encoding of the document",
            type: "string",
            currentValue: generator._getEncoding(),
          },
          la: {
            name: "Language",
            description: "Browser language preference",
            type: "string",
            currentValue: generator._getLanguage(),
          },
          v: {
            name: "Script Version",
            description: "Yandex Metrica script version number",
            type: "string",
            currentValue: CONFIG.scriptVersion,
          },
          cn: {
            name: "Counter Number",
            description: "Sequential counter for tracking script instances on page",
            type: "integer",
            currentValue: generator._getCounterNumber(),
          },
          dp: {
            name: "Device Power",
            description: "Battery charging status (1=charging at full, 0=not)",
            type: "integer",
            possibleValues: [0, 1],
            currentValue: generator._getDevicePower(),
          },
          ls: {
            name: "Local Storage ID",
            description: "Unique identifier stored in localStorage for persistence",
            type: "integer",
            currentValue: generator._getLocalStorageId(),
          },
          hid: {
            name: "Hit ID",
            description: "Unique identifier for this specific page hit/request",
            type: "integer",
            currentValue: generator._getHitId(),
          },
          phid: {
            name: "Parent Hit ID",
            description: "Hit ID of parent frame (when in iframe)",
            type: "integer",
            currentValue: generator._getParentHitId(),
          },
          z: {
            name: "Timezone Offset",
            description: "Timezone offset in minutes from UTC (positive = ahead)",
            type: "integer",
            currentValue: generator._getTimezone(),
          },
          i: {
            name: "Current DateTime",
            description: "Current date and time in YYYYMMDDHHmmss format",
            type: "string",
            currentValue: generator._getCurrentDateTime(),
          },
          et: {
            name: "Epoch Time",
            description: "Current Unix timestamp in seconds",
            type: "integer",
            currentValue: time.getTimeSeconds(),
          },
          c: {
            name: "Cookies Enabled",
            description: "Whether cookies are enabled in browser",
            type: "integer",
            possibleValues: [1, null],
            currentValue: generator._getCookiesEnabled(),
          },
          rn: {
            name: "Random Number",
            description: "Random cache-busting number (0 to 1073741824)",
            type: "integer",
            currentValue: randomInRange(1073741824),
          },
          rqn: {
            name: "Request Number",
            description: "Sequential request counter stored in localStorage",
            type: "integer",
            currentValue: generator._getRequestNumber(),
          },
          u: {
            name: "User ID",
            description: "Persistent user identifier (timestamp + random number)",
            type: "string",
            currentValue: generator._getUserId(),
          },
          w: {
            name: "Window Size",
            description: "Viewport dimensions (width x height in pixels)",
            type: "string",
            format: "WIDTHxHEIGHT",
            currentValue: generator._getWindowSize(),
          },
          s: {
            name: "Screen Info",
            description: "Screen dimensions and color depth",
            type: "string",
            format: "WIDTHxHEIGHTxCOLOR_DEPTH",
            currentValue: generator._getScreenInfo(),
          },
          sk: {
            name: "Device Pixel Ratio",
            description: "Display scaling factor (e.g., 2 for Retina displays)",
            type: "number",
            currentValue: generator._getDevicePixelRatio(),
          },
          ifr: {
            name: "In Iframe",
            description: "Whether page is loaded inside an iframe",
            type: "integer",
            possibleValues: [1, null],
            currentValue: browser.isInIframe() ? 1 : null,
          },
          j: {
            name: "Java Enabled",
            description: "Whether Java plugin is enabled",
            type: "integer",
            possibleValues: [1, null],
            currentValue: browser.isJavaEnabled() ? 1 : null,
          },
          sti: {
            name: "Safe Top Iframe",
            description: "In iframe with access to top window",
            type: "string",
            possibleValues: ["1", null],
            currentValue: generator._getSafeTopIframe(),
          },
          bu: {
            name: "Business UID",
            description: "Yandex Business site identifier (if available)",
            type: "string",
            currentValue: generator._getBusinessUid(),
          },
          pri: {
            name: "Private Mode",
            description: "Browser is in private/incognito mode",
            type: "integer",
            possibleValues: [1, null],
            currentValue: generator._getPrivateMode(),
          },
          co: {
            name: "Connection Online",
            description: "Network connection status",
            type: "integer",
            possibleValues: [0, 1],
            currentValue: generator._getConnectionStatus(),
          },
          td: {
            name: "Turbo Domain UID",
            description: "Yandex Turbo pages user identifier",
            type: "string",
            currentValue: generator._getTurboDomainUid(),
          },
          iss: {
            name: "Is Selenium",
            description: "Selenium WebDriver detected",
            type: "integer",
            possibleValues: [1, null],
            currentValue: browser.isSelenium() ? 1 : null,
          },
          hdl: {
            name: "Is Headless",
            description: "Headless browser detected (PhantomJS, HeadlessChrome)",
            type: "integer",
            possibleValues: [1, null],
            currentValue: browser.isHeadless() ? 1 : null,
          },
          iia: {
            name: "Is Instant Article",
            description: "Facebook Instant Article context detected",
            type: "integer",
            possibleValues: [1, null],
            currentValue: browser.isInstantArticle() ? 1 : null,
          },
          cpf: {
            name: "Chrome PDF Viewer",
            description: "Chrome PDF Viewer plugin present",
            type: "integer",
            possibleValues: [1, null],
            currentValue: browser.hasChromePdfViewer() ? 1 : null,
          },
          ntf: {
            name: "Notification Permission",
            description: "Web Notification permission status",
            type: "integer",
            possibleValues: [
              "1 = denied",
              "2 = granted",
              "null = default/not asked",
            ],
            currentValue: generator._getNotificationPermission(),
          },
          eu: {
            name: "Is EU",
            description: "User is in European Union (GDPR applicable)",
            type: "integer",
            possibleValues: [0, 1],
            currentValue: generator._getIsEU(),
          },
          ns: {
            name: "Navigation Start",
            description: "Timestamp when navigation started (performance.timing)",
            type: "integer",
            currentValue: time.getNavigationStart(),
          },
          np: {
            name: "Navigator Platform Hash",
            description: "Base64-encoded navigator.platform (sampled at 1%)",
            type: "string",
            currentValue: generator._getNavigatorPlatformHash(),
          },
          pr: {
            name: "Prerendering",
            description: "Page is being prerendered",
            type: "string",
            possibleValues: ["1", undefined],
            currentValue: browser.isPrerendering() ? "1" : undefined,
          },
          ds: {
            name: "Document Statistics",
            description: "Navigation timing metrics (DNS, connect, response times, etc.)",
            type: "string",
            format: "comma-separated timing values in ms",
            currentValue: generator._getDocumentStatistics(),
          },
          adb: {
            name: "Ad Blocker Status",
            description: "Ad blocker detection result",
            type: "string",
            possibleValues: ["1 = ad blocker detected", "2 = no ad blocker"],
            currentValue: generator._getAdBlockStatus(),
          },
          rqnl: {
            name: "Request Number Level",
            description: "Request numbering level indicator",
            type: "integer",
            currentValue: 1,
          },
          st: {
            name: "Start Time",
            description: "Request start timestamp in seconds",
            type: "integer",
            currentValue: time.getTimeSeconds(),
          },
          t: {
            name: "Page Title",
            description: "Document title (truncated to 400 chars)",
            type: "string",
            maxLength: CONFIG.maxTitleLength,
            currentValue: generator._getPageTitle(),
          },
        },

        telemetryFields: {
          oo: {
            name: "Observer Object",
            description: "Internal observer state",
            type: "any",
            currentValue: null,
          },
          pmc: {
            name: "Counter Match Count",
            description: "Number of matching counters found",
            type: "integer",
            currentValue: null,
          },
          re: {
            name: "Restored User",
            description: "User ID restored from localStorage (cookie was missing)",
            type: "integer",
            possibleValues: [1, null],
            currentValue: generator._isRestoredUser() ? 1 : null,
          },
          aw: {
            name: "Away State",
            description: "Page visibility state (1=visible, 0=hidden)",
            type: "integer",
            possibleValues: [0, 1, null],
            currentValue: generator._getAwayState(),
          },
          rcm: {
            name: "Resource Content Size",
            description: "Transfer size of Metrica script resource in bytes",
            type: "integer",
            currentValue: generator._getResourceTransferSize(),
          },
          yu: {
            name: "Yandex UID",
            description: "Yandex-wide user identifier from yandexuid cookie",
            type: "string",
            maxLength: 25,
            currentValue: generator._getYandexUid(),
          },
          oms: {
            name: "Observer Match State",
            description: "Internal observer matching state",
            type: "any",
            currentValue: null,
          },
        },

        fingerprintComponents: {
          canvas: {
            name: "Canvas Fingerprint",
            description: "Hash of rendered canvas image using specific fonts and shapes",
            technique: "Renders text and shapes, converts to data URL, hashes result",
            uniquenessLevel: "High",
            currentValue: fingerprint.getCanvasFingerprint(),
          },
          webgl: {
            name: "WebGL Fingerprint",
            description: "Hash of WebGL capabilities, parameters, and rendered output",
            technique: "Collects 23+ WebGL parameters, shader precision, extensions, renders triangle",
            uniquenessLevel: "Very High",
            currentValue: fingerprint.getWebGLFingerprint(),
          },
          fonts: {
            name: "Font Fingerprint",
            description: "Binary string indicating which fonts are installed",
            technique: "Measures text width with each font vs base fonts",
            fontsTested: FONT_LIST.length,
            uniquenessLevel: "High",
            currentValue: fingerprint.getFontFingerprint(),
          },
          plugins: {
            name: "Plugin Fingerprint",
            description: "List of installed browser plugins with MIME types",
            technique: "Enumerates navigator.plugins array",
            uniquenessLevel: "Medium (deprecated in modern browsers)",
            currentValue: fingerprint.getPluginFingerprint(),
          },
          audio: {
            name: "Audio Fingerprint",
            description: "Audio processing characteristics via Web Audio API",
            technique: "Creates oscillator, analyzes frequency bins",
            uniquenessLevel: "Medium",
            currentValue: fingerprint.getAudioFingerprint(),
          },
          navigator: {
            name: "Navigator Fingerprint",
            description: "Combined navigator and screen properties",
            technique: "Collects 20+ navigator properties, screen dimensions, timezone",
            properties: NAVIGATOR_PROPS,
            uniquenessLevel: "Medium-High",
            currentValue: fingerprint.getNavigatorFingerprint(),
          },
          voices: {
            name: "Speech Voices Fingerprint",
            description: "Installed text-to-speech voices",
            technique: "Enumerates speechSynthesis.getVoices()",
            uniquenessLevel: "Medium",
            currentValue: fingerprint.getSpeechVoicesFingerprint(),
          },
          touch: {
            name: "Touch Fingerprint",
            description: "Touch capability indicators",
            technique: "Checks ontouchstart, maxTouchPoints, TouchEvent",
            format: "hasTouchStart x maxTouchPoints x hasTouchEvent",
            uniquenessLevel: "Low",
            currentValue: fingerprint.getTouchFingerprint(),
          },
          mediaQueries: {
            name: "Media Queries Fingerprint",
            description: "CSS media query match results",
            technique: "Tests 23 media queries for preferences and capabilities",
            queriesTested: MEDIA_QUERIES,
            uniquenessLevel: "Medium",
            currentValue: fingerprint.getMediaQueriesFingerprint(),
          },
          gamepads: {
            name: "Gamepad Fingerprint",
            description: "Number of connected gamepads",
            technique: "Calls navigator.getGamepads()",
            uniquenessLevel: "Low",
            currentValue: fingerprint.getGamepadFingerprint(),
          },
          mediaCodecs: {
            name: "Media Codec Fingerprint",
            description: "Supported media formats and codecs",
            technique: "Tests canPlayType() for various video/audio formats",
            formatsTested: MEDIA_TYPES,
            codecsTested: MEDIA_CODECS,
            uniquenessLevel: "Medium",
            currentValue: fingerprint.getMediaCodecFingerprint(),
          },
          jsHeapSizeLimit: {
            name: "JS Heap Size Limit",
            description: "JavaScript memory limit (Chrome-specific)",
            technique: "Reads performance.memory.jsHeapSizeLimit",
            uniquenessLevel: "Low (identifies Chrome users)",
            currentValue: fingerprint.getJsHeapSizeLimitFingerprint(),
          },
          screenAvailable: {
            name: "Screen Available Dimensions",
            description: "Available screen area excluding OS UI",
            technique: "Reads screen.availWidth, availHeight, availTop",
            format: "availWidth x availHeight x availTop",
            uniquenessLevel: "Low-Medium",
            currentValue: fingerprint.getScreenAvailableFingerprint(),
          },
          doNotTrack: {
            name: "Do Not Track",
            description: "DNT header preference setting",
            technique: "Reads navigator.doNotTrack or msDoNotTrack",
            uniquenessLevel: "Low",
            currentValue: fingerprint.getDoNotTrackFingerprint(),
          },
        },

        platformAPIs: {
          description: "Browser-specific API detection for fingerprinting",
          apis: browser.getPlatformAPIs(),
          detectedBrowser: {
            isChrome: browser.hasChrome(),
            isFirefox: browser.isFirefox(),
            isSafari: browser.isSafari(),
            isOpera: browser.isOpera(),
            isBrave: browser.isBrave(),
            isIOS: browser.isIOS(),
            isAndroidWebView: browser.isAndroidWebView(),
            isTizen: browser.isTizen(),
            isWebOS: browser.isWebOS(),
          },
        },

        asyncDetection: {
          userAgentClientHints: {
            name: "User Agent Client Hints",
            description: "High-entropy UA data (architecture, platform version, etc.)",
            technique: "Calls navigator.userAgentData.getHighEntropyValues()",
            properties: CLIENT_HINTS_PROPS,
            isAsync: true,
          },
          webRTCLocalIP: {
            name: "WebRTC Local IP",
            description: "Local IP address via WebRTC ICE candidates",
            technique: "Creates RTCPeerConnection, extracts IP from SDP",
            isAsync: true,
            privacyConcern: "High - reveals local network information",
          },
          webOSInfo: {
            name: "WebOS Info",
            description: "LG TV device identifier (LGUDID)",
            technique: "Calls webOS.service.request for device IDs",
            isAsync: true,
          },
          cookieDeprecationLabel: {
            name: "Cookie Deprecation Label",
            description: "Chrome Privacy Sandbox deprecation label",
            technique: "Calls navigator.cookieDeprecationLabel.getValue()",
            isAsync: true,
          },
        },

        storageKeys: {
          cookies: {
            prefix: "_ym_",
            keys: {
              uid: "User identifier",
              d: "Last update date",
              isad: "Ad blocker detection result",
              turbo_uid: "Turbo pages user ID",
            },
          },
          localStorage: {
            prefix: "_ym{counterId}_",
            keys: {
              lsid: "Local storage session ID",
              reqNum: "Request counter",
              uid: "User identifier backup",
              fip: "Full fingerprint string",
            },
          },
        },

        privacySummary: {
          totalFieldsCollected: 37,
          fingerprintComponents: 14,
          asyncDetectionMethods: 4,
          cookiesUsed: 4,
          localStorageKeys: 4,
          canIdentifyAcrossSessions: true,
          canIdentifyAcrossSites: "Via Yandex cookies on yandex domains",
          botDetection: ["Selenium", "PhantomJS", "HeadlessChrome", "Nightmare"],
          evasionDetection: ["Private mode", "Ad blockers"],
        },
      };
    },

    /**
     * Returns a simple flat object with all current values and their descriptions
     */
    getAllCurrentValues: function () {
      const schema = this.getCollectedDataSchema();
      const result = {};

      // Browser info fields
      for (const [key, info] of Object.entries(schema.browserInfoFields)) {
        result[`browserInfo.${key}`] = {
          name: info.name,
          description: info.description,
          value: info.currentValue,
        };
      }

      // Telemetry fields
      for (const [key, info] of Object.entries(schema.telemetryFields)) {
        result[`telemetry.${key}`] = {
          name: info.name,
          description: info.description,
          value: info.currentValue,
        };
      }

      // Fingerprint components
      for (const [key, info] of Object.entries(schema.fingerprintComponents)) {
        result[`fingerprint.${key}`] = {
          name: info.name,
          description: info.description,
          value: info.currentValue,
          uniquenessLevel: info.uniquenessLevel,
        };
      }

      return result;
    },

    generate: function (options) {
      return new BrowserInfoGenerator(options).generate();
    },

    asyncGenerate: async function (options) {
      return new BrowserInfoGenerator(options).asyncGenerate();
    },

    getFingerprint: function () {
      return new FingerprintCollector(window).generateFullFingerprint();
    },

    getFingerprintHash: function () {
      return new FingerprintCollector(window).generateFingerprintHash();
    },

    getFingerprintHash128: function () {
      const fp = new FingerprintCollector(window).generateFullFingerprint();
      return murmurhash3_128(fp);
    },

    getPlatformAPIs: function () {
      return new BrowserDetector(window).getPlatformAPIs();
    },

    // New async detection methods
    getAsyncDetection: async function () {
      const browser = new BrowserDetector(window);
      const [clientHints, webRTCIP, webOSInfo, cookieLabel, voices] = await Promise.all([
        browser.getUserAgentClientHints().catch(() => null),
        browser.getWebRTCLocalIP().catch(() => null),
        browser.getWebOSInfo().catch(() => null),
        browser.getCookieDeprecationLabel().catch(() => null),
        browser.getSpeechVoicesAsync().catch(() => ({ count: 0, list: [] })),
      ]);
      return {
        userAgentClientHints: clientHints,
        webRTCLocalIP: webRTCIP,
        webOSInfo: webOSInfo,
        cookieDeprecationLabel: cookieLabel,
        voices: voices,
      };
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = window.YandexBrowserInfo;
  }
})(typeof window !== "undefined" ? window : this);
