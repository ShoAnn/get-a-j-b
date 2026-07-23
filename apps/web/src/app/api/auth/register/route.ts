import { internalApiClient } from "@/lib/server/api";
import { setAuthCookies } from "@/lib/setAuthCookies";
import { AuthResponseSchema, RegisterSchema } from "@/types/auth";
import { HttpError, ValidationError } from "@/types/errors";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = RegisterSchema.safeParse(body);
        const safeInput = {
            email: parsed.data?.email,
            password: parsed.data?.password,
            role: parsed.data?.role ?? "user",
        };

        const { accessToken, refreshToken, expiryTime } = await internalApiClient.post(
            "/auth/register",
            AuthResponseSchema,
            safeInput
        );

        await setAuthCookies(accessToken, refreshToken, expiryTime);
        return NextResponse.json({ success: true });
    } catch (err) {
        if (err instanceof ValidationError) {
            return NextResponse.json(
                { error: err.message, fields: err.fields },
                { status: err.statusCode }
            );
        }
        if (err instanceof HttpError) {
            if (err.statusCode == 400) {
                return NextResponse.json({ error: `Bad request ${err.message}` }, { status: 400 });
            }
            if (err.statusCode == 409) {
                return NextResponse.json({ error: `Conflict: ${err.message}` }, { status: 409 });
            }
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
