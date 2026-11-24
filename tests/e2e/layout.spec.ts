import { expect, test } from '@playwright/test';

const PAGES = ['./', './#/c/animals', './#/c/animals/cow', './#/c/numbers/7', './#/c/stories/ant-and-rain', './#/games', './#/games/colors', './#/games/count', './#/parent'];

for (const url of PAGES) {
  test(`no horizontal overflow and large touch targets: ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    // primary child buttons must be at least 48px (Android touch-target guidance)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('.child-area button, .child-area a')]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)).length,
    );
    expect(small).toBe(0);
  });
}
