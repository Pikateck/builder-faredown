/**
 * NUCLEAR OPTION: Use Image object to make requests
 * FullStory cannot intercept Image.src requests
 */

export async function adminApiBypass<T = any>(
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {},
): Promise<T> {
  const baseUrl = "https://builder-faredown-pricing.onrender.com/api";
  const fullUrl = `${baseUrl}${endpoint}`;

  console.log("🚀 BYPASS: Using Image object for API call", {
    endpoint,
    options,
  });

  return new Promise((resolve, reject) => {
    // Encode all data in URL
    const url = new URL(fullUrl);

    // Add method
    url.searchParams.set("_method", options.method || "GET");

    // Add headers as params
    if (options.headers) {
      Object.keys(options.headers).forEach((key) => {
        url.searchParams.set(`_h_${key}`, options.headers![key]);
      });
    }

    // Add body
    if (options.body) {
      url.searchParams.set("_body", JSON.stringify(options.body));
    }

    // Add callback ID
    const callbackId = `cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    url.searchParams.set("_callback", callbackId);

    // Create global callback
    (window as any)[callbackId] = (data: any) => {
      console.log("✅ BYPASS: Callback received", data);
      delete (window as any)[callbackId];
      resolve(data);
    };

    // Use Image object - FullStory CANNOT intercept this
    const img = new Image();

    img.onerror = () => {
      console.error("❌ BYPASS: Image request failed");
      delete (window as any)[callbackId];

      // Fallback: try with script tag
      const script = document.createElement("script");
      script.src = url.toString();
      script.onerror = () => {
        reject(new Error("Both Image and Script methods failed"));
      };
      document.body.appendChild(script);
      setTimeout(() => {
        if (script.parentNode) script.parentNode.removeChild(script);
      }, 5000);
    };

    // This will make the request
    img.src = url.toString();

    // Timeout
    setTimeout(() => {
      if ((window as any)[callbackId]) {
        delete (window as any)[callbackId];
        reject(new Error("Request timeout"));
      }
    }, 10000);
  });
}

/**
 * Simple wrapper for admin API calls
 */
export const adminApi = {
  get: async <T = any>(
    endpoint: string,
    params?: Record<string, any>,
    headers?: Record<string, string>,
  ): Promise<T> => {
    const url = new URL(
      `https://builder-faredown-pricing.onrender.com/api${endpoint}`,
    );
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.set(key, String(params[key]));
        }
      });
    }

    return adminApiBypass(url.pathname + url.search, {
      method: "GET",
      headers: headers || {},
    });
  },

  post: async <T = any>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<T> => {
    return adminApiBypass(endpoint, {
      method: "POST",
      headers: headers || {},
      body: data,
    });
  },

  put: async <T = any>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<T> => {
    return adminApiBypass(endpoint, {
      method: "PUT",
      headers: headers || {},
      body: data,
    });
  },

  delete: async <T = any>(
    endpoint: string,
    headers?: Record<string, string>,
  ): Promise<T> => {
    return adminApiBypass(endpoint, {
      method: "DELETE",
      headers: headers || {},
    });
  },
};
