export interface Trade {
  ticket: number;
  symbol: string;
  type: string;
  volume: number;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  time: string;
  [key: string]: any;
} 