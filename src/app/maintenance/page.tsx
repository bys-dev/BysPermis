import { prisma } from "@/lib/prisma";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWrench, faClock } from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  // Fetch maintenance message from platform settings
  let maintenanceMessage: string | null = null;
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    });
    maintenanceMessage = settings?.maintenanceMessage ?? null;
  } catch {
    // Ignore — show default message
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0A1628" }}>
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <span className="font-bold text-xl text-white">BYS</span>
        </div>

        {/* Wrench icon */}
        <div className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
          <FontAwesomeIcon icon={faWrench} className="text-orange-400 text-3xl" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3">Site en maintenance</h1>

        {/* Custom message */}
        {maintenanceMessage ? (
          <p className="text-gray-400 text-sm leading-relaxed mb-6">{maintenanceMessage}</p>
        ) : (
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Nous effectuons actuellement une maintenance pour ameliorer votre experience.
            <br />
            Le site sera de nouveau accessible tres prochainement.
          </p>
        )}

        {/* Return soon */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-gray-300"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <FontAwesomeIcon icon={faClock} className="text-blue-400 text-xs" />
          Revenez bientot
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <p className="text-gray-600 text-xs">
            BYS Formation — Plateforme de formations professionnelles
          </p>
        </div>
      </div>
    </div>
  );
}
