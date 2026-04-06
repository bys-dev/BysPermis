"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faTrophy,
  faGift,
  faArrowUp,
  faSpinner,
  faTriangleExclamation,
  faCopy,
  faCheck,
  faShare,
  faUserPlus,
  faCoins,
  faCircleCheck,
  faCircleMinus,
  faInfoCircle,
  faTicket,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────

interface LoyaltyData {
  totalPoints: number;
  level: string;
  nextLevel: string | null;
  progressPercent: number;
  pointsToNextLevel: number;
  history: {
    id: string;
    points: number;
    type: "GAIN" | "DEPENSE";
    description: string;
    createdAt: string;
  }[];
}

interface ReferralData {
  referralCode: string;
  referralCount: number;
  totalReferralPoints: number;
  shareUrl: string;
}

// ─── Level config ─────────────────────────────────────────

const levelConfig: Record<string, { label: string; color: string; bgGradient: string; borderColor: string; iconColor: string; textColor: string }> = {
  BRONZE: {
    label: "Bronze",
    color: "#CD7F32",
    bgGradient: "linear-gradient(135deg, rgba(205,127,50,0.15) 0%, rgba(205,127,50,0.05) 100%)",
    borderColor: "rgba(205,127,50,0.3)",
    iconColor: "text-orange-400",
    textColor: "text-orange-300",
  },
  SILVER: {
    label: "Argent",
    color: "#C0C0C0",
    bgGradient: "linear-gradient(135deg, rgba(192,192,192,0.15) 0%, rgba(192,192,192,0.05) 100%)",
    borderColor: "rgba(192,192,192,0.3)",
    iconColor: "text-gray-300",
    textColor: "text-gray-300",
  },
  GOLD: {
    label: "Or",
    color: "#FFD700",
    bgGradient: "linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)",
    borderColor: "rgba(255,215,0,0.3)",
    iconColor: "text-yellow-400",
    textColor: "text-yellow-300",
  },
  PLATINUM: {
    label: "Platine",
    color: "#E5E4E2",
    bgGradient: "linear-gradient(135deg, rgba(229,228,226,0.2) 0%, rgba(59,130,246,0.1) 100%)",
    borderColor: "rgba(229,228,226,0.4)",
    iconColor: "text-blue-300",
    textColor: "text-blue-200",
  },
};

const rewards = [
  { points: 500, value: 50, label: "50 € de reduction" },
  { points: 1000, value: 100, label: "100 € de reduction" },
  { points: 2000, value: 200, label: "200 € de reduction" },
  { points: 5000, value: 500, label: "500 € de reduction" },
];

// ─── Main Page ────────────────────────────────────────────

