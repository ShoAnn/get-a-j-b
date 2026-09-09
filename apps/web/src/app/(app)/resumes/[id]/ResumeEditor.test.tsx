import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ResumeEditor from "./ResumeEditor";
import type { Resume } from "@/types/resume";

vi.mock("@/lib/client/api", () => ({
    apiClient: { get: vi.fn(), put: vi.fn() },
}));
import { apiClient } from "@/lib/client/api";
const mockedApi = vi.mocked(apiClient);

const MOCK: Resume = { id: "r-1", userId: "u-1", label: "Backend", content: "Go and Postgres" };

function cardOf(el: HTMLElement | null): HTMLElement | null {
    return (el?.closest(".rounded-xl") as HTMLElement | null) ?? null;
}

describe("ResumeEditor smoke", () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.unstubAllEnvs());
    it("toggles edit mode, shows preview card, saves via PUT", async () => {
        const onSaved = vi.fn();
        mockedApi.put.mockResolvedValueOnce({ ...MOCK, label: "Backend v2" });
        render(<ResumeEditor resumeId="r-1" initialResume={MOCK} onSaved={onSaved} />);
        expect(screen.getByRole("button", { name: "Edit resume" })).toBeInTheDocument();
        expect(screen.queryByLabelText("Label")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Edit resume" }));
        expect(screen.getByLabelText("Label")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
        // content section moves out of the label card and becomes a readonly preview
        const editor = screen.getByLabelText("Content");
        expect(editor.tagName).toBe("TEXTAREA");
        expect(editor).toHaveValue("Go and Postgres");
        // whole edit card slides into view
        const editCard = cardOf(screen.getByLabelText("Label"));
        await waitFor(() => expect(editCard?.className).toContain("translate-x-0"));
        expect(editCard?.className).toContain("opacity-100");
        expect(cardOf(editor)).toBe(cardOf(screen.getByLabelText("Label")));
        expect(screen.getByText("Preview")).toBeInTheDocument();
        const preview = screen.getByLabelText("Content preview");
        expect(preview.tagName).toBe("TEXTAREA");
        expect(preview).toHaveAttribute("readonly");
        expect(preview).toHaveValue("Go and Postgres");
        expect(cardOf(preview)).not.toBe(cardOf(screen.getByLabelText("Label")));
        // typing in the editor updates the live preview
        fireEvent.change(editor, { target: { value: "Go, Postgres and React" } });
        expect(preview).toHaveValue("Go, Postgres and React");
        fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Backend v2" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        await waitFor(() =>
            expect(mockedApi.put).toHaveBeenCalledWith(
                "/resumes/r-1",
                expect.anything(),
                expect.objectContaining({ label: "Backend v2" }),
            ),
        );
        await waitFor(() => expect(onSaved).toHaveBeenCalled());
        await waitFor(() => expect(screen.queryByLabelText("Label")).not.toBeInTheDocument());
        expect(screen.getByText("Backend v2")).toBeInTheDocument();
        // content section moves back into the main card
        expect(cardOf(screen.getByText("Go and Postgres"))).toBe(cardOf(screen.getByText("Backend v2")));
    });
    it("cancel discards without PUT", () => {
        render(<ResumeEditor resumeId="r-1" initialResume={MOCK} onSaved={vi.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: "Edit resume" }));
        fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Changed" } });
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(mockedApi.put).not.toHaveBeenCalled();
        expect(screen.getByText("Backend")).toBeInTheDocument();
        expect(cardOf(screen.getByText("Go and Postgres"))).toBe(cardOf(screen.getByText("Backend")));
    });
    it("hides edit mode when the feature flag is disabled", () => {
        vi.stubEnv("NEXT_PUBLIC_RESUME_EDIT", "disabled");
        render(<ResumeEditor resumeId="r-1" initialResume={MOCK} onSaved={vi.fn()} />);
        expect(screen.queryByRole("button", { name: "Edit resume" })).not.toBeInTheDocument();
        expect(screen.getByText("Backend")).toBeInTheDocument();
        expect(screen.getByText("Go and Postgres")).toBeInTheDocument();
    });
});
