import { AppError } from "@/lib/access";
import { handle, json } from "@/lib/http";
import { getActor } from "@/lib/session";
import { getDeck, uploadDeck } from "@/lib/services";

type Ctx = { params: Promise<{ id: string }> };

/** Logged-in VCs and the owning startup only. */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { body, size, filename } = await getDeck(await getActor(), id);
  return new Response(body, {
    headers: {
      ...(size ? { "Content-Length": String(size) } : {}),
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
});

/**
 * Owner only. Either multipart/form-data with a `deck` file field (PDF, ≤10MB), or JSON
 * `{ "blobPathname": "decks/<hex>.pdf", "fileName"?: string }` after a direct Vercel Blob upload.
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const actor = await getActor();
  if (!actor) throw new AppError(401, "You need to log in.");
  if ((req.headers.get("content-type") ?? "").includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { blobPathname?: unknown; fileName?: unknown };
    if (typeof body.blobPathname !== "string") throw new AppError(400, "Missing blobPathname.");
    const name = typeof body.fileName === "string" ? body.fileName : undefined;
    return json({ startup: await uploadDeck(actor, id, { blobPathname: body.blobPathname }, name) }, 201);
  }
  const form = await req.formData().catch(() => null);
  const deck = form?.get("deck");
  if (!(deck instanceof File)) throw new AppError(400, "Attach the PDF as a `deck` form field.");
  return json({ startup: await uploadDeck(actor, id, deck) }, 201);
});
