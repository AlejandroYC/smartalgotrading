export interface Database {
  public: {
    Tables: {
      mt_connections: {
        Row: {
          id: string
          user_id: string
          platform_type: string
          account_number: string
          server: string
          encrypted_password: string
          is_active: boolean
          created_at: string
          last_connection: string
          connection_id: string
          account_stats: {
            equity: number
            margin: number
            balance: number
            win_rate: number
            floating_pl: number
            total_profit: number
            total_trades: number
            daily_results: Record<string, { profit: number; trades: number }>
            losing_trades: number
            winning_trades: number
            positions_count: number
          } | null
        }
        Insert: {
          id?: string
          user_id: string
          platform_type: string
          account_number: string
          server: string
          encrypted_password: string
          is_active?: boolean
          created_at?: string
          last_connection?: string
          connection_id?: string
          account_stats?: {
            equity: number
            margin: number
            balance: number
            win_rate: number
            floating_pl: number
            total_profit: number
            total_trades: number
            daily_results: Record<string, { profit: number; trades: number }>
            losing_trades: number
            winning_trades: number
            positions_count: number
          } | null
        }
        Update: Partial<Database['public']['Tables']['mt_connections']['Insert']>
      }
    }
  }
}
