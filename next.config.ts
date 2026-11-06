import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/**": ["./data/build/**/*"] },
};
export default nextConfig;
