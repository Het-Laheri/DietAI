import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('BLOGS configuration and clickable links in Home.tsx', () => {
  const homePath = path.resolve(process.cwd(), 'src/pages/Home.tsx');
  const homeContent = fs.readFileSync(homePath, 'utf-8');

  // 1. Verify Home.tsx renders clickable links for the blog title and thumbnail
  assert.ok(
    homeContent.includes('title={`Read "${b.title}" on ${b.source}`}') ||
    homeContent.includes('<a\n                    href={b.url}\n                    target="_blank"'),
    'Blog thumbnail must be wrapped in a clickable <a> tag'
  );

  assert.ok(
    homeContent.includes('<h3 className="text-base sm:text-lg font-bold text-stone-900 mb-3 leading-snug">\n                      <a\n                        href={b.url}'),
    'Blog title must be wrapped in a clickable <a> tag'
  );

  // 2. Extract image paths from Home.tsx BLOGS array
  const imageMatches = [...homeContent.matchAll(/image:\s*'([^']+)'/g)].map(m => m[1]);
  assert.ok(imageMatches.length >= 6, `Expected at least 6 blog images, found ${imageMatches.length}`);

  // 3. Ensure distinct images are used across articles
  const uniqueImages = new Set(imageMatches);
  assert.ok(uniqueImages.size >= 5, `Expected distinct images across articles, found ${uniqueImages.size}`);

  // 4. Verify all referenced blog images exist in public/ and are non-empty
  for (const imgRelPath of uniqueImages) {
    const cleanPath = imgRelPath.replace(/^\//, '');
    const absoluteImgPath = path.resolve(process.cwd(), 'public', cleanPath);
    assert.ok(fs.existsSync(absoluteImgPath), `Image file must exist: ${absoluteImgPath}`);
    const stats = fs.statSync(absoluteImgPath);
    assert.ok(stats.size > 1000, `Image file must have non-trivial size: ${absoluteImgPath} (${stats.size} bytes)`);
  }

  // 5. Extract URLs and verify they point to HTTPS publication articles
  const urlMatches = [...homeContent.matchAll(/url:\s*'([^']+)'/g)].map(m => m[1]);
  assert.ok(urlMatches.length >= 6, `Expected at least 6 blog URLs, found ${urlMatches.length}`);
  for (const url of urlMatches) {
    assert.ok(url.startsWith('https://'), `URL must be a secure HTTPS link: ${url}`);
  }
});
