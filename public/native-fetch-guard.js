/**
 * CRITICAL: Capture native fetch BEFORE FullStory or any other script can wrap it
 * This prevents analytics tools from interfering with admin API calls
 */
(function () {
  if (typeof window !== "undefined" && typeof fetch === "function") {
    // Store the ORIGINAL native fetch
    window.__NATIVE_FETCH__ = window.fetch.bind(window);

    console.log("✅ Native fetch captured before FullStory can wrap it");

    // Also store XMLHttpRequest as backup
    window.__NATIVE_XHR__ = window.XMLHttpRequest;
  }
})();
