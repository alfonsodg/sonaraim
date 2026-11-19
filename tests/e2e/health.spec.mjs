import { test, expect } from '@playwright/test';
import { HOSTS } from './hosts.mjs';

test.describe('public health endpoints', () => {
  const cases = [
    { name: 'app', url: `${HOSTS.app}/health`, service: 'sonaraim-app' },
    { name: 'b2b', url: `${HOSTS.b2b}/health`, service: 'sonaraim-b2b' },
    { name: 'admin', url: `${HOSTS.admin}/health`, service: 'sonaraim-admin' },
  ];

  for (const { name, url, service } of cases) {
    test(`${name} GET /health returns 200 ok`, async ({ request }) => {
      const res = await request.get(url);
      expect(res.status(), `${name} /health status`).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.service).toBe(service);
    });
  }

  test('node GET /health returns 200 with relay telemetry fields', async ({ request }) => {
    const res = await request.get(`${HOSTS.node}/health`);
    expect(res.status(), 'node /health status').toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.node_id).toBe('string');
    expect(typeof body.queued_envelopes).toBe('number');
    expect(typeof body.kt_log_entries).toBe('number');
  });
});

test.describe('public metrics endpoints', () => {
  const cases = [
    { name: 'app', url: `${HOSTS.app}/metrics`, token: 'sonaraim_app_http_requests_total' },
    { name: 'node', url: `${HOSTS.node}/metrics`, token: 'sonaraim_node_kt_entries_total' },
    { name: 'b2b', url: `${HOSTS.b2b}/metrics`, token: 'sonaraim_b2b_tenants_total' },
    { name: 'admin', url: `${HOSTS.admin}/metrics`, token: 'sonaraim_admin_http_requests_total' },
  ];

  for (const { name, url, token } of cases) {
    test(`${name} GET /metrics exposes real counters`, async ({ request }) => {
      const res = await request.get(url);
      expect(res.status(), `${name} /metrics status`).toBe(200);
      expect(res.headers()['content-type'], `${name} /metrics content-type`).toContain('text/plain');
      const text = await res.text();
      expect(text, `${name} /metrics must include ${token}`).toContain(token);
    });
  }
});
