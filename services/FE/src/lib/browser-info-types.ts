/**
 * TypeScript types for browser-info-generator.js (YandexBrowserInfo)
 * This file provides type definitions for the browser info collection library
 */

export interface PlatformAPIs {
  hasChrome: boolean;
  jsHeapLimit: number | null;
  hasPdfViewer: boolean;
  applePay: {
    available: boolean;
    canMakePayments: boolean;
    supportedVersions: string;
  } | null;
  hasInstallTrigger: boolean;
  hasMozAppearance: boolean;
  isOpera: boolean;
  isBrave: boolean;
  msDoNotTrack: string | null;
  hasWebkitPerformance: boolean;
  hasWebkitNotifications: boolean;
  hasPermissions: boolean;
  hasCredentials: boolean;
  hasBluetooth: boolean;
  hasUSB: boolean;
  hasSerial: boolean;
  hasSharedArrayBuffer: boolean;
  hasWebGL2: boolean;
  hasOffscreenCanvas: boolean;
}

export interface FingerprintComponents {
  canvas: string;
  webgl: string;
  fonts: string;
  plugins: string;
  audio: string;
  navigator: string;
  voices: string;
  touch: string;
  mediaQueries: string;
  gamepads: string;
  mediaCodecs: string;
  jsHeapSizeLimit: string;
  screenAvailable: string;
  doNotTrack: string;
}

export interface VoiceInfo {
  name: string;
  lang: string;
  localService: boolean;
  voiceURI: string;
  default: boolean;
}

export interface AsyncDetectionResult {
  userAgentClientHints: {
    architecture: string;
    bitness: string;
    model: string;
    platformVersion: string;
    uaFullVersion: string;
    fullVersionList: Array<{ brand: string; version: string }>;
    mobile: boolean;
    platform: string;
  } | null;
  webRTCLocalIP: string | null;
  webOSInfo: { lgudid: string } | null;
  cookieDeprecationLabel: string | null;
  voices: {
    count: number;
    list: VoiceInfo[];
    error?: string;
  };
}

export interface BrowserInfoResult {
  browserInfo: string;
  telemetry: string;
  fingerprint: string;
  fields: Record<string, unknown>;
  telemetryFields: Record<string, unknown>;
  fingerprintComponents: FingerprintComponents;
  platformAPIs: PlatformAPIs;
  doNotTrack: string;
  screenAvailable: string;
  tizenInfo: { tifa?: string; tizenId?: string; duid?: string } | null;
  asyncDetection: {
    userAgentClientHints: Promise<AsyncDetectionResult["userAgentClientHints"]>;
    webRTCLocalIP: Promise<string | null>;
    webOSInfo: Promise<{ lgudid: string } | null>;
    cookieDeprecationLabel: Promise<string | null>;
  };
}

/**
 * Result from asyncGenerate - same as BrowserInfoResult but with resolved async data
 */
export interface AsyncBrowserInfoResult {
  browserInfo: string;
  telemetry: string;
  fingerprint: string;
  fields: Record<string, unknown>;
  telemetryFields: Record<string, unknown>;
  fingerprintComponents: FingerprintComponents;
  platformAPIs: PlatformAPIs;
  doNotTrack: string;
  screenAvailable: string;
  tizenInfo: { tifa?: string; tizenId?: string; duid?: string } | null;
  asyncDetection: AsyncDetectionResult;
}

export interface CamoufoxConfig {
  [key: string]: unknown;
}

/**
 * Interface for the YandexBrowserInfo global object
 */
export interface YandexBrowserInfoAPI {
  Generator: new (options?: BrowserInfoGeneratorOptions) => BrowserInfoGenerator;
  FingerprintCollector: new (win: Window) => FingerprintCollector;
  BrowserDetector: new (win: Window) => BrowserDetector;
  CookieStorage: new (
    win: Window,
    prefix?: string,
    suffix?: string
  ) => CookieStorage;
  LocalStorageHelper: new (
    win: Window,
    counterId?: number,
    prefix?: string
  ) => LocalStorageHelper;
  GlobalState: new (win: Window) => GlobalState;
  TimeHelper: new (win: Window) => TimeHelper;
  CONFIG: {
    scriptVersion: string;
    versionFingerprint: string;
    host: string;
    protocol: string;
    maxTitleLength: number;
    maxUrlLength: number;
    noindexValue: string;
  };
  FONT_LIST: string[];
  WEBGL_PARAMS: string[];
  MEDIA_QUERIES: string[];
  MEDIA_TYPES: string[];
  MEDIA_CODECS: string[];
  SCREEN_AVAIL_PROPS: string[];
  CLIENT_HINTS_PROPS: string[];
  RTC_PEER_CONNECTIONS: string[];
  getCollectedDataSchema: () => CollectedDataSchema;
  getAllCurrentValues: () => Record<
    string,
    { name: string; description: string; value: unknown }
  >;
  generate: (options?: BrowserInfoGeneratorOptions) => BrowserInfoResult;
  asyncGenerate: (options?: BrowserInfoGeneratorOptions) => Promise<AsyncBrowserInfoResult>;
  getFingerprint: () => string;
  getFingerprintHash: () => string;
  getFingerprintHash128: () => string;
  getPlatformAPIs: () => PlatformAPIs;
  getAsyncDetection: () => Promise<AsyncDetectionResult>;
}

