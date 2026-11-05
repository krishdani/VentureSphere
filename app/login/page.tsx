import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "VC" ? "/vc" : "/startup");
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your VentureSphere account.">
      <LoginForm />
    </AuthShell>
  );
}
