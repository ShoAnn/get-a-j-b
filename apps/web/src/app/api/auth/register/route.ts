import { internalApiClient } from "@/lib/server/api";
import { setAuthCookies } from "@/lib/setAuthCookies";
import { AuthResponseSchema, RegisterSchema } from "@/types/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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
}
