/**
 * Prisma mock factory — reusable across all test files.
 *
 * Each model exposes jest.fn() stubs for common Prisma operations.
 * Tests can override return values with mockResolvedValueOnce / mockImplementation.
 */

export function createPrismaMock() {
  const modelStub = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({}),
    upsert: jest.fn().mockResolvedValue({}),
  });

  return {
    user: modelStub(),
    centre: modelStub(),
    centreMembre: modelStub(),
    formation: modelStub(),
    categorie: modelStub(),
    session: modelStub(),
    reservation: modelStub(),
    ticket: modelStub(),
    ticketMessage: modelStub(),
    faqItem: modelStub(),
    notification: modelStub(),
    platformSettings: modelStub(),
    subscriptionPlan: modelStub(),
    review: modelStub(),
    invoice: modelStub(),
    favorite: modelStub(),
    promoCode: modelStub(),
    emailTemplate: modelStub(),
    centrePayment: modelStub(),
    message: modelStub(),
    article: modelStub(),
    loyaltyPoints: modelStub(),
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
