import type { Metadata } from "next";
import EspaceCentreClientLayout from "./EspaceCentreClientLayout";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function EspaceCentreLayout({ children }: { children: React.ReactNode }) {
  return <EspaceCentreClientLayout>{children}</EspaceCentreClientLayout>;
}
