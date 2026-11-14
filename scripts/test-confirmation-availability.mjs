import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const pw = await import(process.env.TONEVAULT_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TONEVAULT_TEST_BASE || 'http://localhost:3000';
const evidence = resolve(process.env.TONEVAULT_CONFIRMATION_EVIDENCE || 'docs/evidence/integration-step2/confirmation');
const id = '30000000-0000-4000-8000-000000000099';
const results = [];
await mkdir(evidence, { recursive: true });
try {
  for (const engine of ['chromium', 'webkit']) for (const width of [1440, 390]) for (const reduced of [false, true]) {
    const browser = await pw[engine].launch(engine === 'chromium' && process.env.TONEVAULT_BROWSER_EXECUTABLE ? { executablePath: process.env.TONEVAULT_BROWSER_EXECUTABLE } : {});
    try {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
      const errors = [], writes = [], expectedHttpFailures = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error' && !message.location().url.startsWith(base + '/api/orders/' + id)) errors.push(message.text()); });
      page.on('request', request => { if (request.url().startsWith(base + '/api/') && !['GET', 'HEAD'].includes(request.method())) writes.push(request.method()); });
      page.on('response', response => { if (response.url() === base + '/api/orders/' + id && response.status() >= 400) expectedHttpFailures.push(response.status()); });
      await page.goto(base + '/confirmation');
      await page.getByLabel('Order reference', { exact: true }).fill('invalid-reference');
      await page.getByRole('button', { name: 'Find order', exact: true }).click();
      await page.getByText('Enter a valid saved order reference.', { exact: true }).waitFor();
      await page.getByLabel('Order reference', { exact: true }).fill(id);
      await page.getByRole('button', { name: 'Find order', exact: true }).click();
      await page.waitForURL(base + '/confirmation/' + id);
      await page.getByRole('heading', { name: 'Order confirmation unavailable', exact: true }).waitFor();
      assert.equal(await page.getByRole('heading', { name: 'Your saved order', exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Retry order lookup', exact: true }).click();
      await page.getByRole('heading', { name: 'Order confirmation unavailable', exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.deepEqual(errors, []);
      assert.deepEqual(writes, []);
      assert.ok(expectedHttpFailures.includes(404));
      if (engine === 'chromium' && !reduced) await page.screenshot({ path: join(evidence, `${width}-unavailable.png`), fullPage: true });
      results.push({ engine, width, reduced, passed: true, expectedHttpFailures, apiWrites: 0, interceptedResponses: 0 });
      console.log(`PASS confirmation availability ${engine} ${width}px reduced=${reduced}: validation, actual missing endpoint, retry, no false confirmation.`);
    } finally { await browser.close(); }
  }
} finally {
  await writeFile(join(evidence, 'results.json'), JSON.stringify({ results, note: 'Actual current-app behavior only. No API responses intercepted, orders created, private records read, or successful transactions simulated. Guest/account adapter contracts are separate isolated unit tests; backend integration remains pending.' }, null, 2) + '\n');
}
