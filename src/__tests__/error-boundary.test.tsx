import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/error-boundary";

// Component that throws an error for testing
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error: something went wrong");
  }
  return <div data-testid="success">Rendered successfully</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error in tests to keep output clean
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Hello from child</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Hello from child")).toBeInTheDocument();
  });

  it("renders fallback UI when an error is thrown", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    // Should show friendly error message
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(
        "We ran into an unexpected issue. Your family moments are safe — this is just a temporary hiccup on our end."
      )
    ).toBeInTheDocument();
  });

  it("renders fallback with FamilyTV brand styling", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    // Check for the terracotta accent icon
    const iconContainer = document.querySelector(
      ".w-16.h-16.rounded-full.bg-\\[\\#c4785a\\]\\/10"
    );
    expect(iconContainer).toBeInTheDocument();
    // Check for Try again button
    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();
    // Check for Go home button
    const homeButton = screen.getByRole("button", { name: /go home/i });
    expect(homeButton).toBeInTheDocument();
  });

  it("resets error state and re-renders children when Try again is clicked", () => {
    // After clicking Try again, the error boundary resets its internal state.
    // We verify this by remounting with a child that no longer throws.
    let renderCount = 0;
    function RecoverableChild() {
      renderCount++;
      if (renderCount === 1) {
        throw new Error("Initial error");
      }
      return <div data-testid="recovered">Recovered successfully</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <RecoverableChild />
      </ErrorBoundary>
    );

    // Error fallback is shown on first render
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click Try again — resets boundary state to hasError=false
    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(tryAgainButton);

    // Now remount with a child that recovers (no longer throws)
    // This simulates what happens after a successful reset
    rerender(
      <ErrorBoundary>
        <div data-testid="recovered">Recovered successfully</div>
      </ErrorBoundary>
    );

    // Child content is now visible after recovery
    expect(screen.getByTestId("recovered")).toBeInTheDocument();
    expect(screen.getByText("Recovered successfully")).toBeInTheDocument();
  });

  it("allows custom fallback to be provided", () => {
    const CustomFallback = () => (
      <div data-testid="custom-fallback">Custom error UI</div>
    );
    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
  });

  it("logs structured error to console on error", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(consoleSpy).toHaveBeenCalled();
    // Verify structured log format
    const firstCall = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(firstCall);
    expect(parsed.type).toBe("UNCAUGHT_ERROR");
    expect(parsed.message).toBe("Test error: something went wrong");
    expect(parsed.stack).toBeDefined();
    expect(parsed.timestamp).toBeDefined();
  });
});
