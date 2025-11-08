import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else router.push('/')
    setLoading(false)
  }

  const handleMagicLink = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setMessage(error ? error.message : 'Check your email for a login link!')
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="card-container w-full max-w-xl h-[300px]">
        {/* rim, gold frame, and two stacked 4MK headers (shadow + main) */}
        <div className="card-rim" />
        <div className="card-gold-frame" />
        <div className="card-logo-shadow">4MK</div>
        <div className="card-logo-main">4MK</div>

        {/* Inputs remain in a narrower column for readability */}
        <div className="max-w-sm mx-auto relative z-10 pt-2">
          <h1 className="text-xl font-bold text-center mb-4 text-white">Welcome Back</h1>

          <input
            className="w-full p-2 mb-2 rounded-xl card-input focus:outline-none text-sm"
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full p-2 mb-3 rounded-xl card-input focus:outline-none text-sm"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

        {/* Forgot password link moved above the buttons */}
        <div className="mb-1 text-center">
          <Link href="/forgot" className="text-[10px] text-white hover:text-opacity-80 transition-colors">
            Forgot your password?
          </Link>
        </div>

        {/* Compact 3-button layout */}
        <div className="flex items-center justify-center gap-2">
          <button
            className="py-1 px-2 rounded-md font-semibold transition-all text-[10px] btn-silver whitespace-nowrap"
            style={{ width: 120 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login with Password'}
          </button>

          <button
            className="py-1 px-2 rounded-md font-medium text-[10px] btn-silver whitespace-nowrap"
            style={{ width: 120 }}
            onClick={handleMagicLink}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>

          <Link
            href="/register"
            className="py-1 px-2 rounded-md text-center font-semibold text-[10px] btn-silver whitespace-nowrap"
            style={{ width: 120 }}
          >
            Create Account
          </Link>
        </div>

        {/* Compact tagline */}
        <div className="mt-3 text-[9px] tracking-widest text-white text-center opacity-70">
          EMPOWERING CONNECTIONS
        </div>

        {message && <p className="text-white text-center mt-4 bg-white bg-opacity-10 p-3 rounded-lg">{message}</p>}

        </div>

        
      </div>
    </div>
  )
}
