"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScrewdriverWrench, faCrown } from "@fortawesome/free-solid-svg-icons";

export default function AdminConfigurationPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <FontAwesomeIcon icon={faScrewdriverWrench} className="text-yellow-400 text-xl" />
          <h1 className="text-2xl font-bold text-white">Configuration avancee</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Parametres avances reserves au Owner de la plateforme.
        </p>
      </div>

      <div className="bg-[#0A1628] rounded-xl border border-yellow-500/20 p-12 text-center">
        <FontAwesomeIcon icon={faCrown} className="text-4xl text-yellow-500/40 mb-4" />
        <p className="text-gray-400 font-medium">Configuration avancee</p>
        <p className="text-gray-600 text-sm mt-1">
          Webhooks, integrations tierces, exports de donnees et parametres systeme — disponible prochainement
        </p>
      </div>
    </div>
  );
}
