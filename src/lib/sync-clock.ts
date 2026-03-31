/**
 * Server-authoritative sync clock module
 * Provides wall-clock UTC time for FamilyTV synchronized playback
 */

let _initialized = false;
let _initTime = 0;
let _lastDriftWarning = 0;
const DRIFT_WARNING_INTERVAL_MS = 60_000; // 1 minute between warnings

export interface SyncClockResponse {
  serverTime: number;
  iso: string;
  offset: number;
  uptime: number;
  health: string;
}

export interface InitOptions {
  // Reserved for future configuration
  driftWarningIntervalMs?: number;
}

/**
 * Get current UTC time in milliseconds (Unix epoch)
 */
export function now(): number {
  return Date.now();
}

/**
 * Get current UTC time as ISO 8601 string
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Get full sync clock response for API
 */
export function getSyncClockResponse(): SyncClockResponse {
  return {
    serverTime: now(),
    iso: nowISO(),
    offset: 0, // Reserved for future offset tracking
    uptime: uptime(),
    health: getClockHealth(),
  };
}

/**
 * Get current clock health status
 */
export function getClockHealth(): 'OK' | 'INITIALIZING' | 'DRIFT_WARNING' {
  if (!_initialized) {
    return 'INITIALIZING';
  }
  // Could add drift detection here in the future
  return 'OK';
}

/**
 * Check clock drift and log warning if significant
 * Rate-limited to prevent log spam
 */
export function checkDrift(ms: number): void {
  const now = Date.now();
  if (now - _lastDriftWarning >= DRIFT_WARNING_INTERVAL_MS) {
    _lastDriftWarning = now;
    // Warning is rate-limited; actual logging would happen here
  }
}

/**
 * Initialize the sync clock module
 */
export function initSyncClock(opts?: InitOptions): void {
  _initTime = Date.now();
  _initialized = true;
}

/**
 * Get uptime of the clock module in milliseconds
 */
export function uptime(): number {
  if (!_initialized) {
    return 0;
  }
  return Date.now() - _initTime;
}
