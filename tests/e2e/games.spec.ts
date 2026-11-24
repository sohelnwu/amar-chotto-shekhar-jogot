import { expect, test, type Page } from '@playwright/test';

async function answerRounds(page: Page, rounds: number) {
  for (let i = 0; i < rounds; i++) {
    const right = page.locator('[data-testid="option"][data-answer="yes"]');
    await expect(right).toBeEnabled();
    await right.click();
    if (i < rounds - 1) await expect(page.locator('[data-testid="option"][data-answer="yes"]')).toBeEnabled({ timeout: 5000 });
    await page.waitForTimeout(1800);
  }
  await expect(page.getByTestId('game-done')).toBeVisible();
}

test('listen & find: wrong answer is gentle, right answers finish the game', async ({ page }) => {
  await page.goto('./#/games/animals');
  await page.locator('[data-testid="option"][data-answer="no"]').first().click();
  await expect(page.getByTestId('game-done')).toHaveCount(0);
  await answerRounds(page, 8);
});

test('counting game', async ({ page }) => {
  await page.goto('./#/games/count');
  await answerRounds(page, 8);
});

test('odd one out', async ({ page }) => {
  await page.goto('./#/games/odd');
  await answerRounds(page, 8);
});

test('memory game can be completed', async ({ page }) => {
  await page.goto('./#/games/memory?topic=fruits');
  for (let board = 0; board < 3; board++) {
    const cards = page.getByTestId('memory-card');
    await expect(cards).toHaveCount(6);
    const pairs = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-pair')!));
    const done = new Set<string>();
    for (const p of pairs) {
      if (done.has(p)) continue;
      done.add(p);
      const idx = pairs.flatMap((x, i) => (x === p ? [i] : []));
      await cards.nth(idx[0]).click();
      await cards.nth(idx[1]).click();
      await page.waitForTimeout(750);
    }
    await page.waitForTimeout(1900);
  }
  await expect(page.getByTestId('game-done')).toBeVisible();
});

test('topic picker leads into a game', async ({ page }) => {
  await page.goto('./#/games/listen');
  await page.getByTestId('topic-fruits').click();
  await expect(page.locator('[data-testid="option"]')).toHaveCount(3);
});
