import { Stock } from "../types";

// Universe of tradable stocks, each with an approximate base price used to
// seed the simulated feed (see priceEngine.ts).
export const STOCK_UNIVERSE: (Stock & { basePrice: number; dividendYield: number })[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", marketCap: "Large Cap", exchange: "NSE", basePrice: 2666.16, dividendYield: 0.42 },
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT", marketCap: "Large Cap", exchange: "NSE", basePrice: 3980.4, dividendYield: 1.62 },
  { symbol: "INFY", name: "Infosys", sector: "IT", marketCap: "Large Cap", exchange: "NSE", basePrice: 1491.79, dividendYield: 2.45 },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Financials", marketCap: "Large Cap", exchange: "NSE", basePrice: 1965.85, dividendYield: 1.1 },
  { symbol: "ITC", name: "ITC Ltd", sector: "FMCG", marketCap: "Large Cap", exchange: "NSE", basePrice: 350.59, dividendYield: 3.2 },
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Auto", marketCap: "Large Cap", exchange: "NSE", basePrice: 582.89, dividendYield: 0.55 },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", sector: "Pharma", marketCap: "Large Cap", exchange: "NSE", basePrice: 1062.9, dividendYield: 0.68 },
  { symbol: "ZOMATO", name: "Eternal (Zomato)", sector: "Tech", marketCap: "Mid Cap", exchange: "NSE", basePrice: 161.57, dividendYield: 0 },
  { symbol: "POLYCAB", name: "Polycab India", sector: "Industrials", marketCap: "Mid Cap", exchange: "NSE", basePrice: 5083.5, dividendYield: 0.55 },
  { symbol: "AAPL", name: "Apple Inc", sector: "Tech", marketCap: "Large Cap", exchange: "NASDAQ", basePrice: 18294.01, dividendYield: 0.45 },
  { symbol: "WIPRO", name: "Wipro", sector: "IT", marketCap: "Mid Cap", exchange: "NSE", basePrice: 268, dividendYield: 1.9 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom", marketCap: "Large Cap", exchange: "NSE", basePrice: 1690, dividendYield: 0.75 },
];

export function getStock(symbol: string) {
  return STOCK_UNIVERSE.find((s) => s.symbol === symbol);
}