import { test, expect } from '@playwright/test';
import { HOSTS, VIEWPORTS } from './hosts.mjs';

test.describe('render and screenshots', () => {
  test('admin GET /login renders HTML + screenshots at 3 viewports', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const res = await page.goto(`${HOSTS.admin}/login`, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    await expect(page.locator('#login-heading')).toHaveText('Operator Zero-Trust Sign In');

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.screenshot({ path: `debug/admin-login-${vp.name}-${vp.width}x${vp.height}.png` });
    }
    expect(errors, `console errors on /login: ${errors.join('; ')}`).toEqual([]);
  });

  test('app GET / captures 401 gate evidence (screenshot, not HTML)', async ({ page, request }) => {
    const apiRes = await request.get(`${HOSTS.app}/`);
    expect(apiRes.status()).toBe(401);

    const errors = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto(`${HOSTS.app}/`, { waitUntil: 'domcontentloaded' });
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'debug/app-home-401-gate-desktop-1920x1080.png' });
    expect(errors, `console errors on app /: ${errors.join('; ')}`).toEqual([]);
  });
});
