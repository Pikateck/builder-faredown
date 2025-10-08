/**
 * User Management Service
 * Handles all user-related API operations for admin panel
 */

import { apiClient } from "@/lib/api";
import { getAdminHeaders } from "@/utils/adminEnv";

export interface AdminUser {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  countryCode: string;
  role: "super_admin" | "finance" | "sales" | "marketing" | "user";
  status: "active" | "inactive" | "pending";
  lastLogin: string | null;
  createdAt: string;
  permissions: string[];
  isVerified?: boolean;
  isActive?: boolean;
  verifiedAt?: string | null;
  password?: string;
}

export interface CreateUserRequest {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  countryCode: string;
  role: string;
  status: string;
  password: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

class UserManagementService {
  private baseUrl = "/api/admin/users";

  /**
   * Get all users with optional filters
   */
  async getUsers(filters: UserFilters = {}): Promise<{
    users: AdminUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append("search", filters.search);
      if (filters.role && filters.role !== "all")
        params.append("role", filters.role);
      if (filters.status && filters.status !== "all")
        params.append("status", filters.status);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await apiClient.get(
        `${this.baseUrl}?${params.toString()}`,
        undefined,
        getAdminHeaders(),
      );

      if (response && (response as any).success !== false) {
        const data = response as any;
        return {
          users: data.users || [],
          total: data.total ?? data.pagination?.total ?? 0,
          page: data.page ?? data.pagination?.page ?? 1,
          totalPages: data.totalPages ?? data.pagination?.totalPages ?? 1,
        };
      } else {
        throw new Error(
          (response as any)?.message ||
            (response as any)?.error ||
            "Failed to fetch users",
        );
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserRequest): Promise<AdminUser> {
    try {
      const response = await apiClient.post(
        this.baseUrl,
        userData,
        getAdminHeaders(),
      );

      if (response.ok) {
        return response.data.user;
      } else {
        throw new Error(response.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(
    userId: string,
    userData: Partial<CreateUserRequest>,
  ): Promise<AdminUser> {
    try {
      const response = await apiClient.put(
        `${this.baseUrl}/${userId}`,
        userData,
        getAdminHeaders(),
      );

      if (response.ok) {
        return response.data.user;
      } else {
        throw new Error(response.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/${userId}`);

      if (!response.ok) {
        throw new Error(response.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  /**
   * Toggle user status (active/inactive)
   */
  async toggleUserStatus(userId: string): Promise<AdminUser> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/${userId}/toggle-status`,
        {},
        getAdminHeaders(),
      );

      if (response.ok) {
        return response.data.user;
      } else {
        throw new Error(response.error || "Failed to toggle user status");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      throw error;
    }
  }

  /**
   * Reset user password
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/${userId}/reset-password`,
        {
          password: newPassword,
        },
        getAdminHeaders(),
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    pendingUsers: number;
    roleDistribution: Record<string, number>;
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`);

      if (response.ok) {
        return response.data;
      } else {
        throw new Error(response.error || "Failed to fetch user statistics");
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  }
}

export const userManagementService = new UserManagementService();
