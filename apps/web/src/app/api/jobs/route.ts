import { zodErrorToFields } from "@/lib/helpers";
import { requireAuth } from "@/lib/requireAuth";
import { internalApiClient } from "@/lib/server/api";
import { HttpError } from "@/types/errors";
import { ApiJobListSchema, ApiJobSchema, toJob, toJobs } from "@/types/apiJob";
import { CreateJobSchema } from "@/types/job";
import { NextRequest, NextResponse } from "next/server";
import z, { ZodError } from "zod";

export async function GET() {
    try {
        const token = await requireAuth();
        const data = await internalApiClient.get('/jobs', ApiJobListSchema, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(toJobs(data));
    } catch (err) {
        if (err instanceof ZodError) {
            const fields = zodErrorToFields(err);
            return NextResponse.json(
                { error: 'Validation failed', fields },
                { status: 422 }
            );
        }
        if (err instanceof HttpError) {
            if (err.statusCode == 401) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (err.statusCode == 403) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = await requireAuth();
        const body = await request.json();
        const validatedInput = CreateJobSchema.safeParse(body);
        if (!validatedInput.success) {
            const fields = zodErrorToFields(validatedInput.error);
            return NextResponse.json({ error: 'Validation failed', fields }, { status: 422 });
        }
        const d = validatedInput.data;
        const wireBody: Record<string, unknown> = {
            title: d.title,
            company: d.company,
            location: d.location,
            salary: d.salary,
            requirements: d.requirements,
        };
        if (d.description !== undefined) wireBody.description = d.description;
        if (d.status !== undefined) wireBody.current_status = d.status;
        if (d.notes !== undefined) wireBody.notes = d.notes;
        if (d.sourceURL !== undefined) wireBody.source_url = d.sourceURL;
        if (d.jobPortal !== undefined) wireBody.job_portal = d.jobPortal;
        const data = await internalApiClient.post('/jobs', ApiJobSchema, wireBody,
            { headers: { Authorization: `Bearer ${token}` }, }
        );
        return NextResponse.json(toJob(data));
    } catch (err) {
        if (err instanceof ZodError) {
            const fields = zodErrorToFields(err);
            return NextResponse.json(
                { error: 'Validation failed', fields },
                { status: 422 }
            );
        }
        if (err instanceof HttpError) {
            if (err.statusCode == 401) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (err.statusCode == 400) {
                return NextResponse.json({ error: (err as HttpError).message || 'Bad request' }, { status: 400 });
            }
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
