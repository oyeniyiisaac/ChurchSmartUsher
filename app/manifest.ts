import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChurchConnect — Grace Sanctuary Parish",
    short_name: "ChurchConnect",
    description:
      "Warm Sanctuary Digital Experience for Church Attendance, Rotating QR Check-in, Member Profiles & Ephemeral 7-Day Service Photos.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf8ff",
    theme_color: "#00236f",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
