import { HttpError, ValidationError } from "@/types/errors";
import z from "zod";

const API_URL = process.env.API_URL

async function request<T>(
	path: string,
	schema: z.ZodType<T>,
	options: RequestInit = {}
): Promise<T> {
	const res = await fetch(
		`${API_URL + path}`,
		{
			...options,
			headers: {
				...(options.body ? { "Content-Type": "application/json" } : {}),
				...options.headers,
			}
		}
	)
	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new HttpError(`http error: ${error.message}`, res.status)
	}

	const json = await res.json()
	const parsedJson = schema.safeParse(json)
	if (!parsedJson.success) {
		throw new ValidationError(
			'Validation failed',
			parsedJson.error.issues.reduce((fields, i) => {
				const key = i.path.join('.');
				fields[key] = fields[key] || [];
				fields[key].push(i.message);
				return fields;
			}, {} as Record<string, string[]>)
		);
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
