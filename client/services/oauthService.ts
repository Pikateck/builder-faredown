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
  async getOAuthStatus(): Promise<{ google: boolean; facebook: boolean; apple: boolean }> {
    try {
      const response = await apiClient.get<OAuthStatusResponse>(`${this.baseUrl}/status`);

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

      const response = await apiClient.get<OAuthUrlResponse>(`${this.baseUrl}/google/url`);

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
        throw new Error("Google sign-in is currently unavailable. Please try again later or use email/password login.");
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error("Unable to connect to Google sign-in service. Please try again.");
    }
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(code: string, state: string): Promise<OAuthResponse> {
    try {
      console.log("🔵 Sending callback request to backend...");
      const response = await apiClient.post<OAuthResponse>(`${this.baseUrl}/google/callback`, {
        code,
        state
      });

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
   * Initiate Google login with popup
   */
  async loginWithGoogle(): Promise<OAuthResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("🔵 Getting Google auth URL...");
        const authUrl = await this.getGoogleAuthUrl();
        console.log("🔵 Google auth URL:", authUrl);

        // Open popup window
        const popup = window.open(
          authUrl,
          'google-login',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          throw new Error("Failed to open popup window");
        }

        console.log("🔵 Popup opened, waiting for callback...");

        // Listen for popup messages
        const handleMessage = async (event: MessageEvent) => {
          console.log("🔵 Received popup message:", event.data);
          console.log("🔵 Message origin:", event.origin);
          console.log("🔵 Current origin:", window.location.origin);

          // Allow messages from our deployment domains and Builder.io
          const allowedOrigins = [
            window.location.origin,
            'https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev',
            'https://www.faredowntravels.com',
            'https://builder.io'
          ];

          if (!allowedOrigins.includes(event.origin)) {
            console.log("🔴 Message from disallowed origin:", event.origin);
            return;
          }

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            console.log("🔵 Google auth success received from backend!");
            console.log("🔵 User data:", event.data.user);

            try {
              // Backend has already processed everything, just use the data
              const result: OAuthResponse = {
                success: true,
                message: "Google authentication successful",
                token: event.data.token,
                user: event.data.user
              };

              // Store auth token and user data (backend already set cookie)
              if (result.token) {
                apiClient.setAuthToken(result.token);
                localStorage.setItem("auth_token", result.token);
              }

              if (result.user) {
                localStorage.setItem("user", JSON.stringify(result.user));
              }

              console.log("✅ OAuth success processed:", result);
              popup.close();
              window.removeEventListener('message', handleMessage);
              clearInterval(checkClosed);
              resolve(result);
            } catch (error) {
              console.error("🔴 Error processing success message:", error);
              popup.close();
              window.removeEventListener('message', handleMessage);
              clearInterval(checkClosed);
              reject(error);
            }
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            console.error("🔴 Google auth error from popup:", event.data.error);
            popup.close();
            window.removeEventListener('message', handleMessage);
            clearInterval(checkClosed);
            reject(new Error(event.data.error || 'Google authentication failed'));
          }
        };

        window.addEventListener('message', handleMessage);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            console.log("🔴 Popup was closed manually");
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            reject(new Error('Authentication cancelled'));
          }
        }, 1000);

      } catch (error) {
        console.error("🔴 OAuth flow error:", error);
        reject(error);
      }
    });
  }

  /**
   * Get Facebook OAuth authorization URL
   */
  async getFacebookAuthUrl(): Promise<string> {
    try {
      const response = await apiClient.get<OAuthUrlResponse>(`${this.baseUrl}/facebook/url`);

      if (response.success && response.url) {
        return response.url;
      }

      throw new Error("Failed to get Facebook auth URL");
    } catch (error: any) {
      console.error("Facebook auth URL error:", error);

      // Handle configuration errors
      if (error.response?.status === 503) {
        throw new Error("Facebook sign-in is currently unavailable. Please try again later or use email/password login.");
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error("Unable to connect to Facebook sign-in service. Please try again.");
    }
  }

  /**
   * Handle Facebook OAuth callback
   */
  async handleFacebookCallback(code: string, state: string): Promise<OAuthResponse> {
    try {
      const response = await apiClient.post<OAuthResponse>(`${this.baseUrl}/facebook/callback`, {
        code,
        state
      });

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
          'facebook-login',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          throw new Error("Failed to open popup window");
        }

        // Listen for popup messages
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
            const { code, state } = event.data;
            
            try {
              const result = await this.handleFacebookCallback(code, state);
              popup.close();
              window.removeEventListener('message', handleMessage);
              resolve(result);
            } catch (error) {
              popup.close();
              window.removeEventListener('message', handleMessage);
              reject(error);
            }
          } else if (event.data.type === 'FACEBOOK_AUTH_ERROR') {
            popup.close();
            window.removeEventListener('message', handleMessage);
            reject(new Error(event.data.error || 'Facebook authentication failed'));
          }
        };

        window.addEventListener('message', handleMessage);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            reject(new Error('Authentication cancelled'));
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
      const response = await apiClient.get<OAuthUrlResponse>(`${this.baseUrl}/apple/url`);

      if (response.success && response.url) {
        return response.url;
      }

      throw new Error("Failed to get Apple auth URL");
    } catch (error: any) {
      console.error("Apple auth URL error:", error);

      // Handle configuration errors
      if (error.response?.status === 503) {
        throw new Error("Apple sign-in is currently unavailable. Please try again later or use email/password login.");
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error("Unable to connect to Apple sign-in service. Please try again.");
    }
  }

  /**
   * Handle Apple OAuth callback
   */
  async handleAppleCallback(code: string, state: string, user?: any): Promise<OAuthResponse> {
    try {
      const response = await apiClient.post<OAuthResponse>(`${this.baseUrl}/apple/callback`, {
        code,
        state,
        user
      });

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
          'apple-login',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          throw new Error("Failed to open popup window");
        }

        // Listen for popup messages
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'APPLE_AUTH_SUCCESS') {
            const { code, state, user } = event.data;
            
            try {
              const result = await this.handleAppleCallback(code, state, user);
              popup.close();
              window.removeEventListener('message', handleMessage);
              resolve(result);
            } catch (error) {
              popup.close();
              window.removeEventListener('message', handleMessage);
              reject(error);
            }
          } else if (event.data.type === 'APPLE_AUTH_ERROR') {
            popup.close();
            window.removeEventListener('message', handleMessage);
            reject(new Error(event.data.error || 'Apple authentication failed'));
          }
        };

        window.addEventListener('message', handleMessage);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            reject(new Error('Authentication cancelled'));
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
    const error = urlParams.get('error');

    if (error) {
      console.error("🔴 OAuth URL error:", error);
      const parentOrigin = window.location.origin;
      window.opener?.postMessage({
        type: 'GOOGLE_AUTH_ERROR',
        error: `Authentication failed: ${error}`
      }, parentOrigin);
      window.close();
      return;
    }

    // If we reach here without an error, the backend should have handled everything
    console.log("🔵 No error in URL, backend should have handled the OAuth flow");
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
