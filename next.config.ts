import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow images served from common cloud storage hosts so we can
    // progressively migrate raw <img> tags over to next/image.
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google profile pics
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
