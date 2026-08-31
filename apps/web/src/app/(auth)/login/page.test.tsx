import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/LoginForm", () => ({
    default: () => <div data-testid="login-form">LoginForm</div>,
}));

import LoginPage from "./page";

describe("LoginPage", () => {
    it("renders LoginForm", () => {
        render(<LoginPage />);
        expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
});