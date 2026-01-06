"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { api } from "~/trpc/react";

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
  // Check if it's uncompressed (fallback)
  if (compressed.startsWith("raw:")) {
    const binary = atob(compressed.slice(4));
    const bytes = new Uint8ClampedArray(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Decompress gzip
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

// Convert raw RGBA pixels (gzip compressed base64) to PNG dataURL
async function rawPixelsToDataURL(
  rawPixels: string,
  width: number,
  height: number,
): Promise<string> {
  try {
    const bytes = await decompressPixels(rawPixels);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(bytes);
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Failed to convert raw pixels:", e);
    return "";
  }
}

export default function CanvasPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState("");
  const [rendering, setRendering] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});

  const { data: fingerprints, isLoading, refetch } = api.canvas.list.useQuery();

  const uploadRender = api.canvas.uploadRender.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteFingerprint = api.canvas.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteAll = api.canvas.deleteAll.useMutation({
    onSuccess: () => refetch(),
  });

  useEffect(() => {
    setDeviceInfo(navigator.userAgent.slice(0, 50));
  }, []);

  // Generate preview URLs for all fingerprints (async)
  useEffect(() => {
    if (!fingerprints) return;

    const generatePreviews = async () => {
      const newCache: Record<string, string> = {};
      for (const fp of fingerprints) {
        if (!previewCache[fp.hash]) {
          try {
            newCache[fp.hash] = await rawPixelsToDataURL(
              fp.pixelData,
              fp.width,
              fp.height,
            );
          } catch (e) {
            console.error("Failed to generate preview for", fp.hash, e);
          }
        }
      }
      if (Object.keys(newCache).length > 0) {
        setPreviewCache((prev) => ({ ...prev, ...newCache }));
      }
    };

    generatePreviews();
  }, [fingerprints]);

  const getPreviewURL = (fp: {
    hash: string;
    pixelData: string;
    width: number;
    height: number;
  }) => {
    return previewCache[fp.hash] || "";
  };

  const renderAndSave = async (
    fp: NonNullable<typeof fingerprints>[number],
  ) => {
    if (!deviceInfo.trim()) {
      alert("Please enter device info first");
      return;
    }

    setRendering(fp.hash);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = fp.width;
      canvas.height = fp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Decompress and convert raw pixels to ImageData
      const bytes = await decompressPixels(fp.pixelData);
      const imageData = ctx.createImageData(fp.width, fp.height);
      imageData.data.set(bytes);
      ctx.putImageData(imageData, 0, 0);

      // Now get device-specific toDataURL output
      const renderedDataURL = canvas.toDataURL("image/png");

      await uploadRender.mutateAsync({
        hash: fp.hash,
        deviceInfo: deviceInfo.trim(),
        dataURL: renderedDataURL,
      });
    } catch (error) {
      console.error("Failed to render:", error);
    } finally {
      setRendering(null);
    }
  };

  const renderAll = async () => {
    if (!fingerprints) return;
    for (const fp of fingerprints) {
      await renderAndSave(fp);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Config maps: rawPixelHash -> spoofedToDataURL
  // Key: fp.hash = hash of raw pixels (device-independent, computed by inject.js)
  // Value: the stored render's toDataURL (what we want Camoufox to return)
  const getConfigJson = () => {
    if (!fingerprints) return "{}";
    const config: Record<string, string> = {};
    for (const fp of fingerprints) {
      const render = fp.renders[0];
      if (render) {
        // Key: hash of raw pixels (device-independent)
        // Value: the spoofed toDataURL output
        config[fp.hash] = render.dataURL;
      }
    }
    return JSON.stringify(config, null, 2);
  };

  // Count fingerprints that have renders
  const renderedCount = useMemo(() => {
    if (!fingerprints) return 0;
    return fingerprints.filter((fp) => fp.renders.length > 0).length;
  }, [fingerprints]);

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-900">
      <canvas ref={canvasRef} className="hidden" />

      <header className="sticky top-0 z-10 border-b border-gray-700 bg-gray-800">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-100">
                Canvas Fingerprints
              </h1>
              <p className="text-xs text-gray-400">
                {fingerprints?.length ?? 0} fingerprints, {renderedCount}{" "}
                rendered
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => refetch()}
                className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-600"
              >
                Refresh
              </button>
              <button
                onClick={renderAll}
                disabled={
                  !fingerprints?.length ||
                  rendering !== null ||
                  !deviceInfo.trim()
                }
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Render All
              </button>
              <button
                onClick={() => {
                  if (
                    confirm("Delete ALL fingerprints? This cannot be undone.")
                  ) {
                    deleteAll.mutate();
                  }
                }}
                disabled={!fingerprints?.length || deleteAll.isPending}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete All
              </button>
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-gray-300">
              Device Info
            </label>
            <input
              type="text"
              value={deviceInfo}
              onChange={(e) => setDeviceInfo(e.target.value)}
              placeholder="e.g., iPhone 15 Pro, Pixel 8, etc."
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : !fingerprints?.length ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">🎨</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-100">
              No fingerprints yet
            </h2>
            <p className="text-gray-400">
              Upload canvas fingerprints from the browser extension
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fingerprints.map((fp) => (
              <div
                key={fp.id}
                className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-sm"
              >
                <div className="border-b border-gray-700 bg-gray-800/50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-gray-700 px-2 py-0.5 font-mono text-sm text-gray-200">
                        {fp.hash}
                      </code>
                      <span className="text-xs text-gray-500">
                        {fp.width}x{fp.height}
                      </span>
                      <span className="rounded bg-blue-900/50 px-1.5 py-0.5 text-xs text-blue-300">
                        {fp.method}
                      </span>
                      {fp.renders.length === 0 && (
                        <span className="rounded bg-yellow-900/50 px-1.5 py-0.5 text-xs text-yellow-300">
                          needs render
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => renderAndSave(fp)}
                        disabled={rendering === fp.hash || !deviceInfo.trim()}
                        className="rounded bg-blue-600/20 px-2 py-1 text-xs text-blue-300 hover:bg-blue-600/30 disabled:opacity-50"
                      >
                        {rendering === fp.hash ? "..." : "Render"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete fingerprint ${fp.hash}?`)) {
                            deleteFingerprint.mutate({ hash: fp.hash });
                          }
                        }}
                        disabled={deleteFingerprint.isPending}
                        className="rounded bg-red-600/20 px-2 py-1 text-xs text-red-300 hover:bg-red-600/30 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {fp.sourceUrl}
                  </p>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div>
                      <p className="mb-1 text-xs font-medium text-gray-400">
                        Config Key{" "}
                        <code className="rounded bg-gray-700 px-1 text-gray-300">
                          {fp.hash}
                        </code>
                      </p>
                      <div className="rounded-lg border border-gray-700 bg-gray-900 p-2">
                        {getPreviewURL(fp) ? (
                          <img
                            src={getPreviewURL(fp)}
                            alt="Original"
                            className="h-auto w-full"
                            style={{ imageRendering: "pixelated" }}
                          />
                        ) : (
                          <div className="flex h-20 items-center justify-center text-xs text-gray-500">
                            Loading...
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-medium text-green-400">
                        This Device toDataURL{" "}
                        {getPreviewURL(fp) && (
                          <code className="text-green-500/70">
                            #{hashString(getPreviewURL(fp))}
                          </code>
                        )}
                      </p>
                      <div className="rounded-lg border border-green-900/50 bg-green-900/20 p-2">
                        {getPreviewURL(fp) ? (
                          <img
                            src={getPreviewURL(fp)}
                            alt="This device"
                            className="h-auto w-full"
                            style={{ imageRendering: "pixelated" }}
                          />
                        ) : (
                          <div className="flex h-20 items-center justify-center text-xs text-gray-500">
                            Rendering...
                          </div>
                        )}
                      </div>
                    </div>

                    {fp.renders.map((render, i) => (
                      <div key={render.id}>
                        <p
                          className="mb-1 flex items-center gap-1 text-xs font-medium text-purple-400"
                          title={render.deviceInfo}
                        >
                          <div className="max-w-40 truncate">
                            {render.deviceInfo}{" "}
                          </div>
                          <code className="text-purple-500/70">
                            #{hashString(render.dataURL)}
                          </code>
                        </p>
                        <div className="rounded-lg border border-purple-900/50 bg-purple-900/20 p-2">
                          <img
                            src={render.dataURL}
                            alt={`Render ${i + 1}`}
                            className="h-auto w-full"
                            style={{ imageRendering: "pixelated" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {fp.renders.length > 0 && (
                  <div className="border-t border-gray-700 bg-gray-800/50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <code className="mr-2 flex-1 truncate text-xs text-gray-400">
                        &quot;{fp.hash}&quot;:
                        &quot;data:image/png;base64,...&quot;
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `"${fp.hash}": "${fp.renders[0]!.dataURL}"`,
                            fp.hash,
                          )
                        }
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                          copied === fp.hash
                            ? "bg-green-600/20 text-green-400"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {copied === fp.hash ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-sm">
              <div className="border-b border-gray-700 bg-gray-800/50 px-4 py-3">
                <h2 className="font-semibold text-gray-100">Full Config</h2>
                <p className="text-xs text-gray-400">
                  Copy this to your Camoufox canvas:fingerprints config
                  {renderedCount < (fingerprints?.length ?? 0) && (
                    <span className="ml-2 text-yellow-400">
                      ({(fingerprints?.length ?? 0) - renderedCount} not
                      rendered yet)
                    </span>
                  )}
                </p>
              </div>
              <div className="p-4">
                <pre className="max-h-64 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400">
                  {getConfigJson()}
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(getConfigJson(), "full-config")
                  }
                  className={`mt-3 w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                    copied === "full-config"
                      ? "bg-green-600/20 text-green-400"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {copied === "full-config" ? "Copied!" : "Copy Full Config"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
