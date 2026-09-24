import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { notifyOwnersNewPartnerLead } from "@/lib/event-notifications";

const volumeLabels: Record<string, string> = {
  "1-4": "1 à 4 stages / mois",
  "5-10": "5 à 10 stages / mois",
  "10+": "Plus de 10 stages / mois",
  ne_sait_pas: "Ne sait pas encore",
};

/** N° d'agrément préfectoral CSSR, ex. « R 13 095 0001 0 » ou « R1309500010 ». */
const AGREMENT_REGEX = /^[A-Z0-9][A-Z0-9 ./-]{4,39}$/;

const PartnerLeadSchema = z.object({
  centre: z.string().trim().min(1, "Nom du centre requis").max(200),
  contact: z.string().trim().min(1, "Nom du contact requis").max(150),
  email: z.string().trim().toLowerCase().email("Email invalide").max(200),
  telephone: z.string().trim().min(6, "Téléphone requis").max(30),
  ville: z.string().trim().min(1, "Ville / département requis").max(120),
  agrement: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase().replace(/\s+/g, " "))
    .refine((v) => AGREMENT_REGEX.test(v), "Numéro d'agrément invalide"),
  agrementDepartement: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^(\d{2,3}|2A|2B)?$/, "Département invalide")
    .optional()
    .default(""),
  volume: z.string().optional().default(""),
  message: z.string().max(3000).optional().default(""),
  consent: z.boolean().refine((v) => v === true, { message: "Consentement requis" }),
});

/** « Osny (95) » → { ville: "Osny", dep: "95" } */
function splitVille(raw: string): { ville: string; dep: string | null } {
  const m = raw.match(/^(.*?)\s*\(\s*(\d{2,3}|2A|2B)\s*\)\s*$/i);
  return m ? { ville: m[1].trim() || raw, dep: m[2].toUpperCase() } : { ville: raw, dep: null };
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, { max: 5, windowMs: 60 * 1000, keyPrefix: "partenaires" });
    if (limited) return limited;

    const parsed = PartnerLeadSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const { ville, dep } = splitVille(d.ville);

    const lead = await prisma.partnerLead.create({
      data: {
        centreNom: d.centre,
        agrementNumber: d.agrement,
        agrementDepartement: d.agrementDepartement || dep,
        ville,
        telephone: d.telephone,
        email: d.email,
        contactNom: d.contact,
        contactEmail: d.email,
        contactTelephone: d.telephone,
        volumeMensuel: d.volume || null,
        message: d.message.trim() || null,
        consentIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        source: "devenir-partenaire",
      },
    });

    // La demande est enregistrée : un échec d'email ne doit pas la faire échouer
    // (elle reste visible dans /admin/partenaires).
    try {
      await notifyOwnersNewPartnerLead({
        id: lead.id,
        centreNom: lead.centreNom,
        contactNom: lead.contactNom,
        contactEmail: lead.contactEmail,
        telephone: lead.telephone,
        ville: d.ville,
        agrementNumber: lead.agrementNumber,
        agrementDepartement: lead.agrementDepartement,
        volumeMensuel: d.volume ? (volumeLabels[d.volume] ?? d.volume) : null,
        message: lead.message,
      });
    } catch (notifyErr) {
      console.error("[POST /api/partenaires] notification owner:", notifyErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/partenaires]", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}
