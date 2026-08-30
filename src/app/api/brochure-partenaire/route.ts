import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { BrochurePartenaire } from "@/components/pdf/BrochurePartenaire";

export async function GET() {
  const pdfBuffer = await renderToBuffer(createElement(BrochurePartenaire));

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="bys-permis-brochure-partenaire.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
