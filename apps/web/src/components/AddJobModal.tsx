"use client";

import { useState, type FormEvent } from "react";
import Modal from "./Modal";
import Button from "./Button";
import type { JobStatus } from "@/types/job";
import { JOB_STATUSES } from "./StatusBadge";

export interface JobFormData {
  role: string;
  company: string;
  status: JobStatus;
  notes: string;
}

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: JobFormData) => void;
}

export default function AddJobModal({
  open,
  onClose,
  onSubmit,
}: AddJobModalProps) {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<JobStatus>("draft");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ role?: string; company?: string }>({});

  function validate() {
    const next: { role?: string; company?: string } = {};
    if (!role.trim()) next.role = "Role is required";
    if (!company.trim()) next.company = "Company is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ role: role.trim(), company: company.trim(), status, notes: notes.trim() });
    setRole("");
    setCompany("");
    setStatus("draft");
    setNotes("");
    setErrors({});
  }

  function handleClose() {
    setRole("");
    setCompany("");
    setStatus("draft");
    setNotes("");
    setErrors({});
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Job">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-xs font-medium text-text-secondary dark:text-[#9999AA]">
            Role
          </label>
          <input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Frontend Engineer"
            className="rounded-lg border-[0.5px] border-zinc-300 px-3 py-[9px] text-sm transition-colors focus:border-violet focus:outline-none dark:border-[#333355] dark:bg-[#1A1A2E] dark:text-[#F5F5F0] dark:placeholder:text-[#666688]"
          />
          {errors.role && (
            <span className="text-xs text-error">{errors.role}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="company" className="text-xs font-medium text-text-secondary dark:text-[#9999AA]">
            Company
          </label>
          <input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="rounded-lg border-[0.5px] border-zinc-300 px-3 py-[9px] text-sm transition-colors focus:border-violet focus:outline-none dark:border-[#333355] dark:bg-[#1A1A2E] dark:text-[#F5F5F0] dark:placeholder:text-[#666688]"
          />
          {errors.company && (
            <span className="text-xs text-error">{errors.company}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-xs font-medium text-text-secondary dark:text-[#9999AA]">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus)}
            className="rounded-lg border-[0.5px] border-zinc-300 px-3 py-[9px] text-sm transition-colors focus:border-violet focus:outline-none dark:border-[#333355] dark:bg-[#1A1A2E] dark:text-[#F5F5F0]"
          >
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-xs font-medium text-text-secondary dark:text-[#9999AA]">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes..."
            className="resize-none rounded-lg border-[0.5px] border-zinc-300 px-3 py-[9px] text-sm transition-colors focus:border-violet focus:outline-none dark:border-[#333355] dark:bg-[#1A1A2E] dark:text-[#F5F5F0] dark:placeholder:text-[#666688]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}
