import { defineConfig } from "@playwright/test";

const PORT = 3210;
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  use: { baseURL: `http://localhost:${PORT}`, channel: "chrome", viewport: { width: 1280, height: 900 } },
  webServer: { command: `npm run build && npx next start -p ${PORT}`, url: `http://localhost:${PORT}`, timeout: 180_000, reuseExistingServer: true },
});
