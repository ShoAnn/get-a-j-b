import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MarkdownViewer from "./MarkdownViewer";

describe("MarkdownViewer", () => {
    it("renders markdown headings, emphasis, and lists", () => {
        const { container } = render(
            <MarkdownViewer content={"# Jane Doe\n\n**Engineer** with *5 years* of experience.\n\n- Go\n- Postgres"} />,
        );
        expect(screen.getByRole("heading", { level: 1, name: "Jane Doe" })).toBeInTheDocument();
        expect(container.querySelector("strong")).toHaveTextContent("Engineer");
        expect(container.querySelector("em")).toHaveTextContent("5 years");
        expect(screen.getByText("Go")).toBeInTheDocument();
        expect(screen.getByText("Postgres")).toBeInTheDocument();
    });

    it("renders single line breaks", () => {
        const { container } = render(<MarkdownViewer content={"line one\nline two"} />);
        expect(container.querySelector("br")).not.toBeNull();
    });

    it("renders fenced code blocks", () => {
        render(<MarkdownViewer content={"```go\nfmt.Println()\n```"} />);
        expect(screen.getByText("fmt.Println()")).toBeInTheDocument();
    });

    it("strips scripts and event handlers", () => {
        const { container } = render(
            <MarkdownViewer
                content={'<script>alert("xss")</script>\n\n<img src="x" onerror="alert(1)" />\n\n[click](javascript:alert(2))'}
            />,
        );
        expect(container.querySelector("script")).toBeNull();
        expect(container.innerHTML).not.toContain("onerror");
        expect(container.innerHTML).not.toContain("javascript:");
        expect(container.innerHTML).not.toContain("<script>");
    });

    it("shows a placeholder for empty content", () => {
        render(<MarkdownViewer content={"   \n  "} />);
        expect(screen.getByText("No content")).toBeInTheDocument();
    });
});
