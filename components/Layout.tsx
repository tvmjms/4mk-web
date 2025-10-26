'use client';
import Link from 'next/link';
import Header from '@/components/Header';
import { ReactNode } from 'react';

export default function Layout({
  children,
  accent = 'pink',
  showHeader = true,
}: {
  children: ReactNode;
  accent?: 'pink' | 'green' | 'blue' | 'gold';
  showHeader?: boolean;
}) {
  const accentRing =
    accent === 'pink' ? 'ring-[#f1c87a]' :
    accent === 'green' ? 'ring-[#b7e4c7]' :
    accent === 'blue' ? 'ring-[#b3d4ff]' :
    'ring-[#f1c87a]';

  const inviteFrom =
    accent === 'pink' ? 'from-pink-200 to-pink-300' :
    accent === 'green' ? 'from-emerald-200 to-emerald-300' :
    accent === 'blue' ? 'from-sky-200 to-sky-300' :
    'from-pink-200 to-pink-300';

  return (
    <div className="min-h-screen bg-[#373737] py-8 px-3">
      <div className={`mx-auto max-w-6xl rounded-[28px] bg-gradient-to-b ${inviteFrom} shadow-[0_40px_80px_rgba(0,0,0,0.45)] p-6 md:p-10 ring-2 ${accentRing}`}>
        {showHeader && <Header />}
        {children}
        <div className="mt-10 text-center">
          <Link href="/" className="text-sm text-neutral-700 hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
