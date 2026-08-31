import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BoardPage from "./page";

const mockGet = vi.fn();
vi.mock("@/lib/client/api", () => ({
    apiClient: {
        get: (...args: unknown[]) => mockGet(...args),
    },
}));

import { HttpError } from "@/types/errors";
import type { Job } from "@/types/job";

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
        statusChangedAt: "2026-08-01T00:00:00Z",
        notes: "",
        sourceURL: "",
        jobPortal: "",
        createdAt: "2026-08-01T00:00:00Z",
        ...overrides,
    };
}

const MOCK_JOBS: Job[] = [
    makeJob({ id: "1", title: "Engineer", company: "Stripe", status: "submitted" }),
    makeJob({ id: "2", title: "Designer", company: "Linear", status: "draft" }),
    makeJob({ id: "3", title: "PM", company: "Figma", status: "submitted" }),
];

describe("BoardPage", () => {
    beforeEach(() => {
        mockGet.mockClear();
    });

    it("shows a loading message while fetching", () => {
        mockGet.mockImplementation(() => new Promise(() => {}));
        render(<BoardPage />);
        expect(screen.getByText("Loading your jobs…")).toBeInTheDocument();
    });

    it("renders all status columns", async () => {
        mockGet.mockResolvedValue(MOCK_JOBS);
        render(<BoardPage />);

        await screen.findByText("submitted");
        expect(screen.getByText("draft")).toBeInTheDocument();
        expect(screen.getByText("under review")).toBeInTheDocument();
    });

    it("renders jobs in their respective columns", async () => {
        mockGet.mockResolvedValue(MOCK_JOBS);
        render(<BoardPage />);

        await screen.findByText("submitted");
        expect(screen.getByText("Engineer")).toBeInTheDocument();
        expect(screen.getByText("PM")).toBeInTheDocument();
        expect(screen.getByText("Designer")).toBeInTheDocument();
    });

    it("shows empty state for columns with no jobs", async () => {
        mockGet.mockResolvedValue(MOCK_JOBS.filter((j) => j.status === "submitted"));
        render(<BoardPage />);

        await screen.findByText("submitted");
        const noJobsMessages = screen.getAllByText("No jobs");
        expect(noJobsMessages.length).toBeGreaterThan(0);
    });

    it("shows the column counts", async () => {
        mockGet.mockResolvedValue(MOCK_JOBS);
        render(<BoardPage />);

        await screen.findByText("submitted");
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("displays an error when fetch fails with 401", async () => {
        const { HttpError } = await import("@/types/errors");
        mockGet.mockRejectedValue(new HttpError("Unauthorized", 401));

        render(<BoardPage />);

        expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
    });

    it("displays a generic error when fetch fails", async () => {
        mockGet.mockRejectedValue(new Error("boom"));

        render(<BoardPage />);

        expect(await screen.findByText(/couldn't load your jobs/i)).toBeInTheDocument();
    });
});