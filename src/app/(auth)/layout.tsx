import type { Metadata } from "next";
import AuthClientLayout from "./AuthClientLayout";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthClientLayout>{children}</AuthClientLayout>;
}