export default function FidelitePage() {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [redeemingPoints, setRedeemingPoints] = useState<number | null>(null);
  const [redeemResult, setRedeemResult] = useState<{ code: string; reduction: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/loyalty").then((r) => {
        if (!r.ok) throw new Error("Erreur chargement fidelite");
        return r.json();
      }),
      fetch("/api/referral").then((r) => {
        if (!r.ok) throw new Error("Erreur chargement parrainage");
        return r.json();
      }),
    ])
      .then(([loyaltyData, referralData]) => {
        setLoyalty(loyaltyData);
        setReferral(referralData);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleRedeem(points: number) {
    if (!loyalty || loyalty.totalPoints < points) return;
    setRedeemingPoints(points);
    try {
      const res = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points, type: "PROMO_CODE" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erreur");
      }
      const data = await res.json();
      setRedeemResult({ code: data.code, reduction: data.reduction });
      // Update loyalty state
      setLoyalty((prev) =>
        prev
          ? {
              ...prev,
              totalPoints: data.newTotal,
              level: data.newLevel,
            }
          : prev
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setRedeemingPoints(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.15)" }}>
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-red-400 mb-3" />
        <p className="text-white font-medium mb-1">Erreur de chargement</p>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all">
          Reessayer
        </button>
      </div>
    );
  }

  if (!loyalty || !referral) return null;

  const lvl = levelConfig[loyalty.level] ?? levelConfig.BRONZE;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Programme de fidelite</h1>
        <p className="text-gray-500 text-sm">Gagnez des points a chaque reservation et echangez-les contre des reductions</p>
      </div>

      {/* Level Card */}
      <div
        className="rounded-2xl p-6 mb-6 border relative overflow-hidden"
        style={{ background: lvl.bgGradient, borderColor: lvl.borderColor }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Level icon */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${lvl.color}20`, border: `2px solid ${lvl.color}40` }}
          >
            <FontAwesomeIcon icon={faTrophy} className={`text-3xl ${lvl.iconColor}`} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${lvl.textColor}`}>
                Niveau {lvl.label}
              </span>
              <FontAwesomeIcon icon={faStar} className={`w-3 h-3 ${lvl.iconColor}`} />
            </div>
            <p className="text-3xl font-bold text-white mb-3">
              {loyalty.totalPoints.toLocaleString("fr-FR")} <span className="text-base font-normal text-gray-400">points</span>
            </p>

            {/* Progress bar */}
            {loyalty.nextLevel && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{lvl.label}</span>
                  <span>{levelConfig[loyalty.nextLevel]?.label ?? loyalty.nextLevel}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${loyalty.progressPercent}%`, background: lvl.color }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Encore <span className="text-white font-medium">{loyalty.pointsToNextLevel.toLocaleString("fr-FR")}</span> points pour atteindre le niveau {levelConfig[loyalty.nextLevel]?.label ?? loyalty.nextLevel}
                </p>
              </div>
            )}
            {!loyalty.nextLevel && (
              <p className="text-xs text-gray-400">Vous avez atteint le niveau maximum !</p>
            )}
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faGift} className="text-blue-400 w-4 h-4" />
          Recompenses disponibles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {rewards.map((r) => {
            const canRedeem = loyalty.totalPoints >= r.points;
            return (
              <div
                key={r.points}
                className={`rounded-xl p-4 border transition-all ${canRedeem ? "hover:border-blue-500/30" : "opacity-50"}`}
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/15 flex items-center justify-center">
                    <FontAwesomeIcon icon={faTicket} className="text-blue-400 text-sm" />
                  </div>
                  <span className="font-bold text-white text-lg">{r.value} EUR</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{r.points.toLocaleString("fr-FR")} points</p>
                <button
                  onClick={() => handleRedeem(r.points)}
                  disabled={!canRedeem || redeemingPoints === r.points}
                  className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                    canRedeem
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white/5 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {redeemingPoints === r.points ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  ) : canRedeem ? (
                    "Echanger"
                  ) : (
                    "Points insuffisants"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Redeem result modal */}
      {redeemResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-2xl border p-6" style={{ background: "#0D1D3A", borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-green-400/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-3xl" />
              </div>
              <h2 className="font-display font-bold text-lg text-white mb-2">Code promo genere !</h2>
              <p className="text-sm text-gray-400">Votre code promo de {redeemResult.reduction} EUR :</p>
            </div>

            <div
              className="flex items-center justify-between rounded-lg p-4 mb-5 border"
              style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
            >
              <span className="font-mono font-bold text-lg text-white tracking-wider">{redeemResult.code}</span>
              <button
                onClick={() => copyToClipboard(redeemResult.code)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mb-5">
              Valable 90 jours. Utilisez-le lors de votre prochaine reservation.
            </p>

            <button
              onClick={() => setRedeemResult(null)}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Referral Section */}
      <div
        className="rounded-xl p-6 mb-8 border"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <h2 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faUserPlus} className="text-green-400 w-4 h-4" />
          Parrainage
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Referral Code */}
          <div className="rounded-xl p-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
            <p className="text-xs text-gray-500 mb-2">Votre code parrain</p>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-white">{referral.referralCode ?? "---"}</span>
              {referral.referralCode && (
                <button
                  onClick={() => copyToClipboard(referral.referralCode)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl p-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
            <p className="text-xs text-gray-500 mb-2">Amis parraines</p>
            <span className="text-2xl font-bold text-white">{referral.referralCount}</span>
          </div>

          <div className="rounded-xl p-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
            <p className="text-xs text-gray-500 mb-2">Points gagnes (parrainage)</p>
            <span className="text-2xl font-bold text-white">{referral.totalReferralPoints}</span>
          </div>
        </div>

        {/* Share button */}
        {referral.referralCode && (
          <button
            onClick={() => copyToClipboard(referral.shareUrl)}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-green-700 transition-all"
          >
            <FontAwesomeIcon icon={copied ? faCheck : faShare} className="w-4 h-4" />
            {copied ? "Lien copie !" : "Partager mon lien de parrainage"}
          </button>
        )}

        <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <p className="text-xs text-blue-300">
            <FontAwesomeIcon icon={faInfoCircle} className="mr-1.5" />
            Parrainez un ami et recevez <span className="font-bold">200 points</span> lorsqu&apos;il effectue sa premiere reservation.
            Votre filleul recoit <span className="font-bold">100 points</span> de bienvenue !
          </p>
        </div>
      </div>

      {/* History */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faCoins} className="text-yellow-400 w-4 h-4" />
          Historique des points
        </h2>

        {loyalty.history.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl border"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <FontAwesomeIcon icon={faCoins} className="text-3xl text-gray-600 mb-3" />
            <p className="text-white font-medium mb-1">Aucun mouvement</p>
            <p className="text-gray-500 text-sm">Reservez un stage pour commencer a gagner des points.</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  <th className="text-left text-xs text-gray-500 font-medium uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-xs text-gray-500 font-medium uppercase tracking-wider px-4 py-3">Description</th>
                  <th className="text-right text-xs text-gray-500 font-medium uppercase tracking-wider px-4 py-3">Points</th>
                </tr>
              </thead>
              <tbody>
                {loyalty.history.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={item.type === "GAIN" ? faCircleCheck : faCircleMinus}
                          className={`w-3 h-3 ${item.type === "GAIN" ? "text-green-400" : "text-red-400"}`}
                        />
                        {item.description}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold text-right whitespace-nowrap ${
                      item.type === "GAIN" ? "text-green-400" : "text-red-400"
                    }`}>
                      {item.type === "GAIN" ? "+" : "-"}{item.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it works */}
      <div
        className="rounded-xl p-6 border"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <h2 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faInfoCircle} className="text-blue-400 w-4 h-4" />
          Comment ca marche ?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: faCoins,
              title: "Gagnez des points",
              desc: "1 EUR depense = 1 point gagne automatiquement a chaque reservation.",
              color: "text-yellow-400",
              bg: "bg-yellow-600/15",
            },
            {
              icon: faArrowUp,
              title: "Montez de niveau",
              desc: "Bronze (0), Argent (500), Or (1500), Platine (5000). Chaque niveau offre plus d'avantages.",
              color: "text-blue-400",
              bg: "bg-blue-600/15",
            },
            {
              icon: faGift,
              title: "Echangez vos points",
              desc: "Convertissez vos points en codes promo : 10 points = 1 EUR de reduction.",
              color: "text-green-400",
              bg: "bg-green-600/15",
            },
            {
              icon: faUserPlus,
              title: "Parrainez vos amis",
              desc: "Gagnez 200 points par filleul qui reserve, et offrez-lui 100 points de bienvenue.",
              color: "text-purple-400",
              bg: "bg-purple-600/15",
            },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mx-auto mb-3`}>
                <FontAwesomeIcon icon={item.icon} className={`${item.color} text-lg`} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
