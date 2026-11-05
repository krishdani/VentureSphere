import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./access";
import { firstError } from "./validation";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** Wraps a route handler: maps AppError/ZodError to JSON error responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof AppError) return json({ error: err.message }, err.status);
      if (err instanceof ZodError) return json({ error: firstError(err) }, 400);
      console.error(err);
      return json({ error: "Something went wrong." }, 500);
    }
  };
}

/** Reads a JSON or form body into a plain object (multi-value keys become arrays). */
export async function readBody(req: Request, multi: string[] = []): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new AppError(400, "Invalid JSON body.");
    return body as Record<string, unknown>;
  }
  const form = await req.formData().catch(() => null);
  if (!form) throw new AppError(400, "Unsupported body.");
  const out: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== "string") {
      out[key] = value;
    } else if (multi.includes(key)) {
      out[key] = [...((out[key] as string[]) ?? []), value];
    } else {
      out[key] = value;
    }
  }
  return out;
}
