import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HiringFunnelChart, { funnelData } from "./HiringFunnelChart";
import type { Job } from "@/types/job";

function makeJob(id: string, status: Job["status"]): Job {
    return {
        id,
        userId: "u1",
        title: `Title ${id}`,
        company: `Company ${id}`,
        location: "Remote",
        salary: 100000,
        description: "",
        requirements: "",
        status,
        statusChangedAt: "2026-08-01T00:00:00.000Z",
        notes: "",
        sourceURL: "",
        jobPortal: "",
        createdAt: "2026-08-01T00:00:00.000Z",
    };
}

describe("funnelData", () => {
    it("computes cumulative stage counts", () => {
        const jobs = [
            makeJob("a", "draft"),
            makeJob("b", "submitted"),
            makeJob("c", "interview_scheduled"),
            makeJob("d", "offer_extended"),
            makeJob("e", "accepted"),
            makeJob("f", "rejected"),
        ];
        expect(funnelData(jobs)).toEqual([
            { stage: "Applied", count: 5, color: "#3B82F6" },
            { stage: "Interview", count: 3, color: "#8B5CF6" },
            { stage: "Offer", count: 2, color: "#06B6D4" },
            { stage: "Accepted", count: 1, color: "#22C55E" },
        ]);
    });
});

describe("HiringFunnelChart", () => {
    it("renders the heading and chart when there is data", () => {
        render(<HiringFunnelChart jobs={[makeJob("a", "submitted")]} />);
        expect(screen.getByText("Hiring Funnel")).toBeInTheDocument();
        expect(screen.queryByText(/No funnel data yet/i)).not.toBeInTheDocument();
    });

    it("renders an empty state when there is no data", () => {
        render(<HiringFunnelChart jobs={[]} />);
        expect(screen.getByText(/No funnel data yet/i)).toBeInTheDocument();
    });
});
