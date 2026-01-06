/**
 * Profile utilities for Camoufox
 * Auto-naming and validation functions for fingerprint profiles
 */

import type { CamoufoxConfig } from "./fingerprint-detector";

/**
 * Generate a 4-character hash from fingerprint config
 * Uses a simple djb2 hash for consistency
 */
export function generateProfileHash(config: CamoufoxConfig): string {
  const str = JSON.stringify(config);
  let hash = 5381;

  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }

  // Convert to unsigned 32-bit and take last 4 hex chars
  return (hash >>> 0).toString(16).slice(-4).padStart(4, "0");
}

/**
 * Detect browser name from user agent string
 */
export function detectBrowser(userAgent: string | undefined): string {
  if (!userAgent) return "Unknown";

  const ua = userAgent.toLowerCase();

  // Order matters - check more specific patterns first
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("chrome")) return "Chrome";
  if (ua.includes("safari")) return "Safari";

  return "Unknown";
}

/**
 * Generate a profile name from fingerprint config
 * Format: "Browser-WidthxHeight-hash4"
 * Examples: "Firefox-1920x1080-a3f2", "Chrome-2560x1440-b7c9"
 */
export function generateProfileName(config: CamoufoxConfig): string {
  const userAgent = config["navigator.userAgent"] as string | undefined;
  const browser = detectBrowser(userAgent);
  const width = (config["screen.width"] as number) || 0;
  const height = (config["screen.height"] as number) || 0;
  const hash = generateProfileHash(config);

  return `${browser}-${width}x${height}-${hash}`;
}

/**
 * Validate a profile name
 * - Must be 1-64 characters
 * - Only alphanumeric, dash, underscore, and dot allowed
 */
export function isValidProfileName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 64) {
    return false;
  }

  // Allow alphanumeric, dash, underscore, dot
  const validPattern = /^[a-zA-Z0-9\-_.]+$/;
  return validPattern.test(name);
}

/**
 * Sanitize a profile name to make it valid
 */
export function sanitizeProfileName(name: string): string {
  // Replace invalid characters with dash
  let sanitized = name.replace(/[^a-zA-Z0-9\-_.]/g, "-");

  // Remove consecutive dashes
  sanitized = sanitized.replace(/-+/g, "-");

  // Trim dashes from start and end
  sanitized = sanitized.replace(/^-+|-+$/g, "");

  // Truncate to 64 chars
  if (sanitized.length > 64) {
    sanitized = sanitized.slice(0, 64);
  }

  // If empty after sanitization, generate a random name
  if (!sanitized) {
    sanitized = `profile-${Date.now().toString(36)}`;
  }

  return sanitized;
}

/**
 * Parse profile info from config for display
 */
export function getProfileInfo(config: CamoufoxConfig): {
  browser: string;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  hashSuffix: string;
} {
  const userAgent = (config["navigator.userAgent"] as string) || "";

  return {
    browser: detectBrowser(userAgent),
    screenWidth: (config["screen.width"] as number) || 0,
    screenHeight: (config["screen.height"] as number) || 0,
    userAgent,
    hashSuffix: generateProfileHash(config),
  };
}
