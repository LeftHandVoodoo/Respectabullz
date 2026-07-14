// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  checkDemoData,
  inspectDemoConfig,
  inspectDemoSeedCommandSource,
  inspectDemoSeedSource,
  inspectDemoUiSource,
  inspectSqlBoundary,
} from '../check-demo-data.mjs';

const TEST_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = path.resolve(path.dirname(TEST_PATH), '../..');
const CURRENT_SEED = fs.readFileSync(
  path.join(REPOSITORY_ROOT, 'src/lib/db/legacy.ts'),
  'utf8',
);
const CURRENT_DEMO_CONFIG = JSON.parse(
  fs.readFileSync(
    path.join(REPOSITORY_ROOT, 'src-tauri/tauri.demo.conf.json'),
    'utf8',
  ),
);

describe('demo-data source guard', () => {
  it('accepts the current deterministic synthetic seed fixtures', () => {
    expect(checkDemoData(REPOSITORY_ROOT)).toMatchObject({
      ok: true,
      issues: [],
    });
  });

  it('rejects destructive reset calls, public contacts, and public identifiers', () => {
    const unsafeSource =
      CURRENT_SEED
        .replace('avery@example.test', 'owner@breeder.com')
        .replace('DEMO-REG-0001', 'ABKC-123456')
        .replace('DEMO-CHIP-0001', '985141234567890') +
      '\nclearDatabase();\n';

    const issues = inspectDemoSeedSource(unsafeSource);

    expect(issues).toContain('seedDatabase must not call clearDatabase.');
    expect(issues).toContain(
      'Seed contact email uses a non-reserved domain: breeder.com.',
    );
    expect(issues).toContain(
      'Seed animal identifiers must not resemble a real registry number.',
    );
    expect(issues).toContain(
      'Seed animal identifiers must not contain a real-looking 15-digit microchip number.',
    );
  });

  it('rejects a demo configuration that can touch production application data', () => {
    const unsafeConfig = structuredClone(CURRENT_DEMO_CONFIG);
    unsafeConfig.identifier = 'com.respectabullz.app';
    unsafeConfig.app.security.capabilities[0].permissions = [
      {
        identifier: 'fs:scope',
        allow: [{ path: '$APPDATA/com.respectabullz.app/**' }],
      },
    ];

    const issues = inspectDemoConfig(unsafeConfig);

    expect(issues).toContain(
      'Demo Tauri config must use the dedicated com.respectabullz.demo identifier.',
    );
    expect(issues).toContain(
      'Demo capabilities must not grant the production application-data directory.',
    );
  });

  it('rejects renderer-controlled SQL pool load and close authority', () => {
    const unsafeConfig = structuredClone(CURRENT_DEMO_CONFIG);
    unsafeConfig.plugins.sql.preload = ['sqlite:alternate.db'];
    const permissions = [
      'sql:default',
      'sql:allow-load',
      'sql:allow-execute',
      'sql:allow-select',
      'sql:allow-close',
    ];
    const unsafeConnection = `
      const database = await Database.load(DB_NAME);
      await database.close();
    `;

    const issues = inspectSqlBoundary(
      unsafeConfig,
      permissions,
      unsafeConnection,
      'Test config',
    );

    expect(issues).toContain(
      'Test config must preload only sqlite:respectabullz.db.',
    );
    expect(issues).toContain(
      'Test config must not grant renderer permission sql:default.',
    );
    expect(issues).toContain(
      'Test config must not grant renderer permission sql:allow-load.',
    );
    expect(issues).toContain(
      'Test config must not grant renderer permission sql:allow-close.',
    );
    expect(issues).toContain(
      'Renderer database access must not load arbitrary SQLite pools.',
    );
    expect(issues).toContain(
      'Renderer database access must not close the Rust-owned pool.',
    );
  });

  it('rejects demo commands and controls that are not bound to the isolated identity', () => {
    expect(inspectDemoSeedCommandSource('if !cfg!(debug_assertions) {}')).toContain(
      'Demo transaction safety marker is missing: DEMO_APP_IDENTIFIER.',
    );
    expect(inspectDemoUiSource('{import.meta.env.DEV && (')).toContain(
      "Demo UI identity marker is missing: const DEMO_APP_IDENTIFIER = 'com.respectabullz.demo'.",
    );
  });
});
