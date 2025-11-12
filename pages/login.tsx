import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [checking, setChecking] = useState(false) // Start with false - show form immediately
  const [showEmailForm, setShowEmailForm] = useState(false) // Hide email/password fields initially
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  // Get the redirect destination from URL params
  const redirectTo = router.query.next as string || '/'

  useEffect(() => {
    // Only check session if we weren't redirected here by auth guard
    // If there's a 'next' param, we already know user isn't logged in
    if (router.query.next) {
      console.log('Login page: Redirected by auth guard, showing form immediately')
      setChecking(false)
      return
    }

    // Otherwise, check if user is already logged in
    const checkUser = async () => {
      setChecking(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const destination = (router.query.next as string) || '/'
          console.log('Login page: User already logged in, redirecting to:', destination)
          router.replace(destination)
        } else {
          console.log('Login page: No session found, showing login form')
          setChecking(false)
        }
      } catch (error) {
        console.error('Login page: Error checking session:', error)
        setChecking(false)
      }
    }
    
    // Only run after router is ready
    if (router.isReady) {
      checkUser()
    }
  }, [router.isReady, router.query.next])

  const handleLogin = async () => {
    if (!showEmailForm) {
      // Show the form first
      setShowEmailForm(true)
      return
    }
    if (!email || !password) {
      setMessage('Please enter both email and password')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      // Redirect to intended destination after successful login
      router.push(redirectTo)
    }
    setLoading(false)
  }

  const handleMagicLink = async () => {
    if (!showEmailForm) {
      // Show the form first
      setShowEmailForm(true)
      return
    }
    if (!email) {
      setMessage('Please enter your email address')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        // Include redirect destination in magic link
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      }
    })
    setMessage(error ? error.message : 'Check your email for a login link!')
    setLoading(false)
  }

  const handleOAuthLogin = async (provider: 'google' | 'azure' | 'facebook' | 'github') => {
    setLoading(true)
    setMessage('')
    
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
        setMessage(error.message)
        setLoading(false)
      }
      // Note: OAuth redirects away, so we won't reach here on success
    } catch (err: any) {
      setMessage(err.message || 'Failed to initiate OAuth login')
      setLoading(false)
    }
  }

  // Show loading while checking authentication status
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="text-white text-lg">Checking authentication...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="card-container w-full max-w-xl" style={{ minHeight: '400px' }}>
        {/* rim, gold frame, and two stacked 4MK headers (shadow + main) */}
        <div className="card-rim" />
        <div className="card-gold-frame" />
        <div className="card-logo-shadow">4MK</div>
        <div className="card-logo-main">4MK</div>

        <div className="gold-card-frame relative z-10">
          <div className="space-y-4 max-w-sm mx-auto pt-6 pb-10">
            <h1 className="text-2xl font-bold text-center text-white">Welcome Back</h1>

          {/* OAuth Login Buttons - Compact Layout */}
            <div className="gold-button-frame">
            <div className="flex items-center justify-center gap-2 mb-2">
              <button
                  className="py-1.5 px-3 rounded-md font-bold text-sm btn-turquoise transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 shadow-lg"
                onClick={() => handleOAuthLogin('google')}
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
                onClick={() => handleOAuthLogin('azure')}
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
                  onClick={() => handleOAuthLogin('facebook')}
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

          {/* Email/Password Form - Shown only when showEmailForm is true */}
          {showEmailForm && (
              <div className="space-y-3">
              <input
                  className="w-11/12 mx-auto block px-4 py-2.5 rounded-xl card-input-light focus:outline-none text-sm"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
              />

                <div className="w-11/12 mx-auto relative">
              <input
                    className="block w-full px-4 py-2.5 rounded-xl card-input-light focus:outline-none text-sm pr-16"
                    type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleLogin();
                  }
                }}
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

                {/* Remember Me checkbox */}
                <div className="w-11/12 mx-auto flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="rememberMe" className="text-[10px] text-white cursor-pointer">
                    Remember me
                  </label>
                </div>

              {/* Forgot password link */}
                <div className="text-center">
                <Link href="/forgot" className="text-[10px] text-white hover:text-opacity-80 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>
          )}

          {/* Email/Password Action Buttons */}
            <div className="flex items-center justify-center gap-2">
            <button
                className="py-1.5 px-3 rounded-md font-semibold transition-all text-[11px] btn-silver-3d whitespace-nowrap flex-1 max-w-[48%]"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Logging in...' : showEmailForm ? 'Login' : 'Login with email'}
            </button>

            <button
                className="py-1.5 px-3 rounded-md font-medium text-[11px] btn-silver-3d whitespace-nowrap flex-1 max-w-[48%]"
              onClick={handleMagicLink}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </div>

          {/* Create Account Link */}
            <div className="text-center">
            <Link
              href="/register"
                className="text-[11px] text-white hover:text-opacity-80 transition-colors underline"
            >
              Don't have an account? Create one
            </Link>
            </div>
            {message && (
              <div className="mt-4 px-4 py-3 bg-rose-500/15 border border-rose-500/40 rounded-lg">
                <p className="text-rose-100 text-center text-xs font-medium">{message}</p>
              </div>
            )}
          </div>

          {/* Compact tagline anchored near gold frame */}
          <div className="absolute inset-x-0 bottom-1 text-[9px] tracking-widest text-white text-center opacity-70">
            <div className="mx-auto mb-1 h-0.5 w-32 bg-white opacity-30 rounded-full" />
            EMPOWERING CONNECTIONS
          </div>
        </div>
      </div>
    </div>
  )
}
