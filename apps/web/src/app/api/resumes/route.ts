import { zodErrorToFields } from "@/lib/helpers";
import { requireAuth } from "@/lib/requireAuth";
import { internalApiClient } from "@/lib/server/api";
import { HttpError } from "@/types/errors";
import { ApiResumeListSchema, ApiResumeSchema, toResume, toResumes } from "@/types/apiResume";
import { CreateResumeSchema } from "@/types/resume";
import { NextRequest, NextResponse } from "next/server";
import z, { ZodError } from "zod";

export async function GET() {
    try {
        const token = await requireAuth();
        const data = await internalApiClient.get("/resumes", ApiResumeListSchema, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(toResumes(data));
    } catch (err) {
        if (err instanceof ZodError) {
            const fields = zodErrorToFields(err);
            return NextResponse.json({ error: "Validation failed", fields }, { status: 422 });
        }
        if (err instanceof HttpError) {
            if (err.statusCode == 401) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (err.statusCode == 403) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = await requireAuth();
        const body = await request.json();
        const validatedInput = CreateResumeSchema.safeParse(body);
        if (!validatedInput.success) {
            const fields = zodErrorToFields(validatedInput.error);
            return NextResponse.json({ error: "Validation failed", fields }, { status: 422 });
        }
        const data = await internalApiClient.post("/resumes", ApiResumeSchema, validatedInput.data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(toResume(data));
    } catch (err) {
        if (err instanceof ZodError) {
            const fields = zodErrorToFields(err);
            return NextResponse.json({ error: "Validation failed", fields }, { status: 422 });
        }
        if (err instanceof HttpError) {
            if (err.statusCode == 401) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (err.statusCode == 400) {
                return NextResponse.json({ error: (err as HttpError).message || "Bad request" }, { status: 400 });
            }
        }
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
