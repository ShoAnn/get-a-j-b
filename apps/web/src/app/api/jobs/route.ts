import { zodErrorToFields } from "@/lib/helpers";
import { requireAuth } from "@/lib/requireAuth";
import { internalApiClient } from "@/lib/server/api";
import { HttpError } from "@/types/errors";
import { CreateJobSchema, Job, JobSchema } from "@/types/job";
import { NextRequest, NextResponse } from "next/server";
import z, { ZodError } from "zod";

const MOCK_JOBS: Job[] = [
    {
        id: "mock-1",
        userId: "mock",
        title: "Senior Frontend Engineer",
        company: "Acme Inc.",
        location: "Remote",
        salary: 0,
        description: "Sample description",
        requirements: "Sample requirements",
        status: "interview_scheduled",
        statusChangedAt: "2026-08-01T00:00:00.000Z",
        notes: "Mock job",
        sourceURL: "",
        jobPortal: "LinkedIn",
        createdAt: "2026-08-01T00:00:00.000Z",
    },
    {
        id: "mock-2",
        userId: "mock",
        title: "Backend Engineer",
        company: "Globex Corp.",
        location: "Austin, TX",
        salary: 0,
        description: "Sample description",
        requirements: "Sample requirements",
        status: "submitted",
        statusChangedAt: "2026-07-28T00:00:00.000Z",
        notes: "Mock job",
        sourceURL: "",
        jobPortal: "Indeed",
        createdAt: "2026-07-28T00:00:00.000Z",
    },
];

export async function GET() {
    try {
        console.log("BRANCH is:", JSON.stringify(process.env.BRANCH));
        if (process.env.BRANCH == "dev") {
            return NextResponse.json(MOCK_JOBS);
        } else {
            const token = await requireAuth();
            const data = await internalApiClient.get('/jobs', z.array(JobSchema), {
                headers: { Authorization: `Bearer ${token}` },
            });
            return NextResponse.json(data);
        }
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
        const data = await internalApiClient.post('/jobs', JobSchema, validatedInput,
            { headers: { Authorization: `Bearer ${token}` }, }
        );
        return NextResponse.json(data);
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
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
