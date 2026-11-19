// Shared helpers for the Sonaraim public-URL E2E suite.
// Base domain from env (CI/public default); subdomains per REMOTE.md.
export const BASE_DOMAIN = (process.env.E2E_BASE_DOMAIN || 'sonaraim.apulab.info').trim();

export const HOSTS = {
  app: `https://app.${BASE_DOMAIN}`,
  node: `https://node.${BASE_DOMAIN}`,
  b2b: `https://b2b.${BASE_DOMAIN}`,
  admin: `https://admin.${BASE_DOMAIN}`,
};

const APEX_ALIASES = new Set(['sonaraim.apulab.info']);
if (APEX_ALIASES.has(BASE_DOMAIN)) {
  HOSTS.app = `https://${BASE_DOMAIN}`;
  HOSTS.node = 'https://nodesonar.apulab.info';
  HOSTS.b2b = 'https://b2bsonar.apulab.info';
  HOSTS.admin = 'https://adminsonar.apulab.info';
}

export const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];
