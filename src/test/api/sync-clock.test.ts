import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Clerk auth
const mockAuth = vi.fn();

// Mock database
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      familyMemberships: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
      posts: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
      calendarEvents: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
      familySyncStates: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
  familySyncStates: {},
  posts: {},
  calendarEvents: {},
  familyMemberships: {},
}));

// Import after mocks are set up
import { GET } from '@/app/api/sync/clock/route';

// Valid UUID for testing - matches the UUID regex in the route
const VALID_FAMILY_ID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_USER_ID = '123e4567-e89b-12d3-a456-426614174001';

describe('/api/sync/clock GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const req = new NextRequest('http://localhost/api/sync/clock');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns global server time when no familyId provided', async () => {
    mockAuth.mockResolvedValue({ userId: VALID_USER_ID });

    const req = new NextRequest('http://localhost/api/sync/clock');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('serverTime');
    expect(json).toHaveProperty('iso');
    expect(json).toHaveProperty('offset');
    expect(json).toHaveProperty('uptime');
    expect(json).toHaveProperty('health');
  });

  it('returns family sync state when familyId provided', async () => {
    mockAuth.mockResolvedValue({ userId: VALID_USER_ID });
    const membership = { familyId: VALID_FAMILY_ID, userId: VALID_USER_ID, role: 'member' };

    mockFindFirst
      .mockResolvedValueOnce(membership) // membership check
      .mockResolvedValueOnce(null); // familySyncStates check

    const req = new NextRequest('http://localhost/api/sync/clock?familyId=' + VALID_FAMILY_ID);
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.familyId).toBe(VALID_FAMILY_ID);
    expect(json).toHaveProperty('lastServerTime');
    expect(json).toHaveProperty('lastSyncedAt');
    expect(json).toHaveProperty('driftMs');
    expect(json).toHaveProperty('needsFullSync');
  });

  it('returns 400 for invalid familyId format', async () => {
    mockAuth.mockResolvedValue({ userId: VALID_USER_ID });

    const req = new NextRequest('http://localhost/api/sync/clock?familyId=invalid');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid familyId');
  });

  it('returns 403 when user is not a family member', async () => {
    mockAuth.mockResolvedValue({ userId: '123e4567-e89b-12d3-a456-426614174002' }); // Different user

    mockFindFirst.mockResolvedValueOnce(null); // No membership found

    const req = new NextRequest('http://localhost/api/sync/clock?familyId=' + VALID_FAMILY_ID);
    const res = await GET(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('Not a member');
  });

  it('returns 400 for invalid lastSyncedAt format', async () => {
    mockAuth.mockResolvedValue({ userId: VALID_USER_ID });
    const membership = { familyId: VALID_FAMILY_ID, userId: VALID_USER_ID, role: 'member' };

    mockFindFirst.mockResolvedValueOnce(membership);

    const req = new NextRequest(
      'http://localhost/api/sync/clock?familyId=' + VALID_FAMILY_ID + '&lastSyncedAt=invalid-date'
    );
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid lastSyncedAt');
  });

  it('returns needsFullSync=true when lastSyncedAt is old', async () => {
    mockAuth.mockResolvedValue({ userId: VALID_USER_ID });
    const membership = { familyId: VALID_FAMILY_ID, userId: VALID_USER_ID, role: 'member' };

    mockFindFirst
      .mockResolvedValueOnce(membership)
      .mockResolvedValueOnce(null);

    // 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const req = new NextRequest(
      'http://localhost/api/sync/clock?familyId=' + VALID_FAMILY_ID + '&lastSyncedAt=' + twoHoursAgo
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.needsFullSync).toBe(true);
  });

  it('returns needsFullSync=false when lastSyncedAt is recent', async () => {
    mockAuth.mockResolvedValue({ userId: VALID_USER_ID });
    const membership = { familyId: VALID_FAMILY_ID, userId: VALID_USER_ID, role: 'member' };

    mockFindFirst
      .mockResolvedValueOnce(membership)
      .mockResolvedValueOnce(null);

    // 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const req = new NextRequest(
      'http://localhost/api/sync/clock?familyId=' + VALID_FAMILY_ID + '&lastSyncedAt=' + fiveMinutesAgo
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.needsFullSync).toBe(false);
  });
});
