export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accounting_entries: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string
          entry_date: string
          id: string
          month_key: string
          responsible_user_id: string | null
          responsible_user_name: string | null
          revenue_category: string | null
          revenue_sous_categorie: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          entry_date: string
          id?: string
          month_key: string
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          revenue_category?: string | null
          revenue_sous_categorie?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          entry_date?: string
          id?: string
          month_key?: string
          responsible_user_id?: string | null
          responsible_user_name?: string | null
          revenue_category?: string | null
          revenue_sous_categorie?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          related_id: string | null
          related_type: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string | null
          customer_id: string | null
          id: string
          is_default: boolean | null
          postal_code: string
          zone_id: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_default?: boolean | null
          postal_code: string
          zone_id?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_default?: boolean | null
          postal_code?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agency_accesses: {
        Row: {
          category: string
          created_at: string
          expires_at: string | null
          id: string
          label: string
          login_enc: string | null
          notes_enc: string | null
          password_enc: string | null
          provided_by: string | null
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          expires_at?: string | null
          id?: string
          label: string
          login_enc?: string | null
          notes_enc?: string | null
          password_enc?: string | null
          provided_by?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          label?: string
          login_enc?: string | null
          notes_enc?: string | null
          password_enc?: string | null
          provided_by?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      archived_accounting_entries: {
        Row: {
          amount: number | null
          archived_at: string | null
          category: string | null
          client_id: string | null
          created_by: string | null
          description: string | null
          entry_date: string | null
          id: string
          month_key: string | null
          original_data: Json | null
          original_id: string | null
          type: string | null
          user_id: string
          year: number
        }
        Insert: {
          amount?: number | null
          archived_at?: string | null
          category?: string | null
          client_id?: string | null
          created_by?: string | null
          description?: string | null
          entry_date?: string | null
          id?: string
          month_key?: string | null
          original_data?: Json | null
          original_id?: string | null
          type?: string | null
          user_id: string
          year: number
        }
        Update: {
          amount?: number | null
          archived_at?: string | null
          category?: string | null
          client_id?: string | null
          created_by?: string | null
          description?: string | null
          entry_date?: string | null
          id?: string
          month_key?: string | null
          original_data?: Json | null
          original_id?: string | null
          type?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      archived_projects: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          budget: number | null
          client_id: string | null
          client_name: string | null
          end_date: string | null
          id: string
          name: string | null
          original_data: Json | null
          original_id: string | null
          start_date: string | null
          status: string | null
          total_amount: number | null
          user_id: string
          year: number
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          budget?: number | null
          client_id?: string | null
          client_name?: string | null
          end_date?: string | null
          id?: string
          name?: string | null
          original_data?: Json | null
          original_id?: string | null
          start_date?: string | null
          status?: string | null
          total_amount?: number | null
          user_id: string
          year: number
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          budget?: number | null
          client_id?: string | null
          client_name?: string | null
          end_date?: string | null
          id?: string
          name?: string | null
          original_data?: Json | null
          original_id?: string | null
          start_date?: string | null
          status?: string | null
          total_amount?: number | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      archived_tasks: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          client_id: string | null
          completed_at: string | null
          id: string
          original_data: Json | null
          original_id: string | null
          project_id: string | null
          status: string | null
          title: string | null
          user_id: string
          year: number
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          id?: string
          original_data?: Json | null
          original_id?: string | null
          project_id?: string | null
          status?: string | null
          title?: string | null
          user_id: string
          year: number
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          client_id?: string | null
          completed_at?: string | null
          id?: string
          original_data?: Json | null
          original_id?: string | null
          project_id?: string | null
          status?: string | null
          title?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          actions_executed: Json | null
          executed_at: string | null
          from_value: string | null
          id: string
          project_id: string | null
          to_value: string | null
          trigger_type: string
        }
        Insert: {
          actions_executed?: Json | null
          executed_at?: string | null
          from_value?: string | null
          id?: string
          project_id?: string | null
          to_value?: string | null
          trigger_type: string
        }
        Update: {
          actions_executed?: Json | null
          executed_at?: string | null
          from_value?: string | null
          id?: string
          project_id?: string | null
          to_value?: string | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_invitations: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          project_id: string | null
          short_code: string | null
          status: string
          submitted_at: string | null
          token: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          short_code?: string | null
          status?: string
          submitted_at?: string | null
          token?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          short_code?: string | null
          status?: string
          submitted_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "brief_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      channel_members: {
        Row: {
          channel_id: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_read_status: {
        Row: {
          channel_id: string
          created_at: string | null
          id: string
          last_message_id: string | null
          last_read_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: string
          last_message_id?: string | null
          last_read_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: string
          last_message_id?: string | null
          last_read_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_read_status_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_read_status_last_message_id_fkey"
            columns: ["last_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          allowed_roles: string[] | null
          allowed_users: string[] | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      checklist_items_v2: {
        Row: {
          assigned_name: string | null
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string | null
          phase: string
          priority: string
          project_id: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_name?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          phase?: string
          priority?: string
          project_id: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_name?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          phase?: string
          priority?: string
          project_id?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_v2_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      client_post_assets: {
        Row: {
          asset_type: string
          asset_url: string | null
          created_at: string
          file_name: string | null
          id: string
          post_id: string
          storage_path: string | null
        }
        Insert: {
          asset_type?: string
          asset_url?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          post_id: string
          storage_path?: string | null
        }
        Update: {
          asset_type?: string
          asset_url?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          post_id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_post_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "client_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_post_comments: {
        Row: {
          author_id: string
          comment: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          comment: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "client_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_posts: {
        Row: {
          client_id: string | null
          content: string | null
          created_at: string
          hook: string | null
          id: string
          objective: string | null
          platform: string
          published_at: string | null
          responsible_user_id: string | null
          scheduled_at: string | null
          status: string
          strategic_angle: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          content?: string | null
          created_at?: string
          hook?: string | null
          id?: string
          objective?: string | null
          platform?: string
          published_at?: string | null
          responsible_user_id?: string | null
          scheduled_at?: string | null
          status?: string
          strategic_angle?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          content?: string | null
          created_at?: string
          hook?: string | null
          id?: string
          objective?: string | null
          platform?: string
          published_at?: string | null
          responsible_user_id?: string | null
          scheduled_at?: string | null
          status?: string
          strategic_angle?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_posts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_posts_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string
          assigned_to: string | null
          created_at: string | null
          email: string
          id: string
          last_contact: string | null
          name: string
          phone: string
          sector: string
          status: Database["public"]["Enums"]["client_status"]
          total_revenue: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          assigned_to?: string | null
          created_at?: string | null
          email: string
          id?: string
          last_contact?: string | null
          name: string
          phone: string
          sector: string
          status?: Database["public"]["Enums"]["client_status"]
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          assigned_to?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_contact?: string | null
          name?: string
          phone?: string
          sector?: string
          status?: Database["public"]["Enums"]["client_status"]
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          due_hour: number | null
          id: string
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_hour?: number | null
          id?: string
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_hour?: number | null
          id?: string
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_logo: string | null
          company_name: string
          company_phone: string | null
          company_website: string | null
          created_at: string | null
          default_currency: string | null
          default_tax_rate: number | null
          fiscal_year_start: number | null
          id: string
          invoice_prefix: string | null
          quote_prefix: string | null
          settings: Json | null
          tax_number: string | null
          updated_at: string | null
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_logo?: string | null
          company_name?: string
          company_phone?: string | null
          company_website?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_tax_rate?: number | null
          fiscal_year_start?: number | null
          id?: string
          invoice_prefix?: string | null
          quote_prefix?: string | null
          settings?: Json | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_logo?: string | null
          company_name?: string
          company_phone?: string | null
          company_website?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_tax_rate?: number | null
          fiscal_year_start?: number | null
          id?: string
          invoice_prefix?: string | null
          quote_prefix?: string | null
          settings?: Json | null
          tax_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_activities: {
        Row: {
          activity_date: string
          contact_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          follow_up_required: boolean | null
          id: string
          next_action: string | null
          outcome: string | null
          status: Database["public"]["Enums"]["activity_status"]
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_date: string
          contact_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          follow_up_required?: boolean | null
          id?: string
          next_action?: string | null
          outcome?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_date?: string
          contact_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          follow_up_required?: boolean | null
          id?: string
          next_action?: string | null
          outcome?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          lead_score: number | null
          name: string
          next_activity_date: string | null
          no_show: string | null
          notes: string[] | null
          phone: string | null
          project_price: number | null
          sector: string | null
          source: string | null
          status: Database["public"]["Enums"]["client_status"]
          tags: string[] | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          lead_score?: number | null
          name: string
          next_activity_date?: string | null
          no_show?: string | null
          notes?: string[] | null
          phone?: string | null
          project_price?: number | null
          sector?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          lead_score?: number | null
          name?: string
          next_activity_date?: string | null
          no_show?: string | null
          notes?: string[] | null
          phone?: string | null
          project_price?: number | null
          sector?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_bot_one_activities: {
        Row: {
          activity_date: string
          bot_one_record_id: string
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          activity_date: string
          bot_one_record_id: string
          created_at?: string
          description?: string | null
          id?: string
          status: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          bot_one_record_id?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_bot_one_activities_bot_one_record_id_fkey"
            columns: ["bot_one_record_id"]
            isOneToOne: false
            referencedRelation: "crm_bot_one_records"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_bot_one_columns: {
        Row: {
          column_name: string
          column_order: number | null
          column_type: string
          created_at: string | null
          default_value: string | null
          id: string
          is_default: boolean | null
          is_required: boolean | null
          options: Json | null
          user_id: string | null
          validation_rules: Json | null
        }
        Insert: {
          column_name: string
          column_order?: number | null
          column_type: string
          created_at?: string | null
          default_value?: string | null
          id?: string
          is_default?: boolean | null
          is_required?: boolean | null
          options?: Json | null
          user_id?: string | null
          validation_rules?: Json | null
        }
        Update: {
          column_name?: string
          column_order?: number | null
          column_type?: string
          created_at?: string | null
          default_value?: string | null
          id?: string
          is_default?: boolean | null
          is_required?: boolean | null
          options?: Json | null
          user_id?: string | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      crm_bot_one_records: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          next_activity_date: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          id?: string
          next_activity_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          next_activity_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      crm_columns: {
        Row: {
          color: string
          column_id: string
          created_at: string | null
          header_color: string
          id: string
          is_active: boolean
          position: number
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          color: string
          column_id: string
          created_at?: string | null
          header_color: string
          id?: string
          is_active?: boolean
          position: number
          sort_order?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          column_id?: string
          created_at?: string | null
          header_color?: string
          id?: string
          is_active?: boolean
          position?: number
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crmerp_activities: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          metadata: Json | null
          type: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          type: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crmerp_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crmerp_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crmerp_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crmerp_leads: {
        Row: {
          assignee_id: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          last_activity_at: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_activity_at?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_activity_at?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crmerp_leads_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          company_name: string | null
          created_at: string | null
          customer_type: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          loyalty_points: number | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          customer_type?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          loyalty_points?: number | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          customer_type?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          loyalty_points?: number | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_metrics: {
        Row: {
          created_at: string | null
          id: string
          month: string
          net_result: number
          total_expenses: number
          total_revenue: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: string
          net_result?: number
          total_expenses?: number
          total_revenue?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: string
          net_result?: number
          total_expenses?: number
          total_revenue?: number
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          cities: string[] | null
          created_at: string | null
          delivery_fee: number | null
          estimated_delivery_time: string | null
          free_delivery_threshold: number | null
          id: string
          is_active: boolean | null
          name: string
          postal_codes: string[] | null
        }
        Insert: {
          cities?: string[] | null
          created_at?: string | null
          delivery_fee?: number | null
          estimated_delivery_time?: string | null
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          postal_codes?: string[] | null
        }
        Update: {
          cities?: string[] | null
          created_at?: string | null
          delivery_fee?: number | null
          estimated_delivery_time?: string | null
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          postal_codes?: string[] | null
        }
        Relationships: []
      }
      events: {
        Row: {
          attendees: string[] | null
          client_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_all_day: boolean | null
          is_recurring: boolean | null
          location: string | null
          project_id: string | null
          recurrence_rule: string | null
          reminder_minutes: number | null
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendees?: string[] | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          is_all_day?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendees?: string[] | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_all_day?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          project_id?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      google_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expiry_date: string | null
          id: string
          refresh_token: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          refresh_token?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          refresh_token?: string | null
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          lead_id: string
          note: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          lead_id: string
          note: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          lead_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company_name: string
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          pipeline_stage: string | null
          position: number | null
          source: string | null
          status: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          position?: number | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          position?: number | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string | null
          id: string
          reply_to_message_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string | null
          id?: string
          reply_to_message_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string | null
          id?: string
          reply_to_message_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_accounting_metrics: {
        Row: {
          closed_at: string | null
          created_at: string | null
          expense_count: number | null
          id: string
          is_closed: boolean | null
          is_current_month: boolean | null
          month: string
          month_label: string
          net_result: number | null
          revenue_count: number | null
          total_expenses: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          expense_count?: number | null
          id?: string
          is_closed?: boolean | null
          is_current_month?: boolean | null
          month: string
          month_label: string
          net_result?: number | null
          revenue_count?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          expense_count?: number | null
          id?: string
          is_closed?: boolean | null
          is_current_month?: boolean | null
          month?: string
          month_label?: string
          net_result?: number | null
          revenue_count?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_emails: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          label: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          label?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          label?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          client_updates: boolean | null
          created_at: string | null
          deadline_alerts: boolean | null
          email_notifications: boolean | null
          id: string
          marketing_emails: boolean | null
          notification_frequency: string | null
          push_notifications: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_notifications: boolean | null
          task_reminders: boolean | null
          updated_at: string | null
          user_id: string
          weekly_reports: boolean | null
        }
        Insert: {
          client_updates?: boolean | null
          created_at?: string | null
          deadline_alerts?: boolean | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          notification_frequency?: string | null
          push_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_notifications?: boolean | null
          task_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_reports?: boolean | null
        }
        Update: {
          client_updates?: boolean | null
          created_at?: string | null
          deadline_alerts?: boolean | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          notification_frequency?: string | null
          push_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_notifications?: boolean | null
          task_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_reports?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_transactions: {
        Row: {
          accounting_entry_id: string | null
          amount: number
          created_at: string | null
          description: string | null
          id: string
          partner_id: string | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          accounting_entry_id?: string | null
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          partner_id?: string | null
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          accounting_entry_id?: string | null
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          partner_id?: string | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_transactions_accounting_entry_id_fkey"
            columns: ["accounting_entry_id"]
            isOneToOne: false
            referencedRelation: "accounting_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          share_percentage: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          share_percentage: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          share_percentage?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      personal_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          id: string
          priority: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_assets: {
        Row: {
          asset_type: string
          asset_url: string | null
          created_at: string
          file_name: string | null
          id: string
          post_id: string
          storage_path: string | null
        }
        Insert: {
          asset_type: string
          asset_url?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          post_id: string
          storage_path?: string | null
        }
        Update: {
          asset_type?: string
          asset_url?: string | null
          created_at?: string
          file_name?: string | null
          id?: string
          post_id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "kpi_top_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          comment: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          comment: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "kpi_top_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_metrics: {
        Row: {
          clicks: number | null
          comments_count: number | null
          created_at: string | null
          engagement: number | null
          engagement_rate: number | null
          id: string
          impressions: number | null
          leads_count: number | null
          measured_at: string | null
          performance_score: number | null
          post_id: string
          reach: number | null
          revenue: number | null
          saves: number | null
          shares: number | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          comments_count?: number | null
          created_at?: string | null
          engagement?: number | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          leads_count?: number | null
          measured_at?: string | null
          performance_score?: number | null
          post_id: string
          reach?: number | null
          revenue?: number | null
          saves?: number | null
          shares?: number | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          comments_count?: number | null
          created_at?: string | null
          engagement?: number | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          leads_count?: number | null
          measured_at?: string | null
          performance_score?: number | null
          post_id?: string
          reach?: number | null
          revenue?: number | null
          saves?: number | null
          shares?: number | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "kpi_top_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          client_id: string | null
          content: string | null
          created_at: string
          external_id: string | null
          external_url: string | null
          hook: string | null
          id: string
          objective: string | null
          platform: string
          published_at: string | null
          responsible_user_id: string | null
          scheduled_at: string | null
          status: string
          strategic_angle: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          content?: string | null
          created_at?: string
          external_id?: string | null
          external_url?: string | null
          hook?: string | null
          id?: string
          objective?: string | null
          platform: string
          published_at?: string | null
          responsible_user_id?: string | null
          scheduled_at?: string | null
          status?: string
          strategic_angle?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          content?: string | null
          created_at?: string
          external_id?: string | null
          external_url?: string | null
          hook?: string | null
          id?: string
          objective?: string | null
          platform?: string
          published_at?: string | null
          responsible_user_id?: string | null
          scheduled_at?: string | null
          status?: string
          strategic_angle?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      procedure_revisions: {
        Row: {
          change_note: string | null
          content: Json
          content_text: string | null
          edited_at: string
          edited_by: string | null
          id: string
          procedure_id: string
          summary: string | null
          title: string
        }
        Insert: {
          change_note?: string | null
          content: Json
          content_text?: string | null
          edited_at?: string
          edited_by?: string | null
          id?: string
          procedure_id: string
          summary?: string | null
          title: string
        }
        Update: {
          change_note?: string | null
          content?: Json
          content_text?: string | null
          edited_at?: string
          edited_by?: string | null
          id?: string
          procedure_id?: string
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_revisions_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_revisions_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: Json
          content_text: string | null
          created_at: string
          id: string
          is_archived: boolean
          is_pinned: boolean
          slug: string
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: Json
          content_text?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          slug: string
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: Json
          content_text?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          slug?: string
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedures_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "procedure_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_availability: {
        Row: {
          buffer_hours: number | null
          created_at: string | null
          end_date: string
          id: string
          product_id: string | null
          quantity: number
          reservation_id: string | null
          start_date: string
          status: string | null
        }
        Insert: {
          buffer_hours?: number | null
          created_at?: string | null
          end_date: string
          id?: string
          product_id?: string | null
          quantity?: number
          reservation_id?: string | null
          start_date: string
          status?: string | null
        }
        Update: {
          buffer_hours?: number | null
          created_at?: string | null
          end_date?: string
          id?: string
          product_id?: string | null
          quantity?: number
          reservation_id?: string | null
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_availability_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_availability_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_themes: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          theme_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          theme_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_themes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_themes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          images: string[] | null
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          pricing: Json
          slug: string
          specifications: Json | null
          total_stock: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          pricing?: Json
          slug: string
          specifications?: Json | null
          total_stock?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          pricing?: Json
          slug?: string
          specifications?: Json | null
          total_stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      project_accesses_v2: {
        Row: {
          category: string
          created_at: string
          detected_from_email: boolean
          expires_at: string | null
          id: string
          label: string
          login_enc: string | null
          notes_enc: string | null
          password_enc: string | null
          project_id: string
          provided_by: string | null
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          detected_from_email?: boolean
          expires_at?: string | null
          id?: string
          label: string
          login_enc?: string | null
          notes_enc?: string | null
          password_enc?: string | null
          project_id: string
          provided_by?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          detected_from_email?: boolean
          expires_at?: string | null
          id?: string
          label?: string
          login_enc?: string | null
          notes_enc?: string | null
          password_enc?: string | null
          project_id?: string
          provided_by?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_accesses_v2_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      project_activities_v2: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          id: string
          is_auto: boolean
          metadata: Json | null
          project_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          is_auto?: boolean
          metadata?: Json | null
          project_id: string
          type?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          is_auto?: boolean
          metadata?: Json | null
          project_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_activities_v2_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      project_briefs_v2: {
        Row: {
          created_at: string
          design_references: string | null
          id: string
          notes: string | null
          objective: string | null
          pages: string | null
          project_id: string
          status: string
          submitted_at: string | null
          target_audience: string | null
          techno: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          design_references?: string | null
          id?: string
          notes?: string | null
          objective?: string | null
          pages?: string | null
          project_id: string
          status?: string
          submitted_at?: string | null
          target_audience?: string | null
          techno?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          design_references?: string | null
          id?: string
          notes?: string | null
          objective?: string | null
          pages?: string | null
          project_id?: string
          status?: string
          submitted_at?: string | null
          target_audience?: string | null
          techno?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_briefs_v2_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      project_checklists: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          notes: string | null
          project_id: string
          role: Database["public"]["Enums"]["project_contact_role"]
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          role?: Database["public"]["Enums"]["project_contact_role"]
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          role?: Database["public"]["Enums"]["project_contact_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents_v2: {
        Row: {
          category: string
          created_at: string
          file_path: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          project_id: string
          uploaded_by: string | null
          uploader_name: string | null
          version: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          project_id: string
          uploaded_by?: string | null
          uploader_name?: string | null
          version?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          project_id?: string
          uploaded_by?: string | null
          uploader_name?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_v2_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      project_follow_ups_v2: {
        Row: {
          assigned_name: string | null
          assigned_to: string | null
          created_at: string
          date: string
          follow_up_action: string | null
          follow_up_date: string | null
          follow_up_done: boolean
          id: string
          project_id: string
          summary: string
          type: string
        }
        Insert: {
          assigned_name?: string | null
          assigned_to?: string | null
          created_at?: string
          date?: string
          follow_up_action?: string | null
          follow_up_date?: string | null
          follow_up_done?: boolean
          id?: string
          project_id: string
          summary: string
          type?: string
        }
        Update: {
          assigned_name?: string | null
          assigned_to?: string | null
          created_at?: string
          date?: string
          follow_up_action?: string | null
          follow_up_date?: string | null
          follow_up_done?: boolean
          id?: string
          project_id?: string
          summary?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_follow_ups_v2_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invoices_v2: {
        Row: {
          amount: number
          created_at: string
          date: string | null
          due_date: string | null
          id: string
          label: string
          notes: string | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string | null
          due_date?: string | null
          id?: string
          label: string
          notes?: string | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string | null
          due_date?: string | null
          id?: string
          label?: string
          notes?: string | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invoices_v2_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_to: string | null
          budget: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          position: number | null
          progress: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          position?: number | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          position?: number | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_v2: {
        Row: {
          ai_summary: Json | null
          ai_summary_generated_at: string | null
          assigned_name: string | null
          assigned_to: string | null
          brief_short_code: string | null
          brief_token: string | null
          brief_token_enabled: boolean | null
          budget: number | null
          category: string | null
          client_address: string | null
          client_company: string | null
          client_first_name: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          client_represented_by: string | null
          client_vat_number: string | null
          comm_status: string | null
          company_data: Json | null
          company_enriched_at: string | null
          completed_at: string | null
          completion_score: number | null
          created_at: string
          description: string | null
          end_date: string | null
          erp_status: string | null
          id: string
          is_archived: boolean
          last_activity_at: string | null
          legacy_project_id: string | null
          name: string
          next_action_due: string | null
          next_action_label: string | null
          portal_activated_at: string | null
          portal_activated_by: string | null
          portal_brand_logo_url: string | null
          portal_brand_primary_color: string | null
          portal_client_email: string | null
          portal_deactivated_at: string | null
          portal_deactivation_reason: string | null
          portal_enabled: boolean | null
          portal_expires_at: string | null
          portal_last_invite_sent_at: string | null
          portal_next_milestone_date: string | null
          portal_next_milestone_label: string | null
          portal_phase: string | null
          portal_previous_client_email: string | null
          portal_progress_percent: number | null
          portal_published_hours_worked: number | null
          portal_short_code: string | null
          portal_token: string | null
          portal_url_slug: string | null
          portal_visible: boolean | null
          presta_type: string[] | null
          priority: string
          progress: number | null
          siret: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_summary?: Json | null
          ai_summary_generated_at?: string | null
          assigned_name?: string | null
          assigned_to?: string | null
          brief_short_code?: string | null
          brief_token?: string | null
          brief_token_enabled?: boolean | null
          budget?: number | null
          category?: string | null
          client_address?: string | null
          client_company?: string | null
          client_first_name?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          client_represented_by?: string | null
          client_vat_number?: string | null
          comm_status?: string | null
          company_data?: Json | null
          company_enriched_at?: string | null
          completed_at?: string | null
          completion_score?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          erp_status?: string | null
          id?: string
          is_archived?: boolean
          last_activity_at?: string | null
          legacy_project_id?: string | null
          name: string
          next_action_due?: string | null
          next_action_label?: string | null
          portal_activated_at?: string | null
          portal_activated_by?: string | null
          portal_brand_logo_url?: string | null
          portal_brand_primary_color?: string | null
          portal_client_email?: string | null
          portal_deactivated_at?: string | null
          portal_deactivation_reason?: string | null
          portal_enabled?: boolean | null
          portal_expires_at?: string | null
          portal_last_invite_sent_at?: string | null
          portal_next_milestone_date?: string | null
          portal_next_milestone_label?: string | null
          portal_phase?: string | null
          portal_previous_client_email?: string | null
          portal_progress_percent?: number | null
          portal_published_hours_worked?: number | null
          portal_short_code?: string | null
          portal_token?: string | null
          portal_url_slug?: string | null
          portal_visible?: boolean | null
          presta_type?: string[] | null
          priority?: string
          progress?: number | null
          siret?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_summary?: Json | null
          ai_summary_generated_at?: string | null
          assigned_name?: string | null
          assigned_to?: string | null
          brief_short_code?: string | null
          brief_token?: string | null
          brief_token_enabled?: boolean | null
          budget?: number | null
          category?: string | null
          client_address?: string | null
          client_company?: string | null
          client_first_name?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          client_represented_by?: string | null
          client_vat_number?: string | null
          comm_status?: string | null
          company_data?: Json | null
          company_enriched_at?: string | null
          completed_at?: string | null
          completion_score?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          erp_status?: string | null
          id?: string
          is_archived?: boolean
          last_activity_at?: string | null
          legacy_project_id?: string | null
          name?: string
          next_action_due?: string | null
          next_action_label?: string | null
          portal_activated_at?: string | null
          portal_activated_by?: string | null
          portal_brand_logo_url?: string | null
          portal_brand_primary_color?: string | null
          portal_client_email?: string | null
          portal_deactivated_at?: string | null
          portal_deactivation_reason?: string | null
          portal_enabled?: boolean | null
          portal_expires_at?: string | null
          portal_last_invite_sent_at?: string | null
          portal_next_milestone_date?: string | null
          portal_next_milestone_label?: string | null
          portal_phase?: string | null
          portal_previous_client_email?: string | null
          portal_progress_percent?: number | null
          portal_published_hours_worked?: number | null
          portal_short_code?: string | null
          portal_token?: string | null
          portal_url_slug?: string | null
          portal_visible?: boolean | null
          presta_type?: string[] | null
          priority?: string
          progress?: number | null
          siret?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prospect_activities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          prospect_id: string | null
          scheduled_date: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          prospect_id?: string | null
          scheduled_date?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          prospect_id?: string | null
          scheduled_date?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reservation_items: {
        Row: {
          created_at: string | null
          duration_days: number
          id: string
          product_id: string | null
          quantity: number
          reservation_id: string | null
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          duration_days: number
          id?: string
          product_id?: string | null
          quantity?: number
          reservation_id?: string | null
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          duration_days?: number
          id?: string
          product_id?: string | null
          quantity?: number
          reservation_id?: string | null
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_items_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string | null
          customer_id: string | null
          delivery_address_id: string | null
          delivery_fee: number | null
          delivery_time: string | null
          delivery_type: string
          deposit_amount: number | null
          discount: number | null
          end_date: string
          event_type: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          payment_transaction_id: string | null
          start_date: string
          status: string | null
          subtotal: number | null
          total: number
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          delivery_address_id?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          delivery_type: string
          deposit_amount?: number | null
          discount?: number | null
          end_date: string
          event_type?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_transaction_id?: string | null
          start_date: string
          status?: string | null
          subtotal?: number | null
          total: number
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          delivery_address_id?: string | null
          delivery_fee?: number | null
          delivery_time?: string | null
          delivery_type?: string
          deposit_amount?: number | null
          discount?: number | null
          end_date?: string
          event_type?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_transaction_id?: string | null
          start_date?: string
          status?: string | null
          subtotal?: number | null
          total?: number
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_allocations: {
        Row: {
          amount: number
          created_at: string | null
          entry_id: string
          id: string
          revenue_category: string
          revenue_sous_categorie: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          entry_id: string
          id?: string
          revenue_category: string
          revenue_sous_categorie?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          entry_id?: string
          id?: string
          revenue_category?: string
          revenue_sous_categorie?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_allocations_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "accounting_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          access_token: string
          account_id: string | null
          account_name: string
          account_type: string
          connected_by: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          platform: string
          refresh_token: string | null
          sync_status: string
          token_expires_at: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          account_id?: string | null
          account_name: string
          account_type: string
          connected_by?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          platform: string
          refresh_token?: string | null
          sync_status?: string
          token_expires_at: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          account_id?: string | null
          account_name?: string
          account_type?: string
          connected_by?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          platform?: string
          refresh_token?: string | null
          sync_status?: string
          token_expires_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string | null
          id: string
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string | null
          id?: string
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string | null
          id?: string
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      themes: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          created_at: string | null
          duration: number | null
          id: string
          lead_email: string | null
          lead_name: string
          lead_phone: string | null
          notes: string | null
          result: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          created_at?: string | null
          duration?: number | null
          id?: string
          lead_email?: string | null
          lead_name: string
          lead_phone?: string | null
          notes?: string | null
          result?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          created_at?: string | null
          duration?: number | null
          id?: string
          lead_email?: string | null
          lead_name?: string
          lead_phone?: string | null
          notes?: string | null
          result?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_assign_tasks: boolean | null
          can_create_leads: boolean | null
          can_create_projects: boolean | null
          can_delete_leads: boolean | null
          can_edit_leads: boolean | null
          can_edit_projects: boolean | null
          can_view_chat: boolean | null
          can_view_dashboard: boolean | null
          can_view_finance: boolean | null
          can_view_financial_data: boolean | null
          can_view_leads: boolean | null
          can_view_projects: boolean | null
          can_view_settings: boolean | null
          can_view_tasks: boolean | null
          granted_at: string | null
          granted_by: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_assign_tasks?: boolean | null
          can_create_leads?: boolean | null
          can_create_projects?: boolean | null
          can_delete_leads?: boolean | null
          can_edit_leads?: boolean | null
          can_edit_projects?: boolean | null
          can_view_chat?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_finance?: boolean | null
          can_view_financial_data?: boolean | null
          can_view_leads?: boolean | null
          can_view_projects?: boolean | null
          can_view_settings?: boolean | null
          can_view_tasks?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_assign_tasks?: boolean | null
          can_create_leads?: boolean | null
          can_create_projects?: boolean | null
          can_delete_leads?: boolean | null
          can_edit_leads?: boolean | null
          can_edit_projects?: boolean | null
          can_view_chat?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_finance?: boolean | null
          can_view_financial_data?: boolean | null
          can_view_leads?: boolean | null
          can_view_projects?: boolean | null
          can_view_settings?: boolean | null
          can_view_tasks?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string | null
          name: string
          phone: string | null
          position: string | null
          role: Database["public"]["Enums"]["user_role"]
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          id: string
          is_active?: boolean | null
          language?: string | null
          name: string
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          name?: string
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          bio: string | null
          can_assign_tasks: boolean | null
          can_create_projects: boolean | null
          can_edit_leads: boolean | null
          can_edit_projects: boolean | null
          can_view_chat: boolean | null
          can_view_communication: boolean | null
          can_view_crm_bot_one: boolean | null
          can_view_crm_erp: boolean | null
          can_view_dashboard: boolean | null
          can_view_finance: boolean | null
          can_view_leads: boolean | null
          can_view_procedures: boolean
          can_view_projects: boolean | null
          can_view_settings: boolean | null
          can_view_tasks: boolean | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          language: string | null
          last_login: string | null
          name: string
          onboarding_completed: boolean
          phone: string | null
          portal_enabled: boolean | null
          portal_last_login_at: string | null
          portal_linked_project_id: string | null
          position: string | null
          role: Database["public"]["Enums"]["user_role"]
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          can_assign_tasks?: boolean | null
          can_create_projects?: boolean | null
          can_edit_leads?: boolean | null
          can_edit_projects?: boolean | null
          can_view_chat?: boolean | null
          can_view_communication?: boolean | null
          can_view_crm_bot_one?: boolean | null
          can_view_crm_erp?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_finance?: boolean | null
          can_view_leads?: boolean | null
          can_view_procedures?: boolean
          can_view_projects?: boolean | null
          can_view_settings?: boolean | null
          can_view_tasks?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_login?: string | null
          name: string
          onboarding_completed?: boolean
          phone?: string | null
          portal_enabled?: boolean | null
          portal_last_login_at?: string | null
          portal_linked_project_id?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          can_assign_tasks?: boolean | null
          can_create_projects?: boolean | null
          can_edit_leads?: boolean | null
          can_edit_projects?: boolean | null
          can_view_chat?: boolean | null
          can_view_communication?: boolean | null
          can_view_crm_bot_one?: boolean | null
          can_view_crm_erp?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_finance?: boolean | null
          can_view_leads?: boolean | null
          can_view_procedures?: boolean
          can_view_projects?: boolean | null
          can_view_settings?: boolean | null
          can_view_tasks?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_login?: string | null
          name?: string
          onboarding_completed?: boolean
          phone?: string | null
          portal_enabled?: boolean | null
          portal_last_login_at?: string | null
          portal_linked_project_id?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_portal_linked_project_id_fkey"
            columns: ["portal_linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      yearly_stats: {
        Row: {
          created_at: string | null
          id: string
          net_profit: number | null
          new_clients: number | null
          projects_completed: number | null
          stats_data: Json | null
          tasks_completed: number | null
          total_expenses: number | null
          total_income: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          net_profit?: number | null
          new_clients?: number | null
          projects_completed?: number | null
          stats_data?: Json | null
          tasks_completed?: number | null
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          net_profit?: number | null
          new_clients?: number | null
          projects_completed?: number | null
          stats_data?: Json | null
          tasks_completed?: number | null
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      kpi_daily_metrics: {
        Row: {
          avg_engagement_rate: number | null
          day: string | null
          engagement: number | null
          impressions: number | null
          leads_count: number | null
          platform: string | null
          posts_count: number | null
          reach: number | null
          revenue: number | null
          type: string | null
        }
        Relationships: []
      }
      kpi_monthly_overview: {
        Row: {
          avg_engagement_rate: number | null
          avg_performance_score: number | null
          month: string | null
          platform: string | null
          posts_count: number | null
          responsible_user_id: string | null
          roi_per_post: number | null
          total_clicks: number | null
          total_engagement: number | null
          total_impressions: number | null
          total_leads: number | null
          total_reach: number | null
          total_revenue: number | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_top_posts: {
        Row: {
          engagement: number | null
          engagement_rate: number | null
          id: string | null
          impressions: number | null
          leads_count: number | null
          performance_score: number | null
          platform: string | null
          published_at: string | null
          responsible_user_id: string | null
          revenue: number | null
          title: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      propulspace_documents_v2: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          document_type: string | null
          file_mime_type: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string | null
          name: string | null
          project_id: string | null
          uploaded_by_client: boolean | null
          version: number | null
          viewed_by_client_at: string | null
          visible_to_client: boolean | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          file_mime_type?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string | null
          name?: string | null
          project_id?: string | null
          uploaded_by_client?: boolean | null
          version?: number | null
          viewed_by_client_at?: string | null
          visible_to_client?: boolean | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          file_mime_type?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string | null
          name?: string | null
          project_id?: string | null
          uploaded_by_client?: boolean | null
          version?: number | null
          viewed_by_client_at?: string | null
          visible_to_client?: boolean | null
        }
        Relationships: []
      }
      propulspace_invoice_installments_v2: {
        Row: {
          amount: number | null
          due_date: string | null
          id: string | null
          installment_number: number | null
          invoice_id: string | null
          label: string | null
          paid_at: string | null
          status: string | null
          stripe_payment_link_url: string | null
        }
        Insert: {
          amount?: number | null
          due_date?: string | null
          id?: string | null
          installment_number?: number | null
          invoice_id?: string | null
          label?: string | null
          paid_at?: string | null
          status?: string | null
          stripe_payment_link_url?: string | null
        }
        Update: {
          amount?: number | null
          due_date?: string | null
          id?: string | null
          installment_number?: number | null
          invoice_id?: string | null
          label?: string | null
          paid_at?: string | null
          status?: string | null
          stripe_payment_link_url?: string | null
        }
        Relationships: []
      }
      propulspace_invoices_admin_v2: {
        Row: {
          amount_subtotal: number | null
          amount_total: number | null
          amount_vat: number | null
          client_snapshot: Json | null
          client_visible_notes: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          due_date: string | null
          id: string | null
          internal_notes: string | null
          invoice_number: string | null
          is_deposit: boolean | null
          is_locked: boolean | null
          issue_date: string | null
          line_items: Json | null
          paid_at: string | null
          pdf_hash_sha256: string | null
          pdf_url: string | null
          project_id: string | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_paid_at: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_link_id: string | null
          stripe_payment_link_url: string | null
          updated_at: string | null
          vat_rate: number | null
        }
        Insert: {
          amount_subtotal?: number | null
          amount_total?: number | null
          amount_vat?: number | null
          client_snapshot?: Json | null
          client_visible_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string | null
          internal_notes?: string | null
          invoice_number?: string | null
          is_deposit?: boolean | null
          is_locked?: boolean | null
          issue_date?: string | null
          line_items?: Json | null
          paid_at?: string | null
          pdf_hash_sha256?: string | null
          pdf_url?: string | null
          project_id?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_paid_at?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_link_id?: string | null
          stripe_payment_link_url?: string | null
          updated_at?: string | null
          vat_rate?: number | null
        }
        Update: {
          amount_subtotal?: number | null
          amount_total?: number | null
          amount_vat?: number | null
          client_snapshot?: Json | null
          client_visible_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string | null
          internal_notes?: string | null
          invoice_number?: string | null
          is_deposit?: boolean | null
          is_locked?: boolean | null
          issue_date?: string | null
          line_items?: Json | null
          paid_at?: string | null
          pdf_hash_sha256?: string | null
          pdf_url?: string | null
          project_id?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_paid_at?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_link_id?: string | null
          stripe_payment_link_url?: string | null
          updated_at?: string | null
          vat_rate?: number | null
        }
        Relationships: []
      }
      propulspace_invoices_v2: {
        Row: {
          amount_subtotal: number | null
          amount_total: number | null
          amount_vat: number | null
          client_snapshot: Json | null
          client_visible_notes: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string | null
          invoice_number: string | null
          is_deposit: boolean | null
          issue_date: string | null
          line_items: Json | null
          paid_at: string | null
          pdf_url: string | null
          project_id: string | null
          status: string | null
          stripe_payment_link_url: string | null
          vat_rate: number | null
        }
        Insert: {
          amount_subtotal?: number | null
          amount_total?: number | null
          amount_vat?: number | null
          client_snapshot?: Json | null
          client_visible_notes?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string | null
          invoice_number?: string | null
          is_deposit?: boolean | null
          issue_date?: string | null
          line_items?: Json | null
          paid_at?: string | null
          pdf_url?: string | null
          project_id?: string | null
          status?: string | null
          stripe_payment_link_url?: string | null
          vat_rate?: number | null
        }
        Update: {
          amount_subtotal?: number | null
          amount_total?: number | null
          amount_vat?: number | null
          client_snapshot?: Json | null
          client_visible_notes?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string | null
          invoice_number?: string | null
          is_deposit?: boolean | null
          issue_date?: string | null
          line_items?: Json | null
          paid_at?: string | null
          pdf_url?: string | null
          project_id?: string | null
          status?: string | null
          stripe_payment_link_url?: string | null
          vat_rate?: number | null
        }
        Relationships: []
      }
      propulspace_onboarding_v2: {
        Row: {
          access_credentials_vault_id: string | null
          availability_slots: string[] | null
          brand_voice_notes: string | null
          charter_uploaded: boolean | null
          completed_at: string | null
          completion_percent: number | null
          content_strategy: string | null
          content_uploaded: boolean | null
          created_at: string | null
          detailed_personas: Json | null
          email_notifications: boolean | null
          has_provided_dns_access: boolean | null
          has_provided_google_access: boolean | null
          has_provided_hosting_access: boolean | null
          has_provided_social_access: boolean | null
          id: string | null
          inherited_from_qualification_id: string | null
          is_complete: boolean | null
          kickoff_call_scheduled_at: string | null
          legal_mentions_provided: boolean | null
          logo_uploaded: boolean | null
          preferred_channel: string | null
          project_id: string | null
          updated_at: string | null
          welcome_company: string | null
          welcome_completed_at: string | null
          welcome_current_step: number | null
          welcome_dismissed_count: number | null
          welcome_first_name: string | null
          welcome_last_dismissed_at: string | null
          welcome_last_name: string | null
          welcome_phone: string | null
        }
        Insert: {
          access_credentials_vault_id?: string | null
          availability_slots?: string[] | null
          brand_voice_notes?: string | null
          charter_uploaded?: boolean | null
          completed_at?: string | null
          completion_percent?: number | null
          content_strategy?: string | null
          content_uploaded?: boolean | null
          created_at?: string | null
          detailed_personas?: Json | null
          email_notifications?: boolean | null
          has_provided_dns_access?: boolean | null
          has_provided_google_access?: boolean | null
          has_provided_hosting_access?: boolean | null
          has_provided_social_access?: boolean | null
          id?: string | null
          inherited_from_qualification_id?: string | null
          is_complete?: boolean | null
          kickoff_call_scheduled_at?: string | null
          legal_mentions_provided?: boolean | null
          logo_uploaded?: boolean | null
          preferred_channel?: string | null
          project_id?: string | null
          updated_at?: string | null
          welcome_company?: string | null
          welcome_completed_at?: string | null
          welcome_current_step?: number | null
          welcome_dismissed_count?: number | null
          welcome_first_name?: string | null
          welcome_last_dismissed_at?: string | null
          welcome_last_name?: string | null
          welcome_phone?: string | null
        }
        Update: {
          access_credentials_vault_id?: string | null
          availability_slots?: string[] | null
          brand_voice_notes?: string | null
          charter_uploaded?: boolean | null
          completed_at?: string | null
          completion_percent?: number | null
          content_strategy?: string | null
          content_uploaded?: boolean | null
          created_at?: string | null
          detailed_personas?: Json | null
          email_notifications?: boolean | null
          has_provided_dns_access?: boolean | null
          has_provided_google_access?: boolean | null
          has_provided_hosting_access?: boolean | null
          has_provided_social_access?: boolean | null
          id?: string | null
          inherited_from_qualification_id?: string | null
          is_complete?: boolean | null
          kickoff_call_scheduled_at?: string | null
          legal_mentions_provided?: boolean | null
          logo_uploaded?: boolean | null
          preferred_channel?: string | null
          project_id?: string | null
          updated_at?: string | null
          welcome_company?: string | null
          welcome_completed_at?: string | null
          welcome_current_step?: number | null
          welcome_dismissed_count?: number | null
          welcome_first_name?: string | null
          welcome_last_dismissed_at?: string | null
          welcome_last_name?: string | null
          welcome_phone?: string | null
        }
        Relationships: []
      }
      propulspace_project_steps_v2: {
        Row: {
          date_actual_end: string | null
          date_planned_end: string | null
          date_start: string | null
          description: string | null
          id: string | null
          label: string | null
          project_id: string | null
          status: string | null
          step_order: number | null
          visible_to_client: boolean | null
        }
        Insert: {
          date_actual_end?: string | null
          date_planned_end?: string | null
          date_start?: string | null
          description?: string | null
          id?: string | null
          label?: string | null
          project_id?: string | null
          status?: string | null
          step_order?: number | null
          visible_to_client?: boolean | null
        }
        Update: {
          date_actual_end?: string | null
          date_planned_end?: string | null
          date_start?: string | null
          description?: string | null
          id?: string | null
          label?: string | null
          project_id?: string | null
          status?: string | null
          step_order?: number | null
          visible_to_client?: boolean | null
        }
        Relationships: []
      }
      propulspace_signatures_v2: {
        Row: {
          created_at: string | null
          document_id: string | null
          docuseal_signed_pdf_url: string | null
          docuseal_signing_url: string | null
          expires_at: string | null
          id: string | null
          name: string | null
          project_id: string | null
          sent_at: string | null
          signature_type: string | null
          signed_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          docuseal_signed_pdf_url?: string | null
          docuseal_signing_url?: string | null
          expires_at?: string | null
          id?: string | null
          name?: string | null
          project_id?: string | null
          sent_at?: string | null
          signature_type?: string | null
          signed_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          docuseal_signed_pdf_url?: string | null
          docuseal_signing_url?: string | null
          expires_at?: string | null
          id?: string | null
          name?: string | null
          project_id?: string | null
          sent_at?: string | null
          signature_type?: string | null
          signed_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      qualification_leads_v2: {
        Row: {
          ae_assigned: string | null
          brand_guide_url: string | null
          budget_range: string | null
          business_sector: string | null
          business_sector_custom: string | null
          company_name: string | null
          competitors: string | null
          contacted_at: string | null
          converted_at: string | null
          converted_to_project_id: string | null
          created_at: string | null
          desired_features: string[] | null
          desired_timeline: string | null
          draft_progress_percent: number | null
          ecommerce_platform: string | null
          email: string | null
          existing_site_screenshots: Json | null
          existing_site_url: string | null
          final_cta_choice: string | null
          full_name: string | null
          has_domain_only: boolean | null
          has_existing_site: boolean | null
          has_visual_identity: string | null
          health_specific_needs: string | null
          id: string | null
          ip_address: unknown
          is_decision_maker: string | null
          logo_file_url: string | null
          main_goal: string | null
          main_problems: string[] | null
          monthly_orders_range: string | null
          monthly_traffic: string | null
          notes: string | null
          pappers_enrichment: Json | null
          phone: string | null
          preferred_contact_method: string | null
          product_count_range: string | null
          quality_score: number | null
          quality_score_breakdown: Json | null
          reservation_type: string | null
          source: string | null
          status: string | null
          submitted_at: string | null
          target_audience: string | null
          timeline_reason: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          wants_identity_creation: boolean | null
        }
        Insert: {
          ae_assigned?: string | null
          brand_guide_url?: string | null
          budget_range?: string | null
          business_sector?: string | null
          business_sector_custom?: string | null
          company_name?: string | null
          competitors?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          converted_to_project_id?: string | null
          created_at?: string | null
          desired_features?: string[] | null
          desired_timeline?: string | null
          draft_progress_percent?: number | null
          ecommerce_platform?: string | null
          email?: string | null
          existing_site_screenshots?: Json | null
          existing_site_url?: string | null
          final_cta_choice?: string | null
          full_name?: string | null
          has_domain_only?: boolean | null
          has_existing_site?: boolean | null
          has_visual_identity?: string | null
          health_specific_needs?: string | null
          id?: string | null
          ip_address?: unknown
          is_decision_maker?: string | null
          logo_file_url?: string | null
          main_goal?: string | null
          main_problems?: string[] | null
          monthly_orders_range?: string | null
          monthly_traffic?: string | null
          notes?: string | null
          pappers_enrichment?: Json | null
          phone?: string | null
          preferred_contact_method?: string | null
          product_count_range?: string | null
          quality_score?: number | null
          quality_score_breakdown?: Json | null
          reservation_type?: string | null
          source?: string | null
          status?: string | null
          submitted_at?: string | null
          target_audience?: string | null
          timeline_reason?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          wants_identity_creation?: boolean | null
        }
        Update: {
          ae_assigned?: string | null
          brand_guide_url?: string | null
          budget_range?: string | null
          business_sector?: string | null
          business_sector_custom?: string | null
          company_name?: string | null
          competitors?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          converted_to_project_id?: string | null
          created_at?: string | null
          desired_features?: string[] | null
          desired_timeline?: string | null
          draft_progress_percent?: number | null
          ecommerce_platform?: string | null
          email?: string | null
          existing_site_screenshots?: Json | null
          existing_site_url?: string | null
          final_cta_choice?: string | null
          full_name?: string | null
          has_domain_only?: boolean | null
          has_existing_site?: boolean | null
          has_visual_identity?: string | null
          health_specific_needs?: string | null
          id?: string | null
          ip_address?: unknown
          is_decision_maker?: string | null
          logo_file_url?: string | null
          main_goal?: string | null
          main_problems?: string[] | null
          monthly_orders_range?: string | null
          monthly_traffic?: string | null
          notes?: string | null
          pappers_enrichment?: Json | null
          phone?: string | null
          preferred_contact_method?: string | null
          product_count_range?: string | null
          quality_score?: number | null
          quality_score_breakdown?: Json | null
          reservation_type?: string | null
          source?: string | null
          status?: string | null
          submitted_at?: string | null
          target_audience?: string | null
          timeline_reason?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          wants_identity_creation?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      _access_passphrase: { Args: never; Returns: string }
      call_admin_update_password_function: {
        Args: {
          new_password: string
          supabase_url: string
          target_user_email: string
        }
        Returns: Json
      }
      can_access_channel: {
        Args: { channel_uuid: string; user_uuid: string }
        Returns: boolean
      }
      create_bot_one_activity: {
        Args: {
          p_activity_date?: string
          p_description?: string
          p_record_id: string
          p_status?: string
          p_title: string
          p_type?: string
        }
        Returns: string
      }
      create_bot_one_record_activity: {
        Args: {
          p_activity_date?: string
          p_description?: string
          p_priority?: string
          p_record_id: string
          p_status?: string
          p_title: string
          p_type?: string
        }
        Returns: string
      }
      create_client_from_bot_one_record: {
        Args: { p_record_id: string }
        Returns: string
      }
      create_user_profile_if_missing: {
        Args: { auth_user_uuid: string }
        Returns: boolean
      }
      delete_access: { Args: { p_id: string }; Returns: undefined }
      delete_agency_access: { Args: { p_id: string }; Returns: undefined }
      format_french_date: { Args: { timestamp_value: string }; Returns: string }
      get_access_metadata: {
        Args: { p_project_id: string }
        Returns: {
          category: string
          created_at: string
          detected_from_email: boolean
          expires_at: string
          id: string
          label: string
          project_id: string
          provided_by: string
          status: string
          updated_at: string
          url: string
        }[]
      }
      get_accessible_channels: {
        Args: { user_uuid: string }
        Returns: {
          access_type: string
          description: string
          id: string
          is_public: boolean
          name: string
        }[]
      }
      get_agency_access_metadata: {
        Args: never
        Returns: {
          category: string
          created_at: string
          expires_at: string
          id: string
          label: string
          login: string
          notes: string
          password: string
          provided_by: string
          status: string
          updated_at: string
          url: string
        }[]
      }
      get_bot_one_activities: {
        Args: { p_record_id: string }
        Returns: {
          activity_date: string
          created_at: string
          description: string
          id: string
          status: string
          title: string
          type: string
          updated_at: string
        }[]
      }
      get_brief_by_short_code: { Args: { p_short_code: string }; Returns: Json }
      get_channel_members: {
        Args: { channel_uuid: string }
        Returns: {
          email: string
          joined_at: string
          name: string
          role: string
          user_id: string
        }[]
      }
      get_channel_unread_count: {
        Args: { p_channel_id: string; p_user_id: string }
        Returns: number
      }
      get_commercial_chart_data: {
        Args: { date_from?: string }
        Returns: {
          calls: number
          date: string
          deals: number
          deals_value: number
          rdv: number
        }[]
      }
      get_commercial_kpis: {
        Args: { date_from?: string }
        Returns: {
          calleur_id: string
          calleur_name: string
          calls_count: number
          calls_percentage: number
          calls_target: number
          conversion_rate: number
          deals_count: number
          deals_percentage: number
          deals_target: number
          deals_value: number
          level: number
          period: string
          points_total: number
          rdv_count: number
          rdv_percentage: number
          rdv_target: number
          show_up_rate: number
        }[]
      }
      get_commercial_leaderboard: {
        Args: { date_from?: string }
        Returns: {
          badges_count: number
          calleur_id: string
          calleur_name: string
          calls_count: number
          deals_count: number
          deals_value: number
          level: number
          points: number
          rank: number
          rdv_count: number
        }[]
      }
      get_decrypted_accesses: {
        Args: { p_project_id: string }
        Returns: {
          category: string
          created_at: string
          detected_from_email: boolean
          expires_at: string
          id: string
          label: string
          login: string
          notes: string
          password: string
          project_id: string
          provided_by: string
          status: string
          updated_at: string
          url: string
        }[]
      }
      get_decrypted_agency_accesses: {
        Args: never
        Returns: {
          category: string
          created_at: string
          expires_at: string
          id: string
          label: string
          login: string
          notes: string
          password: string
          provided_by: string
          status: string
          updated_at: string
          url: string
        }[]
      }
      get_portal_data: { Args: { p_short_code: string }; Returns: Json }
      get_reply_message_info: {
        Args: { reply_message_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          sender_name: string
        }[]
      }
      get_user_daily_stats: {
        Args: { input_user_id: string; target_date?: string }
        Returns: {
          calls_count: number
          date: string
          meetings_count: number
          total_activities: number
          user_id: string
        }[]
      }
      get_user_stats: {
        Args: { input_user_id: string }
        Returns: {
          last_activity_date: string
          total_activities: number
          total_calls: number
          total_meetings: number
          user_id: string
        }[]
      }
      get_users_list: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          id: string
          name: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_channel_admin: {
        Args: { channel_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_manager_or_admin: { Args: never; Returns: boolean }
      mark_channel_as_read: {
        Args: { p_channel_id: string; p_user_id: string }
        Returns: undefined
      }
      procedures_fts_vector: {
        Args: {
          p_content_text: string
          p_summary: string
          p_tags: string[]
          p_title: string
        }
        Returns: unknown
      }
      qualif_create_draft: {
        Args: {
          p_source?: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: {
          lead_id: string
          session_token: string
        }[]
      }
      qualif_get_draft: {
        Args: { p_token: string }
        Returns: {
          brand_guide_url: string
          budget_range: string
          business_sector: string
          business_sector_custom: string
          company_name: string
          competitors: string
          created_at: string
          desired_features: string[]
          desired_timeline: string
          draft_progress_percent: number
          ecommerce_platform: string
          email: string
          existing_site_screenshots: Json
          existing_site_url: string
          final_cta_choice: string
          full_name: string
          has_domain_only: boolean
          has_existing_site: boolean
          has_visual_identity: string
          health_specific_needs: string
          id: string
          is_decision_maker: string
          logo_file_url: string
          main_goal: string
          main_problems: string[]
          monthly_orders_range: string
          monthly_traffic: string
          phone: string
          preferred_contact_method: string
          product_count_range: string
          reservation_type: string
          status: string
          target_audience: string
          timeline_reason: string
          updated_at: string
          wants_identity_creation: boolean
        }[]
      }
      qualif_update_draft: {
        Args: { p_payload: Json; p_token: string }
        Returns: string
      }
      refresh_kpi_views: { Args: never; Returns: undefined }
      search_procedures: {
        Args: { q: string }
        Returns: {
          author_id: string | null
          category_id: string | null
          content: Json
          content_text: string | null
          created_at: string
          id: string
          is_archived: boolean
          is_pinned: boolean
          slug: string
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          updated_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "procedures"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sync_all_bot_one_to_clients: {
        Args: never
        Returns: {
          clients_created: number
          clients_updated: number
          records_processed: number
        }[]
      }
      sync_bot_one_activity_to_main: {
        Args: { activity_data: Json }
        Returns: string
      }
      sync_bot_one_record_to_client: {
        Args: { p_record_id: string }
        Returns: string
      }
      update_admin_password_direct:
        | { Args: never; Returns: Json }
        | { Args: { new_password: string; user_email: string }; Returns: Json }
      update_admin_password_via_api: {
        Args: {
          new_password: string
          service_role_key: string
          supabase_url: string
          user_email: string
        }
        Returns: Json
      }
      update_bot_one_activity: {
        Args: {
          p_activity_date?: string
          p_activity_id: string
          p_description?: string
          p_status?: string
          p_title?: string
          p_type?: string
        }
        Returns: boolean
      }
      update_client_from_bot_one_record: {
        Args: { p_record_id: string }
        Returns: boolean
      }
      upsert_access: {
        Args: {
          p_category: string
          p_expires_at: string
          p_id: string
          p_label: string
          p_login: string
          p_notes: string
          p_password: string
          p_project_id: string
          p_provided_by: string
          p_status: string
          p_url: string
        }
        Returns: string
      }
      upsert_agency_access: {
        Args: {
          p_category: string
          p_expires_at: string
          p_id: string
          p_label: string
          p_login: string
          p_notes: string
          p_password: string
          p_provided_by: string
          p_status: string
          p_url: string
        }
        Returns: string
      }
      upsert_brief_by_short_code: {
        Args: { p_fields: Json; p_short_code: string }
        Returns: Json
      }
    }
    Enums: {
      activity_status: "scheduled" | "completed" | "cancelled"
      activity_type: "call" | "email" | "meeting" | "note" | "task"
      campaign_status: "draft" | "active" | "paused" | "completed" | "cancelled"
      campaign_type: "email" | "social" | "seo" | "ads" | "content" | "webinar"
      client_status:
        | "prospect"
        | "proposition_envoyee"
        | "meeting_booke"
        | "offre_envoyee"
        | "en_attente"
        | "signe"
        | "presentation_envoyee"
        | "prospects"
        | "signes"
        | "en_negociation"
      event_type:
        | "rdv_client"
        | "deadline"
        | "livraison"
        | "suivi"
        | "marketing"
        | "formation"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      project_contact_role:
        | "primary"
        | "decision_maker"
        | "technical"
        | "billing"
        | "other"
      project_status:
        | "planning"
        | "in_progress"
        | "review"
        | "completed"
        | "on_hold"
      quote_status: "draft" | "sent" | "viewed" | "signed" | "rejected"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "waiting" | "done"
      user_role:
        | "admin"
        | "sales"
        | "marketing"
        | "developer"
        | "manager"
        | "ops"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_status: ["scheduled", "completed", "cancelled"],
      activity_type: ["call", "email", "meeting", "note", "task"],
      campaign_status: ["draft", "active", "paused", "completed", "cancelled"],
      campaign_type: ["email", "social", "seo", "ads", "content", "webinar"],
      client_status: [
        "prospect",
        "proposition_envoyee",
        "meeting_booke",
        "offre_envoyee",
        "en_attente",
        "signe",
        "presentation_envoyee",
        "prospects",
        "signes",
        "en_negociation",
      ],
      event_type: [
        "rdv_client",
        "deadline",
        "livraison",
        "suivi",
        "marketing",
        "formation",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      project_contact_role: [
        "primary",
        "decision_maker",
        "technical",
        "billing",
        "other",
      ],
      project_status: [
        "planning",
        "in_progress",
        "review",
        "completed",
        "on_hold",
      ],
      quote_status: ["draft", "sent", "viewed", "signed", "rejected"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "waiting", "done"],
      user_role: ["admin", "sales", "marketing", "developer", "manager", "ops"],
    },
  },
} as const
