import { ZodError } from "zod";

export function zodErrorToFields(err: ZodError): Record<string, string[]> {
    return err.issues.reduce((acc, i) => {
        const key = i.path.join('.');
        acc[key] = acc[key] || [];
        acc[key].push(i.message);
        return acc;
    }, {} as Record<string, string[]>);
}
