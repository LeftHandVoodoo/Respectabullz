// @vitest-environment node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkVersions } from '../check-versions.mjs';

const temporaryRoots = [];

async function createVersionFixture(version = '1.10.2', overrides = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'respectabullz-version-check-'));
  temporaryRoots.push(root);

  const files = {
    VERSION: version + '\n',
    'package.json': JSON.stringify({ version }),
    'package-lock.json': JSON.stringify({
      version,
      packages: { '': { version } },
    }),
    'src-tauri/Cargo.toml':
      '[package]\nname = "respectabullz"\nversion = "' + version + '"\n\n[dependencies]\n',
    'src-tauri/Cargo.lock':
      '[[package]]\nname = "respectabullz"\nversion = "' + version + '"\n',
    'src-tauri/tauri.conf.json': JSON.stringify({ version }),
    'src/lib/version.ts': "export const VERSION = '" + version + "';\n",
    '.env.example': 'VITE_APP_VERSION="' + version + '"\n',
    ...overrides,
  };

  for (const [relativePath, contents] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, contents, 'utf8');
  }

  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

describe('checkVersions', () => {
  it('accepts a semantic version that matches every release source', async () => {
    const root = await createVersionFixture();

    const result = checkVersions(root);

    expect(result.ok).toBe(true);
    expect(result.entries).toHaveLength(9);
    expect(result.mismatches).toEqual([]);
  });

  it('reports a stale environment example without changing any files', async () => {
    const root = await createVersionFixture('1.10.2', {
      '.env.example': 'VITE_APP_VERSION="1.9.3"\n',
    });

    const result = checkVersions(root);

    expect(result.ok).toBe(false);
    expect(result.mismatches).toEqual([
      {
        source: '.env.example#VITE_APP_VERSION',
        version: '1.9.3',
      },
    ]);
    await expect(fs.readFile(path.join(root, '.env.example'), 'utf8')).resolves.toContain(
      '1.9.3',
    );
  });
});
