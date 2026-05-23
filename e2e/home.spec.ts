import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load and have correct title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toMatch(/Family|Activity/i);
  });
});
