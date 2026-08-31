import { describe, it, expect } from "vitest";
import { zodErrorToFields } from "./helpers";
import { z } from "zod";

describe("zodErrorToFields", () => {
    it("groups issues by path", () => {
        const schema = z.object({
            email: z.email(),
            password: z.string().min(6),
        });
        const result = schema.safeParse({ email: "not-email", password: "x" });
        if (result.success) throw new Error("expected failure");

        const fields = zodErrorToFields(result.error);
        expect(fields.email).toBeDefined();
        expect(fields.password).toBeDefined();
        expect(fields.email.length).toBeGreaterThan(0);
        expect(fields.password.length).toBeGreaterThan(0);
    });

    it("joins nested paths with dots", () => {
        const schema = z.object({
            user: z.object({
                name: z.string().min(2),
            }),
        });
        const result = schema.safeParse({ user: { name: "a" } });
        if (result.success) throw new Error("expected failure");

        const fields = zodErrorToFields(result.error);
        expect(fields["user.name"]).toBeDefined();
    });

    it("collects multiple errors on the same path", () => {
        const schema = z.string().min(5).regex(/^\d+$/, "must be digits");
        const result = schema.safeParse("xx");
        if (result.success) throw new Error("expected failure");

        const fields = zodErrorToFields(result.error);
        expect(fields[""].length).toBeGreaterThanOrEqual(2);
    });
});