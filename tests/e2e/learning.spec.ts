import { expect, test } from '@playwright/test';
import { unlockParent } from './helpers';

test('home shows categories, games and parent entry', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'আমার ছোট্ট শেখার জগৎ' })).toBeVisible();
  await expect(page.getByTestId('cat-bn-vowels')).toBeVisible();
  await expect(page.getByTestId('cat-animals')).toBeVisible();
  await expect(page.getByTestId('games-entry')).toBeVisible();
  await expect(page.getByTestId('parent-entry')).toBeVisible();
  // level 1 hides level-2 categories
  await expect(page.getByTestId('cat-space')).toHaveCount(0);
});

test('every visible category opens and lists items', async ({ page }) => {
  await page.goto('./');
  const ids = await page.locator('[data-testid^="cat-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.slice(4)));
  expect(ids.length).toBeGreaterThan(20);
  for (const id of ids) {
    await page.goto(`#/c/${id}`);
    await expect(page.locator('[data-testid^="item-"]').first(), id).toBeVisible();
  }
});

test('flashcard: auto-plays name, next/prev, description audio', async ({ page }) => {
  await page.goto('./#/c/animals');
  const name = page.waitForResponse((r) => r.url().endsWith('/audio/bn/female/animals/cow.mp3'));
  await page.getByTestId('item-cow').click();
  expect((await name).status()).toBe(200);
  await expect(page.getByTestId('item-name')).toHaveText('গরু');

  await page.getByTestId('next').click();
  await expect(page).toHaveURL(/animals\/goat$/);
  await expect(page.getByRole('heading', { name: 'ছাগল' })).toBeVisible();
  await page.getByTestId('prev').click();
  await expect(page).toHaveURL(/animals\/cow$/);
  await expect(page.getByTestId('item-name')).toHaveCount(1);

  const desc = page.waitForResponse((r) => r.url().endsWith('/audio/bn/female/animals/cow.desc.mp3'));
  await page.getByTestId('play-desc').click();
  expect((await desc).status()).toBe(200);

  const en = page.waitForResponse((r) => r.url().endsWith('/audio/en/female/animals/cow.mp3'));
  await page.getByTestId('play-en').click();
  expect((await en).status()).toBe(200);
});

test('voice selection switches to male recordings', async ({ page }) => {
  await page.goto('./#/c/fruits/mango');
  await expect(page.getByTestId('item-name')).toHaveText('আম');
  await page.getByTestId('voice-male').click();
  const male = page.waitForResponse((r) => r.url().endsWith('/audio/bn/male/fruits/mango.mp3'));
  await page.getByTestId('play-name').click();
  expect((await male).status()).toBe(200);
  // persisted after reload
  await page.reload();
  await expect(page.getByTestId('voice-male')).toHaveAttribute('aria-checked', 'true');
});

test('audio actually plays in the browser (engine reaches playing state)', async ({ page }) => {
  await page.goto('./#/c/bn-vowels/aa');
  // the card auto-plays the name first; wait for it to finish
  await expect(page.getByTestId('play-name')).toHaveAttribute('data-state', 'idle', { timeout: 8000 });
  await page.getByTestId('play-desc').click();
  // 'playing' is set only after HTMLAudioElement.play() resolved
  await expect(page.getByTestId('play-desc')).toHaveAttribute('data-state', 'playing', { timeout: 5000 });
  await expect(page.getByTestId('play-desc')).toHaveAttribute('data-state', 'idle', { timeout: 10000 });
});

test('favorites persist across reloads (IndexedDB)', async ({ page }) => {
  await page.goto('./#/c/birds/peacock');
  await page.getByTestId('fav-toggle').click();
  await expect(page.getByTestId('fav-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByTestId('fav-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.goto('./#/favorites');
  await expect(page.getByTestId('item-peacock')).toBeVisible();
});

test('parent area is protected and level setting unlocks content', async ({ page }) => {
  await page.goto('./#/parent');
  await expect(page.getByTestId('parent-gate')).toBeVisible();
  await page.locator('[data-key="1"]').click();
  await page.locator('[data-key="ok"]').click();
  await expect(page.getByTestId('tab-summary')).toHaveCount(0);

  await unlockParent(page);
  await page.getByTestId('tab-settings').click();
  const lvl3 = page.getByTestId('setting-level').getByRole('radio', { name: '৫–৬ বছর' });
  await lvl3.click();
  await expect(lvl3).toHaveAttribute('aria-checked', 'true');
  await page.waitForTimeout(300); // let IndexedDB commit before leaving the page
  await page.goto('./');
  await expect(page.getByTestId('cat-space')).toBeVisible();
});

test('progress is recorded and can be reset', async ({ page }) => {
  await page.goto('./#/c/vehicles/bus');
  await expect(page.getByTestId('item-name')).toHaveText('বাস');
  await unlockParent(page);
  await expect(page.getByTestId('category-progress')).toContainText('যানবাহন');
  await expect(page.getByText('দেখেছে: বাস').first()).toBeVisible();
  await page.getByTestId('tab-settings').click();
  await page.getByTestId('reset-progress').click();
  await page.getByTestId('confirm-reset').click();
  await page.getByTestId('tab-summary').click();
  await expect(page.getByText('এখনও কোনো কার্যকলাপ নেই।')).toBeVisible();
});
