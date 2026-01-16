import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { configure } from "onedollarstats";
import { useEffect } from "react";

import { Footer } from "../components/layout/footer";
import { Header } from "../components/layout/header";
import appCss from "../styles.css?url";

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

const Route = createRootRoute({
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
    ],
  }),
});

export { Route };
