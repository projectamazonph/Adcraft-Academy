import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    '.space-z.ai',
    '.fcapp.run',
    '.vercel.app',
    'localhost',
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        '*.space-z.ai',
        '*.fcapp.run',
        '*.vercel.app',
        'localhost',
      ],
    },
  },
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
