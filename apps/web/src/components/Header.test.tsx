import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
    showToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("@/components/ThemeToggle", () => ({
    default: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

vi.mock("@/components/Toast", () => ({
    useToast: () => ({ showToast: mocks.showToast }),
}));

import Header from "./Header";
import { SidebarProvider } from "./SidebarProvider";

function renderHeader() {
    return render(
        <SidebarProvider>
            <Header />
        </SidebarProvider>,
    );
}

describe("Header", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it("renders logo", () => {
        renderHeader();
        expect(screen.getByText("Get a J*b")).toBeInTheDocument();
    });

    it("renders the sidebar toggle", () => {
        renderHeader();
        expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    });

    it("toggles user menu", async () => {
        const user = userEvent.setup();
        renderHeader();

        const avatar = screen.getByText("U");
        await user.click(avatar);

        expect(screen.getByText(/Account/i)).toBeInTheDocument();
        expect(screen.queryByText(/Settings/i)).not.toBeInTheDocument();
        expect(screen.getAllByText(/Log out/i).length).toBeGreaterThanOrEqual(1);
    });

    describe("logout", () => {
        it("calls /api/auth/logout and redirects to /login", async () => {
            const user = userEvent.setup();
            const fetchSpy = vi.fn().mockResolvedValue(
                new Response(null, { status: 204 })
            );
            vi.stubGlobal("fetch", fetchSpy);

            renderHeader();

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

            renderHeader();

            await user.click(screen.getByText("U"));

            const logoutBtns = screen.getAllByRole("button", { name: /Log out/i });
            await user.click(logoutBtns[0]);

            await waitFor(() => {
                expect(mocks.showToast).toHaveBeenCalledWith(
                    expect.stringMatching(/server is having trouble/i),
                    "error",
                );
            });

            expect(mocks.push).not.toHaveBeenCalled();

            vi.unstubAllGlobals();
        });

        it("shows network error when fetch throws", async () => {
            const user = userEvent.setup();
            const fetchSpy = vi.fn().mockRejectedValue(new Error("network down"));
            vi.stubGlobal("fetch", fetchSpy);

            renderHeader();

            await user.click(screen.getByText("U"));

            const logoutBtns = screen.getAllByRole("button", { name: /Log out/i });
            await user.click(logoutBtns[0]);

            await waitFor(() => {
                expect(mocks.showToast).toHaveBeenCalledWith(
                    expect.stringMatching(/Unable to reach the server/i),
                    "error",
                );
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

            renderHeader();

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
