import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import NotFoundPage from "@/app/not-found";

describe("NotFoundPage — Cinema Black theme", () => {
  it("renders with Cinema Black dark background (not stark white)", () => {
    const { container } = render(<NotFoundPage />);

    // StrictMode renders twice; query all mains and check the first non-empty one
    const mains = Array.from(container.querySelectorAll("main")) as HTMLElement[];
    const visible = mains.filter((m) => m.style.backgroundColor);
    const main = visible[0] ?? mains[0];
    expect(main).not.toBeUndefined();

    const bgColor = main!.style.backgroundColor;

    // Cinema Black is #0D0D0F (rgb 13,13,15) — NOT light cream rgb(248,250,252)
    const isDark = bgColor === "rgb(13, 13, 15)" ||
      bgColor === "rgb(20, 20, 23)" ||
      bgColor === "rgb(29, 29, 33)";

    expect(isDark).toBe(true);
  });

  it("renders 404 label and page not found heading", () => {
    render(<NotFoundPage />);
    expect(screen.getAllByText("404")[0]).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })[0]).toHaveTextContent("Page not found");
  });

  it("renders CTA buttons to home and sign-in", () => {
    render(<NotFoundPage />);
    const homeBtn = screen.getAllByTestId("not-found-home-button")[0];
    const signinBtn = screen.getAllByTestId("not-found-signin-button")[0];
    expect(homeBtn).toHaveAttribute("href", "/app");
    expect(signinBtn).toHaveAttribute("href", "/sign-in");
  });

  it("does NOT render stark white background", () => {
    const { container } = render(<NotFoundPage />);
    const mains = Array.from(container.querySelectorAll("main")) as HTMLElement[];
    const visible = mains.filter((m) => m.style.backgroundColor);
    const main = visible[0] ?? mains[0];

    const bgColor = main!.style.backgroundColor;

    // rgb(248, 250, 252) is the light cream — must NOT be present
    expect(bgColor).not.toBe("rgb(248, 250, 252)");
    expect(bgColor).not.toBe("rgb(255, 255, 255)");
  });
});
