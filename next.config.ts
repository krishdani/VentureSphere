import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Pitch decks (≤10MB) are uploaded through a server action.
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;
