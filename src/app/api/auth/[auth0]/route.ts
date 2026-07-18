import { NextRequest, NextResponse } from "next/server";

// ⚠️ Route legacy Auth0 v3. En v4 + Next 16, les routes d'auth sont montées
// par le proxy sur /auth/* (login, logout, callback…). Ce catch-all ne doit
// PLUS renvoyer auth0.middleware(req) : depuis un route handler, la réponse
// « next() » déclenche « NextResponse.next() was used in a app route handler ».
// On se contente de rediriger les anciennes URLs /api/auth/* vers /auth/*.

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const target = url.pathname.replace(/^\/api\/auth/, "/auth") + url.search;
  return NextResponse.redirect(new URL(target, url.origin), 308);
}

export const POST = GET;
