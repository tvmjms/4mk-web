'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function Header() {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();

  return (
    <header className="w-full mb-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-2xl md:text-3xl font-extrabold text-neutral-900">4MK</Link>
        <nav className="flex items-center gap-2">
          {router.pathname !== '/' && (
            <Link href="/" className="text-sm px-3 py-1 rounded-full text-neutral-800 bg-white/70 hover:bg-white shadow">
              All Needs
            </Link>
          )}
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-neutral-800 mr-1">{user.email}</span>
              <button
                onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
                className="text-sm px-3 py-1 rounded-full bg-[#5b8762] text-white hover:opacity-90 shadow"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm px-3 py-1 rounded-full bg-[#5b8762] text-white hover:opacity-90 shadow">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
