export interface MTConnection {
  id: string;
  user_id: string;
  account_number: string;
  password: string;
  server: string;
  connection_id: string;
  is_active: boolean;
  created_at: string;
}

export interface MTConnectionForm {
  platform_type: 'mt4' | 'mt5';
  server: string;
  account_number: string;
  password: string;
} 