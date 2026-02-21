import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@gorillabuild/shared", "@gorillabuild/api-client"],
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },
};

export default nextConfig;
