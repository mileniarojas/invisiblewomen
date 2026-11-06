import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run in a separate folder while the dev server keeps using .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingIncludes: { "/**": ["./data/build/**/*"] },
};
export default nextConfig;
