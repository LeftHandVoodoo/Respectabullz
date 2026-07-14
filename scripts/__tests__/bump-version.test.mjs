// @vitest-environment node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  bumpVersion,
  updateRepositoryVersion,
} from '../bump-version.js';
import { checkVersions } from '../check-versions.mjs';

const temporaryRoots = [];

async function createVersionFixture(version = '1.10.2') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'respectabullz-version-bump-'));
  temporaryRoots.push(root);

  const files = {
    VERSION: version + '\n',
    'package.json': JSON.stringify({
      name: 'respectabullz',
      version,
      private: true,
    }),
    'package-lock.json': JSON.stringify({
      name: 'respectabullz',
      version,
      lockfileVersion: 3,
      packages: {
        '': { name: 'respectabullz', version },
      },
    }),
    'src-tauri/Cargo.toml':
      '[package]\nname = "respectabullz"\nversion = "' +
      version +
      '"\n\n[dependencies]\nserde = "1"\n',
    'src-tauri/Cargo.lock':
      '[[package]]\nname = "dependency"\nversion = "9.9.9"\n\n' +
      '[[package]]\nname = "respectabullz"\nversion = "' +
      version +
      '"\n',
    'src-tauri/tauri.conf.json': JSON.stringify({
      productName: 'Respectabullz',
      version,
    }),
    'src/lib/version.ts': "export const VERSION = '" + version + "';\n",
    '.env.example': 'VITE_APP_VERSION="' + version + '"\n',
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

describe('bump-version', () => {
  it('computes semantic version increments', () => {
    expect(bumpVersion('1.10.2', 'major')).toBe('2.0.0');
    expect(bumpVersion('1.10.2', 'minor')).toBe('1.11.0');
    expect(bumpVersion('1.10.2', 'patch')).toBe('1.10.3');
    expect(bumpVersion('1.10.2', '3.2.1')).toBe('3.2.1');
    expect(() => bumpVersion('1.10.2', 'next')).toThrow('Invalid version format');
  });

  it('updates all nine enforced sources without changing dependency versions', async () => {
    const root = await createVersionFixture();
    const touched = updateRepositoryVersion(root, '1.10.3', { log: () => {} });

    expect(touched).toHaveLength(8);
    expect(checkVersions(root)).toMatchObject({
      canonical: '1.10.3',
      ok: true,
      mismatches: [],
    });
    await expect(
      fs.readFile(path.join(root, 'src-tauri/Cargo.lock'), 'utf8'),
    ).resolves.toContain('name = "dependency"\nversion = "9.9.9"');
  });
});
