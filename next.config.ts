import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // De publieke widget moet in een <iframe> op elke verhuizer-website kunnen draaien.
        source: "/widget/:path*",
        headers: [
          // `frame-ancestors *` staat inbedden op elke site toe. Géén
          // X-Frame-Options: die kent geen "sta alles toe"-waarde en een
          // ongeldige waarde blokkeert de iframe juist in sommige browsers.
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
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
