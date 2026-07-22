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

export async function renderAttestationPdf(reservationIdOrNumero: string): Promise<{
  buffer: Buffer;
  filename: string;
  numeroAttestation: string;
}> {
  return {
    buffer: Buffer.from(`mock-attestation-${reservationIdOrNumero}`),
    filename: `attestation-${reservationIdOrNumero}.pdf`,
    numeroAttestation: "ATT-MOCK-0001",
  };
}

export async function renderIndividualEmargementPdf(reservationIdOrNumero: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  return {
    buffer: Buffer.from(`mock-emargement-${reservationIdOrNumero}`),
    filename: `emargement-${reservationIdOrNumero}.pdf`,
  };
}

export async function renderBonAccordPdf(documentId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  return {
    buffer: Buffer.from(`mock-bon-accord-${documentId}`),
    filename: `bon-accord-${documentId}.pdf`,
  };
}
