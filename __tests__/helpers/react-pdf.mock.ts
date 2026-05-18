// Mock for @react-pdf/renderer — pure ESM, irrelevant in Jest jsdom tests.

export const Document = () => null;
export const Page = () => null;
export const Text = () => null;
export const View = () => null;
export const Image = () => null;
export const StyleSheet = { create: <T,>(s: T) => s };
export const Font = { register: () => undefined };

export async function renderToBuffer(): Promise<Buffer> {
  return Buffer.from("mock-pdf");
}

export type DocumentProps = Record<string, unknown>;
