"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandshake, faAward, faLocationDot, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/lib/utils";

interface PendingLead {
  id: string;
  centreNom: string;
  ville: string;
  agrementNumber: string | null;
  contactEmail: string;
  statut: string;
  createdAt: string;
}

/** Bloc du dashboard admin : demandes « Devenir partenaire » en attente de décision. */
export default function PendingPartnerLeads() {
  const [leads, setLeads] = useState<PendingLead[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/partenaires", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) =>
        setLeads(
          ((d?.leads ?? []) as PendingLead[]).filter((l) => l.statut === "NOUVEAU" || l.statut === "EN_COURS"),
        ),
      )
      .catch(() => setLeads([]));
  }, []);

  return (
    <div className="bg-navy-900 rounded-xl border border-white/8 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2">
          <FontAwesomeIcon icon={faHandshake} className="text-blue-300 w-4 h-4" />
          Demandes partenaires à traiter
          {leads && leads.length > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold inline-flex items-center justify-center">
              {leads.length}
            </span>
          )}
        </h2>
        <Link href="/admin/partenaires" className="text-xs text-blue-300 hover:text-blue-200">
          Tout voir →
        </Link>
      </div>

      {leads === null ? (
        <p className="text-slate-300 text-sm py-4">Chargement...</p>
      ) : leads.length === 0 ? (
        <p className="text-slate-300 text-sm py-4 text-center">Aucune demande en attente.</p>
      ) : (
        <ul className="space-y-2">
          {leads.slice(0, 5).map((l) => (
            <li key={l.id}>
              <Link
                href={`/admin/partenaires?demande=${l.id}`}
                className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.04] border border-white/10 hover:border-blue-400/40 hover:bg-white/[0.07] px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{l.centreNom}</p>
                  <p className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faLocationDot} className="w-3 h-3 text-slate-400" />
                      {l.ville}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono">
                      <FontAwesomeIcon icon={faAward} className="w-3 h-3 text-slate-400" />
                      {l.agrementNumber ?? "agrément non renseigné"}
                    </span>
                    <span>Reçue le {formatDate(l.createdAt)}</span>
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200">
                  Accepter / refuser
                  <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
