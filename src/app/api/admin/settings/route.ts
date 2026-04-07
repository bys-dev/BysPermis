import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin, requireOwner } from "@/lib/auth0";

// GET /api/admin/settings — Return current platform settings
export async function GET() {
  try {
    await requireAdmin();

    let settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          id: "default",
          commissionRate: 10,
          monetisationModel: "COMMISSION",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/admin/settings — Update platform settings
const putSchema = z.object({
  commissionRate: z.number().min(0).max(100).optional(),
  monetisationModel: z.enum(["COMMISSION", "ABONNEMENT", "HYBRIDE"]).optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const data = putSchema.parse(body);

    // Commission rate and monetisation model changes require OWNER role
    if (data.commissionRate !== undefined || data.monetisationModel !== undefined || data.maintenanceMode !== undefined) {
      await requireOwner();
    } else {
      await requireAdmin();
    }

    const updateData: Record<string, unknown> = {};
    if (data.commissionRate !== undefined) updateData.commissionRate = data.commissionRate;
    if (data.monetisationModel !== undefined) updateData.monetisationModel = data.monetisationModel;
    if (data.maintenanceMode !== undefined) updateData.maintenanceMode = data.maintenanceMode;
    if (data.maintenanceMessage !== undefined) updateData.maintenanceMessage = data.maintenanceMessage;

    const settings = await prisma.platformSettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        commissionRate: data.commissionRate ?? 10,
        monetisationModel: data.monetisationModel ?? "COMMISSION",
        maintenanceMode: data.maintenanceMode ?? false,
        maintenanceMessage: data.maintenanceMessage ?? null,
      },
    });

    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
