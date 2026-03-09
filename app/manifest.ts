import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finanzas SaaS",
    short_name: "Finanzas",
    description: "Gestion de ingresos con distribucion automatica",
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#121212",
    lang: "es",
    icons: []
  };
}