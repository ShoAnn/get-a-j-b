import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge, JOB_STATUSES } from "./StatusBadge";

describe("StatusBadge", () => {
  it.each(JOB_STATUSES)("renders %s with correct display text", (status) => {
    render(<StatusBadge status={status} />);
    expect(
      screen.getByText(status.replace(/_/g, " ")),
    ).toBeInTheDocument();
  });

  it("renders a span element", () => {
    const { container } = render(<StatusBadge status="draft" />);
    const span = container.querySelector("span");
    expect(span).toBeInTheDocument();
    expect(span).toHaveClass("inline-flex", "items-center", "rounded-lg");
  });
});
