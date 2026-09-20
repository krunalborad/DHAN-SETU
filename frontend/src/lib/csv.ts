import { Holding } from "../types";
import { STOCK_UNIVERSE } from "./universe";

/**
 * Parses a broker contract-note-style CSV into Holding records.
 * Expected columns (case-insensitive, order-independent):
 *   symbol, quantity, buyPrice/price, buyDate/date
 *
 * This is deliberately forgiving about header names so exports from
 * different brokers (Zerodha, Groww, Upstox) can be mapped without the
 * user having to reformat their file first.
 */
export interface CsvImportResult {
  holdings: Omit<Holding, "id">[];
  skipped: { row: number; reason: string }[];
}

const HEADER_ALIASES: Record<string, string[]> = {
  symbol: ["symbol", "ticker", "scrip", "instrument"],
  quantity: ["quantity", "qty", "shares", "units"],
  buyPrice: ["buyprice", "price", "avgprice", "avg_price", "rate"],
  buyDate: ["buydate", "date", "tradedate", "trade_date"],
};

function resolveHeaderMap(headerRow: string[]) {
  const normalized = headerRow.map((h) => h.trim().toLowerCase().replace(/[\s_]/g, ""));
  const map: Record<string, number> = {};
  Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
    const idx = normalized.findIndex((h) => aliases.includes(h.replace(/[\s_]/g, "")));
    if (idx !== -1) map[field] = idx;
  });
  return map;
}

export function parseHoldingsCsv(text: string): CsvImportResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { holdings: [], skipped: [{ row: 0, reason: "File has no data rows." }] };
  }

  const headerRow = lines[0].split(",").map((c) => c.trim());
  const map = resolveHeaderMap(headerRow);
  const holdings: Omit<Holding, "id">[] = [];
  const skipped: { row: number; reason: string }[] = [];

  const requiredFields = ["symbol", "quantity", "buyPrice"];
  const missing = requiredFields.filter((f) => !(f in map));
  if (missing.length) {
    return {
      holdings: [],
      skipped: [{ row: 0, reason: `Missing required column(s): ${missing.join(", ")}` }],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const symbolRaw = cells[map.symbol]?.toUpperCase();
    const quantity = Number(cells[map.quantity]);
    const buyPrice = Number(cells[map.buyPrice]);
    const buyDate = map.buyDate !== undefined ? cells[map.buyDate] : "";

    const known = STOCK_UNIVERSE.find((s) => s.symbol === symbolRaw);

    if (!symbolRaw) {
      skipped.push({ row: i + 1, reason: "Missing symbol." });
      continue;
    }
    if (!known) {
      skipped.push({ row: i + 1, reason: `Unrecognized symbol "${symbolRaw}".` });
      continue;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      skipped.push({ row: i + 1, reason: "Invalid quantity." });
      continue;
    }
    if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
      skipped.push({ row: i + 1, reason: "Invalid buy price." });
      continue;
    }

    holdings.push({
      symbol: symbolRaw,
      quantity,
      buyPrice,
      buyDate: buyDate && !Number.isNaN(Date.parse(buyDate)) ? new Date(buyDate).toISOString() : new Date().toISOString(),
    });
  }

  return { holdings, skipped };
}

export const SAMPLE_CSV = `symbol,quantity,buyPrice,buyDate
RELIANCE,10,2705.50,2025-03-14
TCS,5,3890.00,2025-05-02
HDFCBANK,12,1590.25,2025-06-20
INFY,8,1690.00,2025-07-11`;
