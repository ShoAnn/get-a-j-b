import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    requireAuth: vi.fn(),
    redirect: vi.fn(),
}));

vi.mock("@/lib/requireAuth", () => ({
    requireAuth: mocks.requireAuth,
}));
vi.mock("next/navigation", () => ({
    redirect: mocks.redirect,
}));
vi.mock("@/components/Header", () => ({
    default: () => <div data-testid="header">Header</div>,
}));
vi.mock("@/components/Sidebar", () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>,
}));

import AppLayout from "./layout";

describe("AppLayout", () => {
    it("renders children when authenticated", async () => {
        mocks.requireAuth.mockResolvedValue("token");
        const element = await AppLayout({ children: <div>content</div> });
        render(element);
        expect(screen.getByTestId("header")).toBeInTheDocument();
        expect(screen.getByTestId("sidebar")).toBeInTheDocument();
        expect(screen.getByText("content")).toBeInTheDocument();
    });

    it("redirects to /login when requireAuth throws", async () => {
        mocks.requireAuth.mockRejectedValue(new Error("unauthorized"));
        await AppLayout({ children: <div>content</div> });
        expect(mocks.redirect).toHaveBeenCalledWith("/login");
    });
});