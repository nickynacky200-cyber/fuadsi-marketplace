import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FUADSI Marketplace",
    short_name: "FUADSI",
    description: "Buy, sell and connect on the FUADSI campus.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5415C6",
    icons: [
      { src: "/images/branding/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/images/branding/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
