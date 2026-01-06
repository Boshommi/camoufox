"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import {
  detectAll,
  DETECTOR_VERSION,
  type CamoufoxConfig,
} from "~/lib/fingerprint-detector";
import { generateProfileName } from "~/lib/profile-utils";
import { toPythonDict, toJSON, getConfigStats } from "~/lib/config-formatter";

type CaptureStatus = "idle" | "detecting" | "rendering" | "saving" | "done" | "error";

// djb2 hash function
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16);
}

// Decompress gzip data and return raw bytes
async function decompressPixels(
  compressed: string,
): Promise<Uint8ClampedArray> {
  if (compressed.startsWith("raw:")) {
    const binary = atob(compressed.slice(4));
    const bytes = new Uint8ClampedArray(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  const binary = atob(compressed);
  const compressedBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    compressedBytes[i] = binary.charCodeAt(i);
  }

  const stream = new Blob([compressedBytes]).stream();
  const decompressedStream = stream.pipeThrough(
    new DecompressionStream("gzip"),
  );
  const decompressedBlob = await new Response(decompressedStream).blob();
  const arrayBuffer = await decompressedBlob.arrayBuffer();
  return new Uint8ClampedArray(arrayBuffer);
}

interface CanvasFingerprint {
  hash: string;
  width: number;
  height: number;
  method: string;
  dataURL: string;
}

function CapturePageContent() {
  const searchParams = useSearchParams();
  const profileNameParam = searchParams.get("profile");

  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [hasValidCaptureCookie, setHasValidCaptureCookie] = useState(() => {
    if (typeof document === 'undefined') return false;
    const match = document.cookie.match(/camoufox_captured=v(\d+)/);
    if (!match) return false;
    // Cookie is valid only if version matches current detector version
    return match[1] === String(DETECTOR_VERSION);
  });
  const [error, setError] = useState<string | null>(null);
  const [fingerprintConfig, setFingerprintConfig] = useState<CamoufoxConfig | null>(null);
  const [canvasFingerprints, setCanvasFingerprints] = useState<CanvasFingerprint[]>([]);
  const [profileName, setProfileName] = useState<string>("");
  const [savedProfileName, setSavedProfileName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"python" | "json">("python");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: existingCanvasFingerprints } = api.canvas.list.useQuery();

  const saveProfile = api.profile.save.useMutation({
    onSuccess: (data) => {
      setSavedProfileName(data.name);
      setStatus("done");
      // Set cookie with detector version to prevent re-capture on reload (expires in 24h)
      document.cookie = `camoufox_captured=v${DETECTOR_VERSION}; path=/; max-age=86400`;
      setHasValidCaptureCookie(true);
    },
    onError: (err) => {
      setError(err.message);
      setStatus("error");
    },
  });

  // Render canvas fingerprints for this device
  const renderCanvasFingerprints = useCallback(async (): Promise<CanvasFingerprint[]> => {
    if (!existingCanvasFingerprints || existingCanvasFingerprints.length === 0) {
      return [];
    }

    const canvas = canvasRef.current;
    if (!canvas) return [];

    const results: CanvasFingerprint[] = [];

    for (const fp of existingCanvasFingerprints) {
      try {
        canvas.width = fp.width;
        canvas.height = fp.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        const bytes = await decompressPixels(fp.pixelData);
        const imageData = ctx.createImageData(fp.width, fp.height);
        imageData.data.set(bytes);
        ctx.putImageData(imageData, 0, 0);

        const renderedDataURL = canvas.toDataURL("image/png");

        results.push({
          hash: fp.hash,
          width: fp.width,
          height: fp.height,
          method: fp.method,
          dataURL: renderedDataURL,
        });
      } catch (e) {
        console.error("Failed to render canvas:", fp.hash, e);
      }
    }

    return results;
  }, [existingCanvasFingerprints]);

  // Main capture flow
  const runCapture = useCallback(async () => {
    setStatus("detecting");
    setError(null);
    setSavedProfileName(null);

    try {
      // Step 1: Detect fingerprint
      const detection = await detectAll({ skipGeolocation: true });
      setFingerprintConfig(detection.config);

      // Determine profile name
      let name = profileNameParam || "";
      if (!name) {
        name = generateProfileName(detection.config);
      }
      setProfileName(name);

      // Step 2: Render canvas fingerprints
      setStatus("rendering");
      const canvasResults = await renderCanvasFingerprints();
      setCanvasFingerprints(canvasResults);

      // Step 3: Save profile
      setStatus("saving");
      await saveProfile.mutateAsync({
        name,
        fingerprintConfig: detection.config,
        canvasFingerprints: canvasResults,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }, [profileNameParam, renderCanvasFingerprints, saveProfile]);

  // Auto-run capture on mount (skip if already captured with current detector version)
  useEffect(() => {
    if (status === "idle" && existingCanvasFingerprints !== undefined && !hasValidCaptureCookie) {
      runCapture();
    }
  }, [existingCanvasFingerprints, hasValidCaptureCookie]);

  // Handle manual re-capture (clears cookie to allow fresh capture)
  const handleRecapture = useCallback(() => {
    document.cookie = 'camoufox_captured=; path=/; max-age=0';
    setHasValidCaptureCookie(false);
    runCapture();
  }, [runCapture]);

  const getFormattedOutput = useCallback(() => {
    if (!fingerprintConfig) return "";

    // Add canvas fingerprints to config
    const configWithCanvas = { ...fingerprintConfig };
    if (canvasFingerprints.length > 0) {
      const canvasConfig: Record<string, string> = {};
      for (const cf of canvasFingerprints) {
        canvasConfig[cf.hash] = cf.dataURL;
      }
      configWithCanvas["canvas:fingerprints"] = canvasConfig;
    }

    if (outputFormat === "python") {
      return toPythonDict(configWithCanvas, { includeComments: true });
    }
    return toJSON(configWithCanvas, true);
  }, [fingerprintConfig, canvasFingerprints, outputFormat]);

  const copyToClipboard = async () => {
    const output = getFormattedOutput();
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = output;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stats = fingerprintConfig ? getConfigStats(fingerprintConfig) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Capture Fingerprint</h1>
        <p className="text-gray-400 mb-6">
          Auto-detect and save browser fingerprint profile
        </p>

        {/* Status Banner */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            {status === "idle" && !hasValidCaptureCookie && (
              <span className="text-gray-400">Waiting for canvas data...</span>
            )}
            {status === "idle" && hasValidCaptureCookie && (
              <span className="text-yellow-400">Already captured (v{DETECTOR_VERSION}). Click Re-capture to run again.</span>
            )}
            {status === "detecting" && (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Detecting fingerprint...
              </span>
            )}
            {status === "rendering" && (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Rendering canvas fingerprints...
              </span>
            )}
            {status === "saving" && (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving profile...
              </span>
            )}
            {status === "done" && savedProfileName && (
              <span className="text-green-400">
                Profile saved as &quot;{savedProfileName}&quot;
              </span>
            )}
            {status === "error" && (
              <span className="text-red-400">Error: {error}</span>
            )}

            <div className="ml-auto flex items-center gap-4">
              <span className="text-xs text-gray-500">
                Detector v{DETECTOR_VERSION}
              </span>
              <button
                onClick={handleRecapture}
                disabled={status === "detecting" || status === "rendering" || status === "saving"}
                className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Re-capture
              </button>
            </div>
          </div>

          {profileNameParam && (
            <p className="text-sm text-gray-500 mt-2">
              Profile name from URL: <code className="bg-gray-700 px-1 rounded">{profileNameParam}</code>
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {fingerprintConfig && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Statistics</h2>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {stats?.totalProperties}
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  properties detected
                </div>

                <div className="space-y-2">
                  {stats?.categories.map((cat) => (
                    <div key={cat.name} className="flex justify-between text-sm">
                      <span className="text-gray-400">{cat.name}</span>
                      <span className="text-gray-200">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Canvas Fingerprints */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">
                  Canvas Fingerprints
                </h2>
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {canvasFingerprints.length}
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  rendered for this device
                </div>

                {canvasFingerprints.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {canvasFingerprints.map((cf) => (
                      <div
                        key={cf.hash}
                        className="text-xs bg-gray-900 rounded p-2"
                      >
                        <code className="text-purple-300">{cf.hash}</code>
                        <span className="text-gray-500 ml-2">
                          {cf.width}x{cf.height}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {canvasFingerprints.length === 0 && existingCanvasFingerprints?.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No canvas fingerprints collected yet. Use the browser extension to capture them.
                  </p>
                )}
              </div>

              {/* Profile Info */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Profile</h2>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Name</dt>
                    <dd className="text-gray-200 font-mono">{profileName}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Detector Version</dt>
                    <dd className="text-gray-200">{DETECTOR_VERSION}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Status</dt>
                    <dd>
                      {savedProfileName ? (
                        <span className="text-green-400">Saved</span>
                      ) : (
                        <span className="text-yellow-400">Not saved</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Output Panel */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">
                    {outputFormat === "python" ? "Python Config" : "JSON Config"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as "python" | "json")}
                      className="bg-gray-700 rounded px-2 py-1 text-sm"
                    >
                      <option value="python">Python dict</option>
                      <option value="json">JSON</option>
                    </select>
                    <button
                      onClick={copyToClipboard}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        copied
                          ? "bg-green-600"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <pre className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px] text-sm font-mono">
                  <code className="text-gray-300">{getFormattedOutput()}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {status === "idle" && !fingerprintConfig && !hasValidCaptureCookie && (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">...</div>
            <h2 className="text-xl font-semibold mb-2">Loading</h2>
            <p className="text-gray-400">
              Waiting for canvas fingerprint data before auto-detection...
            </p>
          </div>
        )}
        {status === "idle" && !fingerprintConfig && hasValidCaptureCookie && (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">&#x2714;</div>
            <h2 className="text-xl font-semibold mb-2">Already Captured</h2>
            <p className="text-gray-400">
              A profile was captured with detector v{DETECTOR_VERSION}. Click &quot;Re-capture&quot; to run again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CapturePageFallback() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Capture Fingerprint</h1>
        <p className="text-gray-400 mb-6">
          Auto-detect and save browser fingerprint profile
        </p>
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">...</div>
          <h2 className="text-xl font-semibold mb-2">Loading</h2>
          <p className="text-gray-400">Initializing...</p>
        </div>
      </div>
    </div>
  );
}

export default function CapturePage() {
  return (
    <Suspense fallback={<CapturePageFallback />}>
      <CapturePageContent />
    </Suspense>
  );
}
