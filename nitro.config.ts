import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  cloudflare: {
    wrangler: {
      name: "skills",
      workers_dev: false,
      preview_urls: true,
      placement: {
        mode: "smart",
      },
      routes: [
        {
          pattern: "skills.851.sh",
          custom_domain: true,
        },
      ],
      observability: {
        enabled: true,
        head_sampling_rate: 1.0,
        logs: {
          enabled: true,
          invocation_logs: true,
        },
      },
    },
  },
});