export interface BrowserInfoGeneratorOptions {
  window?: Window;
  counterId?: number;
  counterType?: string;
  pageUrl?: string;
  pageRef?: string;
  isPageView?: boolean;
  isAutoRequest?: boolean;
  noCookies?: boolean;
}

export interface BrowserInfoGenerator {
  generate(): BrowserInfoResult;
  asyncGenerate(): Promise<AsyncBrowserInfoResult>;
}

export interface FingerprintCollector {
  getCanvasFingerprint(): string;
  getWebGLFingerprint(): string;
  getFontFingerprint(): string;
  getPluginFingerprint(): string;
  getAudioFingerprint(): string;
  getNavigatorFingerprint(): string;
  getSpeechVoicesFingerprint(): string;
  getMediaQueriesFingerprint(): string;
  getTouchFingerprint(): string;
  getGamepadFingerprint(): string;
  getMediaCodecFingerprint(): string;
  getJsHeapSizeLimitFingerprint(): string;
  getScreenAvailableFingerprint(): string;
  getDoNotTrackFingerprint(): string;
  generateFullFingerprint(): string;
  generateFingerprintHash(): string;
}

export interface BrowserDetector {
  getUserAgent(): string;
  isIOS(): boolean;
  isFirefox(): boolean;
  isSafari(): boolean;
  isChrome76Plus(): boolean;
  isAndroidWebView(): boolean;
  isInIframe(): boolean;
  hasTopAccess(): boolean;
  isYandexDomain(): boolean;
  isPrerendering(): boolean;
  isJavaEnabled(): boolean;
  isSelenium(): boolean;
  isHeadless(): boolean;
  isInstantArticle(): boolean;
  hasChromePdfViewer(): boolean;
  getNetworkType(): string | null;
  getPlatform(): string;
  hasChrome(): boolean;
  getJsHeapSizeLimit(): number | null;
  hasApplePay(): { available: boolean; canMakePayments: boolean } | null;
  getMsDoNotTrack(): string | null;
  isOpera(): boolean;
  isBrave(): boolean;
  getPlatformAPIs(): PlatformAPIs;
  getDoNotTrack(): string;
  getScreenAvailable(): string;
  getUserAgentClientHints(): Promise<AsyncDetectionResult["userAgentClientHints"]>;
  getWebRTCLocalIP(): Promise<string | null>;
  isTizen(): boolean;
  getTizenInfo(): { tifa?: string; tizenId?: string; duid?: string } | null;
  isWebOS(): boolean;
  getWebOSInfo(): Promise<{ lgudid: string } | null>;
  getCookieDeprecationLabel(): Promise<string | null>;
  getSpeechVoicesAsync(): Promise<{ count: number; list: VoiceInfo[] }>;
}

export interface CookieStorage {
  get(name: string): string | null;
  set(name: string, value: string, minutes?: number, domain?: string): this;
  remove(name: string, domain?: string): this;
}

export interface LocalStorageHelper {
  blocked: boolean;
  get<T>(name: string, defaultValue?: T): T | null;
  set(name: string, value: unknown): this;
  remove(name: string): this;
}

export interface GlobalState {
  get<T>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: unknown): this;
}

export interface TimeHelper {
  getTime(): number;
  getTimeSeconds(): number;
  getNavigationStart(): number;
}

export interface CollectedDataSchema {
  browserInfoFields: Record<
    string,
    {
      name: string;
      description: string;
      type: string;
      possibleValues?: unknown[];
      currentValue: unknown;
      format?: string;
      maxLength?: number;
    }
  >;
  telemetryFields: Record<
    string,
    {
      name: string;
      description: string;
      type: string;
      possibleValues?: unknown[];
      currentValue: unknown;
      maxLength?: number;
    }
  >;
  fingerprintComponents: Record<
    string,
    {
      name: string;
      description: string;
      technique: string;
      uniquenessLevel: string;
      currentValue: string;
      fontsTested?: number;
      queriesTested?: string[];
      formatsTested?: string[];
      codecsTested?: string[];
      properties?: string[];
      format?: string;
    }
  >;
  platformAPIs: {
    description: string;
    apis: PlatformAPIs;
    detectedBrowser: {
      isChrome: boolean;
      isFirefox: boolean;
      isSafari: boolean;
      isOpera: boolean;
      isBrave: boolean;
      isIOS: boolean;
      isAndroidWebView: boolean;
      isTizen: boolean;
      isWebOS: boolean;
    };
  };
  asyncDetection: Record<
    string,
    {
      name: string;
      description: string;
      technique: string;
      isAsync: boolean;
      properties?: string[];
      privacyConcern?: string;
    }
  >;
  storageKeys: {
    cookies: { prefix: string; keys: Record<string, string> };
    localStorage: { prefix: string; keys: Record<string, string> };
  };
  privacySummary: {
    totalFieldsCollected: number;
    fingerprintComponents: number;
    asyncDetectionMethods: number;
    cookiesUsed: number;
    localStorageKeys: number;
    canIdentifyAcrossSessions: boolean;
    canIdentifyAcrossSites: string;
    botDetection: string[];
    evasionDetection: string[];
  };
}

// Declare global augmentation for window.YandexBrowserInfo
declare global {
  interface Window {
    YandexBrowserInfo?: YandexBrowserInfoAPI;
  }
}
