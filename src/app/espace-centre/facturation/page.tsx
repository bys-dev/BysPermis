"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEuro,
  faSpinner,
  faCrown,
  faCalendarDays,
  faReceipt,
  faFileExport,
  faCircleCheck,
  faCircleExclamation,
  faClock,
  faArrowUpRightFromSquare,
  faXmark,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { formatPrice, formatDate } from "@/lib/utils";

interface Payment {
  id: string;
  type: string;
  montant: number;
  description: string;
  stripeId: string | null;
  status: string;
  periode: string | null;
  createdAt: string;
}

interface PaymentData {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totaux: {
    paye: number;
    enAttente: number;
  };
}

interface SubscriptionInfo {
  plan: {
    id: string;
    nom: string;
    prix: number;
    features: string[];
    commissionRate: number;
  } | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PAYE: { label: "Paye", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
  EN_ATTENTE: { label: "En attente", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  ECHOUE: { label: "Echoue", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
};

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  COMMISSION: { label: "Commission", color: "text-blue-400", bg: "bg-blue-400/10" },
  ABONNEMENT: { label: "Abonnement", color: "text-purple-400", bg: "bg-purple-400/10" },
  REMBOURSEMENT: { label: "Remboursement", color: "text-orange-400", bg: "bg-orange-400/10" },
};

const SUB_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Actif", color: "text-green-400" },
  PAST_DUE: { label: "Paiement en retard", color: "text-orange-400" },
  ANNULEE: { label: "Annule", color: "text-red-400" },
  TRIALING: { label: "Periode d'essai", color: "text-blue-400" },
};

type TabKey = "overview" | "history" | "subscription";

export default function FacturationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/centre/payments?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetch("/api/stripe/subscription")
      .then((r) => r.json())
      .then((d: SubscriptionInfo) => {
        if (d && !("error" in d)) setSubscription(d);
      })
      .catch(() => null)
      .finally(() => setLoadingSub(false));
  }, []);

  async function handleOpenPortal() {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
    } catch {
      // silently fail
    }
    setOpeningPortal(false);
  }

  async function handleCancelSubscription() {
    if (!confirm("Etes-vous sur de vouloir annuler votre abonnement ? Il restera actif jusqu'a la fin de la periode en cours.")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/stripe/subscription", { method: "PUT" });
      if (res.ok) {
        const d = await res.json();
        setSubscription((prev) =>
          prev ? { ...prev, cancelAtPeriodEnd: d.cancelAtPeriodEnd, currentPeriodEnd: d.currentPeriodEnd } : prev
        );
      }
    } catch {
      // silently fail
    }
    setCancelling(false);
  }

  function exportCSV() {
    if (!data?.payments.length) return;
    const lines = ["Date,Type,Description,Montant (EUR),Statut"];
    for (const p of data.payments) {
      lines.push(`${formatDate(p.createdAt, "short")},${p.type},"${p.description}",${p.montant.toFixed(2)},${p.status}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `facturation-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Vue d'ensemble" },
    { key: "history", label: "Historique" },
    { key: "subscription", label: "Abonnement" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-white mb-1">Facturation</h1>
        <p className="text-gray-500 text-sm">Suivi de vos paiements, commissions et abonnement</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab data={data} loading={loading} subscription={subscription} loadingSub={loadingSub} />
      )}
      {activeTab === "history" && (
        <HistoryTab
          data={data}
          loading={loading}
          typeFilter={typeFilter}
          setTypeFilter={(v) => { setTypeFilter(v); setPage(1); }}
          page={page}
          setPage={setPage}
          onExport={exportCSV}
        />
      )}
      {activeTab === "subscription" && (
        <SubscriptionTab
          subscription={subscription}
          loadingSub={loadingSub}
          openingPortal={openingPortal}
          cancelling={cancelling}
          onOpenPortal={handleOpenPortal}
          onCancel={handleCancelSubscription}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────
function OverviewTab({
  data,
  loading,
  subscription,
  loadingSub,
}: {
  data: PaymentData | null;
  loading: boolean;
  subscription: SubscriptionInfo | null;
  loadingSub: boolean;
}) {
  const kpis = [
    {
      label: "Commissions payees",
      value: loading ? "..." : formatPrice(data?.totaux.paye ?? 0),
      sub: "Total des commissions reglees",
      icon: faEuro,
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "border-green-500/20",
    },
    {
      label: "Abonnement actuel",
      value: loadingSub ? "..." : subscription?.plan ? `${subscription.plan.nom} — ${subscription.plan.prix}\u20AC/mois` : "Aucun",
      sub: subscription?.plan ? `Commission ${subscription.plan.commissionRate}%` : "Commission standard 10%",
      icon: faCrown,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-500/20",
    },
    {
      label: "En attente",
      value: loading ? "..." : formatPrice(data?.totaux.enAttente ?? 0),
      sub: "Commissions a regler",
      icon: faClock,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      border: "border-orange-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-xl p-5 border bg-[#0A1628] ${k.border}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${k.bg} border ${k.border} flex items-center justify-center`}>
                <FontAwesomeIcon icon={k.icon} className={`${k.color} text-sm`} />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            <p className="text-[11px] text-gray-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Subscription info */}
      {subscription?.plan && (
        <div className="rounded-xl p-5 border border-white/8 bg-[#0A1628]">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faCrown} className="text-purple-400 w-4 h-4" />
            Abonnement en cours
          </h3>
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <div>
              <p className="text-sm font-semibold text-white">Plan {subscription.plan.nom}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {subscription.plan.prix}&euro;/mois &middot; Commission {subscription.plan.commissionRate}%
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-semibold ${SUB_STATUS_LABELS[subscription.status || ""]?.color || "text-gray-400"}`}>
                {SUB_STATUS_LABELS[subscription.status || ""]?.label || subscription.status || "Inconnu"}
              </span>
              {subscription.currentPeriodEnd && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {subscription.cancelAtPeriodEnd ? "Fin le " : "Renouvellement le "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent payments */}
      <div className="rounded-xl p-5 border border-white/8 bg-[#0A1628]">
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faReceipt} className="text-blue-400 w-4 h-4" />
          Derniers paiements
        </h3>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : !data?.payments.length ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faReceipt} className="text-gray-700 text-2xl mb-3" />
            <p className="text-gray-500 text-sm">Aucun paiement enregistre</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.payments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/3 transition-colors" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_LABELS[p.type]?.bg ?? "bg-gray-400/10"} ${TYPE_LABELS[p.type]?.color ?? "text-gray-400"}`}>
                    {TYPE_LABELS[p.type]?.label ?? p.type}
                  </span>
                  <div>
                    <p className="text-sm text-white">{p.description}</p>
                    <p className="text-[11px] text-gray-500">{formatDate(p.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatPrice(p.montant)}</p>
                  <span className={`text-[11px] font-medium ${STATUS_LABELS[p.status]?.color ?? "text-gray-400"}`}>
                    {STATUS_LABELS[p.status]?.label ?? p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────
function HistoryTab({
  data,
  loading,
  typeFilter,
  setTypeFilter,
  page,
  setPage,
  onExport,
}: {
  data: PaymentData | null;
  loading: boolean;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  page: number;
  setPage: (v: number) => void;
  onExport: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faFilter} className="text-gray-500 w-3 h-3" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <option value="">Tous les types</option>
            <option value="COMMISSION">Commissions</option>
            <option value="ABONNEMENT">Abonnements</option>
            <option value="REMBOURSEMENT">Remboursements</option>
          </select>
        </div>
        <button
          onClick={onExport}
          disabled={!data?.payments.length}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/15 text-blue-400 text-sm font-medium border border-blue-500/20 hover:bg-blue-600/25 transition-colors disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faFileExport} className="text-xs" />
          Exporter CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 bg-[#0A1628] overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-12 justify-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : !data?.payments.length ? (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faReceipt} className="text-gray-700 text-2xl mb-3" />
            <p className="text-gray-500 text-sm">Aucun paiement trouve</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/8">
                  <th className="text-gray-500 font-medium text-xs px-4 py-3">Date</th>
                  <th className="text-gray-500 font-medium text-xs px-4 py-3">Type</th>
                  <th className="text-gray-500 font-medium text-xs px-4 py-3">Description</th>
                  <th className="text-gray-500 font-medium text-xs px-4 py-3 text-right">Montant</th>
                  <th className="text-gray-500 font-medium text-xs px-4 py-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(p.createdAt, "short")}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_LABELS[p.type]?.bg ?? "bg-gray-400/10"} ${TYPE_LABELS[p.type]?.color ?? "text-gray-400"}`}>
                        {TYPE_LABELS[p.type]?.label ?? p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{p.description}</td>
                    <td className="px-4 py-3 text-white font-semibold text-right">{formatPrice(p.montant)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[p.status]?.bg ?? "bg-gray-400/10"} ${STATUS_LABELS[p.status]?.color ?? "text-gray-400"} ${STATUS_LABELS[p.status]?.border ?? ""}`}>
                        {STATUS_LABELS[p.status]?.label ?? p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
            <p className="text-xs text-gray-500">
              Page {data.page} sur {data.totalPages} ({data.total} resultats)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
              >
                Precedent
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= (data?.totalPages ?? 1)}
                className="px-3 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Subscription Tab ──────────────────────────────────────────
function SubscriptionTab({
  subscription,
  loadingSub,
  openingPortal,
  cancelling,
  onOpenPortal,
  onCancel,
}: {
  subscription: SubscriptionInfo | null;
  loadingSub: boolean;
  openingPortal: boolean;
  cancelling: boolean;
  onOpenPortal: () => void;
  onCancel: () => void;
}) {
  if (loadingSub) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm py-12 justify-center">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
        <span>Chargement...</span>
      </div>
    );
  }

  if (!subscription?.plan) {
    return (
      <div className="rounded-xl p-6 border border-white/8 bg-[#0A1628]">
        <div className="text-center py-8">
          <FontAwesomeIcon icon={faCrown} className="text-gray-600 text-3xl mb-4" />
          <h3 className="text-white font-semibold mb-2">Aucun abonnement actif</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Souscrivez un abonnement pour beneficier de commissions reduites et referencer votre centre sur la marketplace.
          </p>
          <Link
            href="/tarifs-partenaires"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          >
            <FontAwesomeIcon icon={faCrown} className="w-3.5 h-3.5" />
            Voir les plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan details */}
      <div className="rounded-xl p-6 border border-white/8 bg-[#0A1628]">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
          <FontAwesomeIcon icon={faCrown} className="text-purple-400 w-4 h-4" />
          Votre plan
        </h3>

        <div className="flex items-center justify-between p-4 rounded-lg mb-5" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <div>
            <p className="text-lg font-bold text-white">Plan {subscription.plan.nom}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              {subscription.plan.prix}&euro;/mois &middot; Commission {subscription.plan.commissionRate}%
            </p>
          </div>
          <div className="text-right">
            <span className={`text-sm font-semibold ${SUB_STATUS_LABELS[subscription.status || ""]?.color || "text-gray-400"}`}>
              {SUB_STATUS_LABELS[subscription.status || ""]?.label || subscription.status || "Inconnu"}
            </span>
          </div>
        </div>

        {/* Features */}
        {subscription.plan.features.length > 0 && (
          <div className="space-y-2 mb-5">
            {subscription.plan.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 w-3.5 h-3.5" />
                {f}
              </div>
            ))}
          </div>
        )}

        {/* Billing date */}
        {subscription.currentPeriodEnd && (
          <div className="flex items-center gap-3 text-sm text-gray-400 mb-5 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <FontAwesomeIcon icon={faCalendarDays} className="w-3.5 h-3.5" />
            <span>
              {subscription.cancelAtPeriodEnd ? "Fin de l'abonnement le " : "Prochain renouvellement le "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="flex items-start gap-3 p-4 rounded-lg mb-5" style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)" }}>
            <FontAwesomeIcon icon={faCircleExclamation} className="text-orange-400 w-4 h-4 mt-0.5" />
            <p className="text-xs text-orange-300">
              Votre abonnement est programme pour etre annule. Il restera actif jusqu&apos;a la fin de la periode en cours.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <button
            onClick={onOpenPortal}
            disabled={openingPortal}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 mt-4"
          >
            {openingPortal ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3.5 h-3.5" />
            ) : (
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
            )}
            Gerer mon abonnement
          </button>

          <Link
            href="/tarifs-partenaires"
            className="bg-transparent border text-gray-300 hover:text-white hover:border-gray-500 px-4 py-2 rounded-lg text-sm font-semibold transition-all mt-4"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          >
            Changer de plan
          </Link>

          {!subscription.cancelAtPeriodEnd && (
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="text-red-400 hover:text-red-300 px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 mt-4"
            >
              {cancelling ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />
              ) : (
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              )}
              Annuler l&apos;abonnement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
