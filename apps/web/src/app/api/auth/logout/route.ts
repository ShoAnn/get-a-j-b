import { internalApiClient } from "@/lib/server/api";
import { LogoutResponseSchema } from "@/types/auth";
import { HttpError } from "@/types/errors";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    // Idempotent logout: clear local cookies regardless of upstream result.
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    // No refresh token means nothing to invalidate upstream; treat as success.
    if (!refreshToken) {
        return new NextResponse(null, { status: 204 });
    }

    try {
        await internalApiClient.post(
            "/auth/logout",
            LogoutResponseSchema,
            {
                headers: { Authorization: `Bearer ${refreshToken}` },
                body: {} // NOTE: this might change
            }
        );
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        // Upstream logout failed, but local session is cleared — still 204 so user isn't stuck.
        // If upstream actually requires acknowledgement, switch to logging + error response.
        if (err instanceof HttpError && err.statusCode >= 500) {
            console.error("logout upstream error:", err);
        }
        return new NextResponse(null, { status: 204 });
    }
}
