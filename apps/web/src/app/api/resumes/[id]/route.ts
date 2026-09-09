import { zodErrorToFields } from "@/lib/helpers";
import { requireAuth } from "@/lib/requireAuth";
import { internalApiClient } from "@/lib/server/api";
import { HttpError } from "@/types/errors";
import { ApiResumeSchema, toResume } from "@/types/apiResume";
import { UpdateResumeSchema } from "@/types/resume";
import { NextRequest, NextResponse } from "next/server";
import z, { ZodError } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(err: unknown) {
    if (err instanceof ZodError) {
        const fields = zodErrorToFields(err);
        return NextResponse.json({ error: "Validation failed", fields }, { status: 422 });
    }
    if (err instanceof HttpError) {
        if (err.statusCode == 400) {
            return NextResponse.json({ error: "Bad request" }, { status: 400 });
        }
        if (err.statusCode == 401) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (err.statusCode == 403) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (err.statusCode == 404) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
    }
    // eslint-disable-next-line no-console
    console.error("[BFF resumes/[id]] errorResponse:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const token = await requireAuth();
        const data = await internalApiClient.get(`/resumes/${id}`, ApiResumeSchema, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(toResume(data));
    } catch (err) {
        return errorResponse(err);
    }
}

export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const token = await requireAuth();
        const body = await request.json();
        const validatedInput = UpdateResumeSchema.safeParse(body);
        if (!validatedInput.success) {
            const fields = zodErrorToFields(validatedInput.error);
            return NextResponse.json({ error: "Validation failed", fields }, { status: 422 });
        }
        const data = await internalApiClient.put(`/resumes/${id}`, ApiResumeSchema, validatedInput.data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(toResume(data));
    } catch (err) {
        return errorResponse(err);
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const token = await requireAuth();
        await internalApiClient.delete(`/resumes/${id}`, z.void(), {
            headers: { Authorization: `Bearer ${token}` },
        });
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        return errorResponse(err);
    }
}
