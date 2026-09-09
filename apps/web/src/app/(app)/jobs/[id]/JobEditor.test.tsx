import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import JobEditor from "./JobEditor";
import type { Job } from "@/types/job";

vi.mock("@/lib/client/api", () => ({
    apiClient: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import { apiClient } from "@/lib/client/api";
const mockedApi = vi.mocked(apiClient);

const mockPush = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());
const mockBumpVersion = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("@/components/JobsRefresh", () => ({
    useJobsRefresh: () => ({ version: 0, highlightedId: null, bumpVersion: mockBumpVersion }),
}));

const MOCK_JOB: Job = {
    id: "j-1",
    userId: "u-1",
    title: "Engineer",
    company: "Acme",
    location: "Remote",
    salary: 100000,
    description: "Build things",
    requirements: "Go",
    status: "submitted",
    statusChangedAt: "2026-08-01T00:00:00.000Z",
    notes: "",
    sourceURL: "",
    jobPortal: "LinkedIn",
    createdAt: "2026-08-01T00:00:00.000Z",
};

describe("JobEditor delete confirm", () => {
    beforeEach(() => vi.clearAllMocks());

    it("arms the confirm on first click without deleting", () => {
        render(<JobEditor jobId="j-1" initialJob={MOCK_JOB} onSaved={vi.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

        expect(screen.getByRole("button", { name: "Confirm delete" })).toBeInTheDocument();
        expect(screen.getByTestId("confirm-countdown")).toBeInTheDocument();
        expect(mockedApi.delete).not.toHaveBeenCalled();
    });

    it("deletes the job after inline two-step confirm", async () => {
        mockedApi.delete.mockResolvedValueOnce(undefined);
        render(<JobEditor jobId="j-1" initialJob={MOCK_JOB} onSaved={vi.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Delete job" }));
        expect(mockedApi.delete).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
        await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith("/jobs/j-1", expect.anything()));
        await waitFor(() => expect(mockBumpVersion).toHaveBeenCalled());
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/jobs"));
        expect(mockRefresh).toHaveBeenCalled();
    });

    it("disarms the confirm after a timeout", () => {
        vi.useFakeTimers();
        try {
            render(<JobEditor jobId="j-1" initialJob={MOCK_JOB} onSaved={vi.fn()} />);
            fireEvent.click(screen.getByRole("button", { name: "Delete job" }));
            expect(screen.getByRole("button", { name: "Confirm delete" })).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(3000);
            });
            expect(screen.getByRole("button", { name: "Delete job" })).toBeInTheDocument();
            expect(mockedApi.delete).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });

    it("highlights all inputs for 1s after entering edit mode", () => {
        vi.useFakeTimers();
        try {
            render(<JobEditor jobId="j-1" initialJob={MOCK_JOB} onSaved={vi.fn()} />);
            fireEvent.click(screen.getByRole("button", { name: "Title" }));

            const titleInput = screen.getByLabelText("Title");
            const statusSelect = screen.getByLabelText("Status");
            expect(titleInput.className).toContain("ring-violet/40");
            expect(statusSelect.className).toContain("ring-violet/40");

            act(() => {
                vi.advanceTimersByTime(1000);
            });
            expect(screen.getByLabelText("Title").className).not.toContain("ring-violet/40");
            expect(screen.getByLabelText("Status").className).not.toContain("ring-violet/40");
        } finally {
            vi.useRealTimers();
        }
    });

    it("shows an error when delete fails", async () => {
        mockedApi.delete.mockRejectedValueOnce(new Error("boom"));
        render(<JobEditor jobId="j-1" initialJob={MOCK_JOB} onSaved={vi.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: "Delete job" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

        await waitFor(() =>
            expect(screen.getByText("Something went wrong while deleting")).toBeInTheDocument(),
        );
        expect(screen.getByRole("button", { name: "Delete job" })).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
    });
});
