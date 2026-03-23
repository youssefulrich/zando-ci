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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blocked_dates: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          item_id: string
          item_type: string
          owner_id: string | null
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          item_id: string
          item_type: string
          owner_id?: string | null
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          item_id?: string
          item_type?: string
          owner_id?: string | null
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          client_name: string
          client_note: string | null
          client_phone: string
          commission_amount: number
          commission_rate: number
          created_at: string
          end_date: string | null
          id: string
          item_id: string
          item_type: string
          owner_amount: number
          reference: string
          start_date: string | null
          status: string
          tickets_count: number | null
          total_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_name: string
          client_note?: string | null
          client_phone: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          end_date?: string | null
          id?: string
          item_id: string
          item_type: string
          owner_amount?: number
          reference?: string
          start_date?: string | null
          status?: string
          tickets_count?: number | null
          total_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_name?: string
          client_note?: string | null
          client_phone?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          end_date?: string | null
          id?: string
          item_id?: string
          item_type?: string
          owner_amount?: number
          reference?: string
          start_date?: string | null
          status?: string
          tickets_count?: number | null
          total_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string
          description: string | null
          event_date: string
          event_time: string
          id: string
          lat: number | null
          lng: number | null
          main_photo: string | null
          owner_id: string
          photos: string[] | null
          price_per_ticket: number
          status: string
          tickets_sold: number
          title: string
          total_capacity: number
          updated_at: string
          venue_address: string
          venue_name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          event_date: string
          event_time: string
          id?: string
          lat?: number | null
          lng?: number | null
          main_photo?: string | null
          owner_id: string
          photos?: string[] | null
          price_per_ticket: number
          status?: string
          tickets_sold?: number
          title: string
          total_capacity: number
          updated_at?: string
          venue_address: string
          venue_name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string
          id?: string
          lat?: number | null
          lng?: number | null
          main_photo?: string | null
          owner_id?: string
          photos?: string[] | null
          price_per_ticket?: number
          status?: string
          tickets_sold?: number
          title?: string
          total_capacity?: number
          updated_at?: string
          venue_address?: string
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhooks: {
        Row: {
          created_at: string
          event_type: string
          genius_pay_id: string | null
          id: string
          payload: Json
          processed: boolean
        }
        Insert: {
          created_at?: string
          event_type: string
          genius_pay_id?: string | null
          id?: string
          payload: Json
          processed?: boolean
        }
        Update: {
          created_at?: string
          event_type?: string
          genius_pay_id?: string | null
          id?: string
          payload?: Json
          processed?: boolean
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          commission_amount: number
          completed_at: string | null
          created_at: string
          currency: string
          genius_pay_id: string | null
          id: string
          mobile_phone: string | null
          owner_amount: number
          payment_method: string | null
          payment_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          commission_amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          genius_pay_id?: string | null
          id?: string
          mobile_phone?: string | null
          owner_amount?: number
          payment_method?: string | null
          payment_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          commission_amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          genius_pay_id?: string | null
          id?: string
          mobile_phone?: string | null
          owner_amount?: number
          payment_method?: string | null
          payment_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "owner_earnings"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_admin: boolean | null
          moov_money: string | null
          mtn_money: string | null
          orange_money: string | null
          phone: string | null
          updated_at: string
          wave: string | null
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          is_admin?: boolean | null
          moov_money?: string | null
          mtn_money?: string | null
          orange_money?: string | null
          phone?: string | null
          updated_at?: string
          wave?: string | null
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_admin?: boolean | null
          moov_money?: string | null
          mtn_money?: string | null
          orange_money?: string | null
          phone?: string | null
          updated_at?: string
          wave?: string | null
        }
        Relationships: []
      }
      residences: {
        Row: {
          address: string | null
          amenities: string[] | null
          bathrooms: number
          bedrooms: number
          city: string
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          lat: number | null
          lng: number | null
          main_photo: string | null
          max_guests: number
          owner_id: string
          photos: string[] | null
          price_per_night: number
          status: string
          surface: number | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          city: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          lat?: number | null
          lng?: number | null
          main_photo?: string | null
          max_guests?: number
          owner_id: string
          photos?: string[] | null
          price_per_night: number
          status?: string
          surface?: number | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          lat?: number | null
          lng?: number | null
          main_photo?: string | null
          max_guests?: number
          owner_id?: string
          photos?: string[] | null
          price_per_night?: number
          status?: string
          surface?: number | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "residences_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          city: string
          created_at: string
          description: string | null
          fuel: string
          id: string
          is_available: boolean
          main_photo: string | null
          mileage: number | null
          model: string
          owner_id: string
          photos: string[] | null
          price_per_day: number
          rental_conditions: Json | null
          seats: number
          status: string
          title: string
          transmission: string
          type: string
          updated_at: string
          year: number
        }
        Insert: {
          brand: string
          city: string
          created_at?: string
          description?: string | null
          fuel: string
          id?: string
          is_available?: boolean
          main_photo?: string | null
          mileage?: number | null
          model: string
          owner_id: string
          photos?: string[] | null
          price_per_day: number
          rental_conditions?: Json | null
          seats?: number
          status?: string
          title: string
          transmission: string
          type: string
          updated_at?: string
          year: number
        }
        Update: {
          brand?: string
          city?: string
          created_at?: string
          description?: string | null
          fuel?: string
          id?: string
          is_available?: boolean
          main_photo?: string | null
          mileage?: number | null
          model?: string
          owner_id?: string
          photos?: string[] | null
          price_per_day?: number
          rental_conditions?: Json | null
          seats?: number
          status?: string
          title?: string
          transmission?: string
          type?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      owner_earnings: {
        Row: {
          booking_id: string | null
          client_id: string | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string | null
          item_id: string | null
          item_type: string | null
          owner_amount: number | null
          owner_id: string | null
          paid_at: string | null
          payment_status: string | null
          reference: string | null
          status: string | null
          total_price: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cancel_expired_bookings: { Args: never; Returns: undefined }
      decrement_tickets: {
        Args: { count: number; event_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
