import { HttpError } from "@/types/errors";
import z from "zod";

async function request<T>(
	path: string,
	schema: z.ZodType<T>,
	options: RequestInit = {}
): Promise<T> {
	const res = await fetch(
		`/api${path}`,
		{
			...options,
			credentials: "include",
			headers: {
				...(options.body ? { "Content-Type": "application/json" } : {}),
				...options.headers,
			}
		}
	)
	if (!res.ok) {
		if (res.status === 401 && typeof window !== "undefined") {
			const path = window.location.pathname;
			const isAuthPage = path.startsWith("/login") || path.startsWith("/register");
			if (!isAuthPage) {
				try {
					sessionStorage.setItem("auth_bounce_reason", "expired");
					document.cookie = "access_token=; Max-Age=0; path=/";
					document.cookie = "refresh_token=; Max-Age=0; path=/";
				} catch {}
				try {
					window.location.assign("/login");
				} catch {}
			}
		}
		const body = await res.json().catch(() => ({} as Record<string, unknown>))
		const message =
			(typeof body.message === "string" && body.message) ||
			(typeof body.error === "string" && body.error) ||
			`Request failed with status ${res.status}`;
		throw new HttpError(message, res.status)
	}

	if (res.status === 204 || res.headers.get("content-length") === "0") {
		return schema.parse(undefined)
	}

	const json = await res.json()
	const parsedJson = schema.safeParse(json)
	if (!parsedJson.success) {
		throw parsedJson.error;
	}
	return parsedJson.data
}

export const apiClient = {
	get: <T>(path: string, schema: z.ZodType<T>) => request<T>(path, schema, { method: "GET" }),
	post: <T>(path: string, schema: z.ZodType<T>, body: unknown) => request<T>(
		path,
		schema,
		{ method: "POST", body: JSON.stringify(body) }
	),
	put: <T>(path: string, schema: z.ZodType<T>, body: unknown) => request<T>(
		path,
		schema,
		{ method: "PUT", body: JSON.stringify(body) }
	),
	patch: <T>(path: string, schema: z.ZodType<T>, body: unknown) => request<T>(
		path,
		schema,
		{ method: "PATCH", body: JSON.stringify(body) }
	),
	delete: <T>(path: string, schema: z.ZodType<T>) => request<T>(path, schema, { method: "DELETE" }),
}
