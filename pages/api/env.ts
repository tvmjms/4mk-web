import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    NEXT_PUBLIC_SUPABASE_URL_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY_exists: !!process.env.RESEND_API_KEY
  });
}