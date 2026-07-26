import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import JobsPage from "./page";

vi.mock("next/link", () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockSearchParamsGet = vi.hoisted(() => vi.fn().mockReturnValue(null));
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

function createMockJob(overrides: Record<string, string> = {}) {
  return {
    id: "0",
    userId: "user1",
    title: "",
    company: "",
    location: "Remote",
    salary: 0,
    description: "",
    requirements: "",
    status: "draft",
    statusChangedAt: "2025-01-01",
    notes: "",
    sourceURL: "",
    jobPortal: "",
    createdAt: "2025-01-01",
    ...overrides,
  };
}

const mockJobs = [
  createMockJob({ id: "1", title: "Frontend Engineer", company: "Stripe", status: "submitted", jobPortal: "LinkedIn", createdAt: "2025-12-01" }),
  createMockJob({ id: "2", title: "Senior Frontend Developer", company: "Vercel", status: "under_review", jobPortal: "Company Website", createdAt: "2025-12-05" }),
  createMockJob({ id: "3", title: "Full Stack Engineer", company: "Notion", status: "interview_scheduled", jobPortal: "LinkedIn", createdAt: "2025-11-28" }),
  createMockJob({ id: "4", title: "UI Engineer", company: "Linear", status: "rejected", jobPortal: "Indeed", createdAt: "2025-11-15" }),
  createMockJob({ id: "5", title: "Software Engineer", company: "Figma", status: "draft", jobPortal: "Glassdoor", createdAt: "2025-12-10" }),
  createMockJob({ id: "6", title: "React Native Developer", company: "Expo", status: "offer_extended", jobPortal: "LinkedIn", createdAt: "2025-11-20" }),
  createMockJob({ id: "7", title: "Backend Engineer", company: "Supabase", status: "accepted", jobPortal: "Company Website", createdAt: "2025-10-01" }),
];

const mockFetch = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", mockFetch);

describe("JobsPage", () => {
  beforeEach(() => {
    mockSearchParamsGet.mockReturnValue(null);
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockJobs) });
  });

  it("renders the page heading", async () => {
    render(<JobsPage />);
    await screen.findByRole("heading", { name: "Jobs" });
  });

  it("renders all jobs", async () => {
    render(<JobsPage />);
    expect(await screen.findByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Supabase")).toBeInTheDocument();
  });

  it("filters jobs by search query (title)", async () => {
    const user = userEvent.setup();
    render(<JobsPage />);
    await screen.findByText("Frontend Engineer");
    const searchInput = screen.getByPlaceholderText(
      "Search by title or company...",
    );
    await user.type(searchInput, "Frontend");
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Senior Frontend Developer")).toBeInTheDocument();
    expect(screen.queryByText("Backend Engineer")).not.toBeInTheDocument();
  });

  it("filters jobs by search query (company)", async () => {
    const user = userEvent.setup();
    render(<JobsPage />);
    await screen.findByText("Frontend Engineer");
    const searchInput = screen.getByPlaceholderText(
      "Search by title or company...",
    );
    await user.type(searchInput, "Notion");
    expect(screen.getByText("Full Stack Engineer")).toBeInTheDocument();
    expect(screen.queryByText("Frontend Engineer")).not.toBeInTheDocument();
  });

  it("filters jobs by status", async () => {
    const user = userEvent.setup();
    render(<JobsPage />);
    await screen.findByText("Frontend Engineer");
    const statusSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(statusSelect, "rejected");
    expect(screen.getByText("UI Engineer")).toBeInTheDocument();
    expect(screen.queryByText("Frontend Engineer")).not.toBeInTheDocument();
  });

  it("shows 'No matching jobs' when no results match", async () => {
    const user = userEvent.setup();
    render(<JobsPage />);
    await screen.findByText("Frontend Engineer");
    const searchInput = screen.getByPlaceholderText(
      "Search by title or company...",
    );
    await user.type(searchInput, "zzzzz");
    expect(
      screen.getByText("No matching jobs"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Try adjusting your search or filter."),
    ).toBeInTheDocument();
  });

  it("clear filters button resets search and status filter", async () => {
    const user = userEvent.setup();
    render(<JobsPage />);
    await screen.findByText("Frontend Engineer");
    const searchInput = screen.getByPlaceholderText(
      "Search by title or company...",
    );
    await user.type(searchInput, "zzzzz");
    expect(screen.getByText("No matching jobs")).toBeInTheDocument();
    await user.click(screen.getByText("Clear filters"));
    expect(await screen.findByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
  });

  it("preserves search query from URL params", async () => {
    mockSearchParamsGet.mockReturnValue("Stripe");
    render(<JobsPage />);
    const searchInput = screen.getByPlaceholderText(
      "Search by title or company...",
    ) as HTMLInputElement;
    expect(searchInput.value).toBe("Stripe");
    expect(await screen.findByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.queryByText("Backend Engineer")).not.toBeInTheDocument();
  });

  it("renders a Details link for each job", async () => {
    render(<JobsPage />);
    await screen.findByText("Frontend Engineer");
    const detailsLinks = screen.getAllByText("Details");
    expect(detailsLinks.length).toBe(7);
    detailsLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", expect.stringMatching(/^\/jobs\/\d+$/));
    });
  });
});
