import { supabase } from '@/lib/supabase';

export const tradingService = {
  async syncAccount(accountId: string) {
    const { data: account } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (!account) return;

    // Llamar a la Edge Function para sincronizar
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-metatrader`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ accountId }),
      }
    );

    return response.json();
  },

  async getAccountPositions(accountId: string) {
    const { data } = await supabase
      .from('positions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    return data;
  },

  async getAccountTrades(accountId: string) {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('account_id', accountId)
      .order('close_time', { ascending: false });

    return data;
  }
}; 