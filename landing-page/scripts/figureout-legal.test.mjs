import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pages, site } from '../legal/figureout.mjs';
import { render, escapeHTML, pagePath } from './generate-figureout-legal.mjs';
import { readFile } from 'node:fs/promises';

test('six distinct Figureout pages have text, public contact and canonical HTTPS URLs', () => {
  assert.equal(pages.length, 6); assert.equal(new Set(pages.map(p => p.slug)).size, 6);
  for (const page of pages) {
    const html = render(page);
    assert.ok(html.includes(`${site.origin}${pagePath(page.slug)}`));
    assert.ok(html.includes(`mailto:${site.email}`));
    assert.ok(html.includes('<main id="main">')); assert.ok(html.includes('<h1>'));
    assert.ok(!html.includes('<script')); assert.ok(!html.includes('<form'));
    for (const link of pages) assert.ok(html.includes(`href="${pagePath(link.slug)}"`));
  }
});
test('legal content is escaped, with no expense/health-app policy contamination', () => {
  assert.equal(escapeHTML('<script>&"'), '&lt;script&gt;&amp;&quot;');
  const policy = render(pages.find(p => p.slug === 'privacy-policy'));
  for (const word of ['Supabase', 'HealthKit', 'OpenRouter']) assert.ok(!policy.includes(word));
  assert.ok(policy.includes('AdMob')); assert.ok(policy.includes('365 days'));
  assert.ok(!policy.includes('No ads, tracking')); assert.ok(policy.includes('anonymous scores'));
});
test('developer website authorizes the supplied AdMob publisher', async () => {
  const text = await readFile(new URL('../public/app-ads.txt', import.meta.url), 'utf8');
  assert.ok(text.includes('google.com, pub-3743383597691737, DIRECT, f08c47fec0942fa0'));
});
test('deployment rewrites serve generated HTML before the SPA fallback', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  for (const page of pages) {
    const at = config.rewrites.findIndex(r => r.source === pagePath(page.slug));
    assert.ok(at >= 0 && at < config.rewrites.length - 1);
    assert.equal(config.rewrites[at].destination, `${pagePath(page.slug)}/index.html`);
  }
});
