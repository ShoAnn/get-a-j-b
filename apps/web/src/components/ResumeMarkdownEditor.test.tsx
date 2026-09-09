import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ResumeMarkdownEditor from "./ResumeMarkdownEditor";

describe("ResumeMarkdownEditor", () => {
    it("renders content with live preview", () => {
        render(<ResumeMarkdownEditor content="# Hello" onContentChange={vi.fn()} />);
        expect(screen.getByLabelText("Editor")).toHaveValue("# Hello");
        expect(screen.getByRole("heading", { level: 1, name: "Hello" })).toBeInTheDocument();
    });

    it("calls onContentChange when editing", () => {
        const onContentChange = vi.fn();
        render(<ResumeMarkdownEditor content="" onContentChange={onContentChange} />);
        fireEvent.change(screen.getByLabelText("Editor"), { target: { value: "New content" } });
        expect(onContentChange).toHaveBeenCalledWith("New content");
    });

    it("shows the content error", () => {
        render(
            <ResumeMarkdownEditor content="" onContentChange={vi.fn()} contentError="Content is required" />,
        );
        expect(screen.getByText("Content is required")).toBeInTheDocument();
    });

    it("disables the textarea when disabled", () => {
        render(<ResumeMarkdownEditor content="Content" onContentChange={vi.fn()} disabled />);
        expect(screen.getByLabelText("Editor")).toBeDisabled();
    });

    it("uses idPrefix for the field id", () => {
        render(<ResumeMarkdownEditor content="" onContentChange={vi.fn()} idPrefix="add-resume" />);
        expect(screen.getByLabelText("Editor")).toHaveAttribute("id", "add-resume-content");
    });
});
