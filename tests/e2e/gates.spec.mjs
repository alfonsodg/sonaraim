import { test, expect } from '@playwright/test';
import { HOSTS } from './hosts.mjs';

test.describe('unauthenticated gates fail closed with 401 JSON', () => {
  test('admin GET /operator without session returns 401', async ({ request }) => {
    const res = await request.get(`${HOSTS.admin}/operator`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('unauthorized');
  });

  test('admin GET /studio without session returns 401', async ({ request }) => {
    const res = await request.get(`${HOSTS.admin}/studio`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('unauthorized');
  });

  test('app GET /inbox without session returns 401', async ({ request }) => {
    const res = await request.get(`${HOSTS.app}/inbox`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('unauthorized');
  });
});
