import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Head from 'next/head';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset',
    });
    setLoading(false);
    if (!error) {
      setSubmitted(true);
    } else {
      alert(error.message);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password – 4MK</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 shadow-lg rounded-2xl">
          <h2 className="text-center text-2xl font-bold text-purple-700">Forgot Your Password?</h2>

          {submitted ? (
            <p className="text-green-600 text-center">
              Check your email for a link to reset your password.
            </p>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
              <button
                type="submit"
                className="w-full bg-purple-600 text-white p-3 rounded-md hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
