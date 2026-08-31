import { zodErrorToFields } from "@/lib/helpers";
import { requireAuth } from "@/lib/requireAuth";
import { internalApiClient } from "@/lib/server/api";
import { HttpError } from "@/types/errors";
import { CreateJobSchema, JobSchema } from "@/types/job";
import { createMockJobs } from "@/mocks/data";
import { NextRequest, NextResponse } from "next/server";
import z, { ZodError } from "zod";

export async function GET() {
    try {
        console.log("BRANCH is:", JSON.stringify(process.env.BRANCH));
        if (process.env.BRANCH == "dev") {
            return NextResponse.json(createMockJobs());
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
        if (!validatedInput.success) {
            const fields = zodErrorToFields(validatedInput.error);
            return NextResponse.json({ error: 'Validation failed', fields }, { status: 422 });
        }
        const data = await internalApiClient.post('/jobs', JobSchema, validatedInput.data,
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
