import { HttpError } from "@/types/errors";
import z from "zod";

const API_URL = process.env.API_URL

async function request<T>(
	path: string,
	schema: z.ZodType<T>,
	options: RequestInit = {}
): Promise<T> {
	const res = await fetch(
		`${API_URL}/api${path}`,
		{
			...options,
			headers: {
				...(options.body ? { "Content-Type": "application/json" } : {}),
				...options.headers,
			}
		}
	)
	if (!res.ok) {
		const error = await res.json().catch(() => ({} as Record<string, unknown>));
		const message =
			(typeof error.message === "string" && error.message) ||
			(typeof (error as Record<string, unknown>).error === "string" && (error as Record<string, unknown>).error as string) ||
			`Request failed with status ${res.status}`;
		throw new HttpError(message, res.status)
	}

	if (res.status === 204 || res.headers.get("content-length") === "0") {
		return schema.parse(undefined as unknown as T)
	}

	const json = await res.json()
	const parsedJson = schema.safeParse(json)
	if (!parsedJson.success) {
		throw parsedJson.error;
	}
	return parsedJson.data
}

export const internalApiClient = {
	get: <T>(path: string, schema: z.ZodType<T>, options?: RequestInit) => request<T>(path, schema, {
		...options,
		method: "GET",
	}),
	post: <T>(path: string, schema: z.ZodType<T>, body: unknown, options?: RequestInit) => request<T>(
		path,
		schema,
		{
			...options,
			method: "POST", body: JSON.stringify(body)
		}
	),
	put: <T>(path: string, schema: z.ZodType<T>, body: unknown, options?: RequestInit) => request<T>(
		path,
		schema,
		{
			...options,
			method: "PUT", body: JSON.stringify(body)
		}
	),
	delete: <T>(path: string, schema: z.ZodType<T>, options?: RequestInit) => request<T>(
		path, schema, { ...options, method: "DELETE" }
	),
}
