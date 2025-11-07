export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      needs: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string | null
          city: string | null
          state: string | null
          created_at: string
          owner_id: string | null
          contact_email: string | null
          contact_phone_e164: string | null
          whatsapp_id: string | null
          provider: string | null
          deleted_at: string | null
          flagged: boolean
          fulfilled_at: string | null
          fulfilled: boolean
          requester_id: string | null
          status: string
          updated_at?: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: string | null
          city?: string | null
          state?: string | null
          created_at?: string
          owner_id?: string | null
          contact_email?: string | null
          contact_phone_e164?: string | null
          whatsapp_id?: string | null
          provider?: string | null
          deleted_at?: string | null
          flagged?: boolean
          fulfilled_at?: string | null
          fulfilled?: boolean
          requester_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string | null
          city?: string | null
          state?: string | null
          created_at?: string
          owner_id?: string | null
          contact_email?: string | null
          contact_phone_e164?: string | null
          whatsapp_id?: string | null
          provider?: string | null
          deleted_at?: string | null
          flagged?: boolean
          fulfilled_at?: string | null
          fulfilled?: boolean
          requester_id?: string | null
          status?: string
          updated_at?: string | null
        }
      }
      fulfillment: {
        Row: {
          id: string
          need_id: string
          helper_id: string
          message: string | null
          created_at: string
          status: string
          accepted_at: string | null
          updated_at?: string | null
        }
        Insert: {
          id?: string
          need_id: string
          helper_id: string
          message?: string | null
          created_at?: string
          status?: string
          accepted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          need_id?: string
          helper_id?: string
          message?: string | null
          created_at?: string
          status?: string
          accepted_at?: string | null
          updated_at?: string | null
        }
      }
      user_profile: {
        Row: {
          user_id: string
          display_name: string | null
          phone_e164: string | null
          preferred_channel: string
          created_at: string
        }
        Insert: {
          user_id?: string
          display_name?: string | null
          phone_e164?: string | null
          preferred_channel?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string | null
          phone_e164?: string | null
          preferred_channel?: string
          created_at?: string
        }
      }
      user_identity: {
        Row: {
          user_id: string | null
          provider: string
          identifier: string
          verified: boolean
          created_at: string
        }
        Insert: {
          user_id?: string | null
          provider: string
          identifier: string
          verified?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string | null
          provider?: string
          identifier?: string
          verified?: boolean
          created_at?: string
        }
      }
      audit_events: {
        Row: {
          id: string
          event_type: string
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          payload?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
