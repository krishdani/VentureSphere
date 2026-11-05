import type { Metadata } from "next";
import { StartupForm } from "@/components/StartupForm";
import { Notice, PageHeader } from "@/components/ui";
import { requirePageUser } from "@/lib/session";
import { getOwnStartup } from "@/lib/services";
import { isBlobStorage } from "@/lib/uploads";

export const metadata: Metadata = { title: "Company & pitch" };

export default async function StartupProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requirePageUser("STARTUP");
  const s = await getOwnStartup(user);
  const { welcome } = await searchParams;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        eyebrow={s ? s.name : "Step 1 of 1"}
        title={s ? "Company & pitch" : "List your company"}
        description="Investors on VentureSphere see this profile, your pitch and your deck."
      />
      {welcome && (
        <div className="mt-6">
          <Notice tone="success">Welcome aboard, {user.name}! Fill in your company and pitch to start appearing in investors&apos; deal flow.</Notice>
        </div>
      )}
      <div className="mt-8">
        <StartupForm
          directUpload={isBlobStorage()}
          blobAccess={process.env.BLOB_ACCESS === "public" ? "public" : "private"}
          initial={{
            id: s?.id,
            name: s?.name ?? "",
            oneLiner: s?.oneLiner ?? "",
            sector: s?.sector ?? "",
            stage: s?.stage ?? "",
            location: s?.location ?? "",
            website: s?.website ?? "",
            teamSize: s?.teamSize ?? "",
            raisingAmount: s?.raisingAmount ?? "",
            traction: s?.traction ?? "",
            pitchText: s?.pitchText ?? "",
            videoUrl: s?.videoUrl ?? "",
            deckOriginal: s?.deckOriginal ?? null,
          }}
        />
      </div>
    </main>
  );
}
