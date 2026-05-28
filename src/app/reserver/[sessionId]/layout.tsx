import type { Metadata } from "next";
import ReserverClientLayout from "./ReserverClientLayout";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function ReserverLayout({ children }: { children: React.ReactNode }) {
  return <ReserverClientLayout>{children}</ReserverClientLayout>;
}
