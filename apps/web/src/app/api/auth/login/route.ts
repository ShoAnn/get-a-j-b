import { zodErrorToFields } from "@/lib/helpers";
import { internalApiClient } from "@/lib/server/api";
import { setAuthCookies } from "@/lib/setAuthCookies";
import { AuthResponseSchema, LoginFormSchema } from "@/types/auth";
import { HttpError } from "@/types/errors";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedInput = LoginFormSchema.safeParse(body);
        if (!validatedInput.success) {
            const fields = zodErrorToFields(validatedInput.error);
            return NextResponse.json({ error: 'Validation failed', fields }, { status: 422 });
        }
        const { access_token, refresh_token, expires_in } = await internalApiClient.post(
            "/auth/login",
            AuthResponseSchema,
            validatedInput.data
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
            if (err.statusCode == 401) {
                return NextResponse.json({ error: `${err.message}` }, { status: 401 });
            }
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
