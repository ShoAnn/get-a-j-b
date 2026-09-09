import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";

import SidebarToggle from "./SidebarToggle";
import { SidebarProvider } from "./SidebarProvider";

function renderToggle() {
    return render(
        <SidebarProvider>
            <SidebarToggle />
        </SidebarProvider>,
    );
}

describe("SidebarToggle", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("renders a collapse toggle when expanded", () => {
        renderToggle();
        expect(screen.getByRole("button", { name: "Collapse sidebar" })).toHaveAttribute(
            "aria-expanded",
            "true",
        );
    });

    it("toggles to expanded/collapsed and persists the state", async () => {
        const user = userEvent.setup();
        renderToggle();

        await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

        expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute(
            "aria-expanded",
            "false",
        );
        expect(localStorage.getItem("sidebar-collapsed")).toBe("1");

        await user.click(screen.getByRole("button", { name: "Expand sidebar" }));

        expect(screen.getByRole("button", { name: "Collapse sidebar" })).toHaveAttribute(
            "aria-expanded",
            "true",
        );
        expect(localStorage.getItem("sidebar-collapsed")).toBe("0");
    });

    it("restores the toggle state from localStorage", () => {
        localStorage.setItem("sidebar-collapsed", "1");
        renderToggle();

        expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
    });
});
