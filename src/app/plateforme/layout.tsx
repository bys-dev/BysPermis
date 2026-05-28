import type { Metadata } from "next";
import PlateformeClientLayout from "./PlateformeClientLayout";
import { PLATFORM_SPACE_ROLES, requireSpaceAccess } from "@/lib/require-space-access";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default async function PlateformeLayout({ children }: { children: React.ReactNode }) {
  await requireSpaceAccess(PLATFORM_SPACE_ROLES, "/plateforme/dashboard");
  return <PlateformeClientLayout>{children}</PlateformeClientLayout>;
}
