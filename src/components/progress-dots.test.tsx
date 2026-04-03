import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { ProgressDots } from "./progress-dots";

describe("ProgressDots", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders with 3 dots", () => {
    render(<ProgressDots currentStep={1} />);
    expect(screen.getByTestId("progress-dot-1")).toBeInTheDocument();
    expect(screen.getByTestId("progress-dot-2")).toBeInTheDocument();
    expect(screen.getByTestId("progress-dot-3")).toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    const { container } = render(<ProgressDots currentStep={2} />);
    const containerElement = container.firstChild;
    expect(containerElement).toHaveAttribute("aria-label", "Step 2 of 3");
  });

  describe("when currentStep is 1", () => {
    it("first dot is active", () => {
      render(<ProgressDots currentStep={1} />);
      const dot1 = screen.getByTestId("progress-dot-1");
      expect(dot1).toHaveAttribute("data-active", "true");
    });

    it("first dot is not completed", () => {
      render(<ProgressDots currentStep={1} />);
      const dot1 = screen.getByTestId("progress-dot-1");
      expect(dot1).toHaveAttribute("data-completed", "false");
    });

    it("second dot is not active", () => {
      render(<ProgressDots currentStep={1} />);
      const dot2 = screen.getByTestId("progress-dot-2");
      expect(dot2).toHaveAttribute("data-active", "false");
    });

    it("second dot is not completed", () => {
      render(<ProgressDots currentStep={1} />);
      const dot2 = screen.getByTestId("progress-dot-2");
      expect(dot2).toHaveAttribute("data-completed", "false");
    });

    it("third dot is not active", () => {
      render(<ProgressDots currentStep={1} />);
      const dot3 = screen.getByTestId("progress-dot-3");
      expect(dot3).toHaveAttribute("data-active", "false");
    });

    it("third dot is not completed", () => {
      render(<ProgressDots currentStep={1} />);
      const dot3 = screen.getByTestId("progress-dot-3");
      expect(dot3).toHaveAttribute("data-completed", "false");
    });
  });

  describe("when currentStep is 2", () => {
    it("first dot is completed", () => {
      render(<ProgressDots currentStep={2} />);
      const dot1 = screen.getByTestId("progress-dot-1");
      expect(dot1).toHaveAttribute("data-completed", "true");
    });

    it("first dot is not active", () => {
      render(<ProgressDots currentStep={2} />);
      const dot1 = screen.getByTestId("progress-dot-1");
      expect(dot1).toHaveAttribute("data-active", "false");
    });

    it("second dot is active", () => {
      render(<ProgressDots currentStep={2} />);
      const dot2 = screen.getByTestId("progress-dot-2");
      expect(dot2).toHaveAttribute("data-active", "true");
    });

    it("second dot is not completed", () => {
      render(<ProgressDots currentStep={2} />);
      const dot2 = screen.getByTestId("progress-dot-2");
      expect(dot2).toHaveAttribute("data-completed", "false");
    });

    it("third dot is not active", () => {
      render(<ProgressDots currentStep={2} />);
      const dot3 = screen.getByTestId("progress-dot-3");
      expect(dot3).toHaveAttribute("data-active", "false");
    });

    it("third dot is not completed", () => {
      render(<ProgressDots currentStep={2} />);
      const dot3 = screen.getByTestId("progress-dot-3");
      expect(dot3).toHaveAttribute("data-completed", "false");
    });
  });

  describe("when currentStep is 3", () => {
    it("first dot is completed", () => {
      render(<ProgressDots currentStep={3} />);
      const dot1 = screen.getByTestId("progress-dot-1");
      expect(dot1).toHaveAttribute("data-completed", "true");
    });

    it("first dot is not active", () => {
      render(<ProgressDots currentStep={3} />);
      const dot1 = screen.getByTestId("progress-dot-1");
      expect(dot1).toHaveAttribute("data-active", "false");
    });

    it("second dot is completed", () => {
      render(<ProgressDots currentStep={3} />);
      const dot2 = screen.getByTestId("progress-dot-2");
      expect(dot2).toHaveAttribute("data-completed", "true");
    });

    it("second dot is not active", () => {
      render(<ProgressDots currentStep={3} />);
      const dot2 = screen.getByTestId("progress-dot-2");
      expect(dot2).toHaveAttribute("data-active", "false");
    });

    it("third dot is active", () => {
      render(<ProgressDots currentStep={3} />);
      const dot3 = screen.getByTestId("progress-dot-3");
      expect(dot3).toHaveAttribute("data-active", "true");
    });

    it("third dot is not completed", () => {
      render(<ProgressDots currentStep={3} />);
      const dot3 = screen.getByTestId("progress-dot-3");
      expect(dot3).toHaveAttribute("data-completed", "false");
    });
  });

  it("active dot has aria-current set to step", () => {
    render(<ProgressDots currentStep={2} />);
    const dot2 = screen.getByTestId("progress-dot-2");
    expect(dot2).toHaveAttribute("aria-current", "step");
  });

  it("inactive dots do not have aria-current", () => {
    render(<ProgressDots currentStep={2} />);
    const dot1 = screen.getByTestId("progress-dot-1");
    const dot3 = screen.getByTestId("progress-dot-3");
    expect(dot1).not.toHaveAttribute("aria-current");
    expect(dot3).not.toHaveAttribute("aria-current");
  });

  it("renders correct width for active and inactive dots", () => {
    // Step 1 - first dot active
    const { unmount: u1 } = render(<ProgressDots currentStep={1} />);
    expect(screen.getAllByTestId("progress-dot-1")[0]).toHaveStyle({ width: "10px", height: "10px" });
    expect(screen.getAllByTestId("progress-dot-2")[0]).toHaveStyle({ width: "8px", height: "8px" });
    u1();
    // Step 2 - second dot active (fresh render)
    render(<ProgressDots currentStep={2} />);
    expect(screen.getAllByTestId("progress-dot-1")[0]).toHaveStyle({ width: "8px", height: "8px" });
    expect(screen.getAllByTestId("progress-dot-2")[0]).toHaveStyle({ width: "10px", height: "10px" });
  });
});
