import LoadingOverlay, { KpiGridSkeleton, PageHeaderSkeleton } from "@/components/ui/LoadingOverlay";

export default function Loading() {
  return (
    <div className="relative min-h-screen bg-[#0A1628]">
      <div className="p-6 sm:p-8 max-w-7xl mx-auto opacity-30 pointer-events-none">
        <PageHeaderSkeleton />
        <KpiGridSkeleton />
        <div className="h-64 rounded-xl bg-white/5 border border-white/5 animate-pulse" />
      </div>
      <LoadingOverlay show fullScreen label="Chargement en cours..." />
    </div>
  );
}
