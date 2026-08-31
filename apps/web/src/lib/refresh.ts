import { cookies } from "next/headers";
import { internalApiClient } from "./server/api";
import { AuthResponseSchema } from "@/types/auth";
import { setAuthCookies } from "./setAuthCookies";

export async function refresh() {
    /*
     get cookies from browser
     fetch /auth/refresh
     set auth cookies with the new tokens
     */
    const cookieStore = await cookies();
    const token = cookieStore.get("refresh_token")?.value;
    if (!token) return false
    try {
        const { access_token, refresh_token, expires_in } = await internalApiClient.post(
            "/auth/refresh",
            AuthResponseSchema,
            { token }
        );
        await setAuthCookies(access_token, refresh_token, expires_in);
        return true;
    } catch (err) {
        return false;
    }
}
