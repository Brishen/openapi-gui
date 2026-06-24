import { defineConfig, devices } from '@playwright/test';

const PORT = 5174;

// E2E tests drive the demo playground (src/demo) in a real browser. Playwright
// boots the Vite dev server itself via `webServer`.
//
// Browser binaries: `npx playwright install chromium`. In sandboxes where the
// download host is blocked but browsers are preinstalled, point Playwright at
// them with PLAYWRIGHT_BROWSERS_PATH (e.g. /opt/pw-browsers).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
