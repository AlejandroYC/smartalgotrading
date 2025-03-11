export const MT5Config = {
  // Convert HTTP URL to WebSocket URL
  WS_URL: (process.env.NEXT_PUBLIC_MT5_API_URL || 'https://18.222.182.98.nip.io')
    .replace('http://', 'ws://')
    .replace('https://', 'wss://') + '/ws',
  API_URL: process.env.NEXT_PUBLIC_MT5_API_URL || 'https://18.222.182.98.nip.io',
  RECONNECT_INTERVAL: 5000,
  CONNECTION_TIMEOUT: 30000,
}; 