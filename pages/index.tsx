// pages/index.tsx
import Link from 'next/link'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import NeedsList from '@/components/NeedsList'

export default function Home() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const mounted = true
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
            <div className="animate-marquee whitespace-nowrap text-slate-600 text-xs font-medium">
              <span className="mx-8">⚠️ SAFETY FIRST: All transactions are meant to be contactless when possible</span>
              <span className="mx-8">🤝 Any in-person contact is the full responsibility of the helper and recipient</span>
              <span className="mx-8">📍 Meet in public places and trust your instincts</span>
              <span className="mx-8">🛡️ ForMyKin facilitates connections but is not liable for user interactions</span>
              <span className="mx-8">📞 Report any safety concerns immediately</span>
              <span className="mx-8">✨ Building safer communities together</span>
            </div>
          </div>
        </div>
        
        <div className="mx-auto max-w-6xl py-1 px-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Parent card hero */}
          <div className="flex justify-center items-center parent-child-connector">
            <div className="card-container parent-card w-full max-w-2xl h-[320px]">
              <div className="card-rim" />
              <div className="card-gold-frame" />
              <div className="card-logo-shadow">4MK</div>
              <div className="card-logo-main">4MK</div>

              <div className="max-w-2xl mx-auto relative z-10">
                <h1 className="text-lg md:text-xl font-extrabold text-white mb-6 text-center">
                  ForMyKin
                </h1>
                <p className="text-white text-center mb-6 text-xs">
                  Where care and connection help humanity thrive.
                </p>

                <div className="flex items-center justify-center gap-3 mt-6">
                  <Link
                    href={email ? "/needs/create" : "/login?next=/needs/create"}
                    className="py-2 px-4 rounded-md text-center font-semibold text-xs btn-turquoise whitespace-nowrap"
                  >
                    Create Need
                  </Link>

                  <Link
                    href={email ? "/dashboard" : "/login?next=/dashboard"}
                    className="py-2 px-4 rounded-md text-center font-semibold text-xs btn-turquoise whitespace-nowrap"
                  >
                    My Dashboard
                  </Link>
                </div>

                <div className="mt-6 text-[10px] tracking-widest text-white text-center opacity-70">
                  EMPOWERING CONNECTIONS
                  <div className="mx-auto mt-2 h-0.5 w-32 bg-white opacity-30 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Child card - All Needs with pagination */}
          <div className="flex justify-center items-center w-full max-w-4xl">
            <div className="child-card w-full">
              <NeedsList pageSize={6} />
            </div>
          </div>
        </div>

        {/* How ForMyKin Works Section - Moved up for visibility */}
        <section className="py-8 bg-white/10 backdrop-blur-sm mt-4">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-lg font-bold text-center text-slate-800 mb-6">
              How ForMyKin Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-sm font-bold shadow-lg">
                  1
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Share Your Need</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Post what you need help with - whether it&rsquo;s a ride, groceries, or just someone to talk to. 
                  Your community is here to support you.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-sm font-bold shadow-lg">
                  2
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Connect & Accept</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Browse needs in your area and accept the ones you can help with. 
                  Build meaningful connections with your neighbors.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-sm font-bold shadow-lg">
                  3
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Make It Happen</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
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
