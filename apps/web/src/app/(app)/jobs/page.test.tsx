import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams(),
}));

const mockGet = vi.fn();
vi.mock("@/lib/client/api", () => ({
    apiClient: {
        get: (...args: unknown[]) => mockGet(...args),
    },
}));

import JobsPage from "./page";

describe("JobsPage", () => {
    it("renders Jobs heading with view toggle buttons", () => {
        render(<JobsPage />);
        expect(screen.getByText("Board view")).toBeInTheDocument();
        expect(screen.getByText("List view")).toBeInTheDocument();
    });

    it("defaults to list view", () => {
        render(<JobsPage />);
        expect(screen.getByText("List view")).toBeInTheDocument();
    });
});