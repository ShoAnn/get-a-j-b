import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import BoardPage from "./page";

describe("BoardPage", () => {
    it("renders all status columns", () => {
        render(<BoardPage />);
        // All 9 statuses appear as column headings
        expect(screen.getByText("draft")).toBeInTheDocument();
        expect(screen.getByText("submitted")).toBeInTheDocument();
        expect(screen.getByText("under review")).toBeInTheDocument();
        expect(screen.getByText("interview scheduled")).toBeInTheDocument();
        expect(screen.getByText("offer extended")).toBeInTheDocument();
        expect(screen.getByText("accepted")).toBeInTheDocument();
        expect(screen.getByText("rejected")).toBeInTheDocument();
        expect(screen.getByText("withdrawn")).toBeInTheDocument();
        expect(screen.getByText("archived")).toBeInTheDocument();
    });

    it("shows 'No jobs' empty state when there are no jobs", () => {
        render(<BoardPage />);
        const emptyMessages = screen.getAllByText("No jobs");
        expect(emptyMessages.length).toBe(9);
    });
});