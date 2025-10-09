/**
 * XMLHttpRequest-based fetch polyfill to completely bypass FullStory's fetch wrapper
 * This uses XHR instead of fetch, which FullStory doesn't intercept
 */

export function xhrFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const method = options.method || "GET";

    console.log("🔧 Using XHR-based fetch to bypass FullStory:", {
      url,
      method,
    });

    xhr.open(method, url);

    // Debug logging
    xhr.onloadstart = () => {
      console.log("🔄 XHR loadstart:", { url, readyState: xhr.readyState });
    };

    xhr.onreadystatechange = () => {
      console.log("🔄 XHR readyState change:", {
        readyState: xhr.readyState,
        status: xhr.status,
        url,
      });
    };

    // Set headers
    if (options.headers) {
      const headers = options.headers as Record<string, string>;
      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key]);
      });
    }

    // Set credentials
    if (options.credentials === "include") {
      xhr.withCredentials = true;
    }

    // Handle timeout
    if (options.signal) {
      const controller = options.signal as AbortSignal;
      controller.addEventListener("abort", () => {
        xhr.abort();
        reject(new DOMException("Aborted", "AbortError"));
      });
    }

    xhr.onload = () => {
      // Create a Response-like object
      const headers = new Headers();
      const headerLines = xhr.getAllResponseHeaders().split("\r\n");
      headerLines.forEach((line) => {
        const parts = line.split(": ");
        if (parts.length === 2) {
          headers.append(parts[0], parts[1]);
        }
      });

      const responseInit: ResponseInit = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: headers,
      };

      // Create response with proper body
      const response = new Response(xhr.responseText, responseInit);

      console.log("✅ XHR-based fetch succeeded:", {
        url,
        status: xhr.status,
        statusText: xhr.statusText,
      });

      resolve(response);
    };

    xhr.onerror = (event) => {
      console.error("❌ XHR-based fetch failed:", {
        url,
        status: xhr.status,
        statusText: xhr.statusText,
        readyState: xhr.readyState,
        responseText: xhr.responseText,
        event: event,
        errorType: "Likely CORS issue - XHR blocked by browser",
      });
      reject(
        new TypeError(
          `Network request failed: XHR error (status: ${xhr.status}, readyState: ${xhr.readyState})`,
        ),
      );
    };

    xhr.ontimeout = () => {
      console.error("❌ XHR-based fetch timeout:", { url });
      reject(new TypeError("Network request timeout"));
    };

    // Send request
    console.log("🚀 About to send XHR:", {
      method,
      url,
      hasBody: !!options.body,
      withCredentials: xhr.withCredentials,
      readyState: xhr.readyState,
    });

    try {
      if (options.body) {
        xhr.send(options.body as string);
      } else {
        xhr.send();
      }
      console.log(
        "✅ XHR.send() called successfully, readyState:",
        xhr.readyState,
      );
    } catch (sendError) {
      console.error("❌ XHR.send() threw error:", sendError);
      reject(sendError);
    }
  });
}
