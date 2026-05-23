export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          login_method: string
          currency: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          login_method?: string
          currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          login_method?: string
          currency?: string
          timezone?: string
          updated_at?: string
        }
      }
      onboarding_state: {
        Row: {
          id: string
          completed: boolean
          step: number
          bank_connected: boolean
          gmail_connected: boolean
          has_connected_bank: boolean
          has_uploaded_statement: boolean
          has_connected_gmail: boolean
          onboarding_completed: boolean
          source: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          completed?: boolean
          step?: number
          bank_connected?: boolean
          gmail_connected?: boolean
          has_connected_bank?: boolean
          has_uploaded_statement?: boolean
          has_connected_gmail?: boolean
          onboarding_completed?: boolean
          source?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          step?: number
          bank_connected?: boolean
          gmail_connected?: boolean
          has_connected_bank?: boolean
          has_uploaded_statement?: boolean
          has_connected_gmail?: boolean
          onboarding_completed?: boolean
          source?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      bank_connections: {
        Row: {
          id: string
          user_id: string
          bank_name: string
          account_number_last4: string
          account_type: string
          kind: string
          status: "live" | "reconnect" | "error"
          color: string
          setu_consent_id: string | null
          last_synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_name: string
          account_number_last4: string
          account_type?: string
          kind?: string
          status?: "live" | "reconnect" | "error"
          color?: string
          setu_consent_id?: string | null
          last_synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          bank_name?: string
          account_number_last4?: string
          account_type?: string
          kind?: string
          status?: "live" | "reconnect" | "error"
          color?: string
          setu_consent_id?: string | null
          last_synced_at?: string
          updated_at?: string
        }
      }
      uploaded_statements: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_size: number
          file_type: string
          status: "processing" | "done" | "error"
          bank_name: string | null
          period_from: string | null
          period_to: string | null
          transaction_count: number
          storage_path: string | null
          error_message: string | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_size?: number
          file_type?: string
          status?: "processing" | "done" | "error"
          bank_name?: string | null
          period_from?: string | null
          period_to?: string | null
          transaction_count?: number
          storage_path?: string | null
          error_message?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          filename?: string
          file_size?: number
          file_type?: string
          status?: "processing" | "done" | "error"
          bank_name?: string | null
          period_from?: string | null
          period_to?: string | null
          transaction_count?: number
          storage_path?: string | null
          error_message?: string | null
          processed_at?: string | null
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          bank_connection_id: string | null
          name: string
          plan: string
          price: number
          currency: string
          cycle: "mo" | "yr"
          category: string
          status: "active" | "paused" | "cancelled"
          detected_by: "bank" | "gmail" | "manual"
          confidence: number
          next_renewal_date: string | null
          renew_label: string
          source_label: string
          ai_tag: string | null
          ai_insight: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_connection_id?: string | null
          name: string
          plan?: string
          price: number
          currency?: string
          cycle?: "mo" | "yr"
          category?: string
          status?: "active" | "paused" | "cancelled"
          detected_by?: "bank" | "gmail" | "manual"
          confidence?: number
          next_renewal_date?: string | null
          renew_label?: string
          source_label?: string
          ai_tag?: string | null
          ai_insight?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          bank_connection_id?: string | null
          name?: string
          plan?: string
          price?: number
          currency?: string
          cycle?: "mo" | "yr"
          category?: string
          status?: "active" | "paused" | "cancelled"
          detected_by?: "bank" | "gmail" | "manual"
          confidence?: number
          next_renewal_date?: string | null
          renew_label?: string
          source_label?: string
          ai_tag?: string | null
          ai_insight?: string | null
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          bank_connection_id: string | null
          merchant: string
          norm: string
          amount: number
          currency: string
          type: "debit" | "credit"
          category: string
          account_label: string
          recurring_confidence: number
          transacted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          bank_connection_id?: string | null
          merchant: string
          norm?: string
          amount: number
          currency?: string
          type?: "debit" | "credit"
          category?: string
          account_label?: string
          recurring_confidence?: number
          transacted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          subscription_id?: string | null
          bank_connection_id?: string | null
          merchant?: string
          norm?: string
          amount?: number
          currency?: string
          type?: "debit" | "credit"
          category?: string
          account_label?: string
          recurring_confidence?: number
          transacted_at?: string
          updated_at?: string
        }
      }
      gmail_connections: {
        Row: {
          id: string
          user_id: string
          email: string
          status: "active" | "disconnected" | "error"
          subscriptions_detected: number
          trials_detected: number
          emails_scanned: number
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          last_synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          status?: "active" | "disconnected" | "error"
          subscriptions_detected?: number
          trials_detected?: number
          emails_scanned?: number
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          last_synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          status?: "active" | "disconnected" | "error"
          subscriptions_detected?: number
          trials_detected?: number
          emails_scanned?: number
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          last_synced_at?: string
          updated_at?: string
        }
      }
      gmail_email_log: {
        Row: {
          id: string
          user_id: string
          gmail_message_id: string
          from_address: string
          subject: string
          merchant_name: string
          amount_inr: number | null
          email_date: string
          tag: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gmail_message_id: string
          from_address: string
          subject: string
          merchant_name: string
          amount_inr?: number | null
          email_date: string
          tag?: string
          created_at?: string
        }
        Update: {
          from_address?: string
          subject?: string
          merchant_name?: string
          amount_inr?: number | null
          email_date?: string
          tag?: string
        }
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          kind: "savings" | "duplicate" | "overlap" | "underused" | "trial" | "yearly"
          title: string
          amount: number
          period: string
          body: string
          action_label: string
          services: string[]
          status: "active" | "accepted" | "dismissed"
          acted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          kind?: "savings" | "duplicate" | "overlap" | "underused" | "trial" | "yearly"
          title: string
          amount?: number
          period?: string
          body?: string
          action_label?: string
          services?: string[]
          status?: "active" | "accepted" | "dismissed"
          acted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          subscription_id?: string | null
          kind?: "savings" | "duplicate" | "overlap" | "underused" | "trial" | "yearly"
          title?: string
          amount?: number
          period?: string
          body?: string
          action_label?: string
          services?: string[]
          status?: "active" | "accepted" | "dismissed"
          acted_at?: string | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
