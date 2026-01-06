"use client";

import { useState, useCallback } from "react";
import {
  detectAll,
  type CamoufoxConfig,
  type DetectionResult,
} from "~/lib/fingerprint-detector";
import { toPythonDict, toJSON, getConfigStats } from "~/lib/config-formatter";

type DetectionStatus = "idle" | "detecting" | "done" | "error";

export default function DetectPage() {
  const [status, setStatus] = useState<DetectionStatus>("idle");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"python" | "json">("python");
  const [skipGeolocation, setSkipGeolocation] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runDetection = useCallback(async () => {
    setStatus("detecting");
    setError(null);
    setCopied(false);

    try {
      const detection = await detectAll({ skipGeolocation });
      setResult(detection);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }, [skipGeolocation]);

  const getFormattedOutput = useCallback(() => {
    if (!result) return "";

    if (outputFormat === "python") {
      return toPythonDict(result.config, { includeComments: true });
    }
    return toJSON(result.config, true);
  }, [result, outputFormat]);

  const copyToClipboard = useCallback(async () => {
    const output = getFormattedOutput();
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = output;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getFormattedOutput]);

  const stats = result ? getConfigStats(result.config) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Fingerprint Detector</h1>
        <p className="text-gray-400 mb-6">
          Detect browser fingerprint properties and generate a Camoufox config
        </p>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={runDetection}
              disabled={status === "detecting"}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                status === "detecting"
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {status === "detecting" ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Detecting...
                </span>
              ) : (
                "Detect Fingerprint"
              )}
            </button>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={skipGeolocation}
                onChange={(e) => setSkipGeolocation(e.target.checked)}
                className="rounded bg-gray-700 border-gray-600"
              />
              Skip geolocation (requires permission)
            </label>

            {result && (
              <>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-gray-400">Format:</span>
                  <select
                    value={outputFormat}
                    onChange={(e) =>
                      setOutputFormat(e.target.value as "python" | "json")
                    }
                    className="bg-gray-700 rounded px-2 py-1 text-sm"
                  >
                    <option value="python">Python dict</option>
                    <option value="json">JSON</option>
                  </select>
                </div>

                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    copied
                      ? "bg-green-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h2 className="text-lg font-semibold mb-3">Statistics</h2>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {stats?.totalProperties}
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  properties detected
                </div>

                <div className="space-y-2">
                  {stats?.categories.map((cat) => (
                    <div
                      key={cat.name}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-400">{cat.name}</span>
                      <span className="text-gray-200">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unavailable APIs */}
              {result.unavailable.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <h2 className="text-lg font-semibold mb-3 text-yellow-400">
                    Unavailable APIs
                  </h2>
                  <ul className="text-sm space-y-1">
                    {result.unavailable.map((api) => (
                      <li key={api} className="text-gray-400">
                        {api}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    These APIs are not available in your browser
                  </p>
                </div>
              )}

              {/* Not Detected Notice */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 text-orange-400">
                  Manual Config Needed
                </h2>
                <ul className="text-sm space-y-1 text-gray-400">
                  <li>canvas:fingerprints (use Canvas page)</li>
                  <li>webrtc:ipv4/ipv6 (specify spoofed IP)</li>
                  <li>fonts (whitelist approach)</li>
                  <li>HTTP headers (server-side)</li>
                </ul>
              </div>
            </div>

            {/* Output Panel */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">
                    {outputFormat === "python" ? "Python Config" : "JSON Config"}
                  </h2>
                  <span className="text-xs text-gray-500">
                    Ready to paste into test.py
                  </span>
                </div>

                <pre className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px] text-sm font-mono">
                  <code className="text-gray-300">{getFormattedOutput()}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Initial State */}
        {status === "idle" && (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">
              Ready to Detect Fingerprint
            </h2>
            <p className="text-gray-400 mb-4">
              Click the button above to detect all browser fingerprint
              properties.
            </p>
            <p className="text-sm text-gray-500">
              This will detect ~100 properties including Navigator, Screen,
              WebGL, Audio, and more.
            </p>
          </div>
        )}

        {/* Property Reference */}
        {status === "done" && result && (
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Quick Property Reference</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs font-mono">
              {Object.keys(result.config)
                .sort()
                .map((key) => (
                  <div
                    key={key}
                    className="bg-gray-900 rounded px-2 py-1 truncate"
                    title={key}
                  >
                    {key}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
