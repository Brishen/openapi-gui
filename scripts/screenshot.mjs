// Capture a screenshot of the demo GUI into docs/demo.png.
// Usage: start the dev server (npm run dev), then `node scripts/screenshot.mjs [url]`.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://localhost:5174';
const out = 'docs/demo.png';

await mkdir('docs', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
// Wait for the live output to render before capturing.
await page.getByTestId('output-code').waitFor();
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`Saved ${out}`);
