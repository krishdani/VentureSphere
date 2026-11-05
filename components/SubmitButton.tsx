"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import type { ActionState } from "@/app/actions";

/**
 * Form helper around a server action.
 * - Hydrated: submits via onSubmit, calls the action directly, keeps the returned state locally
 *   and refreshes the route on success, so React never resets the user's input.
 * - Before hydration / without JS: the <form action> falls back to the same server action
 *   (progressive enhancement) via useActionState.
 * `beforeSubmit` can add to / replace the FormData (e.g. after a direct file upload).
 */
export function useFormAction(
  fn: (prev: ActionState, form: FormData) => Promise<ActionState>,
  beforeSubmit?: (data: FormData) => Promise<FormData | { error: string }>,
) {
  const [fallbackState, action] = useActionState(fn, undefined);
  const [state, setState] = useState<ActionState>(undefined);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let data = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) data.set(submitter.name, submitter.value);
    startTransition(async () => {
      if (beforeSubmit) {
        const result = await beforeSubmit(data);
        if ("error" in result) {
          setState({ error: result.error });
          return;
        }
        data = result;
      }
      const result = await fn(state ?? fallbackState, data);
      setState(result);
      if (result?.ok) router.refresh();
    });
  };
  return { state: state ?? fallbackState, onSubmit, pending, action };
}

export function SubmitButton({
  children,
  pending,
  pendingText,
  className = "btn-primary",
  name,
  value,
}: {
  children: React.ReactNode;
  pending: boolean;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value} aria-busy={pending}>
      {pending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error)
    return (
      <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2.5 text-sm text-danger">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg border border-accent/25 bg-accent-soft px-3 py-2.5 text-sm text-ink">
        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        {state.ok}
      </p>
    );
  return null;
}

export function FieldError({ state, name }: { state: ActionState; name: string }) {
  const msg = state?.fieldErrors?.[name];
  if (!msg) return null;
  return (
    <p id={`${name}-error`} className="mt-1.5 text-xs font-medium text-danger">
      {msg}
    </p>
  );
}

/** Props that wire an input to its field error for screen readers. */
export function errProps(state: ActionState, name: string) {
  const has = !!state?.fieldErrors?.[name];
  return has ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {};
}

export function Field({
  label,
  name,
  state,
  hint,
  ...props
}: { label: string; name: string; state: ActionState; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
        {!props.required && <span className="ml-1 font-normal text-ink-subtle">(optional)</span>}
      </label>
      <input className="input" id={name} name={name} {...errProps(state, name)} {...props} />
      {hint && !state?.fieldErrors?.[name] && <p className="mt-1.5 text-xs text-ink-subtle">{hint}</p>}
      <FieldError state={state} name={name} />
    </div>
  );
}
