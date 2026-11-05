import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "VC" ? "/vc" : "/startup");
  const { role } = await searchParams;
  return (
    <AuthShell title="Create your account" subtitle="Free for founders and investors. Takes under a minute.">
      <SignupForm initialRole={role === "VC" ? "VC" : "STARTUP"} />
    </AuthShell>
  );
}
