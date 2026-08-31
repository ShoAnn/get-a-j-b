import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams(),
}));

import JobsPage from "./page";

describe("JobsPage", () => {
    it("renders JobsList inside Suspense", async () => {
        render(<JobsPage />);
        expect(await screen.findByText("Jobs", {}, { timeout: 3000 })).toBeInTheDocument();
    });
});