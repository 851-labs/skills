import type { QueryClient } from "@tanstack/react-query";

import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { configure } from "onedollarstats";
import { useEffect } from "react";

import { Footer } from "../components/layout/footer";
import { Header } from "../components/layout/header";
import appCss from "../styles.css?url";

const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "skills.surf - Browse Agent Skills",
      },
      {
        name: "description",
        content:
          "Discover, browse, and install Agent Skills from GitHub repositories. Find skills for AI coding agents.",
      },
      {
        name: "theme-color",
        content: "#0a0a0a",
        media: "(prefers-color-scheme: dark)",
      },
      {
        name: "theme-color",
        content: "#ffffff",
        media: "(prefers-color-scheme: light)",
      },
      {
        name: "color-scheme",
        content: "dark light",
      },
      // Open Graph
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:site_name",
        content: "skills.surf",
      },
      {
        property: "og:title",
        content: "skills.surf - Browse Agent Skills",
      },
      {
        property: "og:description",
        content:
          "Discover, browse, and install Agent Skills from GitHub repositories. Find skills for AI coding agents.",
      },
      {
        property: "og:url",
        content: "https://skills.surf",
      },
      // Twitter Card
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: "skills.surf - Browse Agent Skills",
      },
      {
        name: "twitter:description",
        content:
          "Discover, browse, and install Agent Skills from GitHub repositories. Find skills for AI coding agents.",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "canonical",
        href: "https://skills.surf",
      },
    ],
  }),
});

function RootComponent() {
  useEffect(() => {
    configure();
  }, []);

  return (
    <html lang="en" className="bg-bg-primary">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col bg-bg-primary text-text-primary">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <Scripts />
      </body>
    </html>
  );
}

export { Route };
