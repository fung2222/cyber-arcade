// node --test tests/ — bottom safe-area guard for the fixed hub tabbar (A3)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const css = readFileSync(join(root, 'css/hub.css'), 'utf8');
const bodyBlocks = [...css.matchAll(/(^|\n)body\s*\{([^}]*)\}/g)].map((m) => m[2]);
const pad = bodyBlocks.map((b) => b.match(/padding-bottom:\s*calc\((\d+)px\s*\+\s*env\(safe-area-inset-bottom\)\)/)).find(Boolean);

test('hub layout: body clears the fixed tabbar + Games FAB', () => {
  assert.ok(pad, 'body needs padding-bottom: calc(Npx + env(safe-area-inset-bottom))');
  assert.ok(Number(pad[1]) >= 96, `body bottom clearance ${pad[1]}px < 96px (tabbar 69 + 12px gap + FAB)`);
});
