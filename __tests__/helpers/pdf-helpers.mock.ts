// Mock for @/lib/pdf-helpers — @react-pdf/renderer is ESM and irrelevant in
// unit tests. Real PDF rendering is exercised via E2E + manual recette.

export async function renderConvocationPdf(reservationIdOrNumero: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  return {
    buffer: Buffer.from(`mock-convocation-${reservationIdOrNumero}`),
    filename: `convocation-${reservationIdOrNumero}.pdf`,
  };
}

export async function renderInvoicePdfFromReservation(reservationId: string): Promise<{
  buffer: Buffer;
  filename: string;
  invoiceNumero: string;
}> {
  return {
    buffer: Buffer.from(`mock-invoice-${reservationId}`),
    filename: `facture-mock.pdf`,
    invoiceNumero: "FAC-MOCK-0001",
  };
}
