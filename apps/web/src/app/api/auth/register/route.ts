import { zodErrorToFields } from "@/lib/helpers";
import { internalApiClient } from "@/lib/server/api";
import { setAuthCookies } from "@/lib/setAuthCookies";
import { AuthResponseSchema, RegisterSchema } from "@/types/auth";
import { HttpError } from "@/types/errors";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = RegisterSchema.safeParse(body);
        if (!parsed.success) {
            const fields = zodErrorToFields(parsed.error);
            return NextResponse.json({ error: 'Validation failed', fields }, { status: 422 });
        }
        const { email, password, username } = parsed.data;
        const safeInput = { email, password, username };

        const { access_token, refresh_token, expires_in } = await internalApiClient.post(
            "/auth/register",
            AuthResponseSchema,
            safeInput
        );
        await setAuthCookies(access_token, refresh_token, expires_in);
        return new NextResponse(null, { status: 204 });
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
                return NextResponse.json({ error: `Bad request ${err.message}` }, { status: 400 });
            }
            if (err.statusCode == 409) {
                return NextResponse.json({ error: `Conflict: ${err.message}` }, { status: 409 });
            }
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
