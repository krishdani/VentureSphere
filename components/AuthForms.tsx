"use client";

import { Briefcase, Rocket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { loginAction, signupAction } from "@/app/actions";
import { Field, FormMessage, SubmitButton, useFormAction } from "./SubmitButton";

export function LoginForm() {
  const { state, onSubmit, pending, action } = useFormAction(loginAction);
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Field state={state} label="Email" name="email" type="email" autoComplete="email" required />
      <Field state={state} label="Password" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton pending={pending} pendingText="Logging in…" className="btn-primary w-full">
        Log in
      </SubmitButton>
      <p className="text-center text-sm text-ink-muted">
        New to VentureSphere? <Link href="/signup" className="link">Create an account</Link>
      </p>
    </form>
  );
}

export function SignupForm({ initialRole }: { initialRole: "STARTUP" | "VC" }) {
  const { state, onSubmit, pending, action } = useFormAction(signupAction);
  const [role, setRole] = useState(initialRole);
  const options = [
    { value: "STARTUP" as const, title: "Startup", sub: "Raise from VCs", icon: Rocket },
    { value: "VC" as const, title: "Investor", sub: "Find & fund startups", icon: Briefcase },
  ];
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <fieldset>
        <legend className="label">I&apos;m joining as</legend>
        <div className="grid grid-cols-2 gap-3">
          {options.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 text-sm transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20 ${
                role === o.value ? "border-brand bg-brand-soft" : "border-line-strong bg-surface hover:bg-surface-muted"
              }`}
            >
              <input type="radio" name="role" value={o.value} checked={role === o.value} onChange={() => setRole(o.value)} className="sr-only" />
              <o.icon className={`h-5 w-5 ${role === o.value ? "text-link" : "text-ink-subtle"}`} aria-hidden />
              <span className="font-semibold text-ink">{o.title}</span>
              <span className="text-xs text-ink-subtle">{o.sub}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field state={state} label="Your name" name="name" autoComplete="name" required />
      <Field state={state} label={role === "VC" ? "Work email" : "Email"} name="email" type="email" autoComplete="email" required />
      <Field state={state} label="Password" name="password" type="password" minLength={8} autoComplete="new-password" hint="At least 8 characters." required />
      <SubmitButton pending={pending} pendingText="Creating your account…" className="btn-primary w-full">
        Create {role === "VC" ? "investor" : "startup"} account
      </SubmitButton>
      <p className="text-center text-sm text-ink-muted">
        Already have an account? <Link href="/login" className="link">Log in</Link>
      </p>
    </form>
  );
}
