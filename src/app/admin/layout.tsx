import type { Metadata } from "next";
import AdminClientLayout from "./AdminClientLayout";
import { ADMIN_SPACE_ROLES, requireSpaceAccess } from "@/lib/require-space-access";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSpaceAccess(ADMIN_SPACE_ROLES, "/admin/dashboard");
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
