
import { zodErrorToFields } from "@/lib/helpers";
import { requireAuth } from "@/lib/requireAuth";
import { internalApiClient } from "@/lib/server/api";
import { HttpError } from "@/types/errors";
import { JobSchema, PatchJobSchema, UpdateJobSchema } from "@/types/job";
import { NextRequest, NextResponse } from "next/server";
import z, { ZodError } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(err: unknown) {
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

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const token = await requireAuth();
        const data = await internalApiClient.get(`/jobs/${id}`, JobSchema, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(data);
    } catch (err) {
        return errorResponse(err);
    }
}

export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const token = await requireAuth();
        const body = await request.json();
        const validatedInput = UpdateJobSchema.safeParse(body);
        if (!validatedInput.success) {
            const fields = zodErrorToFields(validatedInput.error);
            return NextResponse.json(
                { error: 'Validation failed', fields },
                { status: 422 }
            );
        }
        const data = await internalApiClient.put(`/jobs/${id}`, JobSchema, validatedInput.data,
            { headers: { Authorization: `Bearer ${token}` }, }
        );
        return NextResponse.json(data);
    } catch (err) {
        return errorResponse(err);
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const token = await requireAuth();
        const body = await request.json();
        const validatedInput = PatchJobSchema.safeParse(body);
        if (!validatedInput.success) {
            const fields = zodErrorToFields(validatedInput.error);
            return NextResponse.json(
                { error: "Some fields don't look right.", fields },
                { status: 422 }
            );
        }
        // Translate frontend field names to Go wire field names.
        const wireBody: Record<string, unknown> = {};
        if (validatedInput.data.status !== undefined) wireBody.current_status = validatedInput.data.status;
        for (const [key, value] of Object.entries(validatedInput.data)) {
            if (key === "status") continue;
            if (value !== undefined) wireBody[key] = value;
        }
        const data = await internalApiClient.put(`/jobs/${id}`, JobSchema, wireBody,
            { headers: { Authorization: `Bearer ${token}` }, }
        );
        return NextResponse.json(data);
    } catch (err) {
        return errorResponse(err);
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const token = await requireAuth();
        await internalApiClient.delete(`/jobs/${id}`, z.void(),
            { headers: { Authorization: `Bearer ${token}` }, }
        );
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        return errorResponse(err);
    }
}
