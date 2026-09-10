import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ApplicationsOverTimeChart, { bucketJobsByWeek } from "./ApplicationsOverTimeChart";
import type { Job } from "@/types/job";

const NOW = new Date("2026-09-09T12:00:00.000Z").getTime();

function makeJob(id: string, createdAt: string): Job {
    return {
        id,
        userId: "u1",
        title: `Title ${id}`,
        company: `Company ${id}`,
        location: "Remote",
        salary: 100000,
        description: "",
        requirements: "",
        status: "submitted",
        statusChangedAt: createdAt,
        notes: "",
        sourceURL: "",
        jobPortal: "",
        createdAt,
    };
}

describe("bucketJobsByWeek", () => {
    it("buckets jobs into the correct weeks", () => {
        const today = new Date(NOW);
        today.setHours(0, 0, 0, 0);
        const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();
        const jobs = [
            makeJob("a", daysAgo(1)), // current week
            makeJob("b", daysAgo(8)), // previous week
            makeJob("c", daysAgo(9)), // previous week
        ];
        const buckets = bucketJobsByWeek(jobs, NOW, 4);
        expect(buckets).toHaveLength(4);
        expect(buckets[3].count).toBe(1);
        expect(buckets[2].count).toBe(2);
        expect(buckets[0].count).toBe(0);
        expect(buckets[1].count).toBe(0);
    });

    it("ignores jobs outside the window and invalid dates", () => {
        const jobs = [
            makeJob("old", "2020-01-01T00:00:00.000Z"),
            makeJob("future", "2027-01-01T00:00:00.000Z"),
            makeJob("bad", "not-a-date"),
        ];
        const buckets = bucketJobsByWeek(jobs, NOW, 4);
        expect(buckets.every((b) => b.count === 0)).toBe(true);
    });
});

describe("ApplicationsOverTimeChart", () => {
    it("renders the heading and chart when there is in-window data", () => {
        render(
            <ApplicationsOverTimeChart
                jobs={[makeJob("a", new Date(Date.now() - 2 * 86400000).toISOString())]}
            />,
        );
        expect(screen.getByText("Applications Over Time")).toBeInTheDocument();
        expect(screen.queryByText(/No applications in the last/i)).not.toBeInTheDocument();
    });

    it("renders an empty state when there is no in-window data", () => {
        render(<ApplicationsOverTimeChart jobs={[makeJob("old", "2020-01-01T00:00:00.000Z")]} />);
        expect(screen.getByText(/No applications in the last/i)).toBeInTheDocument();
    });
});
