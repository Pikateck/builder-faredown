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

export class OAuthService {
  private readonly baseUrl = "/api/oauth";

  /**
   * Get Google OAuth authorization URL
   */
  async getGoogleAuthUrl(): Promise<string> {
    try {
      const response = await apiClient.get<OAuthUrlResponse>(`${this.baseUrl}/google/url`);

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
      const response = await apiClient.post<OAuthResponse>(`${this.baseUrl}/google/callback`, {
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
      console.error("Google callback error:", error);
      throw error;
    }
  }

  /**
   * Initiate Google login with popup
   */
  async loginWithGoogle(): Promise<OAuthResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        const authUrl = await this.getGoogleAuthUrl();
        
        // Open popup window
        const popup = window.open(
          authUrl,
          'google-login',
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

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            const { code, state } = event.data;
            
            try {
              const result = await this.handleGoogleCallback(code, state);
              popup.close();
              window.removeEventListener('message', handleMessage);
              resolve(result);
            } catch (error) {
              popup.close();
              window.removeEventListener('message', handleMessage);
              reject(error);
            }
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            popup.close();
            window.removeEventListener('message', handleMessage);
            reject(new Error(event.data.error || 'Google authentication failed'));
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
   * Handle OAuth redirect in popup window
   */
  static handleOAuthRedirect() {
    // This should be called in a separate OAuth callback page
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const provider = window.location.pathname.includes('google') ? 'google' : 
                    window.location.pathname.includes('facebook') ? 'facebook' : 'apple';

    if (error) {
      window.opener?.postMessage({
        type: `${provider.toUpperCase()}_AUTH_ERROR`,
        error: error
      }, window.location.origin);
      window.close();
      return;
    }

    if (code && state) {
      const user = urlParams.get('user'); // For Apple login
      window.opener?.postMessage({
        type: `${provider.toUpperCase()}_AUTH_SUCCESS`,
        code,
        state,
        ...(user && { user })
      }, window.location.origin);
      window.close();
    }
  }
}

// Export singleton instance
export const oauthService = new OAuthService();
export default oauthService;
