// Générer avec : npx supabase gen types typescript --project-id VOTRE_ID > types/supabase.ts
// En attendant, ce placeholder évite les erreurs TypeScript

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          city: string | null
          avatar_url: string | null
          account_type: 'client' | 'owner_residence' | 'owner_vehicle' | 'owner_event' | 'owner_all'
          orange_money: string | null
          mtn_money: string | null
          wave: string | null
          moov_money: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; full_name: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      residences: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          type: 'villa' | 'appartement' | 'studio'
          city: string
          address: string | null
          lat: number | null
          lng: number | null
          price_per_night: number
          bedrooms: number
          bathrooms: number
          max_guests: number
          surface: number | null
          amenities: string[]
          photos: string[]
          main_photo: string | null
          status: 'pending' | 'active' | 'inactive'
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['residences']['Row']> & {
          owner_id: string; title: string; type: string; city: string; price_per_night: number
        }
        Update: Partial<Database['public']['Tables']['residences']['Row']>
      }
      vehicles: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          brand: string
          model: string
          year: number
          type: 'suv' | 'berline' | '4x4' | 'citadine' | 'minibus'
          transmission: 'automatique' | 'manuelle'
          fuel: 'essence' | 'diesel' | 'hybride' | 'electrique'
          seats: number
          mileage: number | null
          city: string
          price_per_day: number
          photos: string[]
          main_photo: string | null
          rental_conditions: Json
          status: 'pending' | 'active' | 'inactive'
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['vehicles']['Row']> & {
          owner_id: string; title: string; brand: string; model: string; year: number; type: string; city: string; price_per_day: number
        }
        Update: Partial<Database['public']['Tables']['vehicles']['Row']>
      }
      events: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          category: 'concert' | 'festival' | 'sport' | 'conference' | 'theatre' | 'autre'
          event_date: string
          event_time: string
          venue_name: string
          venue_address: string
          lat: number | null
          lng: number | null
          price_per_ticket: number
          total_capacity: number
          tickets_sold: number
          photos: string[]
          main_photo: string | null
          status: 'pending' | 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['events']['Row']> & {
          owner_id: string; title: string; category: string; event_date: string; event_time: string; venue_name: string; venue_address: string; price_per_ticket: number; total_capacity: number
        }
        Update: Partial<Database['public']['Tables']['events']['Row']>
      }
      bookings: {
        Row: {
          id: string
          reference: string
          user_id: string | null
          item_type: 'residence' | 'vehicle' | 'event'
          item_id: string
          start_date: string | null
          end_date: string | null
          tickets_count: number | null
          total_price: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          client_name: string
          client_phone: string
          client_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['bookings']['Row']> & {
          item_type: string; item_id: string; total_price: number; client_name: string; client_phone: string
        }
        Update: Partial<Database['public']['Tables']['bookings']['Row']>
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          genius_pay_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          payment_method: 'orange_money' | 'mtn_money' | 'wave' | 'moov_money' | null
          mobile_phone: string | null
          payment_url: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['payments']['Row']> & { booking_id: string; amount: number }
        Update: Partial<Database['public']['Tables']['payments']['Row']>
      }
      payment_webhooks: {
        Row: {
          id: string
          event_type: string
          genius_pay_id: string | null
          payload: Json
          processed: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['payment_webhooks']['Row']> & { event_type: string; payload: Json }
        Update: Partial<Database['public']['Tables']['payment_webhooks']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}