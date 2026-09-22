import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileForm from "./ProfileForm";

vi.mock("./Toast", () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push, refresh }),
}));

const apiPut = vi.fn();
vi.mock("@/lib/client/api", () => ({
    apiClient: { put: (...args: unknown[]) => apiPut(...args) },
}));

const initial = {
    id: "1",
    username: "testuser",
    email: "test@example.com",
    role: "user",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
};

describe("ProfileForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders initial values and disables save when pristine", () => {
        render(<ProfileForm initial={initial} />);
        expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
        expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    });

    it("submits only changed fields", async () => {
        apiPut.mockResolvedValue({ ...initial, username: "newusername" });
        render(<ProfileForm initial={initial} />);
        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "newusername" } });
        fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
        await waitFor(() => expect(apiPut).toHaveBeenCalledWith("/me", expect.anything(), { username: "newusername" }));
    });

    it("shows error on conflict", async () => {
        const { HttpError } = await import("@/types/errors");
        apiPut.mockRejectedValue(new HttpError("Email already exists", 409));
        render(<ProfileForm initial={initial} />);
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "taken@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
        await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/already in use/i));
    });
});
