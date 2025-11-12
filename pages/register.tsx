import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  // Get the redirect destination from URL params
  const redirectTo = router.query.next as string || '/dashboard'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (!email || !password) { setErr('Email and password are required.'); return }
    if (password !== confirm) { setErr('Passwords do not match.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      }
    })
    setLoading(false)
    if (error) setErr(error.message)
    else setMsg('Check your email to confirm your account. You can then log in.')
  }

  const handleOAuthSignup = async (provider: 'google' | 'azure' | 'facebook' | 'github') => {
    setLoading(true)
    setErr(null)
    setMsg(null)
    
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('postAuthRedirect', redirectTo)
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any, // Supabase uses 'azure' for Microsoft
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setErr(error.message)
        setLoading(false)
      }
      // Note: OAuth redirects away, so we won't reach here on success
    } catch (err: any) {
      setErr(err.message || 'Failed to initiate OAuth signup')
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Create account — 4MK</title></Head>
      <main className="flex items-center justify-center min-h-screen px-4">
        <div className="card-container w-full max-w-lg relative" style={{ minHeight: '420px' }}>
          <div className="card-rim" />
          <div className="card-gold-frame" />
          <div className="card-logo-shadow">4MK</div>
          <div className="card-logo-main">4MK</div>

          <div className="gold-card-frame relative z-10 space-y-4">
            <h1 className="text-3xl font-bold text-center text-white mt-4">Create account</h1>
            
            {/* OAuth Signup Buttons - Compact Layout */}
            <div className="gold-button-frame">
              <div className="flex items-center justify-center gap-2 mb-2">
                <button
                  className="py-1.5 px-3 rounded-md font-bold text-sm btn-turquoise transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 shadow-lg"
                  onClick={() => handleOAuthSignup('google')}
                  disabled={loading}
                  type="button"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>

                <button
                  className="py-1.5 px-3 rounded-md font-bold text-sm btn-turquoise transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 shadow-lg"
                  onClick={() => handleOAuthSignup('azure')}
                  disabled={loading}
                  type="button"
                >
                  <svg className="w-4 h-4" viewBox="0 0 23 23" fill="none">
                    <path fill="#F25022" d="M0 0h11v11H0z"/>
                    <path fill="#00A4EF" d="M12 0h11v11H12z"/>
                    <path fill="#7FBA00" d="M0 12h11v11H0z"/>
                    <path fill="#FFB900" d="M12 12h11v11H12z"/>
                  </svg>
                  Microsoft
                </button>
              </div>
              <div className="flex items-center justify-center">
                <button
                  className="py-1.5 px-3 rounded-md font-bold text-sm btn-turquoise transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 max-w-[50%] shadow-lg"
                  onClick={() => handleOAuthSignup('facebook')}
                  disabled={loading}
                  type="button"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </div>

            {/* Divider - Industry Standard */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white opacity-30"></div>
              <span className="text-xs text-white opacity-70 font-medium">OR</span>
              <div className="flex-1 h-px bg-white opacity-30"></div>
            </div>

            <form onSubmit={onSubmit} className="space-y-3 max-w-sm mx-auto">
              <input
                className="w-11/12 mx-auto block px-4 py-2.5 rounded-xl card-input-light focus:outline-none text-sm"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="w-11/12 mx-auto relative">
              <input
                  className="block w-full px-4 py-2.5 rounded-xl card-input-light focus:outline-none text-sm pr-16"
                  type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-emerald-900/70 hover:text-emerald-700"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill={showPassword ? '#047857' : 'none'}
                    stroke="#047857"
                    strokeWidth={1.8}
                  >
                    {showPassword ? (
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-6.5 0-10-8-10-8a21.86 21.86 0 0 1 4.06-5.94" />
                        <path d="M9.88 9.88A3 3 0 0 1 14.12 14.12" />
                        <path d="m1 1 22 22" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              <div className="w-11/12 mx-auto relative">
              <input
                  className="block w-full px-4 py-2.5 rounded-xl card-input-light focus:outline-none text-sm pr-16"
                  type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-emerald-900/70 hover:text-emerald-700"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill={showConfirm ? '#047857' : 'none'}
                    stroke="#047857"
                    strokeWidth={1.8}
                  >
                    {showConfirm ? (
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-6.5 0-10-8-10-8a21.86 21.86 0 0 1 4.06-5.94" />
                        <path d="M9.88 9.88A3 3 0 0 1 14.12 14.12" />
                        <path d="m1 1 22 22" />
                      </>
                    )}
                  </svg>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button type="submit" className="py-3 rounded-md font-semibold text-sm btn-copper" style={{ width: 200 }} disabled={loading}>
                  {loading ? 'Creating…' : 'Create account'}
                </button>
                <Link href="/login" className="py-3 rounded-md text-center font-semibold text-sm btn-copper-ghost" style={{ width: 200 }}>
                  Back to login
                </Link>
              </div>
            </form>

            {msg && <p className="text-white text-center bg-white bg-opacity-10 p-3 rounded-lg">{msg}</p>}
            {err && <p className="text-red-200 text-center">{err}</p>}
          </div>
        </div>
      </main>
    </>
  )
}
