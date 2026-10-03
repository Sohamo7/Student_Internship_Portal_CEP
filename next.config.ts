import type { NextConfig } from "next";

// Fail a *production* Vercel build early if Supabase isn't configured.
//
// NEXT_PUBLIC_* variables are baked into the JavaScript at build time. If they
// are missing, the app silently builds in demo mode — which includes one-click
// "Admin Console" access — and would go live on the public internet. Preview
// deployments and local builds are unaffected (they may legitimately run the demo).
// Escape hatch for a deliberate public demo: set ALLOW_DEMO_BUILD=true in Vercel.
if (process.env.VERCEL_ENV === "production" && process.env.ALLOW_DEMO_BUILD !== "true") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const problems: string[] = [];
  if (!url.startsWith("http") || url.includes("placeholder")) {
    problems.push("NEXT_PUBLIC_SUPABASE_URL is missing or not a real https:// URL");
  }
  if (!key || key.includes("placeholder") || key === "your-anon-key-here") {
    problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
  }
  if (problems.length > 0) {
    throw new Error(
      "Refusing to build production without Supabase — the site would ship in demo mode " +
        "with open admin access.\n  - " +
        problems.join("\n  - ") +
        "\nSet them in Vercel → Project → Settings → Environment Variables (Production), then redeploy. " +
        "(Intentional demo? Set ALLOW_DEMO_BUILD=true.)"
    );
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[config] SUPABASE_SERVICE_ROLE_KEY is not set — the Admin Team invite feature will be disabled.");
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
