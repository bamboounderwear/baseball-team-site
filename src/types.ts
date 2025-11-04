import type { D1Database, AnalyticsEngineDataset, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  CART: KVNamespace;
  ASSETS: Fetcher;
  ANALYTICS: AnalyticsEngineDataset;
  ADMIN_JWT_SECRET: string;
}

declare global {
  function atob(data: string): string;
  function btoa(data: string): string;
}
