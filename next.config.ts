import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // De publieke widget moet in een <iframe> op elke verhuizer-website kunnen draaien.
        source: "/widget/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
      {
        // De loader wordt cross-origin ingeladen vanaf klantsites.
        source: "/embed.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300, s-maxage=300" },
        ],
      },
    ];
  },
};

export default nextConfig;
