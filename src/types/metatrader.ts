export interface MT5Credentials {
  accountNumber: string;
  password: string;
  server: string;
}

export interface MT5AccountInfo {
  login: number;
  name: string;
  server: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  margin_free: number;
  floating_pl: number;
  leverage: number;
}

export interface MT5Position {
  ticket: number;
  time: number;
  type: number;
  symbol: string;
  volume: number;
  open_price: number;
  current_price: number;
  sl: number;
  tp: number;
  profit: number;
  swap: number;
  comment: string;
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
  ticket: number;
  order: number;
  time: number;
  type: number;
  entry: number;
  position_id: number;
  symbol: string;
  volume: number;
  price: number;
  profit: number;
  swap: number;
  commission: number;
  magic: number;
  comment: string;
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

export interface MT5FullAccountData {
  success: boolean;
  data: {
    connection_id: string;
    account: MT5AccountInfo;
    positions: MT5Position[];
    history: MT5Deal[];
    statistics: MT5Stats;
  };
  message?: string;
}

export interface MT5Statistics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_profit: number;
  daily_results: Record<string, { profit: number; trades: number }>;
}

export interface MT5ConnectResponse {
  success: boolean;
  error?: string;
  connection_id: string;
  should_clear_storage?: boolean;
  data: {
    account: MT5AccountInfo;
    positions: MT5Position[];
    history: MT5HistoricalData[];
    statistics: MT5Statistics;
  };
}

export interface StoredAccountData {
  accountId: string;
  connectionId: string;
  accountNumber: string;
  server: string;
  positions: MT5Position[];
  history: MT5HistoricalData[];
  accountInfo: MT5AccountInfo;
  statistics: MT5Statistics;
  lastUpdated: string;
} 