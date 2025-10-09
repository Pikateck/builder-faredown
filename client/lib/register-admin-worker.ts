/**
 * Register service worker for admin API calls
 * This bypasses FullStory by handling fetches at the service worker level
 */

export async function registerAdminWorker(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    console.warn("⚠️ Service Worker not supported");
    return false;
  }

  try {
    // Unregister any existing workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      if (registration.active?.scriptURL.includes("admin-fetch-worker")) {
        await registration.unregister();
        console.log("🗑️ Unregistered old admin worker");
      }
    }

    const registration = await navigator.serviceWorker.register(
      "/admin-fetch-worker.js",
      { scope: "/" },
    );

    console.log("✅ Admin Service Worker registered:", registration.scope);

    const readyRegistration = await navigator.serviceWorker.ready;
    if (readyRegistration.active) {
      console.log("✅ Admin Service Worker active:", readyRegistration.active.state);
    } else {
      console.warn("⚠️ Admin Service Worker ready but no active worker detected");
    }

    return true;
  } catch (error) {
    console.error("❌ Admin Service Worker registration failed:", error);
    return false;
  }
}

/**
 * Unregister admin service worker
 */
export async function unregisterAdminWorker(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    if (registration.active?.scriptURL.includes("admin-fetch-worker")) {
      await registration.unregister();
      console.log("🗑️ Unregistered admin worker");
    }
  }
}
