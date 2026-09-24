import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mapAuthError, requireAdmin } from "@/lib/auth0";
import { sendCentreInvitationEmail } from "@/lib/email";
import { CentreAccountError, createCentreOwnerAccount } from "@/lib/centre-account";

const bodySchema = z.object({
  agrementNumber: z.string().trim().min(5).max(40).optional(),
  agrementDepartement: z.string().trim().max(3).optional(),
});

// POST /api/admin/partenaires/[id]/accept
// Accepte la demande : crée le compte CENTRE_OWNER à l'email fourni par le centre,
// crée le centre (EN_ATTENTE) avec son agrément, puis lui envoie ses accès.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const overrides = bodySchema.parse((await req.json().catch(() => null)) ?? {});

    const lead = await prisma.partnerLead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    if (lead.statut === "COMPTE_CREE" || lead.centreId) {
      return NextResponse.json({ error: "Cette demande a déjà été acceptée." }, { status: 409 });
    }

    // Verrou : empêche deux acceptations simultanées de créer deux comptes.
    // On mémorise le statut d'origine pour le restaurer en cas d'échec.
    const claimed = await prisma.partnerLead.updateMany({
      where: { id, statut: lead.statut, centreId: null, updatedAt: lead.updatedAt },
      data: { statut: "EN_COURS", traiteParId: admin.id },
    });
    if (claimed.count === 0) {
      return NextResponse.json({ error: "Demande déjà en cours de traitement." }, { status: 409 });
    }

    const agrementNumber = overrides.agrementNumber?.toUpperCase() ?? lead.agrementNumber;
    const agrementDepartement = overrides.agrementDepartement?.toUpperCase() ?? lead.agrementDepartement;

    let account;
    try {
      account = await createCentreOwnerAccount({
        email: lead.contactEmail,
        ownerNom: lead.contactNom,
        ownerPrenom: lead.contactPrenom,
        ownerTelephone: lead.contactTelephone ?? lead.telephone,
        centre: {
          nom: lead.centreNom,
          adresse: lead.adresse,
          codePostal: lead.codePostal,
          ville: lead.ville,
          telephone: lead.telephone,
          email: lead.email,
          siteWeb: lead.siteWeb,
          siret: lead.siret,
          raisonSociale: lead.raisonSociale,
          agrementNumber,
          agrementDepartement,
          nomResponsable: [lead.contactPrenom, lead.contactNom].filter(Boolean).join(" "),
          representantFonction: lead.contactFonction,
        },
        welcomeMessage:
          "Votre demande de partenariat a été acceptée ! Complétez le profil de votre centre puis demandez sa mise en ligne.",
      });
    } catch (err) {
      await prisma.partnerLead.update({ where: { id }, data: { statut: lead.statut } });
      throw err;
    }

    await prisma.partnerLead.update({
      where: { id },
      data: {
        statut: "COMPTE_CREE",
        centreId: account.centreId,
        traiteParId: admin.id,
        traiteAt: new Date(),
        motifRefus: null,
        agrementNumber,
        agrementDepartement,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    let emailSent = true;
    try {
      await sendCentreInvitationEmail({
        to: lead.contactEmail,
        centreName: lead.centreNom,
        loginUrl: `${appUrl}/connexion`,
        tempPassword: account.tempPassword ?? undefined,
      });
    } catch (emailErr) {
      emailSent = false;
      console.error("[accept partenaire] email d'accès non envoyé:", emailErr);
    }

    return NextResponse.json({
      success: true,
      emailSent,
      reusedExistingAccount: account.reusedExistingAccount,
      centre: { id: account.centreId, slug: account.centreSlug },
      message: emailSent
        ? `Compte propriétaire créé pour ${lead.contactEmail}. Les accès lui ont été envoyés.`
        : `Compte créé pour ${lead.contactEmail}, mais l'email d'accès n'a pas pu être envoyé.`,
    });
  } catch (err) {
    if (err instanceof CentreAccountError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "EMAIL_HAS_CENTRE" ? 409 : 502 },
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Numéro d'agrément invalide." }, { status: 400 });
    }
    const authResponse = mapAuthError(err);
    if (authResponse) return authResponse;
    console.error("[POST /api/admin/partenaires/[id]/accept]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
