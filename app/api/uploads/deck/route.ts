// Issues short-lived client-upload tokens so browsers can send decks straight to Vercel Blob
// (Vercel functions cap request bodies at 4.5MB). Logged-in startups only; PDF only; ≤10MB;
// random 128-bit path; no overwrites. The server re-validates the file before attaching it.
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { AppError, requireRole } from "@/lib/access";
import { MAX_DECK_BYTES } from "@/lib/constants";
import { handle, json } from "@/lib/http";
import { getActor } from "@/lib/session";
import { BLOB_PATHNAME, isBlobStorage } from "@/lib/uploads";

export const POST = handle(async (req: Request) => {
  if (!isBlobStorage()) throw new AppError(404, "Direct uploads are not enabled.");
  const body = (await req.json()) as HandleUploadBody;
  const result = await handleUpload({
    request: req,
    body,
    onBeforeGenerateToken: async (pathname) => {
      requireRole(await getActor(), "STARTUP");
      if (!BLOB_PATHNAME.test(pathname)) throw new AppError(400, "Invalid upload path.");
      return {
        allowedContentTypes: ["application/pdf"],
        maximumSizeInBytes: MAX_DECK_BYTES,
        addRandomSuffix: false,
        allowOverwrite: false,
      };
    },
  });
  return json(result);
});
