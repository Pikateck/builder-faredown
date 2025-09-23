/**
 * OAuth Service
 * Handles social login (Google, Facebook, Apple) authentication flows
 */

import { apiClient } from "@/lib/api";

export interface OAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    provider: string;
  };
}

export interface OAuthUrlResponse {
  success: boolean;
  url: string;
  state: string;
}

export interface OAuthStatusResponse {
  success: boolean;
  oauth: {
    google: boolean;
    facebook: boolean;
    apple: boolean;
  };
  message: string;
}

export class OAuthService {
  private readonly baseUrl = "/oauth";

  /**
   * Check OAuth services configuration status
   */
  async getOAuthStatus(): Promise<{
    google: boolean;
    facebook: boolean;
    apple: boolean;
  }> {
    try {
      const response = await apiClient.get<OAuthStatusResponse>(
        `${this.baseUrl}/status`,
      );

      if (response.success && response.oauth) {
        return response.oauth;
      }

      // Default to all disabled if status check fails
      return { google: false, facebook: false, apple: false };
    } catch (error) {
      console.error("OAuth status check error:", error);
      // Default to all disabled if status check fails
      return { google: false, facebook: false, apple: false };
    }
  }

  /**
   * Get Google OAuth authorization URL
   */
  async getGoogleAuthUrl(): Promise<string> {
    try {
      // Ensure we're not using fallback mode for OAuth requests
      const originalFallback = apiClient.getConfig().forceFallback;
      if (originalFallback) {
        apiClient.disableFallbackMode();
      }

      const response = await apiClient.get<OAuthUrlResponse>(
        `${this.baseUrl}/google/url`,
      );

      // Restore original fallback setting
      if (originalFallback) {
        apiClient.enableFallbackMode();
      }

      if (response.success && response.url) {
        return response.url;
      }

      throw new Error("Failed to get Google auth URL");
    } catch (error: any) {
      console.error("Google auth URL error:", error);

      // Handle configuration errors
      if (error.response?.status === 503) {
        throw new Error(
          "Google sign-in is currently unavailable. Please try again later or use email/password login.",
        );
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(
        "Unable to connect to Google sign-in service. Please try again.",
      );
    }
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(
    code: string,
    state: string,
  ): Promise<OAuthResponse> {
    try {
      console.log("🔵 Sending callback request to backend...");
      const response = await apiClient.post<OAuthResponse>(
        `${this.baseUrl}/google/callback`,
        {
          code,
          state,
        },
      );

      console.log("🔵 Backend callback response:", response);

      if (response.success && response.token) {
        console.log("🔵 Storing auth token and user data...");
        // Store auth token
        apiClient.setAuthToken(response.token);
        localStorage.setItem("auth_token", response.token);

        // Store user data
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }

        console.log("✅ OAuth callback completed successfully");
      } else {
        console.error("🔴 Backend callback failed:", response);
      }

      return response;
    } catch (error) {
      console.error("🔴 Google callback error:", error);
      throw error;
    }
  }

  /**
   * Alternative Google login using direct OAuth URL
   */
  async loginWithGoogleDirect(): Promise<OAuthResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("🔵 Getting Google OAuth URL...");
        const authUrl = await this.getGoogleAuthUrl();

        console.log("🔵 Opening direct Google OAuth URL...");
        const width = 500,
          height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          authUrl,
          "google-oauth-direct",
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,location=no,toolbar=no,menubar=no,personalbar=no`,
        );

        if (!popup) {
          reject(new Error("Failed to open popup window. Please check if popups are blocked."));
          return;
        }

        popup.focus();

        let messageReceived = false;

        function messageHandler(ev: MessageEvent) {
          const allowed = [
            "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev",
            "https://www.faredowntravels.com",
            "https://builder.io",
          ];

          if (!allowed.includes(ev.origin)) {
            console.log("🔴 Message from disallowed origin:", ev.origin);
            return;
          }

          console.log("🔵 Received message:", ev.data, "from origin:", ev.origin);

          if (ev.data?.type === "oauth:success") {
            messageReceived = true;
            window.removeEventListener("message", messageHandler);
            if (popup && !popup.closed) {
              popup.close();
            }
            resolve(ev.data);
          } else if (ev.data?.type === "oauth:error") {
            messageReceived = true;
            window.removeEventListener("message", messageHandler);
            if (popup && !popup.closed) {
              popup.close();
            }
            reject(new Error(ev.data.error || "Authentication failed"));
          }
        }

        window.addEventListener("message", messageHandler);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed && !messageReceived) {
            clearInterval(checkClosed);
            window.removeEventListener("message", messageHandler);
            reject(new Error("Authentication cancelled"));
          }
        }, 1000);

        // Timeout after 60 seconds
        setTimeout(() => {
          if (!messageReceived) {
            clearInterval(checkClosed);
            window.removeEventListener("message", messageHandler);
            if (popup && !popup.closed) {
              popup.close();
            }
            reject(new Error("Authentication timed out. Please try again."));
          }
        }, 60000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initiate Google login with popup - Streamlined version per Zubin's specs
   */
  async loginWithGoogle(): Promise<OAuthResponse> {
    return new Promise((resolve, reject) => {
      console.log("🔵 Starting Google OAuth flow...");

      // Open popup window directly to /auth/google with better parameters
      const width = 500,
        height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        "/auth/google", // Backend route to start OAuth
        "oauth-google",
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,location=no,toolbar=no,menubar=no,personalbar=no`,
      );

