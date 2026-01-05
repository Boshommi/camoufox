export interface CanvasCapture {
  hash: string;
  dataURL: string;
  width: number;
  height: number;
  method: string;
  url: string;
  timestamp: number;
}

export default defineBackground(() => {
  console.log('[Canvas Capture] Background script loaded');

  // Store captures in memory (will be persisted to storage)
  let captures: CanvasCapture[] = [];

  // Load existing captures from storage
  browser.storage.local.get('captures').then((result) => {
    if (result.captures) {
      captures = result.captures;
    }
  });

  // Listen for messages from content scripts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CANVAS_CAPTURED') {
      const capture = message.data as CanvasCapture;

      // Check if we already have this hash
      const exists = captures.some(c => c.hash === capture.hash);
      if (!exists) {
        captures.unshift(capture); // Add to beginning

        // Keep only last 100 captures
        if (captures.length > 100) {
          captures = captures.slice(0, 100);
        }

        // Save to storage
        browser.storage.local.set({ captures });

        // Update badge
        browser.action.setBadgeText({ text: captures.length.toString() });
        browser.action.setBadgeBackgroundColor({ color: '#10b981' });
      }

      return;
    }

    if (message.type === 'GET_CAPTURES') {
      sendResponse(captures);
      return true;
    }

    if (message.type === 'CLEAR_CAPTURES') {
      captures = [];
      browser.storage.local.set({ captures });
      browser.action.setBadgeText({ text: '' });
      sendResponse({ success: true });
      return true;
    }

    if (message.type === 'DELETE_CAPTURE') {
      captures = captures.filter(c => c.hash !== message.hash);
      browser.storage.local.set({ captures });
      browser.action.setBadgeText({ text: captures.length > 0 ? captures.length.toString() : '' });
      sendResponse({ success: true });
      return true;
    }
  });

  // Set initial badge
  browser.storage.local.get('captures').then((result) => {
    if (result.captures && result.captures.length > 0) {
      browser.action.setBadgeText({ text: result.captures.length.toString() });
      browser.action.setBadgeBackgroundColor({ color: '#10b981' });
    }
  });
});
