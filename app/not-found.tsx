import { Compass } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <EmptyState icon={Compass} title="Page not found" action={<Link href="/" className="btn-primary">Back to home</Link>}>
        The page you were looking for doesn&apos;t exist or you don&apos;t have access to it.
      </EmptyState>
    </main>
  );
}
