import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { configure } from "onedollarstats";
import { useEffect } from "react";

import appCss from "../styles.css?url";

function RootComponent() {
  useEffect(() => {
    configure();
  }, []);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
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
        title: "Skills",
      },
      {
        name: "description",
        content: "Skills",
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
