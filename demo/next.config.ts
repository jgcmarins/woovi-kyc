import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["woovi-kyc"],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
