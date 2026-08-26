import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Dashboard from "./page";
import type { Job } from "@/types/job";

vi.mock("@/lib/client/api", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "@/lib/client/api";
const mockedApi = vi.mocked(apiClient);

function makeJob(overrides: Partial<Job> & { id: string }): Job {
  return {
    userId: "u1",
    title: `Title ${overrides.id}`,
    company: `Company ${overrides.id}`,
    location: "Remote",
    salary: 100000,
    description: "",
    requirements: "",
    status: "submitted",
    statusChangedAt: "2026-08-01T00:00:00.000Z",
    notes: "",
    sourceURL: "",
    jobPortal: "",
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const FIXTURE: Job[] = [
  makeJob({ id: "a", title: "Draft Job", status: "draft", createdAt: "2026-08-20T00:00:00Z" }),
  makeJob({ id: "b", title: "Submitted Job", status: "submitted", createdAt: "2026-08-01T00:00:00Z" }),
  makeJob({ id: "c", title: "Offer Job", status: "offer_extended", createdAt: "2026-07-10T00:00:00Z" }),
  makeJob({ id: "d", title: "Accepted Job", status: "accepted", createdAt: "2026-06-01T00:00:00Z" }),
  makeJob({ id: "e", title: "Rejected Job", status: "rejected", createdAt: "2026-05-15T00:00:00Z" }),
];

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches jobs and computes stats correctly", async () => {
    mockedApi.get.mockResolvedValueOnce(FIXTURE);
    render(<Dashboard />);

    expect(await screen.findByText("Total Saved")).toBeInTheDocument();

    const valueFor = (label: string) =>
      screen.getByText(label).parentElement!.querySelector("p.text-3xl")!.textContent;

    expect(valueFor("Total Saved")).toBe("5");
    expect(valueFor("Total Applied")).toBe("4");
    expect(valueFor("Offer Received")).toBe("2");

    const days = Number(valueFor("Days Since First App"));
    expect(days).toBeGreaterThan(0);
  });

  it("renders chart legend entries for statuses with jobs", async () => {
    mockedApi.get.mockResolvedValueOnce(FIXTURE);
    render(<Dashboard />);

    await screen.findByText("Jobs by Application Status");
    // statuses appear in both the chart legend and recent-jobs list
    expect(screen.getAllByText("draft").length).toBeGreaterThan(0);
    expect(screen.getAllByText("submitted").length).toBeGreaterThan(0);
    expect(screen.getAllByText("offer extended").length).toBeGreaterThan(0);
    expect(screen.getAllByText("accepted").length).toBeGreaterThan(0);
    expect(screen.getAllByText("rejected").length).toBeGreaterThan(0);
    // statuses with zero jobs are omitted
    expect(screen.queryByText(/interview scheduled/i)).not.toBeInTheDocument();
  });

  it("caps Recent Jobs at the 5 most recent", async () => {
    mockedApi.get.mockResolvedValueOnce([
      ...FIXTURE,
      makeJob({ id: "f", title: "Oldest Job", status: "archived", createdAt: "2026-01-01T00:00:00Z" }),
    ]);
    render(<Dashboard />);

    await screen.findByText("Recent Jobs");
    expect(screen.getByText("Draft Job")).toBeInTheDocument(); // newest
    expect(screen.queryByText("Oldest Job")).not.toBeInTheDocument(); // 6th, cut off
  });

  it("renders error state when fetch fails", async () => {
    const { HttpError } = await import("@/types/errors");
    mockedApi.get.mockRejectedValueOnce(new HttpError("boom", 500));
    render(<Dashboard />);

    expect(await screen.findByText(/Request failed \(500\)/)).toBeInTheDocument();
  });
});
