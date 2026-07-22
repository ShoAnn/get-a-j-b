import { internalApiClient } from "@/lib/server/api";
import { setAuthCookies } from "@/lib/setAuthCookies";
import { AuthResponseSchema, RegisterSchema } from "@/types/auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    let callerRole = "";
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString());
    callerRole = payload.role;

    const parsed = RegisterSchema.safeParse(body);
    const safeInput = {
        email: parsed.data?.email,
        password: parsed.data?.password,
        role: callerRole === 'admin' ? (parsed.data?.role ?? 'user') : 'user',
    };

    const authResponse = await internalApiClient.post(
        "/auth/admin/create-user",
        AuthResponseSchema,
        safeInput
    );
    // NOTE: confirm how backend implement this

    return NextResponse.json({ success: true });
}
