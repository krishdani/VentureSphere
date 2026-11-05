"use client";

import { upload } from "@vercel/blob/client";
import { Building2, FileText, Upload } from "lucide-react";
import { useState } from "react";
import { saveStartupAction } from "@/app/actions";
import { MAX_DECK_BYTES, SECTORS, STAGES, STAGE_LABELS } from "@/lib/constants";
import { Field, FieldError, FormMessage, SubmitButton, errProps, useFormAction } from "./SubmitButton";

export type StartupFormValues = {
  id?: string;
  name: string;
  oneLiner: string;
  sector: string;
  stage: string;
  location: string;
  website: string;
  teamSize: number | string;
  raisingAmount: number | string;
  traction: string;
  pitchText: string;
  videoUrl: string;
  deckOriginal: string | null;
};

function randomHex(bytes: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
}

function checkDeck(file: File): string | null {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return "The deck must be a PDF.";
  if (file.size > MAX_DECK_BYTES) return "The deck must be 10MB or smaller.";
  return null;
}

export function StartupForm({
  initial,
  directUpload,
  blobAccess,
}: {
  initial: StartupFormValues;
  /** Upload decks straight from the browser to Vercel Blob (production on Vercel). */
  directUpload: boolean;
  blobAccess: "public" | "private";
}) {
  const [deckLabel, setDeckLabel] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { state, onSubmit, pending, action } = useFormAction(saveStartupAction, async (data) => {
    const file = data.get("deck");
    if (!(file instanceof File) || file.size === 0) {
      data.delete("deck");
      return data;
    }
    const problem = checkDeck(file);
    if (problem) return { error: problem };
    if (!directUpload) return data;
    setUploading(true);
    try {
      const pathname = `decks/${randomHex(16)}.pdf`;
      await upload(pathname, file, {
        access: blobAccess,
        handleUploadUrl: "/api/uploads/deck",
        contentType: "application/pdf",
      });
      data.delete("deck");
      data.set("deckBlob", pathname);
      data.set("deckName", file.name);
      return data;
    } catch {
      return { error: "Deck upload failed. Please try again." };
    } finally {
      setUploading(false);
    }
  });
  const busy = pending || uploading;

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-6" noValidate>
      <FormMessage state={state} />
      <section className="card space-y-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-link"><Building2 className="h-5 w-5" aria-hidden /></span>
          <div>
            <h2 className="font-semibold text-ink">Company profile</h2>
            <p className="text-sm text-ink-subtle">The basics investors filter on.</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field state={state} label="Company name" name="name" defaultValue={initial.name} required />
          <Field state={state} label="Location" name="location" defaultValue={initial.location} placeholder="Bengaluru, India" required />
          <div className="sm:col-span-2">
            <Field state={state} label="One-liner" name="oneLiner" defaultValue={initial.oneLiner} placeholder="What you do, in one sentence" maxLength={200} required />
          </div>
          <div>
            <label className="label" htmlFor="sector">Sector</label>
            <select className="input" id="sector" name="sector" defaultValue={initial.sector} required {...errProps(state, "sector")}>
              <option value="">Select a sector…</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <FieldError state={state} name="sector" />
          </div>
          <div>
            <label className="label" htmlFor="stage">Stage</label>
            <select className="input" id="stage" name="stage" defaultValue={initial.stage} required {...errProps(state, "stage")}>
              <option value="">Select a stage…</option>
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
            <FieldError state={state} name="stage" />
          </div>
          <Field state={state} label="Team size" name="teamSize" type="number" inputMode="numeric" min={1} defaultValue={initial.teamSize} required />
          <Field state={state} label="Raising (USD)" name="raisingAmount" type="number" inputMode="numeric" min={0} step={1000} defaultValue={initial.raisingAmount} placeholder="1500000" required />
          <div className="sm:col-span-2">
            <Field state={state} label="Website" name="website" type="url" defaultValue={initial.website} placeholder="https://" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="traction">Traction <span className="font-normal text-ink-subtle">(optional)</span></label>
          <textarea className="input min-h-24" id="traction" name="traction" defaultValue={initial.traction} placeholder="Revenue, users, growth, pilots, LOIs…" {...errProps(state, "traction")} />
          <FieldError state={state} name="traction" />
        </div>
      </section>

      <section className="card space-y-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-link"><FileText className="h-5 w-5" aria-hidden /></span>
          <div>
            <h2 className="font-semibold text-ink">Pitch</h2>
            <p className="text-sm text-ink-subtle">Only signed-in investors can see your pitch and deck.</p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="pitchText">Written pitch</label>
          <textarea className="input min-h-48" id="pitchText" name="pitchText" defaultValue={initial.pitchText} placeholder="Problem, solution, market, business model, why now, why you…" {...errProps(state, "pitchText")} />
          <FieldError state={state} name="pitchText" />
        </div>
        <div>
          <span className="label">Pitch deck <span className="font-normal text-ink-subtle">(PDF, max 10MB)</span></span>
          <label
            htmlFor="deck"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-canvas px-4 py-8 text-center transition hover:border-brand/50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20"
          >
            <Upload className="h-6 w-6 text-ink-subtle" aria-hidden />
            <span className="text-sm font-medium text-ink">{deckLabel ?? (initial.deckOriginal ? "Upload a new PDF to replace your deck" : "Click to upload your deck")}</span>
            <span className="text-xs text-ink-subtle">PDF only · up to 10MB</span>
            <input
              id="deck"
              name="deck"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                setDeckLabel(f ? `${f.name} · ${(f.size / 1024 / 1024).toFixed(1)}MB` : null);
              }}
            />
          </label>
          {initial.deckOriginal && initial.id && (
            <p className="mt-2 text-sm text-ink-muted">
              Current deck:{" "}
              <a className="link" href={`/api/startups/${initial.id}/deck`} target="_blank" rel="noreferrer">
                {initial.deckOriginal}
              </a>
            </p>
          )}
        </div>
        <Field state={state} label="Pitch video URL" name="videoUrl" type="url" defaultValue={initial.videoUrl} placeholder="https://youtube.com/…" hint="YouTube, Loom, Vimeo — any public link." />
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-line bg-canvas/90 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0">
        <SubmitButton pending={busy} pendingText={uploading ? "Uploading deck…" : "Saving…"}>
          Save profile &amp; pitch
        </SubmitButton>
      </div>
    </form>
  );
}
