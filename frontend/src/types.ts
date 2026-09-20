export type Sector =
  | "Tech"
  | "IT"
  | "Energy"
  | "Financials"
  | "FMCG"
  | "Pharma"
  | "Auto"
  | "Industrials"
  | "Telecom";

export type MarketCap = "Large Cap" | "Mid Cap" | "Small Cap";

export interface Stock {
  symbol: string;
  name: string;
  sector: Sector;
  marketCap: MarketCap;
  exchange: "NSE" | "BSE" | "NASDAQ";
}

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyDate: string; // ISO date
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  addedAt: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: "above" | "below";
  targetPrice: number;
  active: boolean;
  createdAt: string;
}

export interface DividendEntry {
  id: string;
  symbol: string;
  amountPerShare: number;
  exDate: string;
  paidDate: string | null;
}

export interface PricePoint {
  t: number; // timestamp
  price: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  date: string; // ISO date
}

export interface Sip {
  id: string;
  symbol: string;
  amount: number;
  dayOfMonth: number; // 1-28
  startDate: string; // ISO date
  active: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string; // ISO date
  monthlyContribution: number;
  expectedAnnualReturnPct: number;
  createdAt: string;
}