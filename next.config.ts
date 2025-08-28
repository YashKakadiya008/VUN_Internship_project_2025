import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['encrypted-tbn0.gstatic.com', "i.ibb.co"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // Allow all paths under res.cloudinary.com
      },
    ],
  },
  webpack: (config) => {
    // Handle the cloudflare:workers import issue
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        'cloudflare:workers': false
      }
    };
    return config;
  },
};

export default nextConfig;
