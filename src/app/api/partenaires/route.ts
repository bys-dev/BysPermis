import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendMail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/utils";

const volumeLabels: Record<string, string> = {
  "1-4": "1 à 4 stages / mois",
  "5-10": "5 à 10 stages / mois",
  "10+": "Plus de 10 stages / mois",
  ne_sait_pas: "Ne sait pas encore",
};

const PartnerLeadSchema = z.object({
  centre: z.string().min(1, "Nom du centre requis"),
  contact: z.string().min(1, "Nom du contact requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(6, "Téléphone requis"),
  ville: z.string().min(1, "Ville / département requis"),
  volume: z.string().optional().default(""),
  message: z.string().optional().default(""),
  consent: z.boolean().refine((v) => v === true, {
    message: "Consentement requis",
  }),
});

const FROM = process.env.EMAIL_FROM ?? "BYS Formations <noreply@byspermis.fr>";
const TO = "contact@byspermis.fr";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, {
      max: 5,
      windowMs: 60 * 1000,
      keyPrefix: "partenaires",
    });
    if (limited) return limited;

    const body = await req.json();
    const parsed = PartnerLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { centre, contact, email, telephone, ville, volume, message } = parsed.data;

    // Escape all user inputs avant injection HTML (XSS prevention)
    const safeCentre = escapeHtml(centre);
    const safeContact = escapeHtml(contact);
    const safeEmail = escapeHtml(email);
    const safeTel = escapeHtml(telephone);
    const safeVille = escapeHtml(ville);
    const safeVolume = escapeHtml(volumeLabels[volume] ?? volume ?? "—");
    const safeMessage = message
      ? escapeHtml(message).replace(/\n/g, "<br/>")
      : "<em style='color:#9ca3af'>Aucun message</em>";

    const row = (label: string, value: string) => `
      <tr>
        <td style="padding:8px 16px 8px 0;font-weight:bold;color:#374151;width:140px;vertical-align:top">${label}</td>
        <td style="padding:8px 0;color:#111827">${value}</td>
      </tr>`;

    await sendMail({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `[Partenaire BYS] Nouvelle demande — ${centre}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1e3a5f">Nouvelle demande de partenariat centre</h2>
          <p style="color:#6b7280;font-size:14px">
            Un centre agréé souhaite rejoindre la plateforme BYS Formation.
          </p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            ${row("Centre", safeCentre)}
            ${row("Contact", safeContact)}
            ${row("Email", `<a href="mailto:${safeEmail}">${safeEmail}</a>`)}
            ${row("Téléphone", `<a href="tel:${safeTel.replace(/\s/g, "")}">${safeTel}</a>`)}
            ${row("Ville / dép.", safeVille)}
            ${row("Volume estimé", safeVolume)}
          </table>
          <h3 style="color:#374151">Message</h3>
          <div style="background:#f9fafb;border-left:4px solid #3b82f6;padding:16px;border-radius:4px;color:#111827;line-height:1.6">
            ${safeMessage}
          </div>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">
            Envoyé depuis la page « Devenir partenaire » — BYS Formation
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/partenaires]", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}
