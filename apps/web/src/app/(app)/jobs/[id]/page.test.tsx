import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import JobEditor from "./JobEditor";
import JobDetailPage from "./page";
import type { Job } from "@/types/job";

vi.mock("@/lib/client/api", () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import { apiClient } from "@/lib/client/api";
const mockedApi = vi.mocked(apiClient);

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "job-1" }),
}));

const MOCK_JOB: Job = {
  id: "job-1",
  userId: "user-1",
  title: "Frontend Engineer",
  company: "Stripe",
  location: "Remote",
  salary: 120000,
  description: "Build UIs",
  requirements: "React, TypeScript",
  status: "submitted",
  statusChangedAt: "2025-12-01T00:00:00Z",
  notes: "Referred by John.",
  sourceURL: "https://stripe.com/careers",
  jobPortal: "LinkedIn",
  createdAt: "2025-11-20T00:00:00Z",
};

describe("JobEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setup() {
    const onSaved = vi.fn();
    render(<JobEditor jobId="job-1" initialJob={MOCK_JOB} onSaved={onSaved} />);
    return { onSaved };
  }

  it("renders job details as text elements in view mode", () => {
    setup();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();
    expect(screen.getByText("Build UIs")).toBeInTheDocument();
    expect(screen.getByText("Referred by John.")).toBeInTheDocument();
    // no inputs rendered while in view mode
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders formatted salary and status badge in view mode", () => {
    setup();
    expect(screen.getByText("120,000")).toBeInTheDocument();
    const badge = screen.getAllByText("submitted")[0];
    expect(badge.className).toContain("rounded-lg");
  });

  it("shows placeholder text for empty notes", () => {
    render(
      <JobEditor
        jobId="job-1"
        initialJob={{ ...MOCK_JOB, notes: "" }}
        onSaved={vi.fn()}
      />,
    );
    expect(screen.getByText("No notes added yet.")).toBeInTheDocument();
  });

  it("switches all fields to inputs when any field is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("Stripe"));
    expect(screen.getByLabelText("Title")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Company")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Location")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Salary")).toHaveAttribute("type", "number");
    expect(screen.getByLabelText("Source URL")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Description").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("Requirements").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("Notes").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("Status").tagName).toBe("SELECT");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard" })).toBeInTheDocument();
  });

  it("discards changes and returns to view mode", () => {
    setup();
    fireEvent.click(screen.getByText("Frontend Engineer"));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Backend Engineer" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(mockedApi.put).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
  });

  it("saves via PUT /jobs/{id} and returns to view mode", async () => {
    const updated = { ...MOCK_JOB, title: "Senior Frontend Engineer" };
    mockedApi.put.mockResolvedValueOnce(updated);
    const { onSaved } = setup();

    fireEvent.click(screen.getByText("Frontend Engineer"));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Senior Frontend Engineer" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(mockedApi.put).toHaveBeenCalledWith(
        "/jobs/job-1",
        expect.anything(),
        expect.objectContaining({ title: "Senior Frontend Engineer" }),
      );
    });
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(updated);
    });
    // back in view mode showing the saved value
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Senior Frontend Engineer")).toBeInTheDocument();
  });

  it("disables Save until a change is made and shows error when PUT fails", async () => {
    const { HttpError } = await import("@/types/errors");
    mockedApi.put.mockRejectedValueOnce(new HttpError("boom", 500));
    setup();

    fireEvent.click(screen.getByText("Frontend Engineer"));
    const save = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Changed" },
    });
    expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText(/Save failed/)).toBeInTheDocument();
    });
  });
});

describe("JobDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the job by id and renders it in view mode", async () => {
    mockedApi.get.mockResolvedValueOnce(MOCK_JOB);
    render(<JobDetailPage />);
    expect(await screen.findByText("Frontend Engineer")).toBeInTheDocument();
    expect(mockedApi.get).toHaveBeenCalledWith("/jobs/job-1", expect.anything());
  });

  it("shows not-found state on 404", async () => {
    const { HttpError } = await import("@/types/errors");
    mockedApi.get.mockRejectedValueOnce(new HttpError("not found", 404));
    render(<JobDetailPage />);
    expect(await screen.findByText("Job not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Jobs/i })).toHaveAttribute("href", "/jobs");
  });
});
