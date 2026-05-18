import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let db: "ok" | "down" = "ok";
  let dbLatencyMs: number | null = null;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
  } catch {
    db = "down";
  }

  const status = db === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status: db === "ok" ? "healthy" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        db,
        dbLatencyMs,
      },
      durationMs: Date.now() - startedAt,
    },
    { status },
  );
}
