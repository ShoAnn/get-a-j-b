import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/components/ThemeToggle", () => ({
    default: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));
vi.mock("@/components/AddJobModal", () => ({
    default: () => null,
}));

import Header from "./Header";

describe("Header", () => {
    it("renders logo, search, and action buttons", () => {
        render(<Header />);
        expect(screen.getByText("Get a J*b")).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Search jobs/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Add Application/i })).toBeInTheDocument();
    });

    it("navigates to /jobs when search is submitted empty", async () => {
        const user = userEvent.setup();
        render(<Header />);

        const form = screen.getByPlaceholderText(/Search jobs/i).closest("form")!;
        fireSubmit(form);

        expect(mocks.push).toHaveBeenCalledWith("/jobs");
    });

    it("navigates to /jobs?q= when search query is provided", async () => {
        const user = userEvent.setup();
        render(<Header />);

        const input = screen.getByPlaceholderText(/Search jobs/i);
        await user.type(input, "engineer");

        const form = input.closest("form")!;
        fireSubmit(form);

        expect(mocks.push).toHaveBeenCalledWith("/jobs?q=engineer");
    });

    it("toggles user menu", async () => {
        const user = userEvent.setup();
        render(<Header />);

        const avatar = screen.getByText("U");
        await user.click(avatar);

        expect(screen.getByText(/Account/i)).toBeInTheDocument();
        expect(screen.getByText(/Settings/i)).toBeInTheDocument();
        expect(screen.getByText(/Log out/i)).toBeInTheDocument();
    });
});

// Helper since forms don't submit with just type/click
function fireSubmit(form: HTMLFormElement) {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}