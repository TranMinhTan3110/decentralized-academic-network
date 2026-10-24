// ==============================================================================
// API CLIENT - DECENTRALIZED ACADEMIC NETWORK (DEDOCU)
// Centralized HTTP client communicating with Document Service Backend (Port 8082)
// Automatically handles JWT Bearer tokens, FormData uploads, and envelope unwrapping
// ==============================================================================

import { authService } from './authService';

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Khi đặt VITE_API_GATEWAY_URL, mọi request document đi qua API Gateway (8090)
// để được xác thực JWT tập trung; ngược lại gọi thẳng document-service (dev).
const GATEWAY_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_GATEWAY_URL) || '';
const DOCUMENT_API_BASE_URL =
  GATEWAY_BASE_URL ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DOCUMENT_API_BASE_URL) ||
  'http://localhost:8082';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = DOCUMENT_API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Headers xác thực dùng cho fetch thủ công (binary/blob) đi ra ngoài apiClient.
   */
  public buildPublicHeaders(): Headers {
    return this.buildHeaders(true);
  }

  private buildHeaders(isFormData: boolean = false, customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);

    const token = authService.getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const user = authService.getCurrentUser();
    if (user?.id && !headers.has('X-User-Id')) {
      headers.set('X-User-Id', user.id);
    }

    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  }

  private formatUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return null as T;
    }

    let payload: any;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (payload && typeof payload === 'object' && payload.message) ||
        (typeof payload === 'string' && payload) ||
        `Lỗi hệ thống (${response.status}): ${response.statusText}`;

      if (response.status === 401 && typeof window !== 'undefined') {
        // Phiên hết hạn/không hợp lệ: dọn session và đẩy về trang đăng nhập một lần duy nhất
        authService.logout();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
      }

      throw new ApiError(errorMessage, response.status, payload);
    }

    // Unwrap ApiResponse<T> envelope if present
    if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
      const envelope = payload as ApiResponseEnvelope<T>;
      if (!envelope.success) {
        throw new ApiError(envelope.message || 'Yêu cầu không thành công', response.status, payload);
      }
      return envelope.data;
    }

    return payload as T;
  }

  private createSignal(customSignal?: AbortSignal | null, timeoutMs: number = 10000): AbortSignal | undefined {
    if (customSignal) return customSignal;
    if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
      return AbortSignal.timeout(timeoutMs);
    }
    return undefined;
  }

  /**
   * HTTP GET
   */
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.formatUrl(endpoint);
    const headers = this.buildHeaders(false, options.headers);

    const response = await fetch(url, {
      ...options,
      signal: this.createSignal(options.signal),
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * HTTP POST (Supports JSON body or FormData)
   */
  async post<T>(
    endpoint: string,
    body?: any,
    isFormData: boolean = false,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.formatUrl(endpoint);
    const headers = this.buildHeaders(isFormData, options.headers);

    let serializedBody: BodyInit | undefined;
    if (isFormData) {
      serializedBody = body as FormData;
    } else if (body !== undefined) {
      serializedBody = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, {
      ...options,
      // Upload PDF qua IPFS có thể mất vài phút — không áp timeout 10s của request thường
      signal: this.createSignal(options.signal, isFormData ? 120000 : 10000),
      method: 'POST',
      headers,
      body: serializedBody,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * HTTP PUT
   */
  async put<T>(
    endpoint: string,
    body?: any,
    isFormData: boolean = false,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.formatUrl(endpoint);
    const headers = this.buildHeaders(isFormData, options.headers);

    let serializedBody: BodyInit | undefined;
    if (isFormData) {
      serializedBody = body as FormData;
    } else if (body !== undefined) {
      serializedBody = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, {
      ...options,
      signal: this.createSignal(options.signal),
      method: 'PUT',
      headers,
      body: serializedBody,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * HTTP DELETE
   */
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.formatUrl(endpoint);
    const headers = this.buildHeaders(false, options.headers);

    const response = await fetch(url, {
      ...options,
      signal: this.createSignal(options.signal),
      method: 'DELETE',
      headers,
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
