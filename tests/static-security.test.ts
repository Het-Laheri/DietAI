// Static guards against reintroducing the audited vulnerabilities.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(rel));
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}
const CODE = [...sourceFiles('src'), ...sourceFiles('api'), 'server.ts'];

test('SEC-003: no Razorpay keys, private keys or known passwords in source', () => {
  for (const f of CODE) {
    const s = read(f);
    assert.doesNotMatch(s, /rzp_(live|test)_[A-Za-z0-9]{6,}/, `${f}: Razorpay key`);
    assert.doesNotMatch(s, /BEGIN (RSA )?PRIVATE KEY/, `${f}: private key`);
    assert.doesNotMatch(s, /VAPID_PRIVATE_KEY\s*\|\|\s*['"`]/, `${f}: VAPID fallback`);
    assert.doesNotMatch(s, /process\.env\.[A-Z_]*(KEY|SECRET|TOKEN|PASSWORD)[A-Z_]*\s*\|\|\s*['"`][^'"`]{8,}/, `${f}: secret fallback`);
  }
});

test('SEC-003: the only Google API key in source is the public Firebase web config', () => {
  for (const f of CODE) {
    if (f === path.join('src', 'services', 'firebase.ts')) continue;
    assert.doesNotMatch(read(f), /AIza[0-9A-Za-z_-]{30,}/, `${f}: Google API key`);
  }
});

test('SEC-006: no code signs in to Firebase with embedded credentials', () => {
  for (const f of CODE) {
    assert.doesNotMatch(read(f), /signInWithEmailAndPassword\([^)]*['"`][^'"`]+@[^'"`]+['"`]/, `${f}: embedded sign-in`);
  }
  assert.doesNotMatch(read('server.ts'), /signInWithEmailAndPassword/);
});

test('SEC-002: login page shows no demo credentials', () => {
  const s = read('src/pages/Login.tsx');
  assert.doesNotMatch(s, /@nutrisnap\.com|@aidiet\.com|Pass:|Auto-Fill & Sign In/);
  assert.doesNotMatch(s, /createDietician/);
});

test('SEC-005: no email-based role or paywall fallbacks', () => {
  assert.doesNotMatch(read('src/contexts/AuthContext.tsx'), /emailLower|includes\(['"]admin/);
  assert.doesNotMatch(read('src/services/subscription.ts'), /emailLower|getLocalSubscription\(profile/);
});

test('SEC-001: Firestore rules have no open access', () => {
  const rules = read('firestore.rules');
  assert.doesNotMatch(rules, /if\s+true/);
  assert.match(rules, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
});

test('SEC-008: API never sends a wildcard CORS origin', () => {
  for (const f of sourceFiles('api')) {
    assert.doesNotMatch(read(f), /Access-Control-Allow-Origin['"],\s*['"]\*/, f);
  }
});

test('SEC-008 / UNC-001: vercel.json sets security headers and does not serve the SPA for /api', () => {
  const v = JSON.parse(read('vercel.json'));
  const keys = v.headers.flatMap((h: any) => h.headers.map((x: any) => x.key));
  for (const k of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Content-Security-Policy', 'Strict-Transport-Security']) {
    assert.ok(keys.includes(k), k);
  }
  const last = v.rewrites[v.rewrites.length - 1];
  assert.equal(last.destination, '/index.html');
  assert.notEqual(last.source, '/(.*)');
  assert.match('/api/unknown', /^\/api\//);
  assert.ok(!new RegExp(`^${last.source}$`).test('/api/unknown'), 'SPA catch-all must not match /api/*');
  assert.ok(new RegExp(`^${last.source}$`).test('/patient/meals'));
});

test('FUN-003: API functions use explicit .js extensions for local imports (ESM on Vercel)', () => {
  for (const f of sourceFiles('api')) {
    for (const m of read(f).matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
      assert.match(m[1], /\.js$/, `${f}: ${m[1]}`);
    }
  }
});

test('BLD: build runs the type checker first', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts.build, /^tsc --noEmit &&/);
});

test('PAY: no live ₹1 test-payment button on the subscription page', () => {
  assert.doesNotMatch(read('src/pages/Patient/SubscriptionPage.tsx'), /Test Pay|amountInPaise=\{100\}/);
});
