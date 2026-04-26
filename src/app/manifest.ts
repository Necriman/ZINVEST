import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Zinvest — AI Financial Education",
    short_name: "Zinvest",
    description:
      "Learn finance with AI-powered lessons, cash flow tools, and structured practice — step by step.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    orientation: "portrait-primary",
    background_color: "#0a0f1c",
    theme_color: "#0a0f1c",
    categories: ["education", "finance", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Zinvest AI",
        short_name: "AI",
        description: "Chat with the finance tutor",
        url: "/ai",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Cash Flow",
        short_name: "Cash Flow",
        description: "Cash Flow Studio",
        url: "/cash-flow",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
