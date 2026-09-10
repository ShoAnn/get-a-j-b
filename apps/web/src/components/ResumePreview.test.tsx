import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ResumePreview from "./ResumePreview";

describe("ResumePreview", () => {
    it("renders an A4-proportioned white sheet", () => {
        const { container } = render(<ResumePreview content="# Jane Doe" />);
        const sheet = screen.getByTestId("resume-preview");
        expect(sheet.className).toContain("aspect-[210/297]");
        expect(sheet.className).toContain("max-w-[794px]");
        expect(sheet.className).toContain("bg-white");
        expect(container.querySelector(".resume-paper")).not.toBeNull();
    });

    it("renders the resume content inside the sheet", () => {
        render(<ResumePreview content="# Jane Doe" />);
        expect(screen.getByRole("heading", { level: 1, name: "Jane Doe" })).toBeInTheDocument();
    });

    it("shows a placeholder for empty content", () => {
        render(<ResumePreview content="   " />);
        expect(screen.getByText("No content")).toBeInTheDocument();
    });
});
