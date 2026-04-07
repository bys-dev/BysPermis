"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faSpinner,
  faCheck,
  faTriangleExclamation,
  faArrowRightFromBracket,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Fetch user email on mount
  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.email) setEmail(data.email);
      })
      .catch(() => null);
  }, []);

  async function resendVerification() {
    setSending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      if (res.ok) {
        setMessage({ type: "success", text: "Email de verification envoye avec succes !" });
      } else {
        const data = await res.json().catch(() => null);
        setMessage({ type: "error", text: data?.error ?? "Erreur lors de l'envoi." });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion." });
    }

    setSending(false);
    setTimeout(() => setMessage(null), 5000);
  }

  async function checkVerification() {
    setChecking(true);
    setMessage(null);

    // Force session refresh by navigating to dashboard (getCurrentUser re-syncs emailVerified)
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A1628" }}>
      <div className="w-full max-w-md text-center">
        {/* Envelope icon */}
        <div className="w-20 h-20 rounded-full bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
          <FontAwesomeIcon icon={faEnvelope} className="text-blue-400 text-3xl" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">Verifiez votre email</h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Un email de verification a ete envoye a{" "}
          <span className="text-blue-400 font-medium">{email ?? "votre adresse"}</span>.
          <br />
          Cliquez sur le lien dans l&apos;email pour activer votre compte.
        </p>

        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm flex items-center justify-center gap-2 mb-6 ${
              message.type === "success"
                ? "bg-green-400/10 border border-green-500/20 text-green-400"
                : "bg-red-400/10 border border-red-500/20 text-red-400"
            }`}
          >
            <FontAwesomeIcon
              icon={message.type === "success" ? faCheck : faTriangleExclamation}
              className="text-xs"
            />
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={resendVerification}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
          >
            {sending ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
            ) : (
              <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
            )}
            Renvoyer l&apos;email
          </button>

          <button
            onClick={checkVerification}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-colors"
          >
            {checking ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
            ) : (
              <FontAwesomeIcon icon={faRotateRight} className="text-xs" />
            )}
            J&apos;ai verifie mon email
          </button>
        </div>

        {/* Logout link */}
        <div className="mt-8 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <a
            href="/auth/logout"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-xs" />
            Se deconnecter
          </a>
        </div>
      </div>
    </div>
  );
}
