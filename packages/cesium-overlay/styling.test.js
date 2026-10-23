import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');

test('the styling API: every custom property the README documents is read with a fallback, none undocumented, none declared', () => {
  const css = read('./cesium-overlay.js');
  const used = new Set(css.matchAll(/var\((--cesium-overlay-[a-z-]+),/g).map(m => m[1]));
  assert.deepEqual([...used].sort(), [...new Set(read('./README.md').match(/--cesium-overlay-[a-z-]+/g))].sort());
  // declared on the layer, a property would hide the page's, set on :root or the widget's container
  assert.deepEqual(css.match(/--cesium-overlay-[a-z-]+(?=:)/g) ?? [], []);
});

test('the palette resolved: every --overlay-* the layer declares and every class it styles is in the README', () => {
  const css = read('./cesium-overlay.js');
  const readme = read('./README.md');
  const declared = [...css.matchAll(/(--overlay-[a-z-]+):/g)].map(m => m[1]);
  assert.ok(declared.length > 0);
  for (const name of [...declared, ...css.matchAll(/^\.(cesium-overlay-[a-z-]+)/gm).map(m => m[1])]) {
    assert.ok(readme.includes(name), `${name} is not in the README`);
  }
});
