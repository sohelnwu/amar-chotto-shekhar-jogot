import { expect, test } from '@playwright/test';
import { unlockParent, waitForServiceWorker } from './helpers';

test('PWA manifest and service worker are installable', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const res = await request.get(href!);
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBe('আমার ছোট্ট শেখার জগৎ');
  expect(m.display).toBe('standalone');
  expect(m.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const i of m.icons) expect((await request.get(i.src)).ok(), i.src).toBe(true);
  await waitForServiceWorker(page);
});

test('works offline: app shell, downloaded pack audio, honest missing-audio state', async ({ page, context }) => {
  await page.goto('./');
  await waitForServiceWorker(page);

  // download the starter pack (numbers, colours, shapes, phrases)
  await unlockParent(page);
  await page.getByTestId('tab-downloads').click();
  await page.getByTestId('download-starter').click();
  await expect(page.getByTestId('pack-starter')).toHaveAttribute('data-complete', 'yes', { timeout: 60_000 });

  await context.setOffline(true);
  await page.goto('./');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'আমার ছোট্ট শেখার জগৎ' })).toBeVisible();
  await expect(page.getByTestId('net-status').first()).toContainText('অফলাইন');

  // lazily loaded routes are precached too
  await page.goto('./#/games');
  await expect(page.getByTestId('game-count')).toBeVisible();

  // downloaded audio plays offline
  await page.goto('./#/c/numbers/3');
  await expect(page.getByRole('heading', { name: 'তিন' })).toBeVisible();
  await expect(page.getByTestId('play-name')).toHaveAttribute('data-state', 'idle', { timeout: 8000 });
  await page.getByTestId('play-desc').click();
  await expect(page.getByTestId('play-desc')).toHaveAttribute('data-state', 'playing', { timeout: 5000 });

  // audio that was never downloaded: clear "unavailable" state, never fake playback
  await page.goto('./#/c/water-animals/whale');
  await expect(page.getByRole('heading', { name: 'তিমি' })).toBeVisible();
  await expect(page.getByTestId('play-desc')).toHaveAttribute('data-state', 'idle', { timeout: 8000 });
  await page.getByTestId('play-desc').click();
  await expect(page.getByText('এই অডিওটি এখন নেই', { exact: false })).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('play-desc')).toHaveAttribute('data-state', 'unavailable');

  await context.setOffline(false);
});

test('progress stored offline survives restart', async ({ page, context }) => {
  await page.goto('./');
  await waitForServiceWorker(page);
  await context.setOffline(true);
  await page.goto('./#/c/fruits/banana');
  await page.getByTestId('fav-toggle').click();
  // the heart turns on only after IndexedDB committed (live query)
  await expect(page.getByTestId('fav-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByTestId('fav-toggle')).toHaveAttribute('aria-pressed', 'true');
  await context.setOffline(false);
});
