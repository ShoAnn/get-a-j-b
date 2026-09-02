import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
    usePathname: vi.fn(),
}));

import Sidebar from "./Sidebar";

import { usePathname } from "next/navigation";

describe("Sidebar", () => {
    it("renders all navigation links", () => {
        vi.mocked(usePathname).mockReturnValue("/");
        render(<Sidebar />);
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Jobs")).toBeInTheDocument();
    });

    it("highlights Dashboard when pathname is /", () => {
        vi.mocked(usePathname).mockReturnValue("/");
        render(<Sidebar />);
        const dashboardLink = screen.getByText("Dashboard").closest("a");
        expect(dashboardLink?.className).toContain("text-violet");
    });

    it("highlights Jobs when pathname starts with /jobs", () => {
        vi.mocked(usePathname).mockReturnValue("/jobs/123");
        render(<Sidebar />);
        const jobsLink = screen.getByText("Jobs").closest("a");
        expect(jobsLink?.className).toContain("text-violet");
    });

    it("does not highlight Dashboard when on /jobs", () => {
        vi.mocked(usePathname).mockReturnValue("/jobs");
        render(<Sidebar />);
        const dashboardLink = screen.getByText("Dashboard").closest("a");
        expect(dashboardLink?.className).not.toContain("text-violet");
    });

    it("has correct href attributes", () => {
        vi.mocked(usePathname).mockReturnValue("/");
        render(<Sidebar />);
        expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute("href", "/");
        expect(screen.getByText("Jobs").closest("a")).toHaveAttribute("href", "/jobs");
    });
});