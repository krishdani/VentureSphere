import type { Metadata } from "next";
import { VcForm } from "@/components/VcForm";
import { Notice, PageHeader } from "@/components/ui";
import { requirePageUser } from "@/lib/session";
import { getOwnVcProfile } from "@/lib/services";

export const metadata: Metadata = { title: "Firm profile" };

export default async function VcProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requirePageUser("VC");
  const vc = await getOwnVcProfile(user);
  const { welcome } = await searchParams;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        eyebrow="Investor"
        title={vc ? "Firm profile" : "Set up your firm"}
        description="Founders see your firm name, note and offer on every deal you act on."
      />
      {welcome && (
        <div className="mt-6">
          <Notice tone="success">Welcome, {user.name}! Tell founders who you are, then start discovering startups.</Notice>
        </div>
      )}
      <div className="mt-8">
        <VcForm
          initial={{
            firmName: vc?.firmName ?? "",
            thesis: vc?.thesis ?? "",
            chequeMin: vc?.chequeMin ?? "",
            chequeMax: vc?.chequeMax ?? "",
            sectors: vc?.sectors ? vc.sectors.split(",") : [],
            stages: vc?.stages ? vc.stages.split(",") : [],
          }}
        />
      </div>
    </main>
  );
}
