import type { Metadata } from "next";
import EspaceCentreClientLayout from "./EspaceCentreClientLayout";
import { CENTRE_SPACE_ROLES, requireSpaceAccess } from "@/lib/require-space-access";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default async function EspaceCentreLayout({ children }: { children: React.ReactNode }) {
  await requireSpaceAccess(CENTRE_SPACE_ROLES, "/espace-centre/dashboard");
  return <EspaceCentreClientLayout>{children}</EspaceCentreClientLayout>;
}
