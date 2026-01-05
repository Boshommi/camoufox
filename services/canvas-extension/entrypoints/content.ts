// Content script - injects interceptor into page and relays messages
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  allFrames: true,

  main() {
    // Inject external script to bypass CSP
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('/inject.js');
    script.onload = () => script.remove();

    // Inject as early as possible
    const target = document.documentElement || document.head || document.body;
    if (target) {
      target.insertBefore(script, target.firstChild);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        (document.head || document.documentElement).appendChild(script);
      });
    }

    // Listen for messages from the injected script
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data?.type !== 'CANVAS_CAPTURED') return;

      browser.runtime.sendMessage({
        type: 'CANVAS_CAPTURED',
        data: event.data.data
      }).catch(console.error);
    });

    console.log('[Canvas Capture] Content script loaded');
  },
});
