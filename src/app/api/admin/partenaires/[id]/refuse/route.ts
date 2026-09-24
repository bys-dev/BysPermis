import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mapAuthError, requireAdmin } from "@/lib/auth0";
import { sendPartnerLeadRefusedEmail } from "@/lib/event-notifications";

const bodySchema = z.object({
  motif: z.string().trim().min(3, "Motif requis").max(2000),
  notifyCentre: z.boolean().optional().default(true),
});

// POST /api/admin/partenaires/[id]/refuse — refuse la demande avec un motif
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Indiquez le motif du refus." }, { status: 400 });
    }

    const lead = await prisma.partnerLead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    if (lead.statut === "COMPTE_CREE" || lead.centreId) {
      return NextResponse.json(
        { error: "Le compte de ce centre a déjà été créé : gérez-le depuis la page Centres." },
        { status: 409 },
      );
    }

    await prisma.partnerLead.update({
      where: { id },
      data: {
        statut: "REFUSE",
        motifRefus: parsed.data.motif,
        traiteParId: admin.id,
        traiteAt: new Date(),
      },
    });

    let emailSent = false;
    if (parsed.data.notifyCentre) {
      try {
        await sendPartnerLeadRefusedEmail({
          to: lead.contactEmail,
          centreNom: lead.centreNom,
          motif: parsed.data.motif,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error("[refuse partenaire] email non envoyé:", emailErr);
      }
    }

    return NextResponse.json({ success: true, emailSent });
  } catch (err) {
    const authResponse = mapAuthError(err);
    if (authResponse) return authResponse;
    console.error("[POST /api/admin/partenaires/[id]/refuse]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
