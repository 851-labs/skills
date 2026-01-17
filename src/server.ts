import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

import { consumeDiscoveryJobs } from "./queues/discovery/consumer";
import { produceDiscoveryJobs } from "./queues/discovery/producer";
import { DiscoveryJobMessage } from "./queues/discovery/types";

export default {
  ...createServerEntry({
    fetch(request) {
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
