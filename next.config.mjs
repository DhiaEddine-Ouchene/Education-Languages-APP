/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "canvas"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Tell webpack NOT to bundle pdfjs-dist worker — we use CDN worker URL at runtime
      config.resolve.alias["pdfjs-dist/build/pdf.worker.entry"] = false;
    }
    return config;
  },
};
export default nextConfig;
