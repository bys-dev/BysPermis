import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendMail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/utils";
import { renderEmail, emailDetails, emailEncadre } from "@/lib/email-layout";

const ContactSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  sujet: z.string().min(1, "Sujet requis"),
  message: z.string().min(10, "Message trop court"),
});

const FROM = process.env.EMAIL_FROM ?? "BYS Permis <noreply@byspermis.fr>";
const TO = "contact@byspermis.fr";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, {
      max: 5,
      windowMs: 60 * 1000,
      keyPrefix: "contact",
    });
    if (limited) return limited;

    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const { nom, email, sujet, message } = parsed.data;

    // Escape all user inputs avant injection HTML (XSS prevention)
    const safeNom = escapeHtml(nom);
    const safeEmail = escapeHtml(email);
    const safeSujet = escapeHtml(sujet);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

    const subject = `[Contact BYS] ${sujet} — ${nom}`;
    const { html, text } = renderEmail({
      sujet: subject,
      badge: { ton: "info", libelle: "Formulaire de contact" },
      titre: "Nouveau message de contact",
      sousTitre: safeSujet,
      corpsHtml: `${emailDetails([
        ["Nom", safeNom],
        ["Email", `<a href="mailto:${safeEmail}">${safeEmail}</a>`],
        ["Sujet", safeSujet],
      ])}
${emailEncadre("info", "Message", `<p style="margin:0">${safeMessage}</p>`)}
<p>Répondez directement à cet email pour écrire à ${safeNom}.</p>`,
    });

    await sendMail({ from: FROM, to: TO, replyTo: email, subject, html, text });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/contact]", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}
