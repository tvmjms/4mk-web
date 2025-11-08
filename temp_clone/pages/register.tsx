import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (!email || !password) { setErr('Email and password are required.'); return }
    if (password !== confirm) { setErr('Passwords do not match.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) setErr(error.message)
    else setMsg('Check your email to confirm your account. You can then log in.')
  }

  return (
    <>
      <Head><title>Create account — 4MK</title></Head>
      <main className="flex items-center justify-center min-h-screen px-4">
        <div className="card-container w-full max-w-lg relative">
          <div className="card-rim" />
          <div className="card-logo-shadow">4MK</div>
          <div className="card-logo-main">4MK</div>

          <div className="relative z-10 max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8 text-white">Create account</h1>
            <form onSubmit={onSubmit} className="space-y-4">
              <input
                className="w-full p-4 rounded-xl card-input focus:outline-none"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="w-full p-4 rounded-xl card-input focus:outline-none"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                className="w-full p-4 rounded-xl card-input focus:outline-none"
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button type="submit" className="py-3 rounded-md font-semibold text-sm btn-copper" style={{ width: 210 }} disabled={loading}>
                  {loading ? 'Creating…' : 'Create account'}
                </button>
                <Link href="/login" className="py-3 rounded-md text-center font-semibold text-sm btn-copper-ghost" style={{ width: 210 }}>
                  Back to login
                </Link>
              </div>
            </form>

            {msg && <p className="text-white text-center mt-4 bg-white bg-opacity-10 p-3 rounded-lg">{msg}</p>}
            {err && <p className="text-red-200 text-center mt-4">{err}</p>}
          </div>
        </div>
      </main>
    </>
  )
}
