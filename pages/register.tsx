import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleOAuth = async (provider: 'facebook' | 'azure' | 'google') => {
    setLoading(true)
    setErr(null)
    setMsg(null)
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`
      }
    })
    if (error) {
      setErr(error.message)
      setLoading(false)
    }
    // OAuth redirects away, so we don't set loading to false here
  }

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
        <div className="card-container gold-card-frame w-full max-w-lg relative">
          <div className="card-rim" />
          <div className="card-gold-frame" />
          <div className="card-logo-shadow">4MK</div>
          <div className="card-logo-main">4MK</div>

          <div className="relative z-10 max-w-md mx-auto pt-6">
            <h1 className="text-2xl font-bold text-center mb-6 text-white">Create account</h1>
            
            {/* OAuth Buttons */}
            <div className="mb-4 space-y-2">
              <button
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md text-center font-bold text-sm btn-turquoise disabled:opacity-50"
              >
                Google
              </button>
              <button
                onClick={() => handleOAuth('azure')}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md text-center font-bold text-sm btn-turquoise disabled:opacity-50"
              >
                Microsoft
              </button>
              <button
                onClick={() => handleOAuth('facebook')}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md text-center font-bold text-sm btn-turquoise disabled:opacity-50"
              >
                Facebook
              </button>
            </div>

            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="text-white/60 text-xs">or</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <input
                className="w-full p-3 rounded-xl card-input-light focus:outline-none text-sm"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <div className="relative">
                <input
                  className="w-full p-3 rounded-xl card-input-light focus:outline-none text-sm pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <div className="relative">
                <input
                  className="w-full p-3 rounded-xl card-input-light focus:outline-none text-sm pr-10"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

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
