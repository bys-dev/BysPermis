/**
 * @jest-environment node
 */

jest.mock("@/lib/prisma", () => ({
  prisma: {
    emailLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

import { emailAlreadySent, logEmail } from "@/lib/email-log";
import { prisma } from "@/lib/prisma";

const mockEmailLog = prisma.emailLog as unknown as {
  create: jest.Mock;
  findFirst: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("logEmail", () => {
  it("enregistre l'envoi avec son contexte", async () => {
    mockEmailLog.create.mockResolvedValue({ id: "log_1" });

    await logEmail({
      destinataire: "eleve@test.fr",
      sujet: "Confirmation",
      status: "ENVOYE",
      kind: "confirmation_reservation",
      reservationId: "res_1",
      providerId: "resend_abc",
    });

    expect(mockEmailLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        destinataire: "eleve@test.fr",
        kind: "confirmation_reservation",
        status: "ENVOYE",
        reservationId: "res_1",
        providerId: "resend_abc",
      }),
    });
  });

  it("ne propage jamais une panne du journal (l'email prime)", async () => {
    mockEmailLog.create.mockRejectedValue(new Error("DB down"));

    await expect(
      logEmail({
        destinataire: "eleve@test.fr",
        sujet: "Confirmation",
        status: "ENVOYE",
        kind: "confirmation_reservation",
      }),
    ).resolves.toBeUndefined();
  });

  it("tronque les champs trop longs", async () => {
    mockEmailLog.create.mockResolvedValue({ id: "log_2" });

    await logEmail({
      destinataire: "a".repeat(900),
      sujet: "b".repeat(900),
      status: "ECHEC",
      error: "c".repeat(2000),
      kind: "convocation",
    });

    const data = mockEmailLog.create.mock.calls[0][0].data;
    expect(data.destinataire).toHaveLength(500);
    expect(data.sujet).toHaveLength(500);
    expect(data.error).toHaveLength(1000);
  });
});

describe("emailAlreadySent", () => {
  it("retourne true si un envoi réussi existe déjà", async () => {
    mockEmailLog.findFirst.mockResolvedValue({ id: "log_1" });
    await expect(emailAlreadySent("res_1", "convocation")).resolves.toBe(true);
    expect(mockEmailLog.findFirst).toHaveBeenCalledWith({
      where: { reservationId: "res_1", kind: "convocation", status: "ENVOYE" },
      select: { id: true },
    });
  });

  it("retourne false quand rien n'a encore été envoyé", async () => {
    mockEmailLog.findFirst.mockResolvedValue(null);
    await expect(emailAlreadySent("res_1", "convocation")).resolves.toBe(false);
  });

  it("se ferme (true) si le journal est illisible, pour éviter les doublons", async () => {
    mockEmailLog.findFirst.mockRejectedValue(new Error("DB down"));
    await expect(emailAlreadySent("res_1", "convocation")).resolves.toBe(true);
  });
});
