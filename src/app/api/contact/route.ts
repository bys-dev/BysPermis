import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resend } from "@/lib/email";

const ContactSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  sujet: z.string().min(1, "Sujet requis"),
  message: z.string().min(10, "Message trop court"),
});

const FROM = process.env.EMAIL_FROM ?? "BYS Formations <noreply@bysformations.fr>";
const TO = "bysforma95@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const { nom, email, sujet, message } = parsed.data;

    await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `[Contact BYS] ${sujet} — ${nom}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1e3a5f">Nouveau message de contact</h2>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr>
              <td style="padding:8px 16px 8px 0;font-weight:bold;color:#374151;width:100px">Nom</td>
              <td style="padding:8px 0;color:#111827">${nom}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px 8px 0;font-weight:bold;color:#374151">Email</td>
              <td style="padding:8px 0;color:#111827"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 16px 8px 0;font-weight:bold;color:#374151">Sujet</td>
              <td style="padding:8px 0;color:#111827">${sujet}</td>
            </tr>
          </table>
          <h3 style="color:#374151">Message</h3>
          <div style="background:#f9fafb;border-left:4px solid #3b82f6;padding:16px;border-radius:4px;color:#111827;line-height:1.6">
            ${message.replace(/\n/g, "<br/>")}
          </div>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">
            Envoyé depuis le formulaire de contact BYS Formations
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/contact]", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}
