/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────
jest.mock("@/lib/email", () => ({
  resend: {
    emails: {
      send: jest.fn().mockResolvedValue({ id: "email_test_001" }),
    },
  },
}));

import { resend } from "@/lib/email";
import { POST } from "@/app/api/contact/route";

// ─── Helper ───────────────────────────────────────────────────
function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const validContact = {
  nom: "Jean Dupont",
  email: "jean.dupont@test.fr",
  sujet: "Question sur les formations",
  message: "Bonjour, je souhaite obtenir des informations sur vos formations de securite routiere.",
};

// ─────────────────────────────────────────────────────────────
//  Tests — POST /api/contact
// ─────────────────────────────────────────────────────────────

describe("POST /api/contact", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Envoi reussi ────────────────────────────────────────
  it("retourne ok=true avec des donnees valides", async () => {
    const res = await POST(makeReq(validContact));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("envoie un email via Resend avec les bonnes donnees", async () => {
    await POST(makeReq(validContact));

    expect(resend.emails.send).toHaveBeenCalledTimes(1);
    const call = (resend.emails.send as jest.Mock).mock.calls[0][0];

    expect(call.to).toBe("bysforma95@gmail.com");
    expect(call.replyTo).toBe("jean.dupont@test.fr");
    expect(call.subject).toContain("Jean Dupont");
    expect(call.subject).toContain("Question sur les formations");
    expect(call.html).toContain("Jean Dupont");
    expect(call.html).toContain("jean.dupont@test.fr");
    expect(call.html).toContain("Question sur les formations");
  });

  // ─── Champs manquants ────────────────────────────────────
  it("retourne 400 si le nom est manquant", async () => {
    const { nom, ...sanNom } = validContact;
    const res = await POST(makeReq(sanNom));
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("invalide");
  });

  it("retourne 400 si l'email est manquant", async () => {
    const { email, ...sansEmail } = validContact;
    const res = await POST(makeReq(sansEmail));
    expect(res.status).toBe(400);
  });

  it("retourne 400 si le sujet est manquant", async () => {
    const { sujet, ...sansSujet } = validContact;
    const res = await POST(makeReq(sansSujet));
    expect(res.status).toBe(400);
  });

  it("retourne 400 si le message est manquant", async () => {
    const { message, ...sansMessage } = validContact;
    const res = await POST(makeReq(sansMessage));
    expect(res.status).toBe(400);
  });

  // ─── Validation de l'email ───────────────────────────────
  it("retourne 400 si l'email est invalide", async () => {
    const res = await POST(
      makeReq({ ...validContact, email: "pas-un-email" })
    );
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("invalide");
  });

  it("retourne 400 si l'email n'a pas de domaine", async () => {
    const res = await POST(
      makeReq({ ...validContact, email: "jean@" })
    );
    expect(res.status).toBe(400);
  });

  // ─── Validation du message ───────────────────────────────
  it("retourne 400 si le message est trop court (< 10 caracteres)", async () => {
    const res = await POST(
      makeReq({ ...validContact, message: "Court" })
    );
    expect(res.status).toBe(400);
  });

  it("accepte un message de 10 caracteres exactement", async () => {
    const res = await POST(
      makeReq({ ...validContact, message: "1234567890" })
    );
    expect(res.status).toBe(200);
  });

  // ─── Validation du nom ───────────────────────────────────
  it("retourne 400 si le nom est une chaine vide", async () => {
    const res = await POST(makeReq({ ...validContact, nom: "" }));
    expect(res.status).toBe(400);
  });

  // ─── Validation du sujet ─────────────────────────────────
  it("retourne 400 si le sujet est une chaine vide", async () => {
    const res = await POST(makeReq({ ...validContact, sujet: "" }));
    expect(res.status).toBe(400);
  });

  // ─── Body completement invalide ──────────────────────────
  it("retourne 400 pour un body vide", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  // ─── Erreur Resend ───────────────────────────────────────
  it("retourne 500 si Resend echoue", async () => {
    (resend.emails.send as jest.Mock).mockRejectedValueOnce(
      new Error("Resend API error")
    );

    const res = await POST(makeReq(validContact));
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toContain("Erreur");
  });

  // ─── Pas d'email envoye en cas de validation echouee ─────
  it("n'envoie pas d'email si la validation echoue", async () => {
    await POST(makeReq({ nom: "", email: "invalide", sujet: "", message: "" }));

    expect(resend.emails.send).not.toHaveBeenCalled();
  });
});
