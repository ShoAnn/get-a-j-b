import { requireAuth } from "@/lib/requireAuth";
import { internalApiClient } from "@/lib/server/api";
import { HttpError } from "@/types/errors";
import { JobSchema } from "@/types/job";
import { NextResponse } from "next/server";
import z from "zod";

export async function GET() {
    try {
        const token = await requireAuth();
        const data = await internalApiClient.get('/data', z.array(JobSchema), {
            headers: { Authorization: `Bearer ${token}` },
        });
        return NextResponse.json(data);
    } catch (err) {
        if (err instanceof HttpError) {
            if (err.statusCode == 401) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (err.statusCode == 403) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function POST(request: Request) {

}
