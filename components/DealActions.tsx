"use client";

import { BadgeDollarSign, CircleCheck, Star, X } from "lucide-react";
import { dealAction } from "@/app/actions";
import type { DealAction } from "@/lib/constants";
import { Field, FieldError, FormMessage, SubmitButton, errProps, useFormAction } from "./SubmitButton";

const META: Record<DealAction, { label: string; icon: typeof Star; className: string }> = {
  SHORTLIST: { label: "Shortlist", icon: Star, className: "btn-secondary" },
  SELECT: { label: "Select for funding", icon: CircleCheck, className: "btn-primary" },
  FUND: { label: "Mark as funded", icon: BadgeDollarSign, className: "btn-primary" },
  PASS: { label: "Pass", icon: X, className: "btn-danger" },
};

export function DealActions({
  startupId,
  actions,
  offeredAmount,
  note,
}: {
  startupId: string;
  actions: DealAction[];
  offeredAmount: number | null;
  note: string | null;
}) {
  const { state, onSubmit, pending, action } = useFormAction(dealAction);
  if (actions.length === 0) {
    return <FormMessage state={state ?? { ok: "This deal is funded — congratulations!" }} />;
  }
  const order: DealAction[] = ["SELECT", "FUND", "SHORTLIST", "PASS"];
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="startupId" value={startupId} />
      <FormMessage state={state} />
      {(actions.includes("SELECT") || actions.includes("FUND")) && (
        <Field
          state={state}
          label="Offered amount (USD)"
          name="offeredAmount"
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          defaultValue={offeredAmount ?? ""}
          placeholder="500000"
        />
      )}
      <div>
        <label className="label" htmlFor="note">Note to the founders <span className="font-normal text-ink-subtle">(optional)</span></label>
        <textarea className="input min-h-20" id="note" name="note" defaultValue={note ?? ""} placeholder="Visible to the startup" {...errProps(state, "note")} />
        <FieldError state={state} name="note" />
      </div>
      <div className="flex flex-col gap-2">
        {order
          .filter((a) => actions.includes(a))
          .map((a) => {
            const m = META[a];
            return (
              <SubmitButton key={a} pending={pending} name="action" value={a} className={`${m.className} w-full`}>
                <m.icon className="h-4 w-4" aria-hidden />
                {m.label}
              </SubmitButton>
            );
          })}
      </div>
    </form>
  );
}
