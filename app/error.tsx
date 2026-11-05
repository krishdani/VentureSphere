"use client";

import { CircleAlert } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <EmptyState
        icon={CircleAlert}
        title="Something went wrong"
        action={<button onClick={reset} className="btn-primary">Try again</button>}
      >
        An unexpected error occurred. Please try again in a moment.
      </EmptyState>
    </main>
  );
}
