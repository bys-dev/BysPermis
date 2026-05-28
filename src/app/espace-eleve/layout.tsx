import type { Metadata } from "next";
import EspaceEleveClientLayout from "./EspaceEleveClientLayout";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function EspaceEleveLayout({ children }: { children: React.ReactNode }) {
  return <EspaceEleveClientLayout>{children}</EspaceEleveClientLayout>;
}
