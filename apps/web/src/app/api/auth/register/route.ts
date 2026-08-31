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
            return NextResponse.json(
                { error: "Please check the form for errors.", fields },
                { status: 422 }
            );
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
                { error: "Please check the form for errors.", fields },
                { status: 422 }
            );
        }
        if (err instanceof HttpError) {
            if (err.statusCode === 409) {
                return NextResponse.json(
                    { error: "An account with this email already exists." },
                    { status: 409 }
                );
            }
            if (err.statusCode === 400) {
                return NextResponse.json(
                    { error: "Some details don't look right. Please review and try again." },
                    { status: 400 }
                );
            }
            if (err.statusCode >= 500) {
                return NextResponse.json(
                    { error: "The server is having trouble. Please try again in a moment." },
                    { status: 502 }
                );
            }
        }
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
