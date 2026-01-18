import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { env } from "cloudflare:workers";

import { consumeDiscoveryJobs } from "./queues/discovery/consumer";
import { produceDiscoveryJobs } from "./queues/discovery/producer";
import { DiscoveryJobMessage } from "./queues/discovery/types";

export default {
  ...createServerEntry({
    async fetch(request) {
      const url = new URL(request.url);

      // Manual trigger endpoint for initial seeding (protected by secret header)
      if (url.pathname === "/_admin/trigger-discovery") {
        const authHeader = request.headers.get("X-Admin-Secret");
        const expectedSecret = env.ADMIN_SECRET;

        if (!expectedSecret || authHeader !== expectedSecret) {
          return new Response("Unauthorized", { status: 401 });
        }

        await produceDiscoveryJobs();
        return new Response("Discovery jobs queued", { status: 200 });
      }

      // Queue a specific repo for discovery
      if (url.pathname === "/_admin/queue-repo") {
        const authHeader = request.headers.get("X-Admin-Secret");
        const expectedSecret = env.ADMIN_SECRET;

        if (!expectedSecret || authHeader !== expectedSecret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const owner = url.searchParams.get("owner");
        const repo = url.searchParams.get("repo");

        if (!owner || !repo) {
          return new Response("Missing owner or repo parameter", { status: 400 });
        }

        const message: DiscoveryJobMessage = {
          repoFullName: `${owner}/${repo}`,
          owner,
          repo,
          defaultBranch: "main",
          stars: 0,
          isFork: false,
          ownerType: "User",
          ownerAvatarUrl: `https://github.com/${owner}.png`,
          description: null,
          license: null,
        };

        await env.DISCOVERY_QUEUE.send(message);
        return new Response(`Queued ${owner}/${repo} for discovery`, { status: 200 });
      }

      return handler.fetch(request);
    },
  }),

  async scheduled(controller: ScheduledController): Promise<void> {
    switch (controller.cron) {
      case "0 6 * * *":
        await produceDiscoveryJobs();
        break;
    }
  },

  async queue(batch: MessageBatch<DiscoveryJobMessage>): Promise<void> {
    switch (batch.queue) {
      case "skills-discovery":
        await consumeDiscoveryJobs(batch);
        break;
    }
  },
};
