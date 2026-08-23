// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  checkDemoData,
  inspectDatabaseAccessSource,
  inspectDemoConfig,
  inspectFilesystemBoundary,
  inspectRendererDatabaseMutations,
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

  it('rejects recursive or unrelated application-data filesystem scopes', () => {
    const unsafeConfig = structuredClone(CURRENT_DEMO_CONFIG);
    const permissions = unsafeConfig.app.security.capabilities[0].permissions;
    const readPermission = permissions.find(
      (permission) => permission.identifier === 'fs:allow-read-file',
    );
    readPermission.allow = [{ path: '$APPDATA/**' }];
    readPermission.deny = [];
    permissions.push('fs:allow-read-dir');
    permissions.push({
      identifier: 'fs:scope',
      allow: [{ path: '$APPDATA/**' }],
    });
    unsafeConfig.app.security.assetProtocol.scope = ['$APPDATA/**'];

    const issues = inspectFilesystemBoundary(
      unsafeConfig,
      permissions,
      'Test config',
    );

    expect(issues).toContain(
      'Test config must keep default filesystem denials and scope every command.',
    );
    expect(issues).toContain(
      'Test config must grant only the reviewed operation-scoped filesystem commands.',
    );
    expect(issues).toContain(
      'Test config filesystem permission fs:allow-read-file must match its reviewed operation scope.',
    );
    expect(issues).toContain(
      'Test config asset scope must contain only direct managed photo files.',
    );
  });

  it('rejects permission to remove a managed root or any nested path', () => {
    const unsafeConfig = structuredClone(CURRENT_DEMO_CONFIG);
    const permissions = unsafeConfig.app.security.capabilities[0].permissions;
    const removePermission = permissions.find(
      (permission) => permission.identifier === 'fs:allow-remove',
    );
    removePermission.allow.push({ path: '$APPDATA/photos' });
    removePermission.allow.push({ path: '$APPDATA/photos/**' });
    removePermission.deny = [];

    expect(
      inspectFilesystemBoundary(unsafeConfig, permissions, 'Test config'),
    ).toContain(
      'Test config filesystem permission fs:allow-remove must match its reviewed operation scope.',
    );
  });

  it('rejects renderer SQL permissions and direct plugin access', () => {
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
      'Test config must not grant renderer SQL permission sql:default.',
    );
    expect(issues).toContain(
      'Test config must not grant renderer SQL permission sql:allow-load.',
    );
    expect(issues).toContain(
      'Test config must not grant renderer SQL permission sql:allow-close.',
    );
    expect(issues).toContain(
      'Renderer database access must not call the SQL plugin directly.',
    );
    expect(issues).toContain(
      'Renderer reads must use the native database_select command.',
    );
    expect(issues).toContain(
      'Renderer writes must use the native database_execute command.',
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

  it('rejects removal of native database budgets or mutation rollback', () => {
    expect(inspectDatabaseAccessSource('const QUERY_TIMEOUT = 1;')).toEqual(
      expect.arrayContaining([
        'Database boundary marker is missing: MAX_RESULT_ROWS.',
        'Database boundary marker is missing: transaction.rollback().',
        'Database boundary marker is missing: has_parameterized_where.',
      ]),
    );
  });

  it('rejects renderer mutations outside the native generic grammar', () => {
    const issues = inspectRendererDatabaseMutations([
      {
        filePath: 'src/lib/db/unsafe.ts',
        source: `
          execute('UPDATE dogs SET status = 0');
          execute('DELETE FROM dogs WHERE status = 0');
          execute('INSERT INTO dogs (id) SELECT id FROM sales');
          execute('UPDATE sales SET price = ? WHERE id = ?', [1, 'sale-1']);
          execute(buildSql());
        `,
      },
    ]);

    expect(issues).toEqual(expect.arrayContaining([
      'src/lib/db/unsafe.ts:2 must use a parameterized WHERE clause.',
      'src/lib/db/unsafe.ts:3 must use a parameterized WHERE clause.',
      'src/lib/db/unsafe.ts:4 must use a VALUES-only insert or replace.',
      'src/lib/db/unsafe.ts:5 targets a native-workflow-protected table.',
      'src/lib/db/unsafe.ts:6 passes a dynamic SQL expression to execute().',
    ]));
  });
});
