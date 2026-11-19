import { test, expect } from '@playwright/test';
import { HOSTS } from './hosts.mjs';

test.describe('public health endpoints', () => {
  const cases = [
    { name: 'app', url: `${HOSTS.app}/health`, service: 'sonaraim-app' },
    { name: 'node', url: `${HOSTS.node}/health`, service: 'sonaraim-node' },
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
      const text = await res.text();
      expect(text, `${name} /metrics content-type`).toContain('text/plain');
      expect(text, `${name} /metrics must include ${token}`).toContain(token);
    });
  }
});
