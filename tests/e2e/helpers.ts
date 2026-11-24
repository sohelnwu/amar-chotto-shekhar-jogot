import { expect, type Page } from '@playwright/test';

export async function unlockParent(page: Page) {
  await page.goto('#/parent');
  const q = page.getByTestId('gate-question');
  await expect(q).toBeVisible();
  const a = Number(await q.getAttribute('data-a'));
  const b = Number(await q.getAttribute('data-b'));
  for (const d of String(a * b)) await page.locator(`[data-key="${d}"]`).click();
  await page.locator('[data-key="ok"]').click();
  await expect(page.getByTestId('tab-summary')).toBeVisible();
}

/** Waits until the service worker controls the page (app shell cached). */
export async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) {
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  }
}
