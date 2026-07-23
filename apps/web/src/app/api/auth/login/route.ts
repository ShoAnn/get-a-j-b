import { internalApiClient } from "@/lib/server/api";
import { setAuthCookies } from "@/lib/setAuthCookies";
import { AuthResponseSchema } from "@/types/auth";
import { HttpError, ValidationError } from "@/types/errors";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { accessToken, refreshToken, expiryTime } = await internalApiClient.post(
            "/auth/login",
            AuthResponseSchema,
            body
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
            if (err.statusCode == 401) {
                return NextResponse.json({ error: `${err.message}` }, { status: 401 });
            }
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
