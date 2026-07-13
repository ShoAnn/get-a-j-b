"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import Button from "@/components/Button";
import type { Job, JobStatus } from "@/types/job";

const MOCK_JOBS: Job[] = [
  { id: "1", title: "Frontend Engineer", company: "Stripe", status: "submitted", dateApplied: "2025-12-01", notes: "Referred by John. Need to prep for system design.", jobPortal: "LinkedIn" },
  { id: "2", title: "Senior Frontend Developer", company: "Vercel", status: "under_review", dateApplied: "2025-12-05", notes: "Great company culture. Submitted portfolio.", jobPortal: "Company Website" },
  { id: "3", title: "Full Stack Engineer", company: "Notion", status: "interview_scheduled", dateApplied: "2025-11-28", notes: "Interview on Dec 15. Review React patterns and SQL.", jobPortal: "LinkedIn" },
  { id: "4", title: "UI Engineer", company: "Linear", status: "rejected", dateApplied: "2025-11-15", jobPortal: "Indeed" },
  { id: "5", title: "Software Engineer", company: "Figma", status: "draft", dateApplied: "2025-12-10", notes: "Need to tailor resume for this role.", jobPortal: "Glassdoor" },
  { id: "6", title: "React Native Developer", company: "Expo", status: "offer_extended", dateApplied: "2025-11-20", notes: "Offer received: $180k + equity. Waiting on competing offers.", jobPortal: "LinkedIn" },
  { id: "7", title: "Backend Engineer", company: "Supabase", status: "accepted", dateApplied: "2025-10-01", jobPortal: "Company Website" },
];

export default function JobDetailPage() {
  const params = useParams();
  const job = MOCK_JOBS.find((j) => j.id === params.id);

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

  const currentIdx = statusFlow.indexOf(job.status);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 min-h-full dark:bg-[#1A1A2E]">
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
          {/* Left column — Job details */}
          <div>
            <div className="rounded-xl border-[0.5px] border-zinc-300 bg-surface p-6 dark:border-[#333355] dark:bg-[#252540]">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet text-lg font-medium text-white">
                  {job.company.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-medium text-midnight dark:text-[#F5F5F0]">{job.title}</h1>
                  <p className="mt-1 text-sm text-text-secondary dark:text-[#9999AA]">{job.company}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-6 dark:border-[#333355]">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">Status</p>
                  <div className="mt-1.5">
                    <StatusBadge status={job.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">Date Applied</p>
                  <p className="mt-1.5 text-sm text-midnight dark:text-[#F5F5F0]">
                    {new Date(job.dateApplied).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {currentIdx >= 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">Progress</p>
                    <p className="mt-1.5 text-sm text-midnight dark:text-[#F5F5F0]">
                      Step {currentIdx + 1} of {statusFlow.length}
                    </p>
                  </div>
                )}
              </div>

              {/* Status timeline */}
              <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-[#333355]">
                <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">Status History</h2>
                <div className="mt-4 space-y-3">
                  {statusFlow.map((s, i) => {
                    const isCompleted = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            isCompleted
                              ? "border-violet bg-violet"
                              : "border-zinc-300 bg-white dark:border-[#555577] dark:bg-transparent"
                          } ${isCurrent ? "ring-2 ring-violet ring-offset-2 dark:ring-offset-[#252540]" : ""}`}
                        >
                          {isCompleted && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span
                          className={`text-sm capitalize ${
                            isCompleted ? "font-medium text-midnight dark:text-[#F5F5F0]" : "text-text-secondary dark:text-[#9999AA]"
                          }`}
                        >
                          {s.replace(/_/g, " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right column — Job Portal + Notes */}
          <div className="flex flex-col gap-6">
            {job.jobPortal && (
              <div className="rounded-xl border-[0.5px] border-zinc-300 bg-surface p-6 dark:border-[#333355] dark:bg-[#252540]">
                <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">Job Portal</h2>
                <p className="mt-4 text-sm leading-relaxed text-midnight dark:text-[#F5F5F0]">{job.jobPortal}</p>
              </div>
            )}
            <div className="rounded-xl border-[0.5px] border-zinc-300 bg-surface p-6 dark:border-[#333355] dark:bg-[#252540]">
              <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary dark:text-[#9999AA]">Notes</h2>
              {job.notes ? (
                <p className="mt-4 text-sm leading-relaxed text-midnight whitespace-pre-wrap dark:text-[#F5F5F0]">
                  {job.notes}
                </p>
              ) : (
                <p className="mt-4 text-sm italic text-text-secondary dark:text-[#9999AA]">
                  No notes added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
