import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginForm from "./LoginForm";

const mockPost = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());

vi.mock("@/lib/client/api.ts", () => ({
    apiClient: {
        post: mockPost,
    },
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("LoginForm", () => {
    it("renders email, password inputs and submit button", () => {
        render(<LoginForm />);

        expect(screen.getByPlaceholderText("email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    });

    it("shows validation error when submitting empty form", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(screen.getByText("Please enter both your email and password.")).toBeInTheDocument();
        expect(mockPost).not.toHaveBeenCalled();
    });

    it("shows validation error for invalid email", async () => {
        const user = userEvent.setup();
        const { container } = render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("email"), "not-an-email");
        await user.type(screen.getByPlaceholderText("password"), "password123");

        fireEvent.submit(container.querySelector("form")!);

        await waitFor(() => {
            expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
        });
        expect(mockPost).not.toHaveBeenCalled();
    });

    it("calls apiClient.post and redirects on successful login", async () => {
        const user = userEvent.setup();
        mockPost.mockResolvedValue(undefined);

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("email"), "test@example.com");
        await user.type(screen.getByPlaceholderText("password"), "password123");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith(
                "/auth/login",
                expect.anything(),
                { email: "test@example.com", password: "password123" }
            );
        });

        await waitFor(() => {
            expect(screen.getByText(/Signed in/)).toBeInTheDocument();
        });

        expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("displays friendly error message when login fails", async () => {
        const user = userEvent.setup();
        const { HttpError } = await import("@/types/errors");
        mockPost.mockRejectedValue(new HttpError("Incorrect email or password.", 401));

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("email"), "test@example.com");
        await user.type(screen.getByPlaceholderText("password"), "wrongpassword");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(screen.getByText("Incorrect email or password.")).toBeInTheDocument();
        });
    });

    it("shows loading state while submitting", async () => {
        const user = userEvent.setup();
        let resolvePost!: (value: unknown) => void;
        mockPost.mockImplementation(
            () => new Promise((resolve) => { resolvePost = resolve; })
        );

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("email"), "test@example.com");
        await user.type(screen.getByPlaceholderText("password"), "password123");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Signing in/ })).toBeDisabled();
        });

        resolvePost(undefined);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Sign in" })).not.toBeDisabled();
        });
    });

    it("does not redirect on failed login", async () => {
        const user = userEvent.setup();
        const { HttpError } = await import("@/types/errors");
        mockPost.mockRejectedValue(new HttpError("Server error", 500));

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("email"), "test@example.com");
        await user.type(screen.getByPlaceholderText("password"), "password123");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(screen.getByText(/server is having trouble/i)).toBeInTheDocument();
        });

        expect(mockPush).not.toHaveBeenCalled();
    });

    it("shows network error message on non-HttpError", async () => {
        const user = userEvent.setup();
        mockPost.mockRejectedValue(new Error("Network down"));

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("email"), "test@example.com");
        await user.type(screen.getByPlaceholderText("password"), "password123");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(screen.getByText(/Unable to reach the server/i)).toBeInTheDocument();
        });
    });
});
