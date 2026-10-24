import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from '../../services/apiClient';
import { authService } from '../../services/authService';

describe('apiClient Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('automatically adds Authorization Bearer token when user is logged in', async () => {
    vi.spyOn(authService, 'getAccessToken').mockReturnValue('mock-jwt-token');
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
      id: 'user-uuid-1',
      email: 'test@example.com',
      username: 'testuser',
      fullName: 'Test User',
      role: 'USER',
    });

    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, data: { result: 'ok' } }),
    } as any);

    const data = await apiClient.get('/api/v1/test');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/test'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers),
      })
    );

    const callHeaders = mockFetch.mock.calls[0][1]?.headers as Headers;
    expect(callHeaders.get('Authorization')).toBe('Bearer mock-jwt-token');
    expect(callHeaders.get('X-User-Id')).toBe('user-uuid-1');
    expect(data).toEqual({ result: 'ok' });
  });

  it('does not set Content-Type header when sending FormData in POST', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, data: { id: 'doc-123' } }),
    } as any);

    const formData = new FormData();
    formData.append('title', 'Tài liệu test');

    const result = await apiClient.post('/api/v1/documents/upload', formData, true);

    const callHeaders = mockFetch.mock.calls[0][1]?.headers as Headers;
    expect(callHeaders.has('Content-Type')).toBe(false);
    expect(result).toEqual({ id: 'doc-123' });
  });

  it('throws ApiError when backend returns success: false', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: false, message: 'Dữ liệu không hợp lệ' }),
    } as any);

    await expect(apiClient.get('/api/v1/fail')).rejects.toThrow('Dữ liệu không hợp lệ');
  });

  it('handles 204 No Content gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    } as any);

    const result = await apiClient.delete('/api/v1/documents/123');
    expect(result).toBeNull();
  });
});
