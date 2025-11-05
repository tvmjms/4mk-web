// types/database.ts
export interface Need {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status?: 'new' | 'active' | 'fulfilled' | 'pending' | 'closed';
  owner_id: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_email?: string;
  contact_phone_e164?: string;
  whatsapp_id?: string;
  provider?: string;
  created_at: string;
  updated_at: string;
}

export interface Fulfillment {
  id: string;
  need_id: string;
  helper_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}