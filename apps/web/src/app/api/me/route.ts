import { zodErrorToFields } from "@/lib/helpers";
import { requireAuth } from "@/lib/requireAuth";
import { internalApiClient } from "@/lib/server/api";
import { HttpError } from "@/types/errors";
import { ApiUserSchema, toMe, UpdateMeSchema } from "@/types/apiUser";
import { NextRequest, NextResponse } from "next/server";
import z, { ZodError } from "zod";

export async function GET() {
    try {
        const token = await requireAuth();
        const data = await internalApiClient.get("/me", ApiUserSchema, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(toMe(data));
    } catch (err) {
        if (err instanceof ZodError) {
            const fields = zodErrorToFields(err);
            return NextResponse.json(
                { error: "Validation failed", fields },
                { status: 422 }
            );
        }
        if (err instanceof HttpError) {
            if (err.statusCode === 401) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (err.statusCode === 404) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
        }
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const token = await requireAuth();
        const body = await request.json();
        const validated = UpdateMeSchema.safeParse(body);
        if (!validated.success) {
            const fields = zodErrorToFields(validated.error);
            return NextResponse.json({ error: "Validation failed", fields }, { status: 422 });
        }
        const data = await internalApiClient.put("/me", ApiUserSchema, validated.data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(toMe(data));
    } catch (err) {
        if (err instanceof ZodError) {
            const fields = zodErrorToFields(err);
            return NextResponse.json(
                { error: "Validation failed", fields },
                { status: 422 }
            );
        }
        if (err instanceof HttpError) {
            if (err.statusCode === 401) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (err.statusCode === 404) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            if (err.statusCode === 409) {
                return NextResponse.json({ error: "Email already exists" }, { status: 409 });
            }
            if (err.statusCode === 400) {
                return NextResponse.json({ error: err.message || "Bad request" }, { status: 400 });
            }
        }
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const token = await requireAuth();
        await internalApiClient.delete("/me", z.void(), {
            headers: { Authorization: `Bearer ${token}` },
        });
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        if (err instanceof HttpError) {
            if (err.statusCode === 401) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (err.statusCode === 404) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
        }
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
