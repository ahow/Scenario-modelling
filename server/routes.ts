import type { Express } from "express";
import { type Server } from "http";
import { execSync } from "child_process";

// FMP connector config
const FMP_SOURCE_ID = "fmp_b1c4dad85b6141efbffcea91707be44b";

// Pre-war baselines (3-month avg, Nov 15 2025 – Feb 15 2026)
const BASELINES: Record<string, number> = {
  dm_eq: 142.93,
  em_eq: 56.44,
  credit: 110.67,
  govbond: 88.09,
  brent: 63.82,
  gold: 4534.96,
  usd: 98.31,
};

// Asset → FMP ticker mapping
const EQUITY_TICKERS = ["ACWI", "EEM", "LQD", "TLT"];
const COMMODITY_ASSETS: { assetId: string; symbol: string }[] = [
  { assetId: "brent", symbol: "BZUSD" },
  { assetId: "gold", symbol: "GCUSD" },
  { assetId: "usd", symbol: "DXUSD" },
];
const EQUITY_MAP: Record<string, string> = {
  ACWI: "dm_eq",
  EEM: "em_eq",
  LQD: "credit",
  TLT: "govbond",
};

function callFmpTool(toolName: string, args: Record<string, unknown>): unknown {
  const params = JSON.stringify({
    source_id: FMP_SOURCE_ID,
    tool_name: toolName,
    arguments: args,
  });
  const result = execSync(
    `external-tool call '${params.replace(/'/g, "'\\''")}'`,
    { timeout: 15000 }
  ).toString();
  return JSON.parse(result);
}

// Cache: store result for 5 minutes to avoid excessive API calls
let cachedResult: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/market-data", (_req, res) => {
    try {
      // Check cache
      if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL_MS) {
        return res.json(cachedResult.data);
      }

      const prices: Record<string, number> = {};

      // Fetch equity ETF quotes (batch)
      try {
        const eqResult = callFmpTool("quote", {
          endpoint: "batch-quote",
          symbols: EQUITY_TICKERS,
        }) as Array<{ symbol: string; price: number }>;
        const eqArr = Array.isArray(eqResult) ? eqResult : (eqResult as any).result ?? [];
        for (const q of eqArr) {
          const assetId = EQUITY_MAP[q.symbol];
          if (assetId) prices[assetId] = q.price;
        }
      } catch (e) {
        console.error("Failed to fetch equity quotes:", e);
      }

      // Fetch commodity quotes
      for (const { assetId, symbol } of COMMODITY_ASSETS) {
        try {
          const comResult = callFmpTool("commodity", {
            endpoint: "commodities-quote",
            symbol,
          });
          const comArr = Array.isArray(comResult) ? comResult : (comResult as any).result ?? [];
          if (comArr[0]?.price != null) {
            prices[assetId] = comArr[0].price;
          }
        } catch (e) {
          console.error(`Failed to fetch ${symbol}:`, e);
        }
      }

      // Compute % change from baseline
      const pctFromBaseline: Record<string, number> = {};
      for (const [id, price] of Object.entries(prices)) {
        const baseline = BASELINES[id];
        if (baseline) {
          pctFromBaseline[id] = ((price - baseline) / baseline) * 100;
        }
      }

      const response = {
        prices,
        pctFromBaseline,
        timestamp: new Date().toISOString(),
        source: "live" as const,
      };

      // Cache it
      cachedResult = { data: response, timestamp: Date.now() };

      return res.json(response);
    } catch (e) {
      console.error("Market data endpoint error:", e);
      return res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  return httpServer;
}
