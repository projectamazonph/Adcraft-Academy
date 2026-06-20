import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    // Allow preview domains served through reverse proxies
    '.space-z.ai',
    '.fcapp.run',
    'localhost',
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        // Allow Server Actions from preview domains and reverse proxy
        '*.space-z.ai',
        '*.fcapp.run',
        'localhost',
      ],
    },
  },
  serverExternalPackages: [],
};

export default nextConfig;
