// components/Header.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";

export default function Header() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="bg-turquoise-400 px-4 py-1 header-double-gold relative">
      <div className="mx-auto max-w-6xl flex justify-between items-center">
        <Link href="/" className="text-lg font-extrabold text-white tracking-tight">
          4MK
        </Link>
        
        <nav className="flex items-center space-x-4 text-xs">
          <Link href="https://facebook.com" className="text-white hover:text-white/80 font-semibold">
            Facebook
          </Link>
          <Link href="/about" className="text-white hover:text-white/80 font-semibold">
            How It Works
          </Link>
          <Link href="/contact" className="text-white hover:text-white/80 font-semibold">
            Contact Us
          </Link>
          <Link href="/dashboard" className="text-white hover:text-white/80 font-semibold">
            Dashboard
          </Link>
          {session ? (
            <>
              <button onClick={handleLogout} className="text-white hover:text-white/80 font-semibold">
                Logout
              </button>
              <span className="text-white/90 text-[10px] font-medium">{session.user?.email}</span>
            </>
          ) : (
            <Link href="/login" className="text-white hover:text-white/80 font-semibold">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
