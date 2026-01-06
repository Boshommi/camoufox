/**
 * Config Formatter for Camoufox
 * Formats fingerprint config as Python dict or JSON
 */

import type { CamoufoxConfig } from "./fingerprint-detector";

/**
 * Format a JavaScript value as a Python literal
 */
function toPythonValue(value: unknown, indent: number = 0): string {
  const spaces = "    ".repeat(indent);
  const innerSpaces = "    ".repeat(indent + 1);

  if (value === null || value === undefined) {
    return "None";
  }

  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }

  if (typeof value === "number") {
    if (Number.isNaN(value)) {
      return "float('nan')";
    }
    if (!Number.isFinite(value)) {
      return value > 0 ? "float('inf')" : "float('-inf')";
    }
    return String(value);
  }

  if (typeof value === "string") {
    // Use double quotes and escape special characters
    const escaped = value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return `"${escaped}"`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }

    // Check if all items are simple (single line)
    const isSimple = value.every(
      (v) =>
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        v === null
    );

    if (isSimple && value.length <= 5) {
      const items = value.map((v) => toPythonValue(v, 0)).join(", ");
      return `[${items}]`;
    }

    // Multi-line array
    const items = value
      .map((v) => `${innerSpaces}${toPythonValue(v, indent + 1)}`)
      .join(",\n");
    return `[\n${items},\n${spaces}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return "{}";
    }

    // Check if all values are simple
    const isSimple = entries.every(
      ([, v]) =>
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        v === null
    );

    if (isSimple && entries.length <= 3) {
      const items = entries
        .map(([k, v]) => `${toPythonValue(k, 0)}: ${toPythonValue(v, 0)}`)
        .join(", ");
      return `{${items}}`;
    }

    // Multi-line object
    const items = entries
      .map(
        ([k, v]) =>
          `${innerSpaces}${toPythonValue(k, 0)}: ${toPythonValue(v, indent + 1)}`
      )
      .join(",\n");
    return `{\n${items},\n${spaces}}`;
  }

  return String(value);
}

/**
 * Group config keys by category for better organization
 */
function groupConfigKeys(config: CamoufoxConfig): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  const categoryOrder = [
    "navigator",
    "screen",
    "window",
    "document",
    "pdfViewerEnabled",
    "battery",
    "geolocation",
    "timezone",
    "locale",
    "AudioContext",
    "webGl",
    "webGl2",
    "voices",
    "mediaDevices",
    "net-info-api",
    "mediaQuery",
    "mediaCodec",
    "canvas",
  ];

  // Initialize groups in order
  for (const category of categoryOrder) {
    groups.set(category, []);
  }
  groups.set("other", []);

  // Sort keys into groups
  for (const key of Object.keys(config)) {
    let matched = false;

    for (const category of categoryOrder) {
      if (key.startsWith(category)) {
        groups.get(category)!.push(key);
        matched = true;
        break;
      }
    }

    if (!matched) {
      groups.get("other")!.push(key);
    }
  }

  // Remove empty groups
  for (const [key, value] of groups) {
    if (value.length === 0) {
      groups.delete(key);
    }
  }

  return groups;
}

/**
 * Get category display name
 */
function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    navigator: "Navigator",
    screen: "Screen",
    window: "Window",
    document: "Document",
    pdfViewerEnabled: "PDF Viewer",
    battery: "Battery API",
    geolocation: "Geolocation",
    timezone: "Timezone",
    locale: "Locale",
    AudioContext: "Audio Context",
    webGl: "WebGL",
    webGl2: "WebGL2",
    voices: "Speech Synthesis",
    mediaDevices: "Media Devices",
    "net-info-api": "Network Information API",
    mediaQuery: "Media Queries",
    mediaCodec: "Media Codecs",
    canvas: "Canvas Fingerprints",
    other: "Other",
  };
  return names[category] || category;
}

/**
 * Format config as Python dict string
 */
export function toPythonDict(
  config: CamoufoxConfig,
  options: {
    includeComments?: boolean;
    variableName?: string;
  } = {}
): string {
  const { includeComments = true, variableName = "config" } = options;

  const groups = groupConfigKeys(config);
  const lines: string[] = [];

  lines.push(`${variableName} = {`);

  let isFirst = true;
  for (const [category, keys] of groups) {
    if (keys.length === 0) continue;

    // Add section comment
    if (includeComments) {
      if (!isFirst) {
        lines.push("");
      }
      lines.push(`    # ${getCategoryName(category)}`);
    }
    isFirst = false;

    // Add key-value pairs
    for (const key of keys) {
      const value = config[key];
      const pythonValue = toPythonValue(value, 1);
      lines.push(`    ${toPythonValue(key)}: ${pythonValue},`);
    }
  }

  lines.push("}");

  return lines.join("\n");
}

/**
 * Format config as JSON string
 */
export function toJSON(config: CamoufoxConfig, pretty: boolean = true): string {
  if (pretty) {
    return JSON.stringify(config, null, 2);
  }
  return JSON.stringify(config);
}

/**
 * Get statistics about the detected config
 */
export function getConfigStats(config: CamoufoxConfig): {
  totalProperties: number;
  categories: { name: string; count: number }[];
} {
  const groups = groupConfigKeys(config);
  const categories: { name: string; count: number }[] = [];

  for (const [category, keys] of groups) {
    if (keys.length > 0) {
      categories.push({
        name: getCategoryName(category),
        count: keys.length,
      });
    }
  }

  return {
    totalProperties: Object.keys(config).length,
    categories,
  };
}
