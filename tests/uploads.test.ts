import { describe, expect, it } from "vitest";
import { MAX_DECK_BYTES } from "@/lib/constants";
import { validatePdf } from "@/lib/uploads";

const pdf = new TextEncoder().encode("%PDF-1.4\n%%EOF\n");

describe("deck validation", () => {
  it("accepts a small PDF", () => {
    expect(() => validatePdf(pdf, "application/pdf")).not.toThrow();
  });
  it("rejects non-PDF MIME types and fake PDFs", () => {
    expect(() => validatePdf(pdf, "image/png")).toThrow(/PDF/);
    expect(() => validatePdf(new TextEncoder().encode("<html>"), "application/pdf")).toThrow(/valid PDF/);
  });
  it("rejects empty and oversized files", () => {
    expect(() => validatePdf(new Uint8Array(), "application/pdf")).toThrow(/empty/);
    expect(() => validatePdf(pdf, "application/pdf", MAX_DECK_BYTES + 1)).toThrow(/10MB/);
  });
});

describe("local deck storage", () => {
  it("stores under a random 128-bit name and reads it back; rejects path tricks", async () => {
    const { mkdtemp } = await import("node:fs/promises");
    const os = await import("node:os");
    const path = await import("node:path");
    process.env.UPLOAD_DIR = await mkdtemp(path.join(os.tmpdir(), "vs-uploads-"));
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const { storeDeckBytes, readDeck, deleteDeck } = await import("@/lib/uploads");
    const key = await storeDeckBytes(pdf);
    expect(key).toMatch(/^[a-f0-9]{32}\.pdf$/);
    const { body } = await readDeck(key);
    expect(Buffer.from(body as Uint8Array).toString("latin1")).toBe(Buffer.from(pdf).toString("latin1"));
    await expect(readDeck("../../etc/passwd")).rejects.toThrow(/not found/i);
    await expect(readDeck("blob:../secret.pdf")).rejects.toThrow(/not found/i);
    await deleteDeck(key);
    await expect(readDeck(key)).rejects.toThrow(/not found/i);
    await expect(storeDeckBytes(new TextEncoder().encode("nope"))).rejects.toThrow(/valid PDF/);
  });
});
