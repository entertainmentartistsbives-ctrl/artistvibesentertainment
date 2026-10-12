/**
 * =====================================================================
 * MASTER SITE GATEWAY & ACCESS CONTROL SWITCH
 * =====================================================================
 * 
 * Master toggle:
 * Set SITE_ACTIVE = true  --> Instantly restores full public website access.
 * Set SITE_ACTIVE = false --> Simulates realistic 503 Database Connection Timeout error.
 * 
 * Developer Bypass:
 * 1. URL parameter: ?unlock=dev (or ?lock=dev to re-lock)
 * 2. Keyboard shortcut: Ctrl + Shift + U (or Cmd + Shift + U)
 * 3. Triple-click on the Ray / Trace ID on the 503 screen
 * 
 * Once unlocked, authorization is automatically persisted across
 * localStorage, sessionStorage, and browser cookies.
 */

export const SITE_ACTIVE = false;

export const GATEWAY_CONFIG = {
  bypassKey: 'dev',
  storageKey: 'bya_dev_bypass',
  cookieName: 'bya_dev_bypass',
  cookieMaxAgeDays: 30,
  errorCode: '503_DATABASE_TIMEOUT',
  upstreamCluster: 'ep-cool-resonance-pooler.ap-south-1.aws.neon.tech:5432',
  databaseName: 'bookyourartist_production',
  region: 'ap-south-1 (AWS Mumbai)',
  clientRuntime: 'PrismaClient Engine v5.22.0 (Node 24.x LTS)',
};
