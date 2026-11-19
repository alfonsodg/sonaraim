import { test, expect } from '@playwright/test';
import { HOSTS } from './hosts.mjs';

test.describe('public instant clip', () => {
  test('GET /c/:token renders clip view for any non-empty token', async ({ request }) => {
    const token = `e2e-probe-${Date.now()}`;
    const res = await request.get(`${HOSTS.app}/c/${token}`);
    // clipRoutes.mjs L96-111: any non-empty token renders the clip
    // view (200 HTML); only the empty token throws -> 400.
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain(token);
    expect(html).toContain('Instant Clip');
  });
});
