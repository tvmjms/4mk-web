// BACKUP: Perfect Home Page Layout - DO NOT MODIFY
// Date: October 29, 2025
// Status: LOCKED DESIGN VERSION

import Link from 'next/link'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import NeedsList from '@/components/NeedsList'

export default function Home() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (mounted) setEmail(data.user?.email ?? null)
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <>
      <Head><title>4MK</title></Head>
      <main className="min-h-screen px-4">
        {/* Safety Banner - Scrolling Text */}
        <div className="w-full mb-1 overflow-hidden">
          <div className="py-1">
            <div className="animate-marquee whitespace-nowrap text-slate-600 text-sm font-medium">
              <span className="mx-8">⚠️ SAFETY FIRST: All transactions are meant to be contactless when possible</span>
              <span className="mx-8">🤝 Any in-person contact is the full responsibility of the helper and recipient</span>
              <span className="mx-8">📍 Meet in public places and trust your instincts</span>
              <span className="mx-8">🛡️ ForMyKin facilitates connections but is not liable for user interactions</span>
              <span className="mx-8">📞 Report any safety concerns immediately</span>
              <span className="mx-8">✨ Building safer communities together</span>
            </div>
          </div>
        </div>
        
        <div className="mx-auto max-w-6xl py-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Parent card hero */}
          <div className="flex justify-center items-start parent-child-connector">
            <div className="card-container parent-card w-full max-w-2xl h-[340px]">
              <div className="card-rim" />
              <div className="card-gold-frame" />
              <div className="card-logo-shadow">4MK</div>
              <div className="card-logo-main">4MK</div>

              <div className="max-w-2xl mx-auto relative z-10">
                <h1 className="text-xl md:text-2xl font-extrabold text-white mb-3 text-center">
                  ForMyKin
                </h1>
                <p className="text-white text-center mb-6 text-sm">
                  Where care and connection help humanity thrive.
                </p>

                <div className="flex items-center justify-center gap-4 mt-8">
                  <Link
                    href="/needs/create"
                    className="py-3 px-6 rounded-md text-center font-semibold text-sm btn-turquoise whitespace-nowrap"
                  >
                    Create Need
                  </Link>

                  <Link
                    href="/dashboard"
                    className="py-3 px-6 rounded-md text-center font-semibold text-sm btn-turquoise whitespace-nowrap"
                  >
                    My Dashboard
                  </Link>
                </div>

                {!email && (
                  <p className="mt-6 text-sm text-white text-center opacity-80">
                    You're not signed in yet. Visit your Dashboard to sign in.
                  </p>
                )}

                <div className="mt-10 text-xs tracking-widest text-white text-center opacity-70">
                  EMPOWERING CONNECTIONS
                  <div className="mx-auto mt-2 h-1 w-40 bg-white opacity-30 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Child card - All Needs with pagination */}
          <div className="w-full max-w-3xl mx-auto">
            <div className="child-card">
              <NeedsList pageSize={6} />
            </div>
          </div>
        </div>

        {/* How it Works Section */}
        <section className="py-12 bg-white/10 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">
              How ForMyKin Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg">
                  1
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Share Your Need</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Post what you need help with - whether it's a ride, groceries, or just someone to talk to. 
                  Your community is here to support you.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg">
                  2
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Connect & Accept</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Browse needs in your area and accept the ones you can help with. 
                  Build meaningful connections with your neighbors.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg">
                  3
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Make It Happen</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Coordinate safely and help each other out. 
                  Experience the joy of community care and connection.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}