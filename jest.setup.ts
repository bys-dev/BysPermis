import '@testing-library/jest-dom'

// @react-pdf/renderer is ESM and CPU-bound — irrelevant in unit tests.
// Real PDF rendering is exercised via E2E + manual recette.
jest.mock('@/lib/pdf-helpers', () => ({
  renderConvocationPdf: async (id: string) => ({
    buffer: Buffer.from(`mock-convocation-${id}`),
    filename: `convocation-${id}.pdf`,
  }),
  renderInvoicePdfFromReservation: async (id: string) => ({
    buffer: Buffer.from(`mock-invoice-${id}`),
    filename: 'facture-mock.pdf',
    invoiceNumero: 'FAC-MOCK-0001',
  }),
}))

// ─── Polyfills pour l'environnement jsdom (Next.js 16) ────────
if (typeof TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const util = require('util');
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
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
