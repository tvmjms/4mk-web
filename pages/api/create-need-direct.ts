// pages/api/create-need-direct.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { validateInput, rateLimit, compose } from '@/lib/middleware/validation';

async function handleCreateNeed(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use the service role key for direct database access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { 
      owner_id,
      title,
      street,
      city,
      state,
      zip_code,
      category,
      description,
      contact_email,
      contact_phone_e164,
      whatsapp_id,
      provider,
      images
    } = req.body;

    logger.debug('API route - Creating need with payload:', JSON.stringify(req.body, null, 2));

    // First, let's try to count existing needs for this user today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    // Check for recent identical needs (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: existingNeeds, error: countError } = await supabase
      .from('needs')
      .select('id, title, description, created_at')
      .eq('owner_id', owner_id)
      .eq('title', title.trim())
      .gte('created_at', fiveMinutesAgo);

    if (countError) {
      logger.error('API route - Error checking existing needs:', countError);
    }

    // Check for exact duplicate (same title, same user, within 5 minutes)
    if (existingNeeds && existingNeeds.length > 0) {
      const exactMatch = existingNeeds.find(need => 
        need.title.trim().toLowerCase() === title.trim().toLowerCase() &&
        (description ? need.description?.trim().toLowerCase() === description.trim().toLowerCase() : !need.description)
      );
      
      if (exactMatch) {
        logger.warn('API route - Duplicate need detected:', {
          owner_id,
          title,
          existing_id: exactMatch.id,
          existing_created: exactMatch.created_at
        });
        
        return res.status(409).json({ 
          error: 'Duplicate need detected. A very similar need was created recently.',
          existingNeedId: exactMatch.id,
          code: 'DUPLICATE_NEED'
        });
      }
    }

    logger.debug('API route - Creating new need - no duplicates found');

    const { data, error } = await supabase
      .from('needs')
      .insert([{
        owner_id,
        title,
        street: street || null,
        city: city || null,
        state: state || null,
        zip_code: zip_code || null,
        category: category || null,
        description: description || null,
        contact_email: contact_email || null,
        contact_phone_e164: contact_phone_e164 || null,
        whatsapp_id: whatsapp_id || null,
        provider: provider || null,
        status: 'new',
        images: images && images.length > 0 ? images : null
      }])
      .select('id')
      .single();

    if (error) {
      logger.error('API route - Supabase error:', error);
      return res.status(400).json({ 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }

    logger.debug('API route - Success:', data);
    return res.status(200).json({ success: true, needId: data.id });

  } catch (err) {
    logger.error('API route - Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Validation rules for creating needs
const validationRules = [
  { field: 'owner_id', required: true, type: 'string' as const },
  { field: 'title', required: true, type: 'string' as const, minLength: 3, maxLength: 200 },
  { field: 'description', required: false, type: 'string' as const, maxLength: 2000 },
  { field: 'contact_email', required: false, type: 'email' as const },
  { field: 'contact_phone_e164', required: false, type: 'phone' as const }
  // Note: images array validated client-side (max 3, URL format)
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await compose(
      rateLimit({ windowMs: 60000, maxRequests: 10 }), // 10 needs per minute max (more user-friendly)
      validateInput(validationRules)
    )(req, res);
    
    return await handleCreateNeed(req, res);
  } catch (error) {
    logger.error('Create need API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}