import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "aaroh",
    short_name: "aaroh",
    description: "Your love story, your way. Declutter first, then decide.",
    start_url: "/space",
    display: "standalone",
    background_color: "#110d0c",
    theme_color: "#650020",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
