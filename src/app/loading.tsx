export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
      <div className="text-center">
        {/* Logo animé */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-600 mb-6 animate-pulse">
          <span className="font-display font-bold text-xl text-white">BYS</span>
        </div>

        {/* Barre tricolore animée */}
        <div className="flex justify-center mb-6">
          <div className="flex rounded overflow-hidden gap-1">
            <div className="w-8 h-1.5 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
            <div className="w-8 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
            <div className="w-8 h-1.5 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
        </div>

        <p className="text-gray-400 text-sm">Chargement en cours...</p>
      </div>
    </div>
  );
}
