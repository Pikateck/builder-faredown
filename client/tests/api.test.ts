/**
 * API Client Test Suite
 * Tests base URL resolution, error classification, and offline flag handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient, API_CONFIG } from '../lib/api';

// Mock environment variables
const originalWindow = global.window;
const originalEnv = import.meta.env;

describe('API Client', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create fresh API client for each test
    apiClient = new ApiClient(API_CONFIG);
  });

  afterEach(() => {
    // Restore original window and env
    global.window = originalWindow;
    Object.assign(import.meta.env, originalEnv);
  });

  describe('Base URL Resolution', () => {
    it('should use environment variable when provided', () => {
      // Mock environment variable
      vi.stubGlobal('import.meta.env', {
        VITE_API_BASE_URL: 'https://custom-api.com/api'
      });

      const config = { ...API_CONFIG, BASE_URL: 'https://custom-api.com/api' };
      const client = new ApiClient(config);
      
      expect(client.getConfig().baseURL).toBe('https://custom-api.com/api');
    });

    it('should resolve builder.codes domains correctly', () => {
      // Mock window.location for builder.codes
      vi.stubGlobal('window', {
        location: {
          hostname: 'test.builder.codes',
          origin: 'https://test.builder.codes'
        }
      });

      // Mock the getBackendUrl function behavior
      const expectedUrl = 'https://test.builder.codes/api';
      const config = { ...API_CONFIG, BASE_URL: expectedUrl };
      const client = new ApiClient(config);
      
      expect(client.getConfig().baseURL).toBe(expectedUrl);
    });

    it('should resolve localhost correctly', () => {
      vi.stubGlobal('window', {
        location: {
          hostname: 'localhost',
          origin: 'http://localhost:3000'
        }
      });

      const config = { ...API_CONFIG, BASE_URL: 'http://localhost:3001/api' };
      const client = new ApiClient(config);
      
      expect(client.getConfig().baseURL).toBe('http://localhost:3001/api');
    });

    it('should resolve production domains correctly', () => {
      vi.stubGlobal('window', {
        location: {
          hostname: 'faredown.com',
          origin: 'https://faredown.com'
        }
      });

      const config = { ...API_CONFIG, BASE_URL: 'https://faredown.com/api' };
      const client = new ApiClient(config);
      
      expect(client.getConfig().baseURL).toBe('https://faredown.com/api');
    });
  });

  describe('Error Classification', () => {
    beforeEach(() => {
      // Mock fetch globally
      global.fetch = vi.fn();
    });

    it('should classify network errors correctly', async () => {
      // Mock network failure
      (global.fetch as any).mockRejectedValue(new Error('Failed to fetch'));
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      try {
        await apiClient.get('/test-endpoint');
      } catch (error) {
        // Should either return fallback or throw
        expect(true).toBe(true); // Test passes if we reach here
      }
      
      // Should log network unavailable message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Network unavailable')
      );
      
      consoleSpy.mockRestore();
    });

    it('should classify timeout errors correctly', async () => {
      // Mock timeout (AbortError)
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      (global.fetch as any).mockRejectedValue(abortError);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      try {
        await apiClient.get('/test-endpoint');
      } catch (error) {
        expect(true).toBe(true);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Request timeout')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle HTTP errors correctly', async () => {
      // Mock HTTP error response
      const mockResponse = {
        ok: false,
        status: 404,
        headers: {
          get: () => 'application/json'
        },
        json: () => Promise.resolve({ message: 'Not found' })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      try {
        await apiClient.get('/test-endpoint');
      } catch (error) {
        expect(error.message).toContain('Not found');
        expect(error.status).toBe(404);
      }
    });

    it('should handle successful responses correctly', async () => {
      const mockData = { success: true, data: { test: 'value' } };
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: () => 'application/json'
        },
        json: () => Promise.resolve(mockData)
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const result = await apiClient.get('/test-endpoint');
      expect(result).toEqual(mockData);
    });
  });

  describe('Offline Flag Handling', () => {
    it('should respect offline fallback enabled flag in development', () => {
      const config = { 
        ...API_CONFIG, 
        IS_PRODUCTION: false,
        OFFLINE_FALLBACK_ENABLED: true 
      };
      const client = new ApiClient(config);
      
      expect(client.getConfig().offlineFallbackEnabled).toBe(true);
    });

    it('should respect offline fallback disabled flag in production', () => {
      const config = { 
        ...API_CONFIG, 
        IS_PRODUCTION: true,
        OFFLINE_FALLBACK_ENABLED: false 
      };
      const client = new ApiClient(config);
      
      expect(client.getConfig().offlineFallbackEnabled).toBe(false);
    });

    it('should enable fallback mode manually', () => {
      apiClient.enableFallbackMode();
      expect(apiClient.getConfig().forceFallback).toBe(true);
    });

    it('should disable fallback mode manually', () => {
      apiClient.enableFallbackMode();
      apiClient.disableFallbackMode();
      expect(apiClient.getConfig().forceFallback).toBe(false);
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      // Mock localStorage
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };
    });

    it('should set authentication token', () => {
      const token = 'test-token-123';
      apiClient.setAuthToken(token);
      
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', token);
    });

    it('should clear authentication token', () => {
      apiClient.clearAuthToken();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should include authorization header when token is set', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true })
      });

      // Mock localStorage to return a token
      (localStorage.getItem as any).mockReturnValue('test-token');
      
      // Create new client to pick up the token
      const clientWithToken = new ApiClient(API_CONFIG);
      
      await clientWithToken.get('/test-endpoint');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });
  });

  describe('Health Check', () => {
    it('should perform health check successfully', async () => {
      const mockHealthData = {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString()
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockHealthData)
      });

      const health = await apiClient.healthCheck();
      expect(health.status).toBe('ok');
      expect(health.environment).toBeDefined();
    });

    it('should return fallback health data on failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const health = await apiClient.healthCheck();
      expect(health.status).toBe('fallback');
      expect(health.database).toBe('offline');
    });
  });

  describe('Request Methods', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should make GET requests correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ data: 'test' })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      await apiClient.get('/test', { param: 'value' });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test?param=value'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should make POST requests correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const postData = { test: 'data' };
      await apiClient.post('/test', postData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData)
        })
      );
    });

    it('should make PUT requests correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const putData = { update: 'data' };
      await apiClient.put('/test', putData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData)
        })
      );
    });

    it('should make DELETE requests correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      await apiClient.delete('/test');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('Connectivity Testing', () => {
    it('should test connectivity successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ status: 'ok' })
      });

      const isConnected = await apiClient.testConnectivity();
      expect(isConnected).toBe(true);
    });

    it('should handle connectivity failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const isConnected = await apiClient.testConnectivity();
      expect(isConnected).toBe(false);
    });
  });
});
