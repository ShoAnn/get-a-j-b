import { internalApiClient } from "@/lib/server/api";
import { setAuthCookies } from "@/lib/setAuthCookies";
import { AuthResponseSchema } from "@/types/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.json();

    const { accessToken, refreshToken, expiryTime } = await internalApiClient.post(
        "/auth/login",
        AuthResponseSchema,
        body
    );

    await setAuthCookies(accessToken, refreshToken, expiryTime);
    return NextResponse.json({ success: true });
}
