import { useState, useEffect } from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import {
    Copy,
    Check,
    Trash2,
    Image,
    Hash,
    Clock,
    Globe,
    X,
    Fingerprint,
    Code,
    Download,
    Upload,
    Cloud,
    Settings,
    Loader2,
} from 'lucide-react';

interface CanvasCapture {
    hash: string;
    rawPixels: string; // base64 encoded RGBA pixel data
    width: number;
    height: number;
    method: string;
    url: string;
    timestamp: number;
    previewURL?: string; // Cached preview PNG dataURL
}

const DEFAULT_SERVER_URL = 'https://canvas.mikhailaleksndrv.workers.dev/';

// Decompress gzip data and return raw bytes
async function decompressPixels(compressed: string): Promise<Uint8ClampedArray> {
    // Check if it's uncompressed (fallback)
    if (compressed.startsWith('raw:')) {
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
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
    const decompressedBlob = await new Response(decompressedStream).blob();
    const arrayBuffer = await decompressedBlob.arrayBuffer();
    return new Uint8ClampedArray(arrayBuffer);
}

// Convert raw RGBA pixels to PNG dataURL for preview (async version)
async function rawPixelsToDataURLAsync(rawPixels: string, width: number, height: number): Promise<string> {
    try {
        const bytes = await decompressPixels(rawPixels);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        // Create ImageData and copy bytes into it
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(bytes);
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
    } catch (e) {
        console.error('Failed to convert raw pixels:', e);
        return '';
    }
}

// Cache for preview URLs
const previewCache = new Map<string, string>();
const pendingPreviews = new Map<string, Promise<string>>();

// Get preview URL - returns cached value or empty string while loading
function getPreviewURL(capture: CanvasCapture): string {
    if (capture.previewURL) return capture.previewURL;
    if (previewCache.has(capture.hash)) return previewCache.get(capture.hash)!;

    // Start async loading if not already pending
    if (!pendingPreviews.has(capture.hash)) {
        const promise = rawPixelsToDataURLAsync(capture.rawPixels, capture.width, capture.height);
        pendingPreviews.set(capture.hash, promise);
        promise.then((url) => {
            previewCache.set(capture.hash, url);
            pendingPreviews.delete(capture.hash);
        });
    }

    return ''; // Return empty while loading
}

function App() {
    const [captures, setCaptures] = useState<CanvasCapture[]>([]);
    const [copiedHash, setCopiedHash] = useState<string | null>(null);
    const [selectedCapture, setSelectedCapture] = useState<CanvasCapture | null>(null);
    const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
    const [showSettings, setShowSettings] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        loadCaptures();
        // Load saved server URL
        browser.storage.local.get('serverUrl').then((result) => {
            if (result.serverUrl) {
                setServerUrl(result.serverUrl);
            }
        });
    }, []);

    const loadCaptures = async () => {
        const response = await browser.runtime.sendMessage({ type: 'GET_CAPTURES' });
        setCaptures(response || []);
    };

    const clearAll = async () => {
        await browser.runtime.sendMessage({ type: 'CLEAR_CAPTURES' });
        setCaptures([]);
    };

    const deleteCapture = async (hash: string) => {
        await browser.runtime.sendMessage({ type: 'DELETE_CAPTURE', hash });
        setCaptures((prev) => prev.filter((c) => c.hash !== hash));
        if (selectedCapture?.hash === hash) {
            setSelectedCapture(null);
        }
    };

    const copyToClipboard = async (text: string, hash: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedHash(hash);
        setTimeout(() => setCopiedHash(null), 2000);
    };

    const saveServerUrl = async (url: string) => {
        setServerUrl(url);
        await browser.storage.local.set({ serverUrl: url });
    };

    const uploadToServer = async () => {
        if (captures.length === 0) return;

        setUploading(true);
        setUploadStatus('idle');

        try {
            const payload = captures.map((c) => ({
                hash: c.hash,
                pixelData: c.rawPixels,
                width: c.width,
                height: c.height,
                method: c.method,
                sourceUrl: c.url,
            }));

            const response = await fetch(`${serverUrl}/api/canvas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Upload error response:', text);
                throw new Error(`HTTP ${response.status}`);
            }

            setUploadStatus('success');
            setTimeout(() => setUploadStatus('idle'), 3000);
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
            setTimeout(() => setUploadStatus('idle'), 3000);
        } finally {
            setUploading(false);
        }
    };

    const copyConfigEntry = async (capture: CanvasCapture) => {
        const previewURL = getPreviewURL(capture);
        const entry = `"${capture.hash}": "${previewURL}"`;
        await navigator.clipboard.writeText(entry);
        setCopiedHash(capture.hash + '-config');
        setTimeout(() => setCopiedHash(null), 2000);
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const truncateUrl = (url: string, maxLength: number = 30) => {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    };

    const exportCaptures = () => {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas Fingerprints Export</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      padding: 16px;
      min-height: 100vh;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header h1 { font-size: 1.5rem; color: #111827; margin-bottom: 8px; }
    .header p { color: #6b7280; font-size: 0.875rem; }
    .count {
      display: inline-block;
      background: #d1fae5;
      color: #047857;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 8px;
    }
    .captures { display: flex; flex-direction: column; gap: 16px; }
    .capture {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .capture-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .preview {
      width: 80px;
      height: 80px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: #fafafa;
    }
    .preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .info { flex: 1; min-width: 200px; }
    .hash-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .hash {
      font-family: monospace;
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #374151;
    }
    .meta {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 0.75rem;
      color: #6b7280;
    }
    .meta span {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .config-section {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }
    .config-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }
    .config-code {
      background: #1f2937;
      color: #34d399;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.7rem;
      word-break: break-all;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    .copy-btn {
      margin-top: 8px;
      width: 100%;
      padding: 10px;
      background: #059669;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .copy-btn:hover { background: #047857; }
    .copy-btn:active { background: #065f46; }
    .copy-btn.copied { background: #10b981; }
    .full-config {
      margin-top: 24px;
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .full-config h2 {
      font-size: 1rem;
      color: #111827;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Canvas Fingerprints<span class="count">${captures.length}</span></h1>
    <p>Exported ${new Date().toLocaleString()}</p>
  </div>

  <div class="captures">
    ${captures
        .map((c) => {
            const previewURL = getPreviewURL(c);
            return `
    <div class="capture">
      <div class="capture-header">
        <div class="preview">
          <img src="${previewURL}" alt="Canvas">
        </div>
        <div class="info">
          <div class="hash-row">
            <span class="hash">${c.hash}</span>
          </div>
          <div class="meta">
            <span>${c.width}x${c.height}</span>
            <span>${c.method}</span>
            <span>${new Date(c.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
      <div class="config-section">
        <div class="config-label">Config Entry:</div>
        <div class="config-code">"${c.hash}": "${previewURL}"</div>
        <button class="copy-btn" onclick="copyConfig(this, \`&quot;${c.hash}&quot;: &quot;${previewURL}&quot;\`)">
          Copy Config Entry
        </button>
      </div>
    </div>
    `;
        })
        .join('')}
  </div>

  <div class="full-config">
    <h2>Full Config Object</h2>
    <div class="config-code">{
${captures.map((c) => `  "${c.hash}": "${getPreviewURL(c)}"`).join(',\\n')}
}</div>
    <button class="copy-btn" onclick="copyConfig(this, JSON.stringify({${captures
        .map((c) => `'${c.hash}':'${getPreviewURL(c)}'`)
        .join(',')}}, null, 2).replace(/'/g, '&quot;'))">
      Copy Full Config
    </button>
  </div>

  <script>
    function copyConfig(btn, text) {
      // Decode HTML entities
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      const decoded = textarea.value;

      navigator.clipboard.writeText(decoded).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 2000);
      });
    }
  </script>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `canvas-fingerprints-${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Tooltip.Provider delayDuration={300}>
            <div className="flex flex-col h-[500px]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Fingerprint className="w-5 h-5 text-emerald-600" />
                        <h1 className="text-sm font-semibold text-gray-900">Canvas Capture</h1>
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                            {captures.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {captures.length > 0 && (
                            <>
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <button
                                            onClick={uploadToServer}
                                            disabled={uploading}
                                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                                uploadStatus === 'success'
                                                    ? 'text-emerald-600 bg-emerald-50'
                                                    : uploadStatus === 'error'
                                                    ? 'text-red-600 bg-red-50'
                                                    : 'text-blue-600 hover:bg-blue-50'
                                            }`}
                                        >
                                            {uploading ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : uploadStatus === 'success' ? (
                                                <Check className="w-3 h-3" />
                                            ) : uploadStatus === 'error' ? (
                                                <X className="w-3 h-3" />
                                            ) : (
                                                <Cloud className="w-3 h-3" />
                                            )}
                                            {uploading
                                                ? 'Uploading...'
                                                : uploadStatus === 'success'
                                                ? 'Uploaded!'
                                                : uploadStatus === 'error'
                                                ? 'Failed'
                                                : 'Upload'}
                                        </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                        <Tooltip.Content
                                            className="bg-gray-900 text-white text-xs px-2 py-1 rounded"
                                            sideOffset={5}
                                        >
                                            Upload to server
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                                <button
                                    onClick={exportCaptures}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                >
                                    <Download className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </>
                        )}
                        <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
                            <Dialog.Trigger asChild>
                                <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                                    <Settings className="w-4 h-4" />
                                </button>
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-4 w-80">
                                    <div className="flex items-center justify-between mb-4">
                                        <Dialog.Title className="text-sm font-semibold">Settings</Dialog.Title>
                                        <Dialog.Close asChild>
                                            <button className="p-1 hover:bg-gray-100 rounded">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </Dialog.Close>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Server URL
                                            </label>
                                            <input
                                                type="text"
                                                value={serverUrl}
                                                onChange={(e) => saveServerUrl(e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                placeholder="http://localhost:3000"
                                            />
                                            <p className="mt-1 text-xs text-gray-400">URL of your Camoufox dashboard</p>
                                        </div>
                                        <div className="pt-2 border-t">
                                            <a
                                                href={`${serverUrl}/canvas`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-emerald-600 border border-emerald-200 rounded hover:bg-emerald-50 transition-colors"
                                            >
                                                <Globe className="w-4 h-4" />
                                                Open Dashboard
                                            </a>
                                        </div>
                                    </div>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                    </div>
                </div>

                {/* Content */}
                <ScrollArea.Root className="flex-1 overflow-hidden">
                    <ScrollArea.Viewport className="h-full w-full">
                        {captures.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-12">
                                <Image className="w-12 h-12" />
                                <p className="text-sm">No canvas fingerprints captured yet</p>
                                <p className="text-xs text-gray-300">Browse websites to capture canvas data</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {captures.map((capture) => (
                                    <div
                                        key={capture.hash}
                                        className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Preview */}
                                        <Dialog.Root>
                                            <Dialog.Trigger asChild>
                                                <button
                                                    onClick={() => setSelectedCapture(capture)}
                                                    className="flex-shrink-0 w-16 h-16 rounded border border-gray-200 overflow-hidden bg-white hover:border-emerald-400 transition-colors cursor-pointer"
                                                >
                                                    <img
                                                        src={getPreviewURL(capture)}
                                                        alt="Canvas preview"
                                                        className="w-full h-full object-contain"
                                                        style={{ imageRendering: 'pixelated' }}
                                                    />
                                                </button>
                                            </Dialog.Trigger>
                                            <Dialog.Portal>
                                                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                                                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-4 max-w-lg w-full max-h-[80vh] overflow-auto">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <Dialog.Title className="text-lg font-semibold">
                                                            Canvas Preview
                                                        </Dialog.Title>
                                                        <Dialog.Close asChild>
                                                            <button className="p-1 hover:bg-gray-100 rounded">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </Dialog.Close>
                                                    </div>
                                                    {selectedCapture && (
                                                        <div className="space-y-4">
                                                            <div className="border rounded-lg p-2 bg-gray-50">
                                                                <img
                                                                    src={getPreviewURL(selectedCapture)}
                                                                    alt="Canvas full preview"
                                                                    className="max-w-full mx-auto"
                                                                    style={{ imageRendering: 'pixelated' }}
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                                <div className="bg-gray-50 p-2 rounded">
                                                                    <span className="text-gray-500">Size:</span>{' '}
                                                                    {selectedCapture.width}x{selectedCapture.height}
                                                                </div>
                                                                <div className="bg-gray-50 p-2 rounded">
                                                                    <span className="text-gray-500">Method:</span>{' '}
                                                                    {selectedCapture.method}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium text-gray-700">
                                                                    Config Entry:
                                                                </label>
                                                                <code className="block p-2 bg-gray-900 text-emerald-400 rounded text-xs overflow-x-auto">
                                                                    "{selectedCapture.hash}": "
                                                                    {getPreviewURL(selectedCapture).substring(0, 50)}
                                                                    ..."
                                                                </code>
                                                                <button
                                                                    onClick={() => copyConfigEntry(selectedCapture)}
                                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors text-sm"
                                                                >
                                                                    {copiedHash === selectedCapture.hash + '-config' ? (
                                                                        <>
                                                                            <Check className="w-4 h-4" />
                                                                            Copied!
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Code className="w-4 h-4" />
                                                                            Copy Config Entry
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Dialog.Content>
                                            </Dialog.Portal>
                                        </Dialog.Root>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Tooltip.Root>
                                                    <Tooltip.Trigger asChild>
                                                        <button
                                                            onClick={() => copyToClipboard(capture.hash, capture.hash)}
                                                            className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono text-gray-700 transition-colors"
                                                        >
                                                            <Hash className="w-3 h-3" />
                                                            {capture.hash}
                                                            {copiedHash === capture.hash ? (
                                                                <Check className="w-3 h-3 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="w-3 h-3 text-gray-400" />
                                                            )}
                                                        </button>
                                                    </Tooltip.Trigger>
                                                    <Tooltip.Portal>
                                                        <Tooltip.Content
                                                            className="bg-gray-900 text-white text-xs px-2 py-1 rounded"
                                                            sideOffset={5}
                                                        >
                                                            Click to copy hash
                                                        </Tooltip.Content>
                                                    </Tooltip.Portal>
                                                </Tooltip.Root>
                                                <span className="text-xs text-gray-400">
                                                    {capture.width}x{capture.height}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                <Globe className="w-3 h-3" />
                                                <span className="truncate" title={capture.url}>
                                                    {truncateUrl(capture.url)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(capture.timestamp)}
                                                </span>
                                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                                                    {capture.method}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-1">
                                            <Tooltip.Root>
                                                <Tooltip.Trigger asChild>
                                                    <button
                                                        onClick={() => copyConfigEntry(capture)}
                                                        className="p-1.5 hover:bg-emerald-100 rounded transition-colors"
                                                    >
                                                        {copiedHash === capture.hash + '-config' ? (
                                                            <Check className="w-4 h-4 text-emerald-600" />
                                                        ) : (
                                                            <Code className="w-4 h-4 text-gray-400 hover:text-emerald-600" />
                                                        )}
                                                    </button>
                                                </Tooltip.Trigger>
                                                <Tooltip.Portal>
                                                    <Tooltip.Content
                                                        className="bg-gray-900 text-white text-xs px-2 py-1 rounded"
                                                        sideOffset={5}
                                                    >
                                                        Copy config entry
                                                    </Tooltip.Content>
                                                </Tooltip.Portal>
                                            </Tooltip.Root>

                                            <Tooltip.Root>
                                                <Tooltip.Trigger asChild>
                                                    <button
                                                        onClick={() => deleteCapture(capture.hash)}
                                                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                                                    </button>
                                                </Tooltip.Trigger>
                                                <Tooltip.Portal>
                                                    <Tooltip.Content
                                                        className="bg-gray-900 text-white text-xs px-2 py-1 rounded"
                                                        sideOffset={5}
                                                    >
                                                        Delete
                                                    </Tooltip.Content>
                                                </Tooltip.Portal>
                                            </Tooltip.Root>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar
                        className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
                        orientation="vertical"
                    >
                        <ScrollArea.Thumb className="flex-1 bg-gray-300 rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                    </ScrollArea.Scrollbar>
                </ScrollArea.Root>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-400 text-center">
                        Use captured hashes in Camoufox{' '}
                        <code className="bg-gray-200 px-1 rounded">canvas:fingerprints</code> config
                    </p>
                </div>
            </div>
        </Tooltip.Provider>
    );
}

export default App;
