import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = { title: "Statistiques — BYS Admin" };

export default function AdminStatistiquesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Statistiques</h1>
        <p className="text-gray-400 text-sm mt-0.5">Analyses et rapports de la plateforme</p>
      </div>
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-12 text-center">
        <FontAwesomeIcon icon={faChartLine} className="text-4xl text-gray-600 mb-4" />
        <p className="text-gray-400 font-medium">Statistiques avancées</p>
        <p className="text-gray-600 text-sm mt-1">Graphiques et analyses détaillées — disponible prochainement</p>
      </div>
    </div>
  );
}
