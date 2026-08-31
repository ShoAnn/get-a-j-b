import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const originalClassList = document.documentElement.classList;
const originalLocalStorage = window.localStorage;

describe("ThemeToggle", () => {
    beforeEach(() => {
        vi.resetModules();
        document.documentElement.className = "";
        window.localStorage.clear();
    });

    it("renders a toggle button", async () => {
        const { default: ThemeToggle } = await import("./ThemeToggle");
        render(<ThemeToggle />);
        expect(screen.getByRole("button", { name: /Toggle dark mode/i })).toBeInTheDocument();
    });

    it("adds dark class and persists to localStorage when toggled on", async () => {
        const { default: ThemeToggle } = await import("./ThemeToggle");
        render(<ThemeToggle />);

        const button = screen.getByRole("button", { name: /Toggle dark mode/i });
        fireEvent.click(button);

        expect(document.documentElement.classList.contains("dark")).toBe(true);
        expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("removes dark class and stores light when toggled off", async () => {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");

        const { default: ThemeToggle } = await import("./ThemeToggle");
        render(<ThemeToggle />);

        const button = screen.getByRole("button", { name: /Toggle dark mode/i });
        fireEvent.click(button);

        expect(document.documentElement.classList.contains("dark")).toBe(false);
        expect(localStorage.getItem("theme")).toBe("light");
    });

    // Suppress unused variable warnings
    it.skip("placeholder", () => {
        expect(originalClassList).toBeDefined();
        expect(originalLocalStorage).toBeDefined();
    });
});