      if (!popup) {
        reject(new Error("Failed to open popup window. Please check if popups are blocked."));
        return;
      }

      // Focus the popup window to ensure it's interactive
      try {
        popup.focus();
      } catch (e) {
        console.log("🔴 Could not focus popup window:", e);
      }

      console.log("🔵 Popup opened and focused, waiting for auth completion...");

      let messageReceived = false;

      function messageHandler(ev: MessageEvent) {
        const allowed = [
          "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev",
          "https://www.faredowntravels.com",
          "https://builder.io",
        ];

        if (!allowed.includes(ev.origin)) {
          console.log("🔴 Message from disallowed origin:", ev.origin);
          return;
        }

        console.log("🔵 Received message:", ev.data, "from origin:", ev.origin);

        if (ev.data?.type === "oauth:success") {
          console.log("✅ OAuth success received!");
          messageReceived = true;

          // Clean up listeners
          window.removeEventListener("message", messageHandler);
          if (popup && !popup.closed) {
            popup.close();
          }

          // Fetch session from backend to confirm authentication
          fetch("/api/me", { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
              if (data.ok && data.user) {
                console.log("✅ Session confirmed, user logged in:", data.user);
                resolve({
                  success: true,
                  message: "Google authentication successful",
                  user: {
                    id: data.user.id,
                    username: data.user.name || data.user.email,
                    email: data.user.email,
                    role: "user",
                    provider: "google",
                  },
                });
              } else {
                reject(new Error("Session validation failed"));
              }
            })
            .catch((error) => {
              console.error("🔴 Session validation error:", error);
              reject(new Error("Failed to validate session"));
            });
        } else if (ev.data?.type === "oauth:error") {
          console.error("🔴 OAuth error:", ev.data.error);
          messageReceived = true;
          window.removeEventListener("message", messageHandler);
          if (popup && !popup.closed) {
            popup.close();
          }
          reject(new Error(ev.data.error || "Authentication failed"));
        }
      }

