
import { zodErrorToFields } from "@/lib/helpers";
import { requireAuth } from "@/lib/requireAuth";
import { internalApiClient } from "@/lib/server/api";
import { HttpError } from "@/types/errors";
import { JobSchema, UpdateJobsSchema } from "@/types/job";
import { NextRequest, NextResponse } from "next/server";
import z, { ZodError } from "zod";

export async function GET() {
    try {
        const token = await requireAuth();
        const data = await internalApiClient.get('/jobs', JobSchema, {
            headers: { Authorization: `Bearer ${token}` },
        });
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
            if (err.statusCode == 400) {
                return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
            }
            if (err.statusCode == 401) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const token = await requireAuth();
        const body = await request.json();
        const validatedInput = UpdateJobsSchema.safeParse(body);
        const data = await internalApiClient.put('/jobs', JobSchema, validatedInput,
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
            if (err.statusCode == 400) {
                return NextResponse.json({ error: 'Bad request' }, { status: 400 });
            }
            if (err.statusCode == 401) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (err.statusCode == 404) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const token = await requireAuth();
        const data = await internalApiClient.delete('/jobs', z.void(),
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
            if (err.statusCode == 404) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
