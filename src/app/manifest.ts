import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sip Happens · Drink Tracker",
    short_name: "Sip Happens",
    description: "Track and limit your drinking",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#f59e0b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
