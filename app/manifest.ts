import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LingoKit",
    short_name: "LingoKit",
    description:
      "An AI-assisted platform for language teachers to build interactive vocabulary and grammar games and courses for their classes.",
    start_url: "/",
    display: "standalone",
    background_color: "#F9F9F7",
    theme_color: "#7F77DD",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
    ],
  };
}
