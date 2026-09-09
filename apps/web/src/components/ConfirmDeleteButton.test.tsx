import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ConfirmDeleteButton, { CONFIRM_DELETE_TIMEOUT_MS } from "./ConfirmDeleteButton";

describe("ConfirmDeleteButton", () => {
    it("renders the idle label without a countdown ring", () => {
        render(
            <ConfirmDeleteButton
                idleLabel="Delete resume"
                confirming={false}
                deleting={false}
                onClick={vi.fn()}
            />,
        );
        expect(screen.getByRole("button", { name: "Delete resume" })).toBeInTheDocument();
        expect(screen.queryByTestId("confirm-countdown")).not.toBeInTheDocument();
    });

    it("renders the confirm label with a countdown ring when armed", () => {
        render(
            <ConfirmDeleteButton
                idleLabel="Delete resume"
                confirming={true}
                deleting={false}
                onClick={vi.fn()}
            />,
        );
        expect(screen.getByRole("button", { name: "Confirm delete" })).toBeInTheDocument();
        expect(screen.getByTestId("confirm-countdown")).toBeInTheDocument();
    });

    it("renders the deleting label without a countdown ring while deleting", () => {
        render(
            <ConfirmDeleteButton
                idleLabel="Delete resume"
                confirming={true}
                deleting={true}
                onClick={vi.fn()}
            />,
        );
        expect(screen.getByRole("button", { name: "Deleting..." })).toBeInTheDocument();
        expect(screen.queryByTestId("confirm-countdown")).not.toBeInTheDocument();
    });

    it("forwards clicks to onClick", () => {
        const onClick = vi.fn();
        render(
            <ConfirmDeleteButton
                idleLabel="Delete job"
                confirming={true}
                deleting={false}
                onClick={onClick}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("uses a 3s confirm window matching the ring animation", () => {
        expect(CONFIRM_DELETE_TIMEOUT_MS).toBe(3000);
    });
});
