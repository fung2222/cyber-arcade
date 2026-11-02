// node --test tests/ — games.json hygiene for the hub cards (no browser needed)
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { games } = JSON.parse(readFileSync(join(root, 'games.json'), 'utf8'));
const asset = (p) => join(root, p);

test('games.json: ids are unique and card fields are bilingual', () => {
  const seen = new Set();
  for (const g of games) {
    assert.ok(g.id && !seen.has(g.id), `duplicate or missing id: ${g.id}`);
    seen.add(g.id);
    for (const field of ['name', 'genre']) {
      assert.ok(g[field]?.zh && g[field]?.en, `${g.id}.${field} needs zh + en`);
    }
    assert.match(g.repo, /^https:\/\//, `${g.id}.repo`);
    assert.match(g.url, /^https:\/\//, `${g.id}.url`);
    assert.ok(['free', 'silver', 'gold'].includes(g.tier), `${g.id}.tier`);
    assert.ok(['done', 'wip'].includes(g.status), `${g.id}.status`);
    assert.ok(typeof g.version === 'string' && g.version.length > 0, `${g.id}.version`);
  }
});

test('games.json: every card image exists; declared previews must exist too', () => {
  for (const g of games) {
    assert.ok(g.thumb && existsSync(asset(g.thumb)), `${g.id} missing thumb ${g.thumb}`);
    if (g.preview) assert.ok(existsSync(asset(g.preview)), `${g.id} missing preview ${g.preview}`);
    if (g.previewMp4) assert.ok(existsSync(asset(g.previewMp4)), `${g.id} missing previewMp4 ${g.previewMp4}`);
  }
});

test('games.json: wip cards carry a stage note; any stage note is bilingual', () => {
  for (const g of games) {
    if (g.status === 'wip') assert.ok(g.stage?.zh && g.stage?.en, `${g.id} wip needs stage zh + en`);
    if (g.stage) assert.ok(g.stage.zh && g.stage.en, `${g.id} stage needs zh + en`);
  }
});
