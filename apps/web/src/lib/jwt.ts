export function getJwtExpiry(token: string): number | null {
    try {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(
            Buffer.from(payloadBase64, 'base64url').toString('utf-8')
        );
        return payload.exp ?? null; // seconds since epoch
    } catch {
        return null;
    }
}

export function isJwtExpired(token: string): boolean {
    const exp = getJwtExpiry(token);
    if (exp === null) return true; // malformed → treat as expired
    return Date.now() >= exp * 1000; // exp is seconds, Date.now() is ms
}
