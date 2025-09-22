/**
 * Authentication API Service
 * Handles user authentication, registration, and session management
 */

import { apiClient, ApiResponse } from "@/lib/api";

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

// Auth Service Class
export class AuthService {
  private readonly baseUrl = "/api/auth";

  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        `${this.baseUrl}/login`,
        credentials,
      );

      if (response && response.success) {
        // Store auth token if provided
        if (response.token) {
          apiClient.setAuthToken(response.token);
          localStorage.setItem("auth_token", response.token);
        }

        // Store user data
        localStorage.setItem("user", JSON.stringify(response.user));

        return response;
      }

      throw new Error("Login failed: No data received");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        `${this.baseUrl}/register`,
        userData,
      );

      if (response && response.success) {
        // Store user data
        localStorage.setItem("user", JSON.stringify(response.user));

        // Note: Register endpoint doesn't return token, user needs to login
        return response;
      }

      throw new Error("Registration failed: No data received");
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage regardless of API call success
      this.clearLocalAuth();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      `${this.baseUrl}/me`,
    );

    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    }

    throw new Error("Failed to get user profile");
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      `${this.baseUrl}/profile`,
      updates,
    );

    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    }

    throw new Error("Failed to update profile");
  }

  /**
   * Request password reset (forgot password)
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/forgot-password`, { email });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await apiClient.post(`${this.baseUrl}/password-reset`, data);
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    await apiClient.post(`${this.baseUrl}/password-reset/confirm`, data);
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ accessToken: string; expiresIn: number }> {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await apiClient.post<
      ApiResponse<{
        accessToken: string;
        expiresIn: number;
      }>
    >(`${this.baseUrl}/refresh`, {
      refreshToken,
    });

    if (response.data) {
      apiClient.setAuthToken(response.data.accessToken);
      return response.data;
    }

    throw new Error("Failed to refresh token");
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/verify-email`, { token });
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/resend-verification`);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("user");
    return !!(token && user);
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing stored user data:", error);
      return null;
    }
  }

  /**
   * Clear local authentication data
   */
  private clearLocalAuth(): void {
    apiClient.clearAuthToken();
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
