import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

function getRouter() {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
}

export { getRouter };
