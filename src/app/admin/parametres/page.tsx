import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faPercent, faEnvelope, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = { title: "Paramètres — BYS Admin" };

const settings = [
  { label: "Taux de commission", value: "10%", icon: faPercent, desc: "Commission perçue sur chaque réservation", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-500/20" },
  { label: "Email plateforme", value: "bysforma95@gmail.com", icon: faEnvelope, desc: "Email utilisé pour les notifications", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/20" },
  { label: "Mode maintenance", value: "Désactivé", icon: faShieldHalved, desc: "Passer la plateforme en maintenance", color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-500/20" },
];

export default function AdminParametresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400 text-sm mt-0.5">Configuration globale de la plateforme</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {settings.map((s) => (
          <div key={s.label} className={`bg-[#0A1628] rounded-xl border p-5 ${s.border}`}>
            <div className={`w-10 h-10 rounded-lg ${s.bg} border ${s.border} flex items-center justify-center mb-4`}>
              <FontAwesomeIcon icon={s.icon} className={`${s.color} text-sm`} />
            </div>
            <p className="text-white font-semibold">{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            <p className="text-gray-600 text-[11px] mt-2">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#0A1628] rounded-xl border border-white/8 p-6 text-center">
        <FontAwesomeIcon icon={faCog} className="text-3xl text-gray-600 mb-3" />
        <p className="text-gray-400 font-medium">Paramètres avancés — disponible prochainement</p>
      </div>
    </div>
  );
}
