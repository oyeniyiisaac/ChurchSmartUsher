import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RCCG JESUS HOUSE, OGBOMOSHO",
    short_name: "ChurchConnect",
    description:
      "RCCG JESUS HOUSE, OGBOMOSHO — Church Attendance, Rotating QR Check-in, Member Profiles & Ephemeral 7-Day Service Photos.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf8ff",
    theme_color: "#00236f",
    orientation: "portrait",
    icons: [
      {
        src: "/rccg-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/rccg-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
