/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};
export default nextConfig;
