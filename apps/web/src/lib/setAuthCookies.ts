import { cookies } from "next/headers";

export async function setAuthCookies(accessToken: string, refreshToken: string, expiryTime: string) {
    const cookieStore = await cookies();
    cookieStore.set("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: parseInt(expiryTime, 10),
    });
    cookieStore.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
}
