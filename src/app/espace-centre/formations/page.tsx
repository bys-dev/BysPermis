"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGraduationCap, faPlus, faPen, faToggleOn, faToggleOff, faEuroSign, faClock, faAward, faSpinner } from "@fortawesome/free-solid-svg-icons";

interface Formation {
  id: string;
  titre: string;
  prix: number;
  duree: string;
  isQualiopi: boolean;
  isCPF: boolean;
  isActive: boolean;
  _count?: { sessions: number };
}

const MOCK: Formation[] = [
  { id: "f1", titre: "Stage de récupération de points",    prix: 230, duree: "2 jours", isQualiopi: true,  isCPF: false, isActive: true,  _count: { sessions: 4 } },
  { id: "f2", titre: "Sensibilisation à la sécurité routière", prix: 180, duree: "1 jour",  isQualiopi: true,  isCPF: false, isActive: true,  _count: { sessions: 2 } },
  { id: "f3", titre: "Permis B accéléré — Code de la route",   prix: 750, duree: "5 jours", isQualiopi: false, isCPF: true,  isActive: false, _count: { sessions: 0 } },
];

export default function FormationsCentrePage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/formations?mine=1")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setFormations(data);
        else setFormations(MOCK);
      })
      .catch(() => setFormations(MOCK))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/formations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    }).catch(() => null);
    if (res?.ok) {
      setFormations((prev) => prev.map((f) => f.id === id ? { ...f, isActive: !current } : f));
    }
  }

  const actives = formations.filter((f) => f.isActive).length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">Mes formations</h1>
          <p className="text-gray-500 text-sm">
            {loading ? "Chargement…" : `${actives} formation${actives > 1 ? "s" : ""} active${actives > 1 ? "s" : ""}`}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all">
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          Nouvelle formation
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {formations.map((f) => (
            <div key={f.id} className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", opacity: f.isActive ? 1 : 0.6 }}>
              <div className="w-12 h-12 rounded-xl bg-blue-600/15 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faGraduationCap} className="text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-semibold text-white text-sm">{f.titre}</h3>
                  {f.isQualiopi && (
                    <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FontAwesomeIcon icon={faAward} className="w-3 h-3" />Qualiopi
                    </span>
                  )}
                  {f.isCPF && (
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">CPF</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.isActive ? "text-green-400 bg-green-400/10" : "text-gray-500 bg-gray-500/10"}`}>
                    {f.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faEuroSign} className="w-3 h-3" />
                    {f.prix} €
                  </span>
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                    {f.duree}
                  </span>
                  <span>{f._count?.sessions ?? 0} sessions</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
                  Modifier
                </button>
                <button
                  onClick={() => toggleActive(f.id, f.isActive)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${f.isActive ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300"}`}
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <FontAwesomeIcon icon={f.isActive ? faToggleOn : faToggleOff} className="w-3.5 h-3.5" />
                  {f.isActive ? "Désactiver" : "Activer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
