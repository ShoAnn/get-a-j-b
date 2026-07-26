import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ApplicationCard } from "./ApplicationCard";
import type { Job } from "@/types/job";

const baseJob: Job & { dateApplied: string } = {
  id: "1",
  userId: "user1",
  title: "Frontend Engineer",
  company: "Stripe",
  location: "Remote",
  salary: 150000,
  status: "submitted",
  statusChangedAt: "2025-12-01T00:00:00Z",
  description: "Build UI components",
  requirements: "React, TypeScript",
  notes: "Referred by John",
  jobPortal: "LinkedIn",
  sourceURL: "https://stripe.com/jobs",
  dateApplied: "2025-12-01",
};

describe("ApplicationCard", () => {
  it("renders job title and company", () => {
    render(<ApplicationCard job={baseJob} />);
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
  });

  it("renders company initial in the avatar circle", () => {
    render(<ApplicationCard job={baseJob} />);
    expect(screen.getByText("S")).toBeInTheDocument();
  });

  it("renders status badge with correct text", () => {
    render(<ApplicationCard job={baseJob} />);
    expect(screen.getByText("submitted")).toBeInTheDocument();
  });

  it("renders job portal when provided", () => {
    render(<ApplicationCard job={baseJob} />);
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
  });

  it("does not render job portal when absent", () => {
    const jobWithoutPortal = { ...baseJob, jobPortal: "" };
    render(<ApplicationCard job={jobWithoutPortal} />);
    expect(screen.queryByText("LinkedIn")).not.toBeInTheDocument();
  });

  it("renders formatted date applied", () => {
    render(<ApplicationCard job={baseJob} />);
    const expected = new Date("2025-12-01").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