      window.addEventListener("message", messageHandler);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed && !messageReceived) {
          console.log("🔴 Popup closed manually");
          clearInterval(checkClosed);
          window.removeEventListener("message", messageHandler);
          reject(new Error("Authentication cancelled"));
        }
      }, 1000);

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!messageReceived) {
          console.log("🔴 OAuth timeout");
          clearInterval(checkClosed);
          window.removeEventListener("message", messageHandler);
          if (popup && !popup.closed) {
            popup.close();
          }
          reject(new Error("Authentication timed out. Please try again."));
        }
      }, 60000);
    });
  }

  /**
   * Get Facebook OAuth authorization URL
   */
  async getFacebookAuthUrl(): Promise<string> {
    try {
      const response = await apiClient.get<OAuthUrlResponse>(
        `${this.baseUrl}/facebook/url`,
      );

      if (response.success && response.url) {
        return response.url;
      }

      throw new Error("Failed to get Facebook auth URL");
    } catch (error: any) {
      console.error("Facebook auth URL error:", error);

      // Handle configuration errors
      if (error.response?.status === 503) {
        throw new Error(
          "Facebook sign-in is currently unavailable. Please try again later or use email/password login.",
        );
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(
        "Unable to connect to Facebook sign-in service. Please try again.",
      );
    }
  }

  /**
   * Handle Facebook OAuth callback
   */
  async handleFacebookCallback(
    code: string,
    state: string,
  ): Promise<OAuthResponse> {
    try {
      const response = await apiClient.post<OAuthResponse>(
        `${this.baseUrl}/facebook/callback`,
        {
          code,
          state,
        },
      );

      if (response.success && response.token) {
        // Store auth token
        apiClient.setAuthToken(response.token);
        localStorage.setItem("auth_token", response.token);

        // Store user data
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      }

      return response;
    } catch (error) {
      console.error("Facebook callback error:", error);
      throw error;
    }
  }

  /**
   * Initiate Facebook login with popup
   */
  async loginWithFacebook(): Promise<OAuthResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        const authUrl = await this.getFacebookAuthUrl();

        // Open popup window
        const popup = window.open(
          authUrl,
          "facebook-login",
          "width=500,height=600,scrollbars=yes,resizable=yes",
        );

        if (!popup) {
          throw new Error("Failed to open popup window");
        }

        // Listen for popup messages
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === "FACEBOOK_AUTH_SUCCESS") {
            const { code, state } = event.data;

            try {
              const result = await this.handleFacebookCallback(code, state);
              popup.close();
              window.removeEventListener("message", handleMessage);
              resolve(result);
            } catch (error) {
              popup.close();
              window.removeEventListener("message", handleMessage);
              reject(error);
            }
          } else if (event.data.type === "FACEBOOK_AUTH_ERROR") {
            popup.close();
            window.removeEventListener("message", handleMessage);
            reject(
              new Error(event.data.error || "Facebook authentication failed"),
            );
          }
        };

        window.addEventListener("message", handleMessage);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener("message", handleMessage);
            reject(new Error("Authentication cancelled"));
          }
        }, 1000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get Apple OAuth authorization URL
   */
  async getAppleAuthUrl(): Promise<string> {
    try {
      const response = await apiClient.get<OAuthUrlResponse>(
        `${this.baseUrl}/apple/url`,
      );

      if (response.success && response.url) {
        return response.url;
      }

      throw new Error("Failed to get Apple auth URL");
    } catch (error: any) {
      console.error("Apple auth URL error:", error);

      // Handle configuration errors
      if (error.response?.status === 503) {
        throw new Error(
          "Apple sign-in is currently unavailable. Please try again later or use email/password login.",
        );
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(
        "Unable to connect to Apple sign-in service. Please try again.",
      );
    }
  }

  /**
   * Handle Apple OAuth callback
   */
  async handleAppleCallback(
    code: string,
    state: string,
    user?: any,
  ): Promise<OAuthResponse> {
    try {
      const response = await apiClient.post<OAuthResponse>(
        `${this.baseUrl}/apple/callback`,
        {
          code,
          state,
          user,
        },
      );

      if (response.success && response.token) {
        // Store auth token
        apiClient.setAuthToken(response.token);
        localStorage.setItem("auth_token", response.token);

        // Store user data
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      }

      return response;
    } catch (error) {
      console.error("Apple callback error:", error);
      throw error;
    }
  }

  /**
   * Initiate Apple login with popup
   */
  async loginWithApple(): Promise<OAuthResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        const authUrl = await this.getAppleAuthUrl();

        // Open popup window
        const popup = window.open(
          authUrl,
          "apple-login",
          "width=500,height=600,scrollbars=yes,resizable=yes",
        );

        if (!popup) {
          throw new Error("Failed to open popup window");
        }

        // Listen for popup messages
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === "APPLE_AUTH_SUCCESS") {
            const { code, state, user } = event.data;

            try {
              const result = await this.handleAppleCallback(code, state, user);
              popup.close();
              window.removeEventListener("message", handleMessage);
              resolve(result);
            } catch (error) {
              popup.close();
              window.removeEventListener("message", handleMessage);
              reject(error);
            }
          } else if (event.data.type === "APPLE_AUTH_ERROR") {
            popup.close();
            window.removeEventListener("message", handleMessage);
            reject(
              new Error(event.data.error || "Apple authentication failed"),
            );
          }
        };

        window.addEventListener("message", handleMessage);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener("message", handleMessage);
            reject(new Error("Authentication cancelled"));
          }
        }, 1000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle OAuth redirect in popup window (Legacy method - Backend now handles this)
   */
  static handleOAuthRedirect() {
    console.log("🔵 OAuth redirect handler called (legacy)");
    console.log("🔵 Current URL:", window.location.href);
    console.log("🔵 Window opener exists:", !!window.opener);

    // This method is now mostly obsolete since the backend renders the bridge page
    // But we keep it as a fallback for any edge cases

    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");

    if (error) {
      console.error("🔴 OAuth URL error:", error);
      const parentOrigin = window.location.origin;
      window.opener?.postMessage(
        {
          type: "GOOGLE_AUTH_ERROR",
          error: `Authentication failed: ${error}`,
        },
        parentOrigin,
      );
      window.close();
      return;
    }

    // If we reach here without an error, the backend should have handled everything
    console.log(
      "🔵 No error in URL, backend should have handled the OAuth flow",
    );
    console.log("🔵 If popup doesn't close automatically, this is a fallback");

    // Fallback: try to close popup after a delay
    setTimeout(() => {
      if (window.opener) {
        console.log("🔵 Fallback: Closing popup window");
        window.close();
      }
    }, 3000);
  }
}

// Export singleton instance
export const oauthService = new OAuthService();
export default oauthService;
