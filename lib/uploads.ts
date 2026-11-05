// Pitch-deck storage. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set, else local disk.
// Keys stored in Startup.deckFile:
//   "<32 hex>.pdf"               -> ./uploads/decks/<file>
//   "blob:decks/<32 hex>.pdf"    -> Vercel Blob pathname
// Decks are never linked directly: they're always served via the auth-checked
// /api/startups/:id/deck route, and paths carry 128 random bits.
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import { AppError } from "./access";
import { MAX_DECK_BYTES } from "./constants";

const LOCAL_KEY = /^[a-f0-9]{32}\.pdf$/;
export const BLOB_PATHNAME = /^decks\/[a-f0-9]{32}\.pdf$/;

export function isBlobStorage(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function blobAccess(): "public" | "private" {
  return process.env.BLOB_ACCESS === "public" ? "public" : "private";
}

export function uploadRoot(): string {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

function deckDir(): string {
  return path.join(uploadRoot(), "decks");
}

/** Validate a pitch-deck upload: PDF only (MIME + magic bytes), ≤ 10MB, non-empty. */
export function validatePdf(bytes: Uint8Array, mimeType: string, size: number = bytes.byteLength): void {
  if (size === 0) throw new AppError(400, "The deck file is empty.");
  if (size > MAX_DECK_BYTES) throw new AppError(413, "The deck must be 10MB or smaller.");
  if (mimeType !== "application/pdf") throw new AppError(415, "The deck must be a PDF.");
  const magic = Buffer.from(bytes.subarray(0, 5)).toString("latin1");
  if (magic !== "%PDF-") throw new AppError(415, "The file is not a valid PDF.");
}

export function randomDeckName(): string {
  return `${randomBytes(16).toString("hex")}.pdf`;
}

/** Validates and stores PDF bytes; returns the storage key. */
export async function storeDeckBytes(bytes: Uint8Array, mimeType = "application/pdf"): Promise<string> {
  validatePdf(bytes, mimeType);
  const name = randomDeckName();
  if (isBlobStorage()) {
    await put(`decks/${name}`, Buffer.from(bytes), {
      access: blobAccess(),
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return `blob:decks/${name}`;
  }
  await mkdir(deckDir(), { recursive: true });
  await writeFile(path.join(deckDir(), name), bytes);
  return name;
}

/** Stores an uploaded File (server-side upload path). */
export async function saveDeck(file: File): Promise<string> {
  if (file.size > MAX_DECK_BYTES) throw new AppError(413, "The deck must be 10MB or smaller.");
  return storeDeckBytes(new Uint8Array(await file.arrayBuffer()), file.type);
}

async function readStream(stream: ReadableStream<Uint8Array>, limit: number): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new AppError(413, "The deck must be 10MB or smaller.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * Verifies a deck the browser uploaded straight to Vercel Blob (client upload, used on
 * Vercel because function bodies are capped at 4.5MB). Deletes it if it isn't a valid PDF.
 */
export async function verifyUploadedBlob(pathname: string): Promise<string> {
  if (!isBlobStorage()) throw new AppError(400, "Direct uploads are not enabled.");
  if (!BLOB_PATHNAME.test(pathname)) throw new AppError(400, "Invalid upload reference.");
  const res = await get(pathname, { access: blobAccess(), useCache: false }).catch(() => null);
  if (!res || res.statusCode !== 200 || !res.stream) throw new AppError(400, "Upload not found. Please try again.");
  try {
    if (res.blob.size > MAX_DECK_BYTES) throw new AppError(413, "The deck must be 10MB or smaller.");
    const bytes = await readStream(res.stream, MAX_DECK_BYTES);
    validatePdf(bytes, res.blob.contentType);
  } catch (err) {
    await del(pathname).catch(() => {});
    throw err;
  }
  return `blob:${pathname}`;
}

export async function readDeck(key: string): Promise<{ body: BodyInit; size?: number }> {
  if (key.startsWith("blob:")) {
    const pathname = key.slice(5);
    if (!BLOB_PATHNAME.test(pathname)) throw new AppError(404, "Deck not found.");
    const res = await get(pathname, { access: blobAccess() }).catch(() => null);
    if (!res || res.statusCode !== 200 || !res.stream) throw new AppError(404, "Deck not found.");
    return { body: res.stream, size: res.blob.size };
  }
  if (!LOCAL_KEY.test(key)) throw new AppError(404, "Deck not found.");
  const bytes = await readFile(path.join(deckDir(), key)).catch(() => {
    throw new AppError(404, "Deck not found.");
  });
  return { body: new Uint8Array(bytes), size: bytes.byteLength };
}

export async function deleteDeck(key: string | null | undefined): Promise<void> {
  if (!key) return;
  if (key.startsWith("blob:")) {
    const pathname = key.slice(5);
    if (BLOB_PATHNAME.test(pathname) && isBlobStorage()) await del(pathname).catch(() => {});
    return;
  }
  if (LOCAL_KEY.test(key)) await unlink(path.join(deckDir(), key)).catch(() => {});
}
