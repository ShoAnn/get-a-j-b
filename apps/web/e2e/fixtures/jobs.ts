const API_URL = process.env.API_URL ?? "http://localhost:8080";

export interface CreatedJob {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: number;
    description: string;
    requirements: string;
    current_status: string;
    notes: string;
    source_url: string;
    job_portal: string;
}

export interface CreateJobOptions {
    title?: string;
    company?: string;
    location?: string;
    salary?: number;
    description?: string;
    requirements?: string;
    status?: string;
    notes?: string;
    sourceURL?: string;
    jobPortal?: string;
}

/**
 * Creates a job directly via the Go API using a Bearer token.
 * Used to seed data for read/edit/delete e2e tests without driving the UI.
 */
export async function createJobViaApi(
    accessToken: string,
    overrides: CreateJobOptions = {},
): Promise<CreatedJob> {
    const apiBase = API_URL.replace(/\/$/, "");
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const payload = {
        title: overrides.title ?? `E2E Title ${suffix}`,
        company: overrides.company ?? `E2E Company ${suffix}`,
        location: overrides.location ?? "Remote",
        salary: overrides.salary ?? 95000,
        description: overrides.description ?? "Playwright e2e description",
        requirements: overrides.requirements ?? "Playwright e2e requirements",
        current_status: overrides.status ?? "draft",
        notes: overrides.notes ?? "e2e notes",
        source_url: overrides.sourceURL ?? "https://example.com/job",
        job_portal: overrides.jobPortal ?? "LinkedIn",
    };

    const res = await fetch(`${apiBase}/api/jobs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Failed to create job via Go API (${res.status}): ${body}`);
    }

    const job = (await res.json()) as CreatedJob;
    // Go returns numeric id; normalize to string for frontend routes (/jobs/:id)
    return { ...job, id: String(job.id) };
}

export async function deleteJobViaApi(accessToken: string, jobId: string): Promise<void> {
    const apiBase = API_URL.replace(/\/$/, "");
    const res = await fetch(`${apiBase}/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok && res.status !== 204) {
        const body = await res.text().catch(() => "");
        throw new Error(`Failed to delete job ${jobId} via Go API (${res.status}): ${body}`);
    }
}
