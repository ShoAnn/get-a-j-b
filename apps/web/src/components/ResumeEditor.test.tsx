import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ResumeEditor from "./ResumeEditor";
import type { Resume } from "@/types/resume";

vi.mock("@/lib/client/api", () => ({
    apiClient: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
import { apiClient } from "@/lib/client/api";
const mockedApi = vi.mocked(apiClient);

const mockPush = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());
const mockBumpVersion = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("./ResumesRefresh", () => ({
    useResumesRefresh: () => ({ version: 0, highlightedId: null, bumpVersion: mockBumpVersion }),
}));

const MOCK: Resume = { id: "r-1", userId: "u-1", label: "Backend", content: "Go and Postgres", updatedAt: "2026-01-02 03:04:05" };

describe("ResumeEditor", () => {
    beforeEach(() => vi.clearAllMocks());

    it("toggles edit mode and saves via PUT", async () => {
        const onSaved = vi.fn();
        const updated = { ...MOCK, label: "Backend v2", content: "Go, Postgres and React" };
        mockedApi.put.mockResolvedValueOnce(updated);
        render(<ResumeEditor resumeId="r-1" initialResume={MOCK} onSaved={onSaved} />);
        expect(screen.getByText("Last edited Jan 2, 2026")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Edit resume" })).toBeInTheDocument();
        expect(screen.queryByLabelText("Label")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Edit resume" }));
        expect(screen.getByLabelText("Label")).toHaveValue("Backend");
        expect(screen.getByLabelText("Editor")).toHaveValue("Go and Postgres");
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Backend v2" } });
        fireEvent.change(screen.getByLabelText("Editor"), { target: { value: "Go, Postgres and React" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() =>
            expect(mockedApi.put).toHaveBeenCalledWith(
                "/resumes/r-1",
                expect.anything(),
                expect.objectContaining({ label: "Backend v2", content: "Go, Postgres and React" }),
            ),
        );
        await waitFor(() => expect(onSaved).toHaveBeenCalledWith(updated));
        await waitFor(() => expect(screen.queryByLabelText("Label")).not.toBeInTheDocument());
        expect(screen.getByText("Backend v2")).toBeInTheDocument();
        expect(screen.getByText("Go, Postgres and React")).toBeInTheDocument();
    });

    it("cancel discards without PUT", () => {
        render(<ResumeEditor resumeId="r-1" initialResume={MOCK} onSaved={vi.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: "Edit resume" }));
        fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Changed" } });
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(mockedApi.put).not.toHaveBeenCalled();
        expect(screen.queryByLabelText("Label")).not.toBeInTheDocument();
        expect(screen.getByText("Backend")).toBeInTheDocument();
    });

    it("create mode starts editing and saves via POST", async () => {
        const onSaved = vi.fn();
        const created = { ...MOCK, id: "r-2", label: "Backend v2", content: "Go, Postgres and React" };
        mockedApi.post.mockResolvedValueOnce(created);
        render(<ResumeEditor mode="create" initialResume={MOCK} onSaved={onSaved} />);
        expect(screen.queryByRole("button", { name: "Edit resume" })).not.toBeInTheDocument();
        expect(screen.queryByText(/Last edited/)).not.toBeInTheDocument();
        expect(screen.getByLabelText("Label")).toHaveValue("Backend");
        expect(screen.getByLabelText("Editor")).toHaveValue("Go and Postgres");

        fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Backend v2" } });
        fireEvent.change(screen.getByLabelText("Editor"), { target: { value: "Go, Postgres and React" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() =>
            expect(mockedApi.post).toHaveBeenCalledWith(
                "/resumes",
                expect.anything(),
                expect.objectContaining({ label: "Backend v2", content: "Go, Postgres and React" }),
            ),
        );
        expect(mockedApi.put).not.toHaveBeenCalled();
        await waitFor(() => expect(onSaved).toHaveBeenCalledWith(created));
    });

    it("create mode disables Save when fields are blank", () => {
        render(
            <ResumeEditor
                mode="create"
                initialResume={{ ...MOCK, label: "   ", content: "   " }}
                onSaved={vi.fn()}
            />,
        );
        expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("create mode Cancel returns to the list without POST", () => {
        render(<ResumeEditor mode="create" initialResume={MOCK} onSaved={vi.fn()} />);
        fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Changed" } });
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(mockedApi.post).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/resumes");
    });

    it("deletes the resume after inline two-step confirm", async () => {
        mockedApi.delete.mockResolvedValueOnce(undefined);
        render(<ResumeEditor resumeId="r-1" initialResume={MOCK} onSaved={vi.fn()} />);

        fireEvent.click(screen.getByRole("button", { name: "Delete resume" }));
        expect(screen.getByRole("button", { name: "Confirm delete" })).toBeInTheDocument();
        expect(screen.getByTestId("confirm-countdown")).toBeInTheDocument();
        expect(mockedApi.delete).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
        await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith("/resumes/r-1", expect.anything()));
        await waitFor(() => expect(mockBumpVersion).toHaveBeenCalled());
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/resumes"));
        expect(mockRefresh).toHaveBeenCalled();
    });

    it("disarms the confirm after a timeout", () => {
        vi.useFakeTimers();
        try {
            render(<ResumeEditor resumeId="r-1" initialResume={MOCK} onSaved={vi.fn()} />);
            fireEvent.click(screen.getByRole("button", { name: "Delete resume" }));
            expect(screen.getByRole("button", { name: "Confirm delete" })).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(3000);
            });
            expect(screen.getByRole("button", { name: "Delete resume" })).toBeInTheDocument();
            expect(mockedApi.delete).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });

    it("shows an error when delete fails", async () => {
        mockedApi.delete.mockRejectedValueOnce(new Error("boom"));
        render(<ResumeEditor resumeId="r-1" initialResume={MOCK} onSaved={vi.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: "Delete resume" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

        await waitFor(() =>
            expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong while deleting"),
        );
        expect(screen.getByRole("button", { name: "Delete resume" })).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
    });
});
