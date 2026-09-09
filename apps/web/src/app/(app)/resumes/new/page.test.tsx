import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NewResumePage from "./page";
import { DEFAULT_RESUME_LABEL, DEFAULT_RESUME_CONTENT } from "@/lib/resumeTemplate";

vi.mock("@/lib/client/api", () => ({
    apiClient: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import { apiClient } from "@/lib/client/api";
const mockedApi = vi.mocked(apiClient);

const push = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push }),
}));

const bumpVersion = vi.fn();
vi.mock("@/components/ResumesRefresh", () => ({
    useResumesRefresh: () => ({ version: 0, highlightedId: null, bumpVersion }),
}));

describe("NewResumePage", () => {
    beforeEach(() => vi.clearAllMocks());

    it("prefills the template with live preview", () => {
        render(<NewResumePage />);
        expect(screen.getByLabelText("Label")).toHaveValue(DEFAULT_RESUME_LABEL);
        expect(screen.getByLabelText("Editor")).toHaveValue(DEFAULT_RESUME_CONTENT);
        expect(screen.getByRole("heading", { level: 1, name: "Your Name" })).toBeInTheDocument();
    });

    it("creates the resume then returns to the list with highlight", async () => {
        const created = {
            id: "r-9",
            userId: "u-1",
            label: DEFAULT_RESUME_LABEL,
            content: DEFAULT_RESUME_CONTENT.trim(),
            updatedAt: null,
        };
        mockedApi.post.mockResolvedValueOnce(created);
        render(<NewResumePage />);
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() =>
            expect(mockedApi.post).toHaveBeenCalledWith(
                "/resumes",
                expect.anything(),
                expect.objectContaining({
                    label: DEFAULT_RESUME_LABEL,
                    content: DEFAULT_RESUME_CONTENT.trim(),
                }),
            ),
        );
        await waitFor(() => expect(bumpVersion).toHaveBeenCalledWith("r-9"));
        await waitFor(() => expect(push).toHaveBeenCalledWith("/resumes"));
    });
});
