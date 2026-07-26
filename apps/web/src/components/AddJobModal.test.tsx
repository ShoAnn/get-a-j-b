import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AddJobModal from "./AddJobModal";

describe("AddJobModal", () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <AddJobModal open={false} onClose={onClose} onSubmit={onSubmit} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders all form fields and buttons when open", () => {
    render(
      <AddJobModal open={true} onClose={onClose} onSubmit={onSubmit} />,
    );
    expect(screen.getByLabelText("Role")).toBeInTheDocument();
    expect(screen.getByLabelText("Company")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Job Portal")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel" }),
    ).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(
      <AddJobModal open={true} onClose={onClose} onSubmit={onSubmit} />,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Role is required")).toBeInTheDocument();
    expect(screen.getByText("Company is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error for missing company only", async () => {
    const user = userEvent.setup();
    render(
      <AddJobModal open={true} onClose={onClose} onSubmit={onSubmit} />,
    );
    await user.type(screen.getByLabelText("Role"), "Engineer");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Company is required")).toBeInTheDocument();
    expect(
      screen.queryByText("Role is required"),
    ).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with trimmed form data when valid", async () => {
    const user = userEvent.setup();
    render(
      <AddJobModal open={true} onClose={onClose} onSubmit={onSubmit} />,
    );
    await user.type(screen.getByLabelText("Role"), "  Software Engineer  ");
    await user.type(screen.getByLabelText("Company"), "  Acme Corp  ");
    await user.selectOptions(screen.getByLabelText("Status"), "submitted");
    await user.type(screen.getByLabelText("Job Portal"), "LinkedIn");
    await user.type(screen.getByLabelText("Notes"), "Great opportunity");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledWith({
      role: "Software Engineer",
      company: "Acme Corp",
      status: "submitted",
      jobPortal: "LinkedIn",
      notes: "Great opportunity",
    });
  });

  it("resets form fields after successful submit", async () => {
    const user = userEvent.setup();
    render(
      <AddJobModal open={true} onClose={onClose} onSubmit={onSubmit} />,
    );
    await user.type(screen.getByLabelText("Role"), "Engineer");
    await user.type(screen.getByLabelText("Company"), "Acme");
    await user.click(screen.getByRole("button", { name: "Save" }));
    const roleInput = screen.getByLabelText("Role") as HTMLInputElement;
    const companyInput = screen.getByLabelText("Company") as HTMLInputElement;
    expect(roleInput.value).toBe("");
    expect(companyInput.value).toBe("");
  });

  it("calls onClose and resets form when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AddJobModal open={true} onClose={onClose} onSubmit={onSubmit} />,
    );
    await user.type(screen.getByLabelText("Role"), "Engineer");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
    const roleInput = screen.getByLabelText("Role") as HTMLInputElement;
    expect(roleInput.value).toBe("");
  });

  it("renders all status options in the select", () => {
    render(
      <AddJobModal open={true} onClose={onClose} onSubmit={onSubmit} />,
    );
    const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
    expect(statusSelect.options.length).toBe(9);
    expect(statusSelect.options[0].value).toBe("draft");
  });
});
