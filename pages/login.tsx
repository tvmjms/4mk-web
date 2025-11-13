// Login page - Latest version with OAuth, gold frames, and all formatting
// Last updated: 2025-11-12
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [checking, setChecking] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  // Get the redirect destination from URL params
  const redirectTo = router.query.next as string || '/'

  useEffect(() => {
    // If already logged in, redirect to intended destination
    // UNLESS ?force=true is in the URL (for testing/viewing the login page)
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const forceView = router.query.force === 'true'
        
        if (session && !forceView) {
          const destination = (router.query.next as string) || '/'
          console.log('Login page: User already logged in, redirecting to:', destination)
          router.replace(destination)
        } else {
          console.log('Login page: No session found or force view, staying on login page')
          setChecking(false) // Done checking, show login form
        }
      } catch (error) {
        console.error('Login page: Error checking session:', error)
        setChecking(false) // Show login form even if there's an error
      }
    }
    
    // Set a timeout to ensure we always show the form after 2 seconds
    const timeoutId = setTimeout(() => {
      console.log('Login page: Timeout reached, showing login form')
      setChecking(false)
    }, 2000)
    
    // Only run after router is ready to avoid issues with router.query
    if (router.isReady) {
      checkUser().finally(() => {
        clearTimeout(timeoutId)
      })
    } else {
      // If router not ready after 1 second, show form anyway
      const routerTimeout = setTimeout(() => {
        console.log('Login page: Router not ready, showing form anyway')
        setChecking(false)
        clearTimeout(timeoutId)
      }, 1000)
      
      // Clean up router timeout if router becomes ready
      const checkRouter = setInterval(() => {
        if (router.isReady) {
          clearInterval(checkRouter)
          clearTimeout(routerTimeout)
          checkUser().finally(() => {
            clearTimeout(timeoutId)
          })
        }
      }, 100)
      
      return () => {
        clearTimeout(timeoutId)
        clearTimeout(routerTimeout)
        clearInterval(checkRouter)
      }
    }
    
    return () => clearTimeout(timeoutId)
  }, [router.isReady, router.query.next, router.query.force])

  const handleLogin = async () => {
    setLoading(true)
    setMessage('')
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
    setLoading(true)
    setMessage('')
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        // Include redirect destination in magic link
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      }
    })
    setMessage(error ? error.message : 'Check your email for a login link!')
    setLoading(false)
  }

  const handleOAuth = async (provider: 'facebook' | 'azure' | 'google') => {
    setLoading(true)
    setMessage('')
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      }
    })
    if (error) {
      setMessage(error.message)
      setLoading(false)
    }
    // OAuth redirects away, so we don't set loading to false here
  }

  // Show loading while checking authentication status
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-teal-100 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <div className="text-teal-800 text-lg">Checking authentication...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="card-container gold-card-frame w-full max-w-xl">
        {/* rim, gold frame, and two stacked 4MK headers (shadow + main) */}
        <div className="card-rim" />
        <div className="card-gold-frame" />
        <div className="card-logo-shadow">4MK</div>
        <div className="card-logo-main">4MK</div>

        <div className="max-w-md mx-auto relative z-10 pt-6">
          {/* Tagline above gold line */}
          <div className="mb-4 text-center">
            <div className="text-[10px] tracking-widest text-white opacity-70 mb-2">
              EMPOWERING CONNECTIONS
            </div>
            <div className="mx-auto h-0.5 w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />
          </div>

          <h1 className="text-xl font-bold text-center mb-6 text-white">Welcome Back</h1>

          {/* OAuth Buttons - Compact group with gold frame */}
          <div className="mb-4 flex justify-center">
            <div className="gold-button-frame inline-flex items-center gap-2">
              <button
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="py-1.5 px-3 rounded-md text-center font-bold text-xs btn-turquoise disabled:opacity-50 whitespace-nowrap"
              >
                Google
              </button>
              <button
                onClick={() => handleOAuth('azure')}
                disabled={loading}
                className="py-1.5 px-3 rounded-md text-center font-bold text-xs btn-turquoise disabled:opacity-50 whitespace-nowrap"
              >
                Microsoft
              </button>
              <button
                onClick={() => handleOAuth('facebook')}
                disabled={loading}
                className="py-1.5 px-3 rounded-md text-center font-bold text-xs btn-turquoise disabled:opacity-50 whitespace-nowrap"
              >
                Facebook
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-white/60 text-xs">or</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Email/Password Login */}
          <div className="space-y-3">
            <input
              className="w-full p-2.5 rounded-xl card-input-light focus:outline-none text-sm"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative">
              <input
                className="w-full p-2.5 rounded-xl card-input-light focus:outline-none text-sm pr-10"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="rememberMe" className="text-white/80 text-xs">
                Remember me
              </label>
            </div>
          </div>

          {/* Forgot password link */}
          <div className="mb-3 text-center mt-2">
            <Link href="/forgot" className="text-[10px] text-white/80 hover:text-white transition-colors">
              Forgot your password?
            </Link>
          </div>

          {/* Login Buttons */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <button
              className="py-1.5 px-3 rounded-md font-semibold transition-all text-xs btn-silver whitespace-nowrap"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login with Password'}
            </button>

            <button
              className="py-1.5 px-3 rounded-md font-medium text-xs btn-silver whitespace-nowrap"
              onClick={handleMagicLink}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>

            <Link
              href="/register"
              className="py-1.5 px-3 rounded-md text-center font-semibold text-xs btn-silver whitespace-nowrap"
            >
              Create Account
            </Link>
          </div>

          {/* Error/Success Message */}
          {message && (
            <div className="mt-4 p-3 rounded-lg bg-rose-100 border border-rose-300 text-rose-800 text-xs text-center">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
