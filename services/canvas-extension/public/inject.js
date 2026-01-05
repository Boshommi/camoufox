(function() {
  if (window.__canvasCaptureInjected) return;
  window.__canvasCaptureInjected = true;

  // Perceptual hash (pHash) - creates a 64-bit hash based on visual structure
  // Robust to rendering differences, use Hamming distance ≤ 5 for matching
  function computePHash(bytes, width, height) {
    // Downsample to 8x8 grid
    const gridSize = 8;
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;
    const grid = new Array(64);

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        let sum = 0;
        let count = 0;

        // Average grayscale value in this cell
        const startX = Math.floor(gx * cellWidth);
        const endX = Math.floor((gx + 1) * cellWidth);
        const startY = Math.floor(gy * cellHeight);
        const endY = Math.floor((gy + 1) * cellHeight);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = (y * width + x) * 4;
            if (idx + 3 < bytes.length) {
              // Grayscale using luminance formula
              const gray = 0.299 * bytes[idx] + 0.587 * bytes[idx + 1] + 0.114 * bytes[idx + 2];
              sum += gray;
              count++;
            }
          }
        }

        grid[gy * gridSize + gx] = count > 0 ? sum / count : 0;
      }
    }

    // Compute median
    const sorted = [...grid].sort((a, b) => a - b);
    const median = (sorted[31] + sorted[32]) / 2;

    // Create 64-bit hash: 1 if above median, 0 otherwise
    // Split into two 32-bit integers for JavaScript
    let hashHigh = 0;
    let hashLow = 0;

    for (let i = 0; i < 32; i++) {
      if (grid[i] > median) {
        hashHigh |= (1 << (31 - i));
      }
    }
    for (let i = 32; i < 64; i++) {
      if (grid[i] > median) {
        hashLow |= (1 << (63 - i));
      }
    }

    // Return as 16-char hex string (64 bits) + dimensions
    const hashStr = (hashHigh >>> 0).toString(16).padStart(8, '0') +
                    (hashLow >>> 0).toString(16).padStart(8, '0');
    // Append dimensions to prevent completely different canvases matching
    return width + 'x' + height + '_' + hashStr;
  }

  // Compress raw pixel bytes using gzip and return base64
  async function compressAndEncode(uint8Array) {
    try {
      const stream = new Blob([uint8Array]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const compressedBlob = await new Response(compressedStream).blob();
      const arrayBuffer = await compressedBlob.arrayBuffer();
      const compressedBytes = new Uint8Array(arrayBuffer);

      // Convert to base64
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < compressedBytes.length; i += chunkSize) {
        const chunk = compressedBytes.subarray(i, Math.min(i + chunkSize, compressedBytes.length));
        binary += String.fromCharCode.apply(null, chunk);
      }
      return btoa(binary);
    } catch (e) {
      console.warn('[Canvas Capture] Compression failed, using uncompressed:', e);
      // Fallback to uncompressed
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, chunk);
      }
      return 'raw:' + btoa(binary); // Prefix to indicate uncompressed
    }
  }

  function sendCanvasData(data) {
    window.postMessage({ type: 'CANVAS_CAPTURED', data: data }, '*');
    console.log('[Canvas Capture]', data.method, data.width + 'x' + data.height, 'hash:', data.hash, 'size:', Math.round(data.rawPixels.length / 1024) + 'KB');
  }

  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

  // Capture and compress raw pixels when toDataURL is called
  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    value: function(type, quality) {
      const dataURL = originalToDataURL.call(this, type, quality);
      if (this.width > 0 && this.height > 0) {
        try {
          const ctx = this.getContext('2d');
          if (ctx) {
            const imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
            const width = this.width;
            const height = this.height;
            const hash = computePHash(imageData.data, width, height);

            // Compress asynchronously
            compressAndEncode(imageData.data).then(compressed => {
              sendCanvasData({
                hash: hash,
                rawPixels: compressed,
                width: width,
                height: height,
                method: 'toDataURL',
                url: window.location.href,
                timestamp: Date.now()
              });
            });
          }
        } catch (e) {
          console.warn('[Canvas Capture] Failed to capture raw pixels:', e);
        }
      }
      return dataURL;
    },
    writable: true,
    configurable: true
  });

  // Capture and compress raw pixels when toBlob is called
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value: function(callback, type, quality) {
      if (this.width > 0 && this.height > 0) {
        try {
          const ctx = this.getContext('2d');
          if (ctx) {
            const imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
            const width = this.width;
            const height = this.height;
            const hash = computePHash(imageData.data, width, height);

            compressAndEncode(imageData.data).then(compressed => {
              sendCanvasData({
                hash: hash,
                rawPixels: compressed,
                width: width,
                height: height,
                method: 'toBlob',
                url: window.location.href,
                timestamp: Date.now()
              });
            });
          }
        } catch (e) {
          console.warn('[Canvas Capture] Failed to capture raw pixels:', e);
        }
      }
      return originalToBlob.call(this, callback, type, quality);
    },
    writable: true,
    configurable: true
  });

  // Capture and compress raw pixels when getImageData is called
  Object.defineProperty(CanvasRenderingContext2D.prototype, 'getImageData', {
    value: function(sx, sy, sw, sh, settings) {
      const imageData = originalGetImageData.call(this, sx, sy, sw, sh, settings);
      const canvas = this.canvas;
      if (canvas && canvas.width > 0 && canvas.height > 0 && sw > 10 && sh > 10) {
        try {
          const fullImageData = originalGetImageData.call(this, 0, 0, canvas.width, canvas.height);
          const width = canvas.width;
          const height = canvas.height;
          const hash = computePHash(fullImageData.data, width, height);

          compressAndEncode(fullImageData.data).then(compressed => {
            sendCanvasData({
              hash: hash,
              rawPixels: compressed,
              width: width,
              height: height,
              method: 'getImageData',
              url: window.location.href,
              timestamp: Date.now()
            });
          });
        } catch (e) {
          console.warn('[Canvas Capture] Failed to capture raw pixels:', e);
        }
      }
      return imageData;
    },
    writable: true,
    configurable: true
  });

  // Handle OffscreenCanvas
  if (typeof OffscreenCanvas !== 'undefined') {
    const originalConvertToBlob = OffscreenCanvas.prototype.convertToBlob;
    Object.defineProperty(OffscreenCanvas.prototype, 'convertToBlob', {
      value: async function(options) {
        const blob = await originalConvertToBlob.call(this, options);
        if (this.width > 0 && this.height > 0) {
          try {
            const ctx = this.getContext('2d');
            if (ctx) {
              const imageData = ctx.getImageData(0, 0, this.width, this.height);
              const hash = computePHash(imageData.data, this.width, this.height);
              const compressed = await compressAndEncode(imageData.data);
              sendCanvasData({
                hash: hash,
                rawPixels: compressed,
                width: this.width,
                height: this.height,
                method: 'OffscreenCanvas.convertToBlob',
                url: window.location.href,
                timestamp: Date.now()
              });
            }
          } catch (e) {
            console.warn('[Canvas Capture] Failed to capture OffscreenCanvas:', e);
          }
        }
        return blob;
      },
      writable: true,
      configurable: true
    });
  }

  console.log('[Canvas Capture] Interceptors installed (gzip compressed raw pixel mode)');
})();
