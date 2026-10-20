import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

// Fail fast on unmocked network calls during tests to prevent TCP connection timeouts to localhost:8082
const defaultFetch = globalThis.fetch;

const createMockFetch = () => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : (input as Request).url;

    if (url.includes('localhost:8082') || url.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Test environment: backend mock offline' }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    return defaultFetch(input, init);
  };
};

if (typeof globalThis.fetch === 'function') {
  globalThis.fetch = createMockFetch();
}

beforeEach(() => {
  if (typeof globalThis.fetch === 'function') {
    globalThis.fetch = createMockFetch();
  }
});
