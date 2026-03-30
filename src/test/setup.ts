import "@testing-library/jest-dom/vitest";
import { expect, vi } from "vitest";

// Mock IntersectionObserver for components that use it
globalThis.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
  takeRecords: vi.fn(() => []),
})) as any;
