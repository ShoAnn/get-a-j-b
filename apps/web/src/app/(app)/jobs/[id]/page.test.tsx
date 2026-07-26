import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import JobDetailPage from "./page";

vi.mock("next/link", () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockParams = vi.hoisted(() => ({ id: "1" }));
vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
}));

describe("JobDetailPage", () => {
  beforeEach(() => {
    mockParams.id = "1";
  });

  it("renders job title and company for a found job", () => {
    render(<JobDetailPage />);
    expect(
      screen.getByRole("heading", { name: "Frontend Engineer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<JobDetailPage />);
    const matches = screen.getAllByText("submitted");
    expect(matches.length).toBe(2);
    expect(matches[0].tagName).toBe("SPAN");
    expect(matches[0].className).toContain("rounded-lg");
  });

  it("renders step progress", () => {
    render(<JobDetailPage />);
    expect(screen.getByText("Step 2 of 6")).toBeInTheDocument();
  });

  it("renders date applied", () => {
    render(<JobDetailPage />);
    const expectedDate = new Date("2025-12-01").toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it("renders job portal section", () => {
    render(<JobDetailPage />);
    expect(
      screen.getByText("Job Portal"),
    ).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
  });

  it("renders notes", () => {
    render(<JobDetailPage />);
    expect(
      screen.getByText("Referred by John. Need to prep for system design."),
    ).toBeInTheDocument();
  });

  it("shows 'No notes added yet' placeholder when notes is empty", () => {
    mockParams.id = "4";
    render(<JobDetailPage />);
    expect(
      screen.getByText("No notes added yet."),
    ).toBeInTheDocument();
  });

  it("shows 'Job not found' for non-existent id", () => {
    mockParams.id = "999";
    render(<JobDetailPage />);
    expect(
      screen.getByText("Job not found"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to Jobs/i }),
    ).toHaveAttribute("href", "/jobs");
  });

  it("renders status history timeline steps", () => {
    render(<JobDetailPage />);
    expect(screen.getByText("Status History")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("under review")).toBeInTheDocument();
    expect(screen.getByText("interview scheduled")).toBeInTheDocument();
  });
});
