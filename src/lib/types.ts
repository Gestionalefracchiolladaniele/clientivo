export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          // Dati azienda
          company_name: string | null;
          ragione_sociale: string | null;
          partita_iva: string | null;
          codice_fiscale: string | null;
          address: string | null;
          cap: string | null;
          city: string | null;
          phone: string | null;
          website: string | null;
          logo_url: string | null;
          // OneDigit
          hourly_cost: number;
          // QuoteBuilder — numerazione
          quote_numbering_prefix: string;
          quote_numbering_counter: number;
          quote_numbering_digits: number;
          // QuoteBuilder — pagamenti
          quote_validity_days: number;
          quote_payment_terms: string | null;
          quote_payment_methods: Array<{ name: string; iban?: string; details?: string }>;
          // OneDigit — sedi
          sedi: string[];
          // QuoteBuilder — firma
          quote_signature_name: string | null;
          quote_signature_role: string | null;
          quote_signature_image: string | null;
          // QuoteBuilder — stile PDF
          quote_color_primary: string;
          quote_color_text: string;
          quote_color_secondary: string;
          quote_font_size_base: number;
          quote_font_size_service: number;
          quote_font_size_price: number;
          quote_margin_top: number;
          quote_margin_right: number;
          quote_margin_bottom: number;
          quote_margin_left: number;
          quote_sections: {
            header_azienda: boolean;
            box_cliente: boolean;
            box_totali: boolean;
            footer: boolean;
            note_servizi: boolean;
            titolo_preventivo: boolean;
            allegato_tecnico: boolean;
            firma: boolean;
          };
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          company_name?: string | null;
          ragione_sociale?: string | null;
          partita_iva?: string | null;
          codice_fiscale?: string | null;
          address?: string | null;
          cap?: string | null;
          city?: string | null;
          phone?: string | null;
          website?: string | null;
          logo_url?: string | null;
          hourly_cost?: number;
          sedi?: string[];
          quote_numbering_prefix?: string;
          quote_numbering_counter?: number;
          quote_numbering_digits?: number;
          quote_validity_days?: number;
          quote_payment_terms?: string | null;
          quote_payment_methods?: Array<{ name: string; iban?: string; details?: string }>;
          quote_signature_name?: string | null;
          quote_signature_role?: string | null;
          quote_signature_image?: string | null;
          quote_color_primary?: string;
          quote_color_text?: string;
          quote_color_secondary?: string;
          quote_font_size_base?: number;
          quote_font_size_service?: number;
          quote_font_size_price?: number;
          quote_margin_top?: number;
          quote_margin_right?: number;
          quote_margin_bottom?: number;
          quote_margin_left?: number;
          quote_sections?: {
            header_azienda: boolean;
            box_cliente: boolean;
            box_totali: boolean;
            footer: boolean;
            note_servizi: boolean;
            titolo_preventivo: boolean;
            allegato_tecnico: boolean;
            firma: boolean;
          };
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company_name?: string | null;
          ragione_sociale?: string | null;
          partita_iva?: string | null;
          codice_fiscale?: string | null;
          address?: string | null;
          cap?: string | null;
          city?: string | null;
          phone?: string | null;
          website?: string | null;
          logo_url?: string | null;
          hourly_cost?: number;
          sedi?: string[];
          quote_numbering_prefix?: string;
          quote_numbering_counter?: number;
          quote_numbering_digits?: number;
          quote_validity_days?: number;
          quote_payment_terms?: string | null;
          quote_payment_methods?: Array<{ name: string; iban?: string; details?: string }>;
          quote_signature_name?: string | null;
          quote_signature_role?: string | null;
          quote_signature_image?: string | null;
          quote_color_primary?: string;
          quote_color_text?: string;
          quote_color_secondary?: string;
          quote_font_size_base?: number;
          quote_font_size_service?: number;
          quote_font_size_price?: number;
          quote_margin_top?: number;
          quote_margin_right?: number;
          quote_margin_bottom?: number;
          quote_margin_left?: number;
          quote_sections?: {
            header_azienda: boolean;
            box_cliente: boolean;
            box_totali: boolean;
            footer: boolean;
            note_servizi: boolean;
            titolo_preventivo: boolean;
            allegato_tecnico: boolean;
            firma: boolean;
          };
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          ragione_sociale: string | null;
          insegna: string | null;
          cap: string | null;
          citta: string | null;
          partita_iva: string | null;
          pec: string | null;
          agente: string | null;
          sede: string | null;
          data_firma_contratto: string | null;
          data_attivazione: string | null;
          fine_contratto: string | null;
          limite_disdetta: string | null;
          commercial_id: string | null;
          commission_override: number | null;
          cpa: number | null;
          supplier_reel_id: string | null;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          address?: string | null;
          notes?: string | null;
          ragione_sociale?: string | null;
          insegna?: string | null;
          cap?: string | null;
          citta?: string | null;
          partita_iva?: string | null;
          pec?: string | null;
          agente?: string | null;
          sede?: string | null;
          data_firma_contratto?: string | null;
          data_attivazione?: string | null;
          fine_contratto?: string | null;
          limite_disdetta?: string | null;
          commercial_id?: string | null;
          commission_override?: number | null;
          cpa?: number | null;
          supplier_reel_id?: string | null;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          address?: string | null;
          notes?: string | null;
          ragione_sociale?: string | null;
          insegna?: string | null;
          cap?: string | null;
          citta?: string | null;
          partita_iva?: string | null;
          pec?: string | null;
          agente?: string | null;
          sede?: string | null;
          data_firma_contratto?: string | null;
          data_attivazione?: string | null;
          fine_contratto?: string | null;
          limite_disdetta?: string | null;
          commercial_id?: string | null;
          commission_override?: number | null;
          cpa?: number | null;
          supplier_reel_id?: string | null;
        };
        Relationships: [];
      };
      packages: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          description: string | null;
          price: number;
          duration_months: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          post_count: number;
          reel_count: number;
          carousel_count: number;
          video_count: number;
          shooting_cost: number;
          canone_una_tantum: number | null;
          durata_minima_mesi: number;
          sede: string | null;
          tipo_pacchetto: 'contenuto' | 'servizio';
          budget_pubblicitario: number | null;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          description?: string | null;
          price: number;
          duration_months?: number | null;
          is_active?: boolean;
          post_count?: number;
          reel_count?: number;
          carousel_count?: number;
          video_count?: number;
          shooting_cost?: number;
          canone_una_tantum?: number | null;
          durata_minima_mesi?: number;
          sede?: string | null;
          tipo_pacchetto?: 'contenuto' | 'servizio';
          budget_pubblicitario?: number | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          duration_months?: number | null;
          is_active?: boolean;
          post_count?: number;
          reel_count?: number;
          carousel_count?: number;
          video_count?: number;
          shooting_cost?: number;
          canone_una_tantum?: number | null;
          durata_minima_mesi?: number;
          sede?: string | null;
          tipo_pacchetto?: 'contenuto' | 'servizio';
          budget_pubblicitario?: number | null;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          account_id: string;
          client_id: string;
          title: string;
          status: 'active' | 'expired' | 'cancelled' | 'draft';
          start_date: string;
          end_date: string | null;
          total_value: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
          commercial_id: string | null;
          package_id: string | null;
          auto_renew: boolean;
          cancelled_at: string | null;
          renewal_count: number;
          canone_mensile: number;
        };
        Insert: {
          id?: string;
          account_id: string;
          client_id: string;
          title: string;
          status?: 'active' | 'expired' | 'cancelled' | 'draft';
          start_date: string;
          end_date?: string | null;
          total_value?: number;
          notes?: string | null;
          commercial_id?: string | null;
          package_id?: string | null;
          auto_renew?: boolean;
          cancelled_at?: string | null;
          renewal_count?: number;
          canone_mensile?: number;
        };
        Update: {
          client_id?: string;
          title?: string;
          status?: 'active' | 'expired' | 'cancelled' | 'draft';
          start_date?: string;
          end_date?: string | null;
          total_value?: number;
          notes?: string | null;
          commercial_id?: string | null;
          package_id?: string | null;
          auto_renew?: boolean;
          cancelled_at?: string | null;
          renewal_count?: number;
          canone_mensile?: number;
        };
        Relationships: [];
      };
      contract_items: {
        Row: {
          id: string;
          contract_id: string;
          package_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          package_id?: string | null;
          description: string;
          quantity?: number;
          unit_price?: number;
        };
        Update: {
          package_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [];
      };
      team_users: {
        Row: {
          id: string;
          account_id: string;
          user_id: string | null;
          name: string;
          email: string;
          role: 'owner' | 'admin' | 'member';
          avatar_url: string | null;
          is_active: boolean;
          status: 'pending' | 'active' | 'disabled';
          invite_token: string | null;
          invite_expires_at: string | null;
          // OneDigit permissions
          can_view_onedigit_dashboard: boolean;
          can_view_clients: boolean;
          can_view_packages: boolean;
          can_view_contracts: boolean;
          can_view_commercials: boolean;
          can_view_supplier_costs: boolean;
          can_view_storico_contratti: boolean;
          // QuoteBuilder permissions
          can_view_quotes: boolean;
          can_edit_quotes: boolean;
          can_view_servizi: boolean;
          can_view_bundle: boolean;
          can_send_quotes: boolean;
          can_view_impostazioni: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          user_id?: string | null;
          name: string;
          email: string;
          role?: 'owner' | 'admin' | 'member';
          avatar_url?: string | null;
          is_active?: boolean;
          status?: 'pending' | 'active' | 'disabled';
          invite_token?: string | null;
          invite_expires_at?: string | null;
          can_view_onedigit_dashboard?: boolean;
          can_view_clients?: boolean;
          can_view_packages?: boolean;
          can_view_contracts?: boolean;
          can_view_commercials?: boolean;
          can_view_supplier_costs?: boolean;
          can_view_storico_contratti?: boolean;
          can_view_quotes?: boolean;
          can_edit_quotes?: boolean;
          can_view_servizi?: boolean;
          can_view_bundle?: boolean;
          can_send_quotes?: boolean;
          can_view_impostazioni?: boolean;
        };
        Update: {
          user_id?: string | null;
          name?: string;
          email?: string;
          role?: 'owner' | 'admin' | 'member';
          avatar_url?: string | null;
          is_active?: boolean;
          status?: 'pending' | 'active' | 'disabled';
          invite_token?: string | null;
          invite_expires_at?: string | null;
          can_view_onedigit_dashboard?: boolean;
          can_view_clients?: boolean;
          can_view_packages?: boolean;
          can_view_contracts?: boolean;
          can_view_commercials?: boolean;
          can_view_supplier_costs?: boolean;
          can_view_storico_contratti?: boolean;
          can_view_quotes?: boolean;
          can_edit_quotes?: boolean;
          can_view_servizi?: boolean;
          can_view_bundle?: boolean;
          can_send_quotes?: boolean;
          can_view_impostazioni?: boolean;
        };
        Relationships: [];
      };
      commercials: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          commission_percent: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          commission_percent?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          commission_percent?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      supplier_price_list: {
        Row: {
          id: string;
          account_id: string;
          supplier_name: string;
          product_type: string;
          volume: number;
          unit_cost: number;
          created_at: string;
          cost_type: 'fisso' | 'variabile';
          supplier_id: string | null;
        };
        Insert: {
          id?: string;
          account_id: string;
          supplier_name: string;
          product_type: string;
          volume: number;
          unit_cost: number;
          cost_type?: 'fisso' | 'variabile';
          supplier_id?: string | null;
        };
        Update: {
          supplier_name?: string;
          product_type?: string;
          volume?: number;
          unit_cost?: number;
          cost_type?: 'fisso' | 'variabile';
          supplier_id?: string | null;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          account_id: string;
          nome: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          nome: string;
        };
        Update: {
          nome?: string;
        };
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          account_id: string;
          client_id: string | null;
          template_id: string | null;
          title: string;
          status: 'draft' | 'sent' | 'accepted' | 'rejected';
          valid_until: string | null;
          notes: string | null;
          total_amount: number;
          created_at: string;
          updated_at: string;
          quote_number: string | null;
          logo_url: string | null;
          show_iva: boolean;
          iva_percent: number;
          payment_terms: string | null;
          signature_name: string | null;
          signature_role: string | null;
          is_exported_word: boolean;
        };
        Insert: {
          id?: string;
          account_id: string;
          client_id?: string | null;
          template_id?: string | null;
          title: string;
          status?: 'draft' | 'sent' | 'accepted' | 'rejected';
          valid_until?: string | null;
          notes?: string | null;
          total_amount?: number;
          quote_number?: string | null;
          logo_url?: string | null;
          show_iva?: boolean;
          iva_percent?: number;
          payment_terms?: string | null;
          signature_name?: string | null;
          signature_role?: string | null;
          is_exported_word?: boolean;
        };
        Update: {
          client_id?: string | null;
          template_id?: string | null;
          title?: string;
          status?: 'draft' | 'sent' | 'accepted' | 'rejected';
          valid_until?: string | null;
          notes?: string | null;
          total_amount?: number;
          quote_number?: string | null;
          logo_url?: string | null;
          show_iva?: boolean;
          iva_percent?: number;
          payment_terms?: string | null;
          signature_name?: string | null;
          signature_role?: string | null;
          is_exported_word?: boolean;
        };
        Relationships: [];
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          name: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          sort_order: number;
          unit: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          name?: string | null;
          description: string;
          quantity?: number;
          unit_price?: number;
          sort_order?: number;
          unit?: string;
        };
        Update: {
          name?: string | null;
          description?: string;
          quantity?: number;
          unit_price?: number;
          sort_order?: number;
          unit?: string;
        };
        Relationships: [];
      };
      template_servizi: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          description: string | null;
          price: number;
          unit: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          description?: string | null;
          price: number;
          unit?: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          unit?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      bundle_progetti: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      bundle_items: {
        Row: {
          id: string;
          bundle_id: string;
          template_servizio_id: string;
          order_position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          bundle_id: string;
          template_servizio_id: string;
          order_position?: number;
        };
        Update: {
          order_position?: number;
        };
        Relationships: [];
      };
      quote_public_tokens: {
        Row: {
          id: string;
          quote_id: string;
          account_id: string;
          token: string;
          created_at: string;
          expires_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          quote_id: string;
          account_id: string;
          token?: string;
          expires_at: string;
          is_active?: boolean;
        };
        Update: {
          is_active?: boolean;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          account_id: string;
          quote_id: string | null;
          client_name: string;
          quote_number: string | null;
          action: 'accepted' | 'rejected';
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          quote_id?: string | null;
          client_name: string;
          quote_number?: string | null;
          action: 'accepted' | 'rejected';
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
      quote_templates: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          html_content: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          html_content: string;
          is_default?: boolean;
        };
        Update: {
          name?: string;
          html_content?: string;
          is_default?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Convenience types
export type Account = Database['public']['Tables']['accounts']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Package = Database['public']['Tables']['packages']['Row'];
export type Contract = Database['public']['Tables']['contracts']['Row'];
export type ContractItem = Database['public']['Tables']['contract_items']['Row'];
export type TeamUser = Database['public']['Tables']['team_users']['Row'];
export type Commercial = Database['public']['Tables']['commercials']['Row'];
export type SupplierPriceList = Database['public']['Tables']['supplier_price_list']['Row'];
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type Quote = Database['public']['Tables']['quotes']['Row'];
export type QuoteItem = Database['public']['Tables']['quote_items']['Row'];
export type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];
export type QuotePublicToken = Database['public']['Tables']['quote_public_tokens']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type TemplateServizio = Database['public']['Tables']['template_servizi']['Row'];
export type BundleProgetto = Database['public']['Tables']['bundle_progetti']['Row'];
export type BundleItem = Database['public']['Tables']['bundle_items']['Row'];
