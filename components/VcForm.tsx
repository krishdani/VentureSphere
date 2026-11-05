"use client";

import { saveVcAction } from "@/app/actions";
import { SECTORS, STAGES, STAGE_LABELS } from "@/lib/constants";
import { Field, FieldError, FormMessage, SubmitButton, errProps, useFormAction } from "./SubmitButton";

export type VcFormValues = {
  firmName: string;
  thesis: string;
  chequeMin: number | string;
  chequeMax: number | string;
  sectors: string[];
  stages: string[];
};

export function VcForm({ initial }: { initial: VcFormValues }) {
  const { state, onSubmit, pending, action } = useFormAction(saveVcAction);
  return (
    <form action={action} onSubmit={onSubmit} className="card space-y-6" noValidate>
      <FormMessage state={state} />
      <Field state={state} label="Firm name" name="firmName" defaultValue={initial.firmName} required />
      <div>
        <label className="label" htmlFor="thesis">Investment thesis</label>
        <textarea className="input min-h-28" id="thesis" name="thesis" defaultValue={initial.thesis} placeholder="What you invest in and why…" required {...errProps(state, "thesis")} />
        <FieldError state={state} name="thesis" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field state={state} label="Cheque size — min (USD)" name="chequeMin" type="number" inputMode="numeric" min={0} step={1000} defaultValue={initial.chequeMin} required />
        <Field state={state} label="Cheque size — max (USD)" name="chequeMax" type="number" inputMode="numeric" min={0} step={1000} defaultValue={initial.chequeMax} required />
      </div>
      <fieldset>
        <legend className="label">Preferred sectors</legend>
        <div className="flex flex-wrap gap-2">
          {SECTORS.map((s) => (
            <Chip key={s} name="sectors" value={s} label={s} defaultChecked={initial.sectors.includes(s)} />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Preferred stages</legend>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <Chip key={s} name="stages" value={s} label={STAGE_LABELS[s]} defaultChecked={initial.stages.includes(s)} />
          ))}
        </div>
      </fieldset>
      <div className="border-t border-line pt-5">
        <SubmitButton pending={pending} pendingText="Saving…">Save firm profile</SubmitButton>
      </div>
    </form>
  );
}

function Chip({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="inline-block rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-sm text-ink-muted transition hover:bg-surface-muted peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:font-medium peer-checked:text-link peer-focus-visible:ring-4 peer-focus-visible:ring-brand/20">
        {label}
      </span>
    </label>
  );
}
