"use client";

import Button from "@/components/Button";
import { JOB_STATUSES } from "@/components/StatusBadge";
import { Job, JobStatus } from "@/types/job";
import Link from "next/link";
import { useState } from "react";

export default async function JobEditor(job: Job) {
    const [formData, setFormData] = useState(job);
    const [isEditing, setisEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    if (!job) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center min-h-full gap-4 dark:bg-[#1A1A2E]">
                <h2 className="text-xl font-medium text-midnight dark:text-[#F5F5F0]">Job not found</h2>
                <Link href="/jobs">
                    <Button variant="secondary">Back to Jobs</Button>
                </Link>
            </div>
        );
    }

    const statusFlow: JobStatus[] = [
        "draft", "submitted", "under_review", "interview_scheduled",
        "offer_extended", "accepted",
    ];

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
            {isEditing ? (
                <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                    <Link
                        href="/jobs"
                        className="inline-flex items-center gap-1.5 text-sm text-violet transition-colors hover:text-[#6B63C9]"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Jobs
                    </Link>

                    <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
                        <input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <input
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        />
                        <input
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                        <input
                            type="number"
                            value={formData.salary}
                            onChange={(e) => {
                                const value = e.target.value;
                                const num = value === "" ? 0 : Number(value);
                                setFormData({ ...formData, salary: Number.isNaN(num) ? formData.salary : num });
                            }}
                        />
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <input
                            value={formData.requirements}
                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                        />
                        <select
                            name="status"
                            id="status"
                            value={formData.status}
                            onSelect={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                setFormData({ ...formData, status: e.target.value as JobStatus })
                            }}>
                            {JOB_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <input
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                        <input
                            value={formData.sourceURL}
                            onChange={(e) => setFormData({ ...formData, sourceURL: e.target.value })}
                        />
                        <input
                            value={formData.jobPortal}
                            onChange={(e) => setFormData({ ...formData, jobPortal: e.target.value })}
                        />
                    </div>
                </div>
            ) : (
                <div>
                    <h2 onClick={() => setisEditing(true)}>{formData.title}</h2>
                    <h2 onClick={() => setisEditing(true)}>{formData.company}</h2>
                    <h2 onClick={() => setisEditing(true)}>{formData.location}</h2>
                    <h2 onClick={() => setisEditing(true)}>{formData.salary}</h2>
                    <h2 onClick={() => setisEditing(true)}>{formData.description}</h2>
                    <h2 onClick={() => setisEditing(true)}>{formData.requirements}</h2>
                    <h2 onClick={() => setisEditing(true)}>
                        {formData.status} <small>last changed at {formData.statusChangedAt}</small>
                    </h2>
                    <h2 onClick={() => setisEditing(true)}>{formData.notes}</h2>
                    <h2 onClick={() => setisEditing(true)}>{formData.sourceURL}</h2>
                    <h2 onClick={() => setisEditing(true)}>{formData.jobPortal}</h2>
                    <h2>{formData.createdAt}</h2>
                </div>
            )}
        </div>
    );
}
