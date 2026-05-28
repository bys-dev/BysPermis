import type { Metadata } from "next";
import PlateformeClientLayout from "./PlateformeClientLayout";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function PlateformeLayout({ children }: { children: React.ReactNode }) {
  return <PlateformeClientLayout>{children}</PlateformeClientLayout>;
}
