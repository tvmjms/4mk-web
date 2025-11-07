export type Database = {
  public: {
    Tables: {
      needs: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string | null;
          city: string | null;
          state: string | null;
          created_at: string;
          owner_id: string | null;
          contact_email: string | null;
          contact_phone_e164: string | null;
          whatsapp_id: string | null;
          provider: string | null;
          deleted_at: string | null;
          flagged: boolean;
          fulfilled_at: string | null;
          fulfilled: boolean;
          requester_id: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string | null;
          city?: string | null;
          state?: string | null;
          created_at?: string;
          owner_id?: string | null;
          contact_email?: string | null;
          contact_phone_e164?: string | null;
          whatsapp_id?: string | null;
          provider?: string | null;
          deleted_at?: string | null;
          flagged?: boolean;
          fulfilled_at?: string | null;
          fulfilled?: boolean;
          requester_id?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          city?: string | null;
          state?: string | null;
          created_at?: string;
          owner_id?: string | null;
          contact_email?: string | null;
          contact_phone_e164?: string | null;
          whatsapp_id?: string | null;
          provider?: string | null;
          deleted_at?: string | null;
          flagged?: boolean;
          fulfilled_at?: string | null;
          fulfilled?: boolean;
          requester_id?: string | null;
          status?: string;
        };
      };
      fulfillment: {
        Row: {
          id: string;
          need_id: string;
          helper_id: string;
          message: string | null;
          created_at: string;
          status: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          need_id: string;
          helper_id: string;
          message?: string | null;
          created_at?: string;
          status?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          need_id?: string;
          helper_id?: string;
          message?: string | null;
          created_at?: string;
          status?: string;
          accepted_at?: string | null;
        };
      };
      user_profile: {
        Row: {
          user_id: string;
          display_name: string | null;
          phone_e164: string | null;
          preferred_channel: string;
          created_at: string;
        };
        Insert: {
          user_id?: string;
          display_name?: string | null;
          phone_e164?: string | null;
          preferred_channel?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          phone_e164?: string | null;
          preferred_channel?: string;
          created_at?: string;
        };
      };
    };
  };
};
