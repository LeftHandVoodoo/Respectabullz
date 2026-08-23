// @vitest-environment node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { scanBuffer, scanPaths } from '../check-build-secrets.mjs';

const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

describe('build secret scanning', () => {
  it('recognizes public-token markers and the configured sentinel without exposing values', () => {
    const sentinel = ['github', 'pat', 'RB009', 'SENTINEL', '000000000000'].join('_');
    const classicTokenShape = 'gh' + 'p_' + '12345678901234567890';
    const labels = scanBuffer(
      Buffer.from('VITE_GITHUB_TOKEN=' + sentinel + '\n' + classicTokenShape),
      { sentinel },
    );

    expect(labels).toEqual([
      'VITE_GITHUB_TOKEN marker',
      'GitHub fine-grained token shape',
      'GitHub classic token shape',
      'configured build sentinel',
    ]);
  });

  it('recursively scans clean artifact directories', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'respectabullz-artifacts-'));
    temporaryRoots.push(root);
    await fs.mkdir(path.join(root, 'assets'));
    await fs.writeFile(path.join(root, 'index.html'), '<main>Respectabullz</main>');
    await fs.writeFile(path.join(root, 'assets', 'app.js'), 'console.log("ready")');

    const result = await scanPaths([root], { sentinel: 'unused-sentinel' });

    expect(result.filesScanned).toBe(2);
    expect(result.findings).toEqual([]);
  });

  it.each([
    ['private key material', '-----BEGIN PRIVATE KEY-----'],
    ['AWS access key shape', 'AKIA1234567890ABCDEF'],
    ['Google API key shape', 'AIza' + 'A'.repeat(35)],
    ['OpenAI API key shape', 'sk-proj-' + 'A'.repeat(24)],
    ['Slack token shape', 'xoxb-' + '1'.repeat(20)],
    ['Stripe live secret shape', 'sk_live_' + '1'.repeat(20)],
    ['public Vite credential marker', 'VITE_CUSTOM_API_KEY'],
  ])('detects %s without requiring the actual credential value', (label, marker) => {
    expect(scanBuffer(Buffer.from(marker))).toContain(label);
  });
});
