// pages/needs/index.tsx
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import NeedsList from '@/components/NeedsList'

export default function AllNeedsPage() {
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
    <main className="min-h-screen px-4" style={{ background: '#a7f3d0' }}>
      <div className="mx-auto max-w-5xl py-8 px-6">
        <div className="card-container list-card w-full" style={{ minHeight: '480px' }}>
          <div className="card-rim" />
          <div className="card-gold-frame" />
          
          {/* Title positioned absolutely like home page */}
          <div className="card-logo-main">All Needs</div>
          
          <div className="w-full relative z-10 pt-10">
            {/* Create Need Button */}
            <div className="mb-3 flex justify-center">
              <Link
                href={email ? "/needs/create" : "/login?next=/needs/create"}
                className="py-2 px-4 rounded-md text-center font-semibold text-xs btn-turquoise whitespace-nowrap"
              >
                Create Need
              </Link>
            </div>
            
            <NeedsList pageSize={30} columns={3} />
          </div>
        </div>
      </div>
    </main>
  )
}