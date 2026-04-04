import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock Clerk's SignUp component
vi.mock("@clerk/nextjs", async () => {
  const actual = await vi.importActual("@clerk/nextjs");
  return {
    ...actual,
    SignUp: vi.fn(({ fallbackRedirectUrl }) => (
      <div data-testid="clerk-signup-form">
        <input type="email" placeholder="Email" data-testid="clerk-email-input" />
        <input type="password" placeholder="Password" data-testid="clerk-password-input" />
        <button data-testid="clerk-submit-btn">Sign up</button>
      </div>
    )),
  };
});

import SignUpPage from "@/app/sign-up/[[...sign-up]]/page";

describe("SignUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the auth heading and subheading", async () => {
    render(<SignUpPage />);

    // Wait for component to stabilize (mounted + loading resolved)
    await waitFor(() => {
      expect(screen.getAllByTestId("auth-heading")[0]).toHaveTextContent("Join your family on FamilyTV");
    });
    expect(screen.getAllByTestId("auth-subheading")[0]).toHaveTextContent("The private place for your closest people");
  });

  it("renders brand logo and name", async () => {
    render(<SignUpPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId("auth-logo")[0]).toBeInTheDocument();
      expect(screen.getAllByTestId("auth-brand-name")[0]).toHaveTextContent("FamilyTV");
    });
  });

  it("renders the SignUp form after loading completes", async () => {
    render(<SignUpPage />);

    // Wait for the Clerk form to appear (after skeleton loads)
    await waitFor(() => {
      expect(screen.getAllByTestId("clerk-signup-form")[0]).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("renders the tagline below the form", async () => {
    render(<SignUpPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId("clerk-signup-form")[0]).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getAllByTestId("auth-tagline")[0]).toHaveTextContent(
      "No ads, no algorithms — just your family, sharing what matters."
    );
  });

  it("shows a loading skeleton while Clerk is loading", async () => {
    render(<SignUpPage />);

    // Initially the skeleton should be visible
    const skeleton = await screen.findByTestId("signup-loading-skeleton");
    expect(skeleton).toBeInTheDocument();

    // Then the Clerk form should appear
    await waitFor(() => {
      expect(screen.getAllByTestId("clerk-signup-form")[0]).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
