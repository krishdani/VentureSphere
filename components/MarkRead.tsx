"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { markReadAction } from "@/app/actions";

/** Marks notifications as read once the user has seen them. */
export function MarkRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!hasUnread) return;
    const t = setTimeout(() => {
      markReadAction().then(() => router.refresh());
    }, 1500);
    return () => clearTimeout(t);
  }, [hasUnread, router]);
  return null;
}
