import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const mockGet = vi.fn();
const mockPatch = vi.fn();
vi.mock("@/lib/client/api", () => ({
    apiClient: {
        get: (...args: unknown[]) => mockGet(...args),
        patch: (...args: unknown[]) => mockPatch(...args),
        put: vi.fn(),
    },
}));

import JobsPage from "./page";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("JobsPage", () => {
    it("renders Jobs heading with view toggle buttons", () => {
        renderWithProviders(<JobsPage />);
        expect(screen.getByText("Board view")).toBeInTheDocument();
        expect(screen.getByText("List view")).toBeInTheDocument();
    });

    it("defaults to list view", () => {
        renderWithProviders(<JobsPage />);
        expect(screen.getByText("List view")).toBeInTheDocument();
    });
});