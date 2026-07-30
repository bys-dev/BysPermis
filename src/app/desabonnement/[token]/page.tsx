import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DesabonnementClient from "./DesabonnementClient";

export const metadata: Metadata = {
  title: "Désinscription — BYS Permis",
  description: "Gérez la réception de nos emails de prospection.",
  // Page à usage strictement individuel : elle ne doit pas être indexée.
  robots: { index: false, follow: false },
};

export default async function DesabonnementPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <>
      <Header />
      <main>
        <DesabonnementClient token={token} />
      </main>
      <Footer />
    </>
  );
}
