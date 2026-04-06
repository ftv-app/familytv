import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
import { TagChip } from "@/components/tag-chip";

describe("TagChip", () => {
  it("renders tag name", () => {
    render(<TagChip tag={{ id: "1", name: "Holidays", color: "#6366f1" }} />);
    expect(screen.getByTestId("tag-chip-name").textContent).toBe("Holidays");
  });

  it("renders remove button when onRemove is provided", () => {
    const onRemove = vi.fn();
    render(
      <TagChip
        tag={{ id: "1", name: "Holidays", color: "#6366f1" }}
        onRemove={onRemove}
      />
    );
    const removeBtn = screen.getByTestId("tag-chip-remove");
    expect(removeBtn).toBeInTheDocument();
  });

  it("does not render remove button when onRemove is not provided", () => {
    render(<TagChip tag={{ id: "1", name: "Holidays", color: "#6366f1" }} />);
    expect(screen.queryByTestId("tag-chip-remove")).not.toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", () => {
    const onRemove = vi.fn();
    render(
      <TagChip
        tag={{ id: "1", name: "Holidays", color: "#6366f1" }}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByTestId("tag-chip-remove"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("calls onClick when chip is clicked (not on remove button)", () => {
    const onClick = vi.fn();
    render(
      <TagChip
        tag={{ id: "1", name: "Holidays", color: "#6366f1" }}
        onClick={onClick}
      />
    );
    // Click on the chip (but not the remove button)
    const chip = screen.getByTestId("tag-chip-name").parentElement!;
    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when remove button is clicked", () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(
      <TagChip
        tag={{ id: "1", name: "Holidays", color: "#6366f1" }}
        onClick={onClick}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByTestId("tag-chip-remove"));
    expect(onClick).not.toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("uses light text for dark backgrounds (dark color)", () => {
    render(<TagChip tag={{ id: "1", name: "Holidays", color: "#1a1a2e" }} />);
    const chip = screen.getByTestId("tag-chip-name").parentElement!;
    // Browser normalizes to rgb() format
    expect(chip.style.backgroundColor).toBe("rgb(26, 26, 46)");
  });

  it("uses dark text for light backgrounds (light color)", () => {
    render(<TagChip tag={{ id: "1", name: "Beach", color: "#fde047" }} />);
    const chip = screen.getByTestId("tag-chip-name").parentElement!;
    // Browser normalizes to rgb() format
    expect(chip.style.backgroundColor).toBe("rgb(253, 224, 71)");
  });

  it("truncates long tag names", () => {
    const longName = "A".repeat(100);
    render(<TagChip tag={{ id: "1", name: longName, color: "#6366f1" }} />);
    const nameEl = screen.getByTestId("tag-chip-name");
    expect(nameEl).toHaveClass("truncate");
    expect(nameEl.textContent).toBe(longName);
  });
});
