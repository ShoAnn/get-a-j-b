import { HttpError, ValidationError } from "@/types/errors";
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
		const error = await res.json().catch(() => ({}))
		throw new HttpError(`http error: ${error.message}`, res.status)
	}

	if (res.status === 204 || res.headers.get("content-length") === "0") {
		return schema.parse(undefined)
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
	delete: <T>(path: string, schema: z.ZodType<T>) => request<T>(path, schema, { method: "DELETE" }),
}
