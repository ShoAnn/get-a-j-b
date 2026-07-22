import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isJwtExpired } from '@/lib/jwt';
import { refresh } from '@/lib/refresh';

export async function requireAuth(): Promise<string> {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken || isJwtExpired(accessToken)) {
        const refreshed = await refresh();
        if (!refreshed) redirect('/login');
        accessToken = (await cookies()).get('access_token')?.value;
    }

    return accessToken!;
}
