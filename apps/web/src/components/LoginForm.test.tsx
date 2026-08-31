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
        expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    });

    it("shows validation error when submitting empty form", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.click(screen.getByRole("button", { name: "Submit" }));

        expect(screen.getByText("Please enter a valid username/password")).toBeInTheDocument();
        expect(mockPost).not.toHaveBeenCalled();
    });

    it("shows validation error for invalid email", async () => {
        const user = userEvent.setup();
        const { container } = render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("email"), "not-an-email");
        await user.type(screen.getByPlaceholderText("password"), "password123");

        fireEvent.submit(container.querySelector("form")!);

        await waitFor(() => {
            expect(screen.getByText("Invalid email format")).toBeInTheDocument();
        });
        expect(mockPost).not.toHaveBeenCalled();
    });

    it("calls apiClient.post and redirects on successful login", async () => {
        const user = userEvent.setup();
        mockPost.mockResolvedValue(undefined);

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("email"), "test@example.com");
        await user.type(screen.getByPlaceholderText("password"), "password123");
        await user.click(screen.getByRole("button", { name: "Submit" }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith(
                "/auth/login",
                expect.anything(),
                { email: "test@example.com", password: "password123" }
            );
        });

        await waitFor(() => {
            expect(screen.getByText("login success")).toBeInTheDocument();
        });

        expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("displays error message when login fails", async () => {
        const user = userEvent.setup();
        mockPost.mockRejectedValue(new Error("Invalid credentials"));

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("email"), "test@example.com");
        await user.type(screen.getByPlaceholderText("password"), "wrongpassword");
        await user.click(screen.getByRole("button", { name: "Submit" }));

        await waitFor(() => {
            expect(screen.getByText(/Login failed/)).toBeInTheDocument();
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
        await user.click(screen.getByRole("button", { name: "Submit" }));

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "..." })).toBeDisabled();
        });

        resolvePost({
            user: {
                id: "1",
                email: "test@example.com",
                username: "testuser",
                role: "user",
                registeredAt: new Date(),
            },
        });

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Submit" })).not.toBeDisabled();
        });
    });

    it("does not redirect on failed login", async () => {
        const user = userEvent.setup();
        mockPost.mockRejectedValue(new Error("Server error"));

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("email"), "test@example.com");
        await user.type(screen.getByPlaceholderText("password"), "password123");
        await user.click(screen.getByRole("button", { name: "Submit" }));

        await waitFor(() => {
            expect(screen.getByText(/Login failed/)).toBeInTheDocument();
        });

        expect(mockPush).not.toHaveBeenCalled();
    });
});
