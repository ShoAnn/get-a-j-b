import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TopCompaniesChart, { topCompanies } from "./TopCompaniesChart";
import type { Job } from "@/types/job";

function makeJob(id: string, company: string): Job {
    return {
        id,
        userId: "u1",
        title: `Title ${id}`,
        company,
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
    };
}

describe("topCompanies", () => {
    it("ranks companies by application count and respects the limit", () => {
        const jobs = [
            makeJob("a", "Acme"),
            makeJob("b", "Acme"),
            makeJob("c", "Acme"),
            makeJob("d", "Globex"),
            makeJob("e", "Globex"),
            makeJob("f", "Initech"),
        ];
        expect(topCompanies(jobs, 2)).toEqual([
            { company: "Acme", count: 3 },
            { company: "Globex", count: 2 },
        ]);
    });

    it("treats blank company names as Unknown", () => {
        expect(topCompanies([makeJob("a", "   ")])).toEqual([{ company: "Unknown", count: 1 }]);
    });
});

describe("TopCompaniesChart", () => {
    it("renders the heading and chart when there is data", () => {
        render(<TopCompaniesChart jobs={[makeJob("a", "Acme")]} />);
        expect(screen.getByText("Top Companies")).toBeInTheDocument();
        expect(screen.queryByText(/No companies yet/i)).not.toBeInTheDocument();
    });

    it("renders an empty state when there is no data", () => {
        render(<TopCompaniesChart jobs={[]} />);
        expect(screen.getByText(/No companies yet/i)).toBeInTheDocument();
    });
});
