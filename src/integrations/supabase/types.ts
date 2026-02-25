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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          body_location: string | null
          business_id: string
          client_city: string | null
          client_cpf: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_whatsapp: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          end_time: string | null
          has_previous_tattoo: boolean | null
          id: string
          observations: string | null
          professional_id: string | null
          reference_photo_url: string | null
          service_id: string | null
          size_cm: number | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          tattoo_value: number | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          body_location?: string | null
          business_id: string
          client_city?: string | null
          client_cpf?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_whatsapp?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          end_time?: string | null
          has_previous_tattoo?: boolean | null
          id?: string
          observations?: string | null
          professional_id?: string | null
          reference_photo_url?: string | null
          service_id?: string | null
          size_cm?: number | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          tattoo_value?: number | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          body_location?: string | null
          business_id?: string
          client_city?: string | null
          client_cpf?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_whatsapp?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          end_time?: string | null
          has_previous_tattoo?: boolean | null
          id?: string
          observations?: string | null
          professional_id?: string | null
          reference_photo_url?: string | null
          service_id?: string | null
          size_cm?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          tattoo_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          address_zip: string | null
          auto_accept_appointments: boolean | null
          avatar_url: string | null
          city: string | null
          cpf: string
          created_at: string
          email: string
          grace_period_until: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          message_template_client: string | null
          message_template_professional: string | null
          name: string
          operating_hours: Json | null
          owner_id: string
          premium_plan: string | null
          premium_status: Database["public"]["Enums"]["premium_status"] | null
          premium_until: string | null
          slug: string
          theme_primary_color: string | null
          theme_secondary_color: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          address_zip?: string | null
          auto_accept_appointments?: boolean | null
          avatar_url?: string | null
          city?: string | null
          cpf: string
          created_at?: string
          email: string
          grace_period_until?: string | null
          id?: string
          industry: Database["public"]["Enums"]["industry_type"]
          message_template_client?: string | null
          message_template_professional?: string | null
          name: string
          operating_hours?: Json | null
          owner_id: string
          premium_plan?: string | null
          premium_status?: Database["public"]["Enums"]["premium_status"] | null
          premium_until?: string | null
          slug: string
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          address_zip?: string | null
          auto_accept_appointments?: boolean | null
          avatar_url?: string | null
          city?: string | null
          cpf?: string
          created_at?: string
          email?: string
          grace_period_until?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          message_template_client?: string | null
          message_template_professional?: string | null
          name?: string
          operating_hours?: Json | null
          owner_id?: string
          premium_plan?: string | null
          premium_status?: Database["public"]["Enums"]["premium_status"] | null
          premium_until?: string | null
          slug?: string
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          business_id: string
          city: string | null
          cpf: string
          created_at: string
          email: string | null
          id: string
          name: string
          neighborhood: string | null
          notes: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          business_id: string
          city?: string | null
          cpf: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          notes?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          business_id?: string
          city?: string | null
          cpf?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          notes?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number | null
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_images_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean | null
          business_id: string
          created_at: string
          id: string
          name: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean | null
          business_id: string
          created_at?: string
          id?: string
          name: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean | null
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean | null
          business_id: string
          created_at: string
          duration_minutes: number
          id: string
          name: string
          price: number | null
        }
        Insert: {
          active?: boolean | null
          business_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          name: string
          price?: number | null
        }
        Update: {
          active?: boolean | null
          business_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          used: boolean | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          email: string | null
          error_message: string | null
          event_type: string
          id: string
          plan_applied: string | null
          raw_payload: Json | null
          status_processing: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          plan_applied?: string | null
          raw_payload?: Json | null
          status_processing?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          plan_applied?: string | null
          raw_payload?: Json | null
          status_processing?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      businesses_public: {
        Row: {
          auto_accept_appointments: boolean | null
          avatar_url: string | null
          city: string | null
          id: string | null
          industry: Database["public"]["Enums"]["industry_type"] | null
          name: string | null
          operating_hours: Json | null
          slug: string | null
          theme_primary_color: string | null
          theme_secondary_color: string | null
        }
        Insert: {
          auto_accept_appointments?: boolean | null
          avatar_url?: string | null
          city?: string | null
          id?: string | null
          industry?: Database["public"]["Enums"]["industry_type"] | null
          name?: string | null
          operating_hours?: Json | null
          slug?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
        }
        Update: {
          auto_accept_appointments?: boolean | null
          avatar_url?: string | null
          city?: string | null
          id?: string | null
          industry?: Database["public"]["Enums"]["industry_type"] | null
          name?: string | null
          operating_hours?: Json | null
          slug?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_business_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: { Args: { _user_id: string }; Returns: boolean }
      is_business_owner: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "adm" | "premium"
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
      industry_type: "tattoo" | "barber" | "salon"
      premium_status: "active" | "past_due" | "inactive" | "trial"
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
      app_role: ["adm", "premium"],
      appointment_status: ["pending", "confirmed", "cancelled", "completed"],
      industry_type: ["tattoo", "barber", "salon"],
      premium_status: ["active", "past_due", "inactive", "trial"],
    },
  },
} as const
