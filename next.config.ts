import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Cover uploads allow up to 5MB raw; leave headroom for multipart overhead.
      bodySizeLimit: "6mb"
    }
  }
};

export default nextConfig;
