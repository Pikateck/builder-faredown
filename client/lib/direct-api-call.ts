/**
 * Direct API call using JSONP-like approach to bypass all wrappers and restrictions
 * This uses dynamic script tags which cannot be intercepted by FullStory
 */

export async function directApiCall<T = any>(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<T> {
  const method = options.method || 'GET';
  
  console.log('🔧 Direct API call:', { url, method });

  // For GET requests, use JSONP-like callback approach
  if (method === 'GET') {
    return new Promise((resolve, reject) => {
      const callbackName = `apiCallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Request timeout'));
      }, 10000);

      const cleanup = () => {
        clearTimeout(timeoutId);
        delete (window as any)[callbackName];
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };

      // Create callback
      (window as any)[callbackName] = (data: any) => {
        cleanup();
        console.log('✅ Direct API call success:', data);
        resolve(data);
      };

      // Add callback parameter to URL
      const separator = url.includes('?') ? '&' : '?';
      const callbackUrl = `${url}${separator}callback=${callbackName}`;

      // Add headers as URL parameters
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          const paramName = key.toLowerCase().replace(/-/g, '_');
          callbackUrl += `&${paramName}=${encodeURIComponent(options.headers![key])}`;
        });
      }

      const script = document.createElement('script');
      script.src = callbackUrl;
      script.onerror = () => {
        cleanup();
        reject(new Error('Script load failed'));
      };

      document.body.appendChild(script);
    });
  }

  // For non-GET, we need to use a different approach
  // Create a form with a hidden iframe target
  return new Promise((resolve, reject) => {
    const iframeName = `apiFrame_${Date.now()}`;
    const iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = method;
    form.action = url;
    form.target = iframeName;
    form.style.display = 'none';

    // Add body data as form fields
    if (options.body) {
      const data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      Object.keys(data).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
      });
    }

    // Add headers as hidden fields
    if (options.headers) {
      Object.keys(options.headers).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = `_header_${key}`;
        input.value = options.headers![key];
        form.appendChild(input);
      });
    }

    document.body.appendChild(form);

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Request timeout'));
    }, 10000);

    iframe.onload = () => {
      try {
        const response = iframe.contentDocument?.body.textContent;
        cleanup();
        if (response) {
          resolve(JSON.parse(response));
        } else {
          reject(new Error('Empty response'));
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (form.parentNode) form.parentNode.removeChild(form);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    form.submit();
  });
}
