import { supabase } from '../../utils/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';
import { logger } from '@/lib/logger';

async function handleFulfillment(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { needId, message } = req.body;

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

// Apply validation middleware
const validationRules = [
  { field: 'needId', required: true, type: 'string' as const },
  { field: 'message', required: false, type: 'string' as const, maxLength: 500 }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 10 }), // 10 requests per minute
      validateInput(validationRules)
    )(req, res);
    
    return await handleFulfillment(req, res);
  } catch (error) {
    logger.error('Fulfillment API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
