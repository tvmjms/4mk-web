import { supabase } from '../../utils/supabaseClient';
import { getAdminSupabaseClient } from '@/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';
import { logger } from '@/lib/logger';

async function handleFulfillment(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const admin = getAdminSupabaseClient();
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { 
    needId, 
    message, 
    offerType, 
    offerDescription, 
    contactMethod,
    maxCashlessAmount,
    orderId,
    proofUrl,
    deliveryPreferences,
    brandPreference,
    caseManagerInfo
  } = req.body;

  if (!needId) {
    return res.status(400).json({ error: 'needId is required' });
  }

  // Validate max cashless amount (must be ≤ $100 per spec)
  if (maxCashlessAmount !== undefined && maxCashlessAmount !== null) {
    const amount = Number(maxCashlessAmount);
    if (isNaN(amount) || amount < 0 || amount > 100) {
      return res.status(400).json({ error: 'maxCashlessAmount must be between 0 and 100' });
    }
  }

  // Check if this is the first offer for this need
  const { data: existingOffers, error: checkError } = await admin
    .from('fulfillment')
    .select('id')
    .eq('need_id', needId)
    .in('status', ['proposed', 'accepted']);

  if (checkError) {
    logger.error('Error checking existing offers:', checkError);
    return res.status(500).json({ error: 'Failed to check existing offers' });
  }

  const isFirstOffer = !existingOffers || existingOffers.length === 0;

  // Insert the fulfillment/offer
  const { data, error } = await admin
    .from('fulfillment')
    .insert([
      {
        need_id: needId,
        helper_id: user.id,
        message: message || '',
        status: 'proposed',
        offer_type: offerType || 'general',
        offer_description: offerDescription || null,
        contact_method: contactMethod || 'email',
        max_cashless_amount: maxCashlessAmount ? Number(maxCashlessAmount) : null,
        order_id: orderId || null,
        proof_url: proofUrl || null,
        delivery_preferences: deliveryPreferences || null,
        brand_preference: brandPreference || null,
        case_manager_info: caseManagerInfo || null,
      },
    ])
    .select()
    .single();

  if (error) {
    logger.error('Fulfillment insert error:', error);
    return res.status(500).json({ error: error.message });
  }

  // If this is the first offer, update the need status to "Help Offered"
  if (isFirstOffer) {
    const { error: needUpdateError } = await admin
      .from('needs')
      .update({ status: 'Help Offered' })
      .eq('id', needId);

    if (needUpdateError) {
      logger.error('Failed to update need status to Help Offered:', needUpdateError);
      // Non-fatal - the offer was created successfully
    }
  }

  return res.status(201).json({ data });
}

// Apply validation middleware
const validationRules = [
  { field: 'needId', required: true, type: 'string' as const },
  { field: 'message', required: false, type: 'string' as const, maxLength: 500 },
  { field: 'offerType', required: false, type: 'string' as const },
  { field: 'offerDescription', required: false, type: 'string' as const, maxLength: 1000 },
  { field: 'contactMethod', required: false, type: 'string' as const },
  { field: 'maxCashlessAmount', required: false, type: 'number' as const },
  { field: 'orderId', required: false, type: 'string' as const, maxLength: 200 },
  { field: 'proofUrl', required: false, type: 'string' as const, maxLength: 500 },
  { field: 'deliveryPreferences', required: false, type: 'string' as const, maxLength: 1000 },
  { field: 'brandPreference', required: false, type: 'string' as const, maxLength: 200 },
  { field: 'caseManagerInfo', required: false, type: 'string' as const, maxLength: 500 }
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
