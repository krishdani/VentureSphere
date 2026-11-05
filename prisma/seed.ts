// Seeds demo data. Two modes:
//
//   npm run db:seed                 (development, default)
//     Demo VC + 4 demo startups, all loginable with DEMO_PASSWORD, plus a sample pipeline
//     and notifications. Re-running resets the demo accounts.
//
//   SEED_MODE=production npm run db:seed
//     Only the demo startup listings (featured on the landing page; their owner accounts get
//     random passwords, so nobody can log in as them) and ONE demo VC account whose password is
//     DEMO_VC_PASSWORD (default "demo12345" — change it!). No fake deals or notifications.
//     Safe to re-run: never overwrites existing passwords, decks or real data.
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";
import { storeDeckBytes } from "../lib/uploads";

const prisma = new PrismaClient();
const PRODUCTION = process.env.SEED_MODE === "production";
export const DEMO_PASSWORD = "demo12345";
const VC_PASSWORD = process.env.DEMO_VC_PASSWORD || DEMO_PASSWORD;

function tinyPdf(title: string): Buffer {
  // Minimal single-page PDF with one line of text.
  const text = title.replace(/[()\\]/g, "");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 344] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    null,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const stream = `BT /F1 28 Tf 60 180 Td (${text}) Tj ET`;
  objs[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

const startups = [
  {
    email: "founder@nimbusai.demo",
    name: "Asha Rao",
    company: {
      name: "Nimbus AI",
      oneLiner: "AI copilots that cut cloud bills for mid-market engineering teams by 30%.",
      sector: "AI/ML",
      stage: "SEED",
      location: "Bengaluru, India",
      website: "https://nimbus-ai.example.com",
      teamSize: 12,
      raisingAmount: 2_500_000,
      traction: "$40K MRR, growing 18% MoM. 22 paying customers, 2 enterprise pilots.",
      pitchText:
        "Cloud spend is the #2 cost line for SaaS companies, and most teams overprovision by 35%.\n\nNimbus watches your infrastructure, proposes right-sizing changes as pull requests, and proves the savings. We charge 20% of verified savings.\n\nWe're raising $2.5M to grow the GTM team and ship multi-cloud support.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      deck: true,
    },
  },
  {
    email: "founder@greenloop.demo",
    name: "Diego Martins",
    company: {
      name: "GreenLoop",
      oneLiner: "Reverse-logistics platform that turns returned electronics into refurbished inventory.",
      sector: "Climate",
      stage: "PRE_SEED",
      location: "Lisbon, Portugal",
      website: "https://greenloop.example.com",
      teamSize: 5,
      raisingAmount: 750_000,
      traction: "3 retail partners, 4,000 devices processed, 61% gross margin on resale.",
      pitchText:
        "Retailers landfill or liquidate 40% of returned electronics at a loss. GreenLoop grades, repairs and resells them through our own marketplace, splitting the margin with the retailer.",
      videoUrl: null,
      deck: true,
    },
  },
  {
    email: "founder@medibridge.demo",
    name: "Priya Shah",
    company: {
      name: "MediBridge",
      oneLiner: "Remote patient monitoring for rural clinics, built for low-bandwidth networks.",
      sector: "Healthtech",
      stage: "SERIES_A_PLUS",
      location: "Nairobi, Kenya",
      website: "https://medibridge.example.com",
      teamSize: 38,
      raisingAmount: 8_000_000,
      traction: "140 clinics live across 3 countries, $1.9M ARR, 120% net revenue retention.",
      pitchText:
        "MediBridge connects low-cost vitals devices to a clinician dashboard that works over 2G and SMS. Clinics bill insurers for monitoring; we take a per-patient SaaS fee.",
      videoUrl: null,
      deck: false,
    },
  },
  {
    email: "founder@ledgerly.demo",
    name: "Tom Becker",
    company: {
      name: "Ledgerly",
      oneLiner: "Autonomous bookkeeping for freelancers — from bank feed to tax-ready books.",
      sector: "Fintech",
      stage: "IDEA",
      location: "Berlin, Germany",
      website: null,
      teamSize: 2,
      raisingAmount: 250_000,
      traction: "Waitlist of 1,100 freelancers; 30 design-partner interviews.",
      pitchText: "",
      videoUrl: null,
      deck: false,
    },
  },
];

const vc = {
  email: "partner@horizonvc.demo",
  name: "Morgan Lee",
  profile: {
    firmName: "Horizon Ventures",
    thesis: "We back technical founders building AI-native and climate infrastructure, from pre-seed to Series A.",
    chequeMin: 250_000,
    chequeMax: 3_000_000,
    sectors: "AI/ML,Climate,SaaS,Fintech",
    stages: "PRE_SEED,SEED,SERIES_A_PLUS",
  },
};

async function main() {
  console.log(`Seeding (${PRODUCTION ? "production" : "development"} mode)…`);
  const demoHash = await hashPassword(DEMO_PASSWORD);
  const vcHash = await hashPassword(VC_PASSWORD);

  const vcUser = await prisma.user.upsert({
    where: { email: vc.email },
    create: { email: vc.email, name: vc.name, role: "VC", passwordHash: vcHash },
    // In production never reset a password the owner may have changed.
    update: PRODUCTION ? {} : { name: vc.name, role: "VC", passwordHash: vcHash },
  });
  const vcProfile = await prisma.vcProfile.upsert({
    where: { userId: vcUser.id },
    create: { ...vc.profile, userId: vcUser.id },
    update: PRODUCTION ? {} : vc.profile,
  });
  if (!PRODUCTION) await prisma.deal.deleteMany({ where: { vcId: vcProfile.id } });

  const created: Record<string, string> = {};
  for (const s of startups) {
    const passwordHash = PRODUCTION ? await hashPassword(randomBytes(24).toString("base64url")) : demoHash;
    const user = await prisma.user.upsert({
      where: { email: s.email },
      create: { email: s.email, name: s.name, role: "STARTUP", passwordHash },
      update: PRODUCTION ? {} : { name: s.name, role: "STARTUP", passwordHash },
    });
    if (!PRODUCTION) await prisma.notification.deleteMany({ where: { userId: user.id } });
    const { deck, ...company } = s.company;
    const existing = await prisma.startup.findUnique({ where: { ownerId: user.id } });
    let deckFields = {};
    if (deck && !existing?.deckFile) {
      const deckFile = await storeDeckBytes(tinyPdf(`${company.name} - pitch deck`));
      deckFields = { deckFile, deckOriginal: `${company.name.replace(/\s+/g, "-")}-deck.pdf` };
    }
    const startup = existing
      ? PRODUCTION
        ? existing
        : await prisma.startup.update({ where: { id: existing.id }, data: { ...company, ...deckFields, featured: true } })
      : await prisma.startup.create({ data: { ...company, ...deckFields, featured: true, ownerId: user.id } });
    created[company.name] = startup.id;
  }

  if (!PRODUCTION) {
    // A little existing pipeline so both dashboards have something to show.
    const greenloop = created["GreenLoop"];
    const medibridge = created["MediBridge"];
    await prisma.deal.create({
      data: { vcId: vcProfile.id, startupId: greenloop, status: "SHORTLISTED", note: "Love the unit economics — want to dig into retailer contracts." },
    });
    await prisma.deal.create({
      data: { vcId: vcProfile.id, startupId: medibridge, status: "SELECTED", offeredAmount: 2_000_000, note: "Happy to lead with $2M. Let's set up a partner meeting." },
    });
    const owners = await prisma.startup.findMany({ where: { id: { in: [greenloop, medibridge] } } });
    for (const o of owners) {
      await prisma.notification.create({
        data: {
          userId: o.ownerId,
          message: o.id === medibridge ? "Horizon Ventures marked MediBridge as Selected. Offer: $2M." : "Horizon Ventures marked GreenLoop as Shortlisted.",
          link: "/startup",
        },
      });
    }
  }

  console.log("Done.");
  console.log(`  Demo VC:  ${vc.email}  /  ${PRODUCTION && process.env.DEMO_VC_PASSWORD ? "(DEMO_VC_PASSWORD)" : VC_PASSWORD}`);
  if (PRODUCTION) {
    if (!process.env.DEMO_VC_PASSWORD) console.warn("  ⚠ Using the documented default VC password — change it: npm run user:password -- partner@horizonvc.demo <new>");
    console.log("  Demo startups are listing-only (random passwords).");
  } else {
    for (const s of startups) console.log(`  Startup:  ${s.email}  /  ${DEMO_PASSWORD}  (${s.company.name})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
