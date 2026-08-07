import { cookies } from 'next/headers';
import { isJwtExpired } from '@/lib/jwt';
import { refresh } from '@/lib/refresh';
import { HttpError } from '@/types/errors';

export async function requireAuth(): Promise<string> {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken || isJwtExpired(accessToken)) {
        const refreshed = await refresh();
        if (!refreshed) {
            throw new HttpError('Unauthorized', 401);
        }
        accessToken = (await cookies()).get('access_token')?.value;
    }

    return accessToken!;
}
