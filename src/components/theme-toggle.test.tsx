import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import React from "react";
import { ThemeToggle } from "./theme-toggle";
import * as nextThemes from "next-themes";

// Mock next-themes module
vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

const mockSetTheme = vi.fn();

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const setupLightMode = () => {
    vi.mocked(nextThemes.useTheme).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    } as any);
  };

  const setupDarkMode = () => {
    vi.mocked(nextThemes.useTheme).mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
    } as any);
  };

  it("renders without crashing", () => {
    setupLightMode();
    render(<ThemeToggle />);
    expect(screen.getAllByRole("button")[0]).toBeInTheDocument();
  });

  it("renders in light mode with moon icon", () => {
    setupLightMode();
    render(<ThemeToggle />);
    expect(screen.getAllByRole("button")[0]).toBeInTheDocument();
  });

  it("renders in dark mode with sun icon", () => {
    setupDarkMode();
    render(<ThemeToggle />);
    expect(screen.getAllByRole("button")[0]).toBeInTheDocument();
  });

  it("toggles theme from light to dark when clicked", async () => {
    setupLightMode();
    render(<ThemeToggle />);

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => {
      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });
  });

  it("toggles theme from dark to light when clicked", async () => {
    setupDarkMode();
    render(<ThemeToggle />);

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => {
      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });
  });

  it("has correct aria-label in light mode", () => {
    setupLightMode();
    render(<ThemeToggle />);
    expect(screen.getAllByRole("button")[0]).toHaveAttribute("aria-label", "Switch to dark mode");
  });

  it("has correct aria-label in dark mode", () => {
    setupDarkMode();
    render(<ThemeToggle />);
    expect(screen.getAllByRole("button")[0]).toHaveAttribute("aria-label", "Switch to light mode");
  });
});
