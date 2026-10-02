import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

test('generated application modules resolve their static and lazy imports', async () => {
  async function inspect(directory) {
    for (const entry of await readdir(directory, {withFileTypes:true})) {
      const file = resolve(directory, entry.name);
      if (entry.isDirectory() && entry.name !== 'whisper') await inspect(file);
      else if (entry.isFile() && entry.name.endsWith('.js')) {
        const source = await readFile(file, 'utf8');
        for (const [, path] of source.matchAll(/(?:from\s*|import\s*\(\s*)["'](\.\.?\/[^"']+)["']/g)) {
          assert.ok((await stat(resolve(dirname(file), path))).isFile(), `${file}: ${path}`);
        }
      }
    }
  }
  await inspect(resolve('dist/assets'));
  const voice = await readFile('site/hq/inbox-voice.js', 'utf8');
  const styles = voice.match(/link\.href\s*=\s*['"]([^'"]+)['"]/)[1];
  assert.ok((await stat(resolve('dist', '.' + styles))).isFile(), styles);
});
