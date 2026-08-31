import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/RegisterForm", () => ({
    default: ({ showRoleSelect }: { showRoleSelect: boolean }) => (
        <div data-testid="register-form" data-show-role={showRoleSelect}>
            RegisterForm
        </div>
    ),
}));

import RegisterPage from "./page";

describe("RegisterPage", () => {
    it("renders RegisterForm without role select", () => {
        render(<RegisterPage />);
        const form = screen.getByTestId("register-form");
        expect(form).toBeInTheDocument();
        expect(form.dataset.showRole).toBe("false");
    });
});