import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, globSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, join, normalize, relative} from 'node:path';

// A package published with a `files` list ships only what it names: a file that a listed one imports, and the list omits, is
// missing from the published package, and importing it fails there (post-process 0.1.0 shipped without effect.js).
const root = new URL('.', import.meta.url).pathname;

for (const name of readdirSync(root, {withFileTypes: true}).filter(each => each.isDirectory()).map(each => each.name)) {
  const folder = join(root, name);
  const manifest = join(folder, 'package.json');
  if (!existsSync(manifest) || !JSON.parse(readFileSync(manifest)).files) {
    continue;
  }
  test(`${name}: every file the listed files import is listed too`, () => {
    const {files} = JSON.parse(readFileSync(manifest));
    const listed = new Set(files.flatMap(file => file.includes('*') ? globSync(file, {cwd: folder}) : [file]).map(file => normalize(file)));
    const missing = [];
    const seen = new Set();
    const queue = [...listed].filter(file => file.endsWith('.js') && existsSync(join(folder, file)));
    while (queue.length) {
      const file = queue.pop();
      if (seen.has(file)) {
        continue;
      }
      seen.add(file);
      const source = readFileSync(join(folder, file), 'utf8');
      for (const [, path] of source.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
        const target = normalize(join(dirname(file), path));
        if (!listed.has(target)) {
          missing.push(`${file} imports ${target}`);
        }
        if (target.endsWith('.js') && existsSync(join(folder, target))) {
          queue.push(target);
        }
      }
    }
    assert.deepEqual([...new Set(missing)], [], `not in ${relative(root, manifest)}'s files`);
  });
}
