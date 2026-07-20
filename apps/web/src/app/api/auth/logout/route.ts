import { internalApiClient } from "@/lib/server/api";
import { LogoutResponseSchema } from "@/types/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    await internalApiClient.post(
        "/auth/logout",
        LogoutResponseSchema,
        {
            headers: { Authorization: `Bearer ${refreshToken}` },
            body: {} // NOTE: this might change
        }
    );

    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    return new NextResponse(null, { status: 204 });
}
