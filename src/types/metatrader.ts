export interface MT5Credentials {
  accountNumber: string;
  password: string;
  server: string;
}

export interface MT5AccountInfo {
  // Información básica
  login: number;
  server: string;
  currency: string;
  leverage: number;
  company: string;
  
  // Información financiera
  balance: number;
  equity: number;
  margin: number;
  margin_free: number;
  margin_level: number;
  profit: number;
  floating_pl: number;
  
  // Posiciones y órdenes actuales
  positions: MT5Position[];
  pending_orders: MT5Order[];
  
  // Historiales
  orders_history: MT5Order[];
  deals_history: MT5Deal[];
  deals: any[];
  
  // Estado de la cuenta
  trade_allowed: boolean;
  connected: boolean;
  last_update: string;
  
  // Límites y configuración
  limit_orders: number;
  margin_so_call: number;
  margin_so_mode: number;
  
  // Información adicional
  name: string;
  trade_mode: number;
  fifo_close: boolean;
  
  // ID de conexión
  connection_id: string;
}

export interface MT5Position {
  ticket: number;
  symbol: string;
  type: number;
  volume: number;
  open_price: number;
  current_price: number;
  sl: number;
  tp: number;
  profit: number;
  swap: number;
  comment: string;
  magic: number;
  time: string;
}

export interface MT5Order {
  ticket: number;
  symbol: string;
  type: number;
  volume: number;
  price: number;
  sl: number;
  tp: number;
  state: number;
  comment: string;
  magic: number;
  time_setup: string;
  time_done?: string;
  reason?: number;
}

export interface MT5Deal {
  ticket: number;
  order: number;
  symbol: string;
  type: number;
  volume: number;
  price: number;
  profit: number;
  swap: number;
  commission: number;
  magic: number;
  comment: string;
  time: string;
  entry: number;
}

export interface MT5Stats {
  balance: number;
  equity: number;
  margin: number;
  margin_free?: number;
  floating_pl: number;
  positions: any[];
  positions_count: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  net_profit: number;
  profit_factor: number;
  avg_win: number;
  avg_loss: number;
  daily_results: {
    [key: string]: {
      profit: number;
      trades: number;
      status: 'win' | 'loss' | 'break_even';
    };
  };
  deals: any[];
  server_time?: string;
  last_update: string;
  winning_days: number;
  losing_days: number;
  break_even_days: number;
  day_win_rate: number;
  closed_trades?: Array<{ profit: number }>;
}

export interface DateRangeQuery {
  fromDate: string;
  toDate: string;
}

export interface MT5HistoricalData {
  balance: number;
  equity: number;
  deals: MT5Deal[];
  daily_results: {
    [date: string]: {
      profit: number;
      trades: number;
      status: 'win' | 'loss' | 'break_even';
    }
  };
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  net_profit: number;
  last_update: string;
}

export interface MT5AccountData {
  balance: number;
  equity: number;
  margin: number;
  margin_free?: number;
  floating_pl: number;
  positions: any[];
  positions_count: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  net_profit: number;
  profit_factor: number;
  avg_win: number;
  avg_loss: number;
  daily_results: {
    [key: string]: {
      profit: number;
      trades: number;
      status: 'win' | 'loss' | 'break_even';
    };
  };
  deals: any[];
  server_time?: string;
  last_update: string;
  winning_days: number;
  losing_days: number;
  break_even_days: number;
  day_win_rate: number;
  closed_trades?: Array<{ profit: number }>;
} 