import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
    usePathname: vi.fn(),
}));

import Sidebar from "./Sidebar";
import { SidebarProvider } from "./SidebarProvider";

import { usePathname } from "next/navigation";

function renderSidebar() {
    return render(
        <SidebarProvider>
            <Sidebar />
        </SidebarProvider>,
    );
}

describe("Sidebar", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("renders all navigation links", () => {
        vi.mocked(usePathname).mockReturnValue("/");
        renderSidebar();
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Jobs")).toBeInTheDocument();
    });

    it("highlights Dashboard when pathname is /", () => {
        vi.mocked(usePathname).mockReturnValue("/");
        renderSidebar();
        const dashboardLink = screen.getByText("Dashboard").closest("a");
        expect(dashboardLink?.className).toContain("text-violet");
    });

    it("highlights Jobs when pathname starts with /jobs", () => {
        vi.mocked(usePathname).mockReturnValue("/jobs/123");
        renderSidebar();
        const jobsLink = screen.getByText("Jobs").closest("a");
        expect(jobsLink?.className).toContain("text-violet");
    });

    it("does not highlight Dashboard when on /jobs", () => {
        vi.mocked(usePathname).mockReturnValue("/jobs");
        renderSidebar();
        const dashboardLink = screen.getByText("Dashboard").closest("a");
        expect(dashboardLink?.className).not.toContain("text-violet");
    });

    it("has correct href attributes", () => {
        vi.mocked(usePathname).mockReturnValue("/");
        renderSidebar();
        expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute("href", "/");
        expect(screen.getByText("Jobs").closest("a")).toHaveAttribute("href", "/jobs");
    });

    it("renders expanded by default without a footer toggle", () => {
        vi.mocked(usePathname).mockReturnValue("/");
        const { container } = renderSidebar();
        expect(container.querySelector("aside")?.className).toContain("w-56");
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /sidebar/i })).not.toBeInTheDocument();
    });

    it("renders an icon-only rail when collapsed state is stored", () => {
        vi.mocked(usePathname).mockReturnValue("/");
        localStorage.setItem("sidebar-collapsed", "1");
        const { container } = renderSidebar();

        expect(container.querySelector("aside")?.className).toContain("w-16");
        expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
            "title",
            "Dashboard",
        );
    });

    it("keeps active highlighting when collapsed", () => {
        vi.mocked(usePathname).mockReturnValue("/jobs/123");
        localStorage.setItem("sidebar-collapsed", "1");
        renderSidebar();

        expect(screen.getByRole("link", { name: "Jobs" }).className).toContain("text-violet");
    });
});
