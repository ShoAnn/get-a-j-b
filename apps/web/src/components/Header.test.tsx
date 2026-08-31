import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("@/components/ThemeToggle", () => ({
    default: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));
vi.mock("@/components/AddJobModal", () => ({
    default: () => null,
}));

import Header from "./Header";

describe("Header", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders logo, search, and action buttons", () => {
        render(<Header />);
        expect(screen.getByText("Get a J*b")).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Search jobs/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Add Application/i })).toBeInTheDocument();
    });

    it("navigates to /jobs when search is submitted empty", () => {
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
        expect(screen.getAllByText(/Log out/i).length).toBeGreaterThanOrEqual(1);
    });

    describe("logout", () => {
        it("calls /api/auth/logout and redirects to /login", async () => {
            const user = userEvent.setup();
            const fetchSpy = vi.fn().mockResolvedValue(
                new Response(null, { status: 204 })
            );
            vi.stubGlobal("fetch", fetchSpy);

            render(<Header />);

            await user.click(screen.getByText("U"));

            const logoutBtns = screen.getAllByRole("button", { name: /Log out/i });
            await user.click(logoutBtns[0]);

            await waitFor(() => {
                expect(fetchSpy).toHaveBeenCalledWith(
                    "/api/auth/logout",
                    expect.objectContaining({ method: "POST", credentials: "include" })
                );
            });

            expect(mocks.push).toHaveBeenCalledWith("/login");
            expect(mocks.refresh).toHaveBeenCalled();

            vi.unstubAllGlobals();
        });

        it("shows friendly error when logout fails with 5xx", async () => {
            const user = userEvent.setup();
            const fetchSpy = vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ error: "The server is having trouble. Please try again in a moment." }), {
                    status: 502,
                    headers: { "Content-Type": "application/json" },
                })
            );
            vi.stubGlobal("fetch", fetchSpy);

            render(<Header />);

            await user.click(screen.getByText("U"));

            const logoutBtns = screen.getAllByRole("button", { name: /Log out/i });
            await user.click(logoutBtns[0]);

            await waitFor(() => {
                expect(screen.getByText(/server is having trouble/i)).toBeInTheDocument();
            });

            expect(mocks.push).not.toHaveBeenCalled();

            vi.unstubAllGlobals();
        });

        it("shows network error when fetch throws", async () => {
            const user = userEvent.setup();
            const fetchSpy = vi.fn().mockRejectedValue(new Error("network down"));
            vi.stubGlobal("fetch", fetchSpy);

            render(<Header />);

            await user.click(screen.getByText("U"));

            const logoutBtns = screen.getAllByRole("button", { name: /Log out/i });
            await user.click(logoutBtns[0]);

            await waitFor(() => {
                expect(screen.getByText(/Unable to reach the server/i)).toBeInTheDocument();
            });

            expect(mocks.push).not.toHaveBeenCalled();

            vi.unstubAllGlobals();
        });

        it("disables the button while logging out", async () => {
            const user = userEvent.setup();
            let resolveFetch!: (value: Response) => void;
            const fetchSpy = vi.fn().mockImplementation(
                () => new Promise<Response>((resolve) => { resolveFetch = resolve; })
            );
            vi.stubGlobal("fetch", fetchSpy);

            render(<Header />);

            await user.click(screen.getByText("U"));

            const logoutBtns = screen.getAllByRole("button", { name: /Log out/i });
            await user.click(logoutBtns[0]);

            await waitFor(() => {
                expect(screen.getAllByText(/Signing out/i)[0]).toBeInTheDocument();
            });

            resolveFetch(new Response(null, { status: 204 }));

            vi.unstubAllGlobals();
        });
    });
});

// Helper since forms don't submit with just type/click
function fireSubmit(form: HTMLFormElement) {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}