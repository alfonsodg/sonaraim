import { test, expect } from '@playwright/test';
import { HOSTS } from './hosts.mjs';

// Authenticated flows read the operator token ONLY from the environment.
// Public CI runs (no secret) skip gracefully; sandbox runs inject it.
const ADMIN_TOKEN = (process.env.E2E_ADMIN_TOKEN || '').trim();
const hasToken = Boolean(ADMIN_TOKEN);
test.skip(!hasToken, 'E2E_ADMIN_TOKEN not set: skipping authenticated studio submit');

test.describe('authenticated studio submit', () => {
  test('POST /studio/cards with minimal card returns 200 and dispatch report', async ({
    request,
  }) => {
    const cardTitle = `E2E Studio Card ${Date.now()}`;
    const res = await request.post(`${HOSTS.admin}/studio/cards`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      form: {
        tenantDid: 'did:web:clinic.example.com',
        cardTitle,
        actionLabel: 'Confirm Slot',
        recipientDid: 'did:sonaraim:e2e-probe',
      },
    });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('Declarative Card Preview');
    expect(html).toContain(cardTitle);
    // Empty apiKey means no upstream dispatch; the builder still
    // answers 200 with preview + signing manifest (server.mjs L240-253).
    expect(html).toContain('Manifest Digest');
  });
});
