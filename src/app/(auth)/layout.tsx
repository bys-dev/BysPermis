'use client';

import { TricoloreParticles } from '@/components/ui/TricoloreParticles';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-start sm:items-center justify-center min-h-screen px-4 py-12 overflow-y-auto" style={{ background: '#0A1628' }}>
      {/* Radial glow like homepage */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
      {/* Particules tricolores */}
      <TricoloreParticles />
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
