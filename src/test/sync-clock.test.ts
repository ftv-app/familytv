import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('sync-clock', () => {
  // Store original module exports for isolation
  let clockModule: typeof import('@/lib/sync-clock');
  let initCount = 0;

  beforeEach(async () => {
    // Reset modules to get fresh state
    vi.resetModules();
    // Re-import to get fresh module
    clockModule = await import('@/lib/sync-clock');
    initCount++;
  });

  describe('now()', () => {
    it('returns a positive number', () => {
      clockModule.initSyncClock();
      const result = clockModule.now();
      expect(result).toBeGreaterThan(0);
    });

    it('returns a number (not string)', () => {
      clockModule.initSyncClock();
      const result = clockModule.now();
      expect(typeof result).toBe('number');
    });

    it('returns a Unix epoch in milliseconds', () => {
      clockModule.initSyncClock();
      const before = Date.now();
      const result = clockModule.now();
      const after = Date.now();
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });

    it('returns consistent values within same tick', () => {
      clockModule.initSyncClock();
      const a = clockModule.now();
      const b = clockModule.now();
      expect(a).toBe(b);
    });
  });

  describe('nowISO()', () => {
    it('returns a valid ISO string', () => {
      clockModule.initSyncClock();
      const result = clockModule.nowISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('returns a string', () => {
      clockModule.initSyncClock();
      const result = clockModule.nowISO();
      expect(typeof result).toBe('string');
    });

    it('returns UTC timezone (ends with Z)', () => {
      clockModule.initSyncClock();
      const result = clockModule.nowISO();
      expect(result.endsWith('Z')).toBe(true);
    });

    it('returns a parseable date', () => {
      clockModule.initSyncClock();
      const result = clockModule.nowISO();
      const parsed = new Date(result);
      expect(isNaN(parsed.getTime())).toBe(false);
    });
  });

  describe('getSyncClockResponse()', () => {
    it('returns all required fields', () => {
      clockModule.initSyncClock();
      const result = clockModule.getSyncClockResponse();
      expect(result).toHaveProperty('serverTime');
      expect(result).toHaveProperty('iso');
      expect(result).toHaveProperty('offset');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('health');
    });

    it('serverTime is a positive number', () => {
      clockModule.initSyncClock();
      const result = clockModule.getSyncClockResponse();
      expect(typeof result.serverTime).toBe('number');
      expect(result.serverTime).toBeGreaterThan(0);
    });

    it('iso is a valid ISO string', () => {
      clockModule.initSyncClock();
      const result = clockModule.getSyncClockResponse();
      expect(result.iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('offset is a number', () => {
      clockModule.initSyncClock();
      const result = clockModule.getSyncClockResponse();
      expect(typeof result.offset).toBe('number');
    });

    it('uptime is a non-negative number', () => {
      clockModule.initSyncClock();
      const result = clockModule.getSyncClockResponse();
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('health is a valid enum value', () => {
      clockModule.initSyncClock();
      const result = clockModule.getSyncClockResponse();
      expect(['OK', 'INITIALIZING', 'DRIFT_WARNING']).toContain(result.health);
    });
  });

  describe('getClockHealth()', () => {
    it('returns INITIALIZING before init', () => {
      const health = clockModule.getClockHealth();
      expect(health).toBe('INITIALIZING');
    });

    it('returns OK after init', () => {
      clockModule.initSyncClock();
      const health = clockModule.getClockHealth();
      expect(health).toBe('OK');
    });

    it('returns a valid enum value', () => {
      clockModule.initSyncClock();
      const health = clockModule.getClockHealth();
      expect(['OK', 'INITIALIZING', 'DRIFT_WARNING']).toContain(health);
    });
  });

  describe('checkDrift()', () => {
    it('does not throw when called', () => {
      clockModule.initSyncClock();
      expect(() => clockModule.checkDrift(0)).not.toThrow();
    });

    it('does not throw with large drift values', () => {
      clockModule.initSyncClock();
      expect(() => clockModule.checkDrift(60000)).not.toThrow();
      expect(() => clockModule.checkDrift(-60000)).not.toThrow();
    });

    it('handles multiple rapid calls without throwing', () => {
      clockModule.initSyncClock();
      for (let i = 0; i < 10; i++) {
        clockModule.checkDrift(i * 1000);
      }
      expect(true).toBe(true);
    });
  });

  describe('initSyncClock()', () => {
    it('initializes without throwing', () => {
      expect(() => clockModule.initSyncClock()).not.toThrow();
    });

    it('initializes with empty options', () => {
      expect(() => clockModule.initSyncClock({})).not.toThrow();
    });

    it('changes health from INITIALIZING to OK', () => {
      const before = clockModule.getClockHealth();
      expect(before).toBe('INITIALIZING');
      clockModule.initSyncClock();
      const after = clockModule.getClockHealth();
      expect(after).toBe('OK');
    });
  });

  describe('uptime()', () => {
    it('returns 0 before init', () => {
      const result = clockModule.uptime();
      expect(result).toBe(0);
    });

    it('returns positive number after init', async () => {
      clockModule.initSyncClock();
      // Wait to ensure time passes
      await new Promise((r) => setTimeout(r, 10));
      const result = clockModule.uptime();
      expect(result).toBeGreaterThan(0);
    });

    it('returns a number', () => {
      clockModule.initSyncClock();
      const result = clockModule.uptime();
      expect(typeof result).toBe('number');
    });

    it('increases over time', async () => {
      clockModule.initSyncClock();
      const first = clockModule.uptime();
      await new Promise((r) => setTimeout(r, 10));
      const second = clockModule.uptime();
      expect(second).toBeGreaterThan(first);
    });
  });

  describe('health transitions', () => {
    it('transitions from INITIALIZING to OK after init', () => {
      const beforeInit = clockModule.getClockHealth();
      expect(beforeInit).toBe('INITIALIZING');
      clockModule.initSyncClock();
      const afterInit = clockModule.getClockHealth();
      expect(afterInit).toBe('OK');
    });
  });

  describe('type correctness', () => {
    it('getSyncClockResponse returns correct types', () => {
      clockModule.initSyncClock();
      const result = clockModule.getSyncClockResponse();
      expect(typeof result.serverTime).toBe('number');
      expect(typeof result.iso).toBe('string');
      expect(typeof result.offset).toBe('number');
      expect(typeof result.uptime).toBe('number');
      expect(typeof result.health).toBe('string');
    });
  });
});
