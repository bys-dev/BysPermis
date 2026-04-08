import '@testing-library/jest-dom'

// ─── Polyfills pour l'environnement jsdom (Next.js 16) ────────
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

if (typeof Request === 'undefined') {
  global.Request = class Request {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: unknown;
    constructor(input: string | Request, init?: RequestInit) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init?.method ?? 'GET';
      this.headers = (init?.headers as Record<string, string>) ?? {};
      this.body = init?.body ?? null;
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
  } as unknown as typeof globalThis.Request;
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    body: unknown;
    status: number;
    headers: Record<string, string>;
    constructor(body?: unknown, init?: ResponseInit) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = (init?.headers as Record<string, string>) ?? {};
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body as string) : this.body;
    }
  } as unknown as typeof globalThis.Response;
}
