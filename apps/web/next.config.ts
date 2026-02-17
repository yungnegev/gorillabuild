import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@gorillabuild/shared", "@gorillabuild/api-client"],
  reactCompiler: true,
};

export default nextConfig;
