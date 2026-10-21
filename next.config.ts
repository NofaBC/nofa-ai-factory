import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin uses ESM-only sub-packages (jose, jwks-rsa) that cannot
  // be bundled by Next.js. Marking as external leaves them as node requires.
  serverExternalPackages: [
    "firebase-admin",
    "firebase-admin/app",
    "firebase-admin/auth",
    "firebase-admin/firestore",
    "firebase-admin/storage",
    "jose",
    "jwks-rsa",
    "nodemailer",
  ],
  images: {
    remotePatterns: [
      {
        // Firebase Storage — product images uploaded via admin
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
