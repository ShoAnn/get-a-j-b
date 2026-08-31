import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RegisterForm from "./RegisterForm";

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

describe("RegisterForm", () => {
    it("renders email, username, password, confirm password, submit", () => {
        render(<RegisterForm showRoleSelect={false} />);

        expect(screen.getByPlaceholderText("email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("username")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("confirmPassword")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Register/i })).toBeInTheDocument();
    });

    it("renders role select when showRoleSelect is true", () => {
        render(<RegisterForm showRoleSelect={true} />);
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("hides role select when showRoleSelect is false", () => {
        render(<RegisterForm showRoleSelect={false} />);
        expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });

    it("shows validation error when submitting empty form", async () => {
        const user = userEvent.setup();
        render(<RegisterForm showRoleSelect={false} />);

        await user.click(screen.getByRole("button", { name: /Register/i }));

        expect(screen.getByText("Please enter a valid username/password")).toBeInTheDocument();
        expect(mockPost).not.toHaveBeenCalled();
    });

    it("shows error when passwords do not match", async () => {
        const user = userEvent.setup();
        render(<RegisterForm showRoleSelect={true} />);

        await user.type(screen.getByPlaceholderText("email"), "user@test.com");
        await user.type(screen.getByPlaceholderText("username"), "user1");
        await user.type(screen.getByPlaceholderText("password"), "password123");
        await user.type(screen.getByPlaceholderText("confirmPassword"), "different456");
        await user.selectOptions(screen.getByRole("combobox"), "user");
        await user.click(screen.getByRole("button", { name: /Register/i }));

        await waitFor(() => {
            expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
        });
        expect(mockPost).not.toHaveBeenCalled();
    });

    it("calls apiClient.post and redirects on successful registration", async () => {
        const user = userEvent.setup();
        mockPost.mockResolvedValue(undefined);

        render(<RegisterForm showRoleSelect={true} />);

        await user.type(screen.getByPlaceholderText("email"), "user@test.com");
        await user.type(screen.getByPlaceholderText("username"), "user1");
        await user.type(screen.getByPlaceholderText("password"), "password123");
        await user.type(screen.getByPlaceholderText("confirmPassword"), "password123");
        await user.selectOptions(screen.getByRole("combobox"), "admin");
        await user.click(screen.getByRole("button", { name: /Register/i }));

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith(
                "/auth/register",
                expect.anything(),
                expect.objectContaining({
                    email: "user@test.com",
                    username: "user1",
                    password: "password123",
                    confirmPassword: "password123",
                    role: "admin",
                })
            );
        });

        expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("displays error when registration fails", async () => {
        const user = userEvent.setup();
        mockPost.mockRejectedValue(new Error("Email already exists"));

        render(<RegisterForm showRoleSelect={true} />);

        await user.type(screen.getByPlaceholderText("email"), "user@test.com");
        await user.type(screen.getByPlaceholderText("username"), "user1");
        await user.type(screen.getByPlaceholderText("password"), "password123");
        await user.type(screen.getByPlaceholderText("confirmPassword"), "password123");
        await user.selectOptions(screen.getByRole("combobox"), "user");
        await user.click(screen.getByRole("button", { name: /Register/i }));

        await waitFor(() => {
            expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
        });
        expect(mockPush).not.toHaveBeenCalled();
    });

    it("shows loading state while submitting", async () => {
        const user = userEvent.setup();
        let resolvePost!: (value: unknown) => void;
        mockPost.mockImplementation(
            () => new Promise((resolve) => { resolvePost = resolve; })
        );

        render(<RegisterForm showRoleSelect={true} />);

        await user.type(screen.getByPlaceholderText("email"), "user@test.com");
        await user.type(screen.getByPlaceholderText("username"), "user1");
        await user.type(screen.getByPlaceholderText("password"), "password123");
        await user.type(screen.getByPlaceholderText("confirmPassword"), "password123");
        await user.selectOptions(screen.getByRole("combobox"), "user");
        await user.click(screen.getByRole("button", { name: /Register/i }));

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "..." })).toBeDisabled();
        });

        resolvePost(undefined);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Register/i })).not.toBeDisabled();
        });
    });

    it("updates role on select change", async () => {
        const user = userEvent.setup();
        render(<RegisterForm showRoleSelect={true} />);

        await user.selectOptions(screen.getByRole("combobox"), "user");

        expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("user");
    });
});