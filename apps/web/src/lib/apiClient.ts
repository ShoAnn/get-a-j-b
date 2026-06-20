const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(
		`${BASE_URL}/api/${path}`,
		{
			...options,
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			}
		}
	)
	if (!res.ok) {
		const error = await res.json().catch(() => ({}))
		throw new Error(error.message ?? `http error: ${res.status}`)
	}
	return res.json() as Promise<T>;
}

export const apiClient = {
	get: <T>(path: string) => request<T>(path, { method: "GET" }),
	post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
	put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
	delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}
