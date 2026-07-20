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
		throw new Error(error.message ?? `http error: ${res.status}`);
	}

	const json = await res.json()
	const parsedJson = schema.safeParse(json)
	if (!parsedJson.success) {
		throw new Error(
			`Validation failed: ${parsedJson.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")}`
		)
	}
	return parsedJson.data
}

export const internalApiClient = {
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
