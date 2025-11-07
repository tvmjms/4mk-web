import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSupabaseClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { needId, message } = req.body;

  const supabase = getAdminSupabaseClient();
  const user = await supabase.auth.getUser();

  if (!user.data?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('fulfillments')
    .insert([
      {
        need_id: needId,
        message,
        user_id: user.data.user.id,
      },
    ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ data });
}
