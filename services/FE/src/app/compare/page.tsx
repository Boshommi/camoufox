"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { api } from "~/trpc/react";
import { collectAll, type CollectionResult } from "~/lib/fingerprint-collector";
import {
  murmurhash3_32,
  type BrowserInfoComponent,
} from "~/lib/browser-info-detector";

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

// djb2 hash function
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16);
}

interface CanvasPreview {
  hash: string;
  width: number;
  height: number;
  method: string;
  dataURL: string;
  computedHash: string;
}

export default function ComparePage() {
  const [collectionResult, setCollectionResult] = useState<CollectionResult | null>(null);
  const [canvasPreviews, setCanvasPreviews] = useState<CanvasPreview[]>([]);
  const [isCollecting, setIsCollecting] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: existingCanvasFingerprints } = api.canvas.list.useQuery();

  // Collect browser info fingerprints on mount (async for proper voice collection)
  useEffect(() => {
    const collect = async () => {
      try {
        const result = await collectAll();
        setCollectionResult(result);
      } catch (error) {
        console.error("Failed to collect fingerprints:", error);
      }
    };
    void collect();
  }, []);

  // Convert fingerprintComponents to display format
  const browserInfo = useMemo(() => {
    if (!collectionResult) return null;

    const fp = collectionResult.fingerprintComponents;
    const asyncData = collectionResult.asyncData;

    // Helper to hash raw fingerprint values (fingerprintComponents contains raw strings, not hashes)
    const hash = (raw: string) => raw ? murmurhash3_32(raw).toString(36) : "";

    // Map component raw values to BrowserInfoComponent format with hashes
    const components: BrowserInfoComponent[] = [
      { name: "Canvas", hash: hash(fp.canvas), rawValue: fp.canvas?.slice(0, 50) + "..." },
      { name: "Plugins", hash: hash(fp.plugins), rawValue: fp.plugins?.slice(0, 50) + "..." },
      { name: "Navigator", hash: hash(fp.navigator), rawValue: fp.navigator?.slice(0, 50) + "..." },
      { name: "Gamepad", hash: hash(fp.gamepads), rawValue: fp.gamepads },
      { name: "Fonts", hash: hash(fp.fonts), rawValue: `${fp.fonts?.split("1").length - 1} fonts detected` },
      { name: "Audio", hash: hash(fp.audio), rawValue: fp.audio },
      { name: "WebGL", hash: hash(fp.webgl), rawValue: fp.webgl?.slice(0, 50) + "..." },
      { name: "Voices", hash: hash(asyncData?.voices?.list?.map(v => `${v.name},${v.lang},${v.localService},${v.voiceURI},${v.default}`).join("|") ?? ""), rawValue: `${asyncData?.voices?.list?.length ?? 0} voices` },
      { name: "Touch", hash: hash(fp.touch), rawValue: fp.touch },
      { name: "MediaQueries", hash: hash(fp.mediaQueries), rawValue: fp.mediaQueries },
      { name: "MediaCodecs", hash: hash(fp.mediaCodecs), rawValue: fp.mediaCodecs?.slice(0, 50) + "..." },
      { name: "JsHeap", hash: hash(fp.jsHeapSizeLimit), rawValue: fp.jsHeapSizeLimit },
      { name: "ScreenAvail", hash: hash(fp.screenAvailable), rawValue: fp.screenAvailable },
      { name: "DNT", hash: hash(fp.doNotTrack), rawValue: fp.doNotTrack },
    ];

    // Calculate combined hash
    const combinedValue = components.map(c => c.hash).join("-");
    const combinedHash = murmurhash3_32(combinedValue).toString(36);

    return { components, combinedHash };
  }, [collectionResult]);

  // Render canvas fingerprints
  useEffect(() => {
    if (!existingCanvasFingerprints) return;

    const renderPreviews = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const previews: CanvasPreview[] = [];

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

          const dataURL = canvas.toDataURL("image/png");
          const computedHash = hashString(dataURL);

          previews.push({
            hash: fp.hash,
            width: fp.width,
            height: fp.height,
            method: fp.method,
            dataURL,
            computedHash,
          });
        } catch (e) {
          console.error("Failed to render canvas:", fp.hash, e);
        }
      }

      setCanvasPreviews(previews);
      setIsCollecting(false);
    };

    renderPreviews();
  }, [existingCanvasFingerprints]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Compare Fingerprints</h1>
        <p className="text-gray-400 mb-6">
          Compare fingerprint values between original and spoofed devices
        </p>

        {isCollecting && (
          <div className="bg-gray-800 rounded-lg p-8 text-center mb-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-400">Collecting fingerprints...</p>
          </div>
        )}

        {!isCollecting && (
          <>
            {/* Browser Info Components Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Browser Info Components (14)
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Combined hash: <code data-testid="combined-hash" className="bg-gray-800 px-2 py-1 rounded">{browserInfo?.combinedHash}</code>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {browserInfo?.components.map((component, index) => (
                  <div
                    key={component.name}
                    data-testid={`component-${component.name.toLowerCase()}`}
                    className="bg-gray-800 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">
                        {index + 1}. {component.name}
                      </span>
                      {component.hash ? (
                        <code data-testid={`hash-${component.name.toLowerCase()}`} className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
                          {component.hash}
                        </code>
                      ) : (
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                          N/A
                        </span>
                      )}
                    </div>
                    <p data-testid={`raw-${component.name.toLowerCase()}`} className="text-xs text-gray-500 break-all font-mono">
                      {component.rawValue || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Canvas Fingerprints Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                Canvas Fingerprints ({canvasPreviews.length})
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                These images show how canvas operations render on this device
              </p>

              {canvasPreviews.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-4">🎨</div>
                  <p className="text-gray-400">No canvas fingerprints captured yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Use the browser extension to capture canvas fingerprints from websites
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {canvasPreviews.map((preview) => (
                    <div
                      key={preview.hash}
                      className="bg-gray-800 rounded-lg overflow-hidden"
                    >
                      <div className="p-3 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                          <code className="text-xs text-gray-400 truncate max-w-[200px]">
                            {preview.hash}
                          </code>
                          <span className="text-xs text-gray-500">
                            {preview.width}x{preview.height}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-purple-400">
                            {preview.method}
                          </span>
                          <code className="text-xs text-green-400">
                            #{preview.computedHash.slice(0, 8)}
                          </code>
                        </div>
                      </div>
                      <div className="p-2 bg-gray-900">
                        <img
                          src={preview.dataURL}
                          alt={preview.hash}
                          className="w-full h-auto"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Raw JSON data for automated extraction */}
            <script
              id="fingerprint-data"
              type="application/json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(collectionResult),
              }}
            />

            {/* Quick Reference */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                Hash Summary
              </h2>
              <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-400">Component</th>
                      <th className="text-left py-2 px-3 text-gray-400">Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {browserInfo?.components.map((component) => (
                      <tr key={component.name} className="border-b border-gray-700/50">
                        <td className="py-2 px-3 text-gray-300">{component.name}</td>
                        <td className="py-2 px-3 font-mono text-green-400">
                          {component.hash || "—"}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b border-gray-700/50 bg-blue-900/20">
                      <td className="py-2 px-3 text-blue-300 font-medium">Combined</td>
                      <td className="py-2 px-3 font-mono text-blue-400">
                        {browserInfo?.combinedHash}
                      </td>
                    </tr>
                    {canvasPreviews.map((preview) => (
                      <tr key={preview.hash} className="border-b border-gray-700/50">
                        <td className="py-2 px-3 text-gray-300">
                          Canvas: {preview.hash.slice(0, 20)}...
                        </td>
                        <td className="py-2 px-3 font-mono text-purple-400">
                          #{preview.computedHash.slice(0, 8)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
