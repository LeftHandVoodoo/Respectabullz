import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SEED_PATH = 'src/lib/db/legacy.ts';
const DEMO_SEED_COMMAND_PATH = 'src-tauri/src/demo_seed.rs';
const DEMO_CONFIG_PATH = 'src-tauri/tauri.demo.conf.json';
const PRODUCTION_CONFIG_PATH = 'src-tauri/tauri.conf.json';
const PRODUCTION_CAPABILITY_PATH = 'src-tauri/capabilities/default.json';
const CONNECTION_PATH = 'src/lib/db/connection.ts';
const SETTINGS_PATH = 'src/pages/SettingsPage.tsx';
const PRODUCTION_IDENTIFIER = 'com.respectabullz.app';
const DEMO_IDENTIFIER = 'com.respectabullz.demo';
const FIXED_DATABASE_URL = 'sqlite:respectabullz.db';
const REQUIRED_SQL_PERMISSIONS = ['sql:allow-execute', 'sql:allow-select'];
const FORBIDDEN_SQL_PERMISSIONS = ['sql:default', 'sql:allow-load', 'sql:allow-close'];

const REQUIRED_SAFETY_MARKERS = [
  "new Date('2026-07-14T12:00:00.000Z')",
  'let seedId = 0',
  'const generateId = () =>',
  "padStart(5, '0')",
  'SELECT name FROM sqlite_master',
  "name NOT LIKE 'sqlite_%'",
  "name <> '_schema_version'",
  'for (const { name } of applicationTables)',
  'SELECT COUNT(*) AS count',
  'Development sample data requires no user-created records',
  'const seedStatements:',
  "invoke('apply_demo_seed'",
];

const REQUIRED_TRANSACTION_MARKERS = [
  'MAX_DEMO_STATEMENTS',
  'ALLOWED_INSERT_TABLES',
  'DEMO_APP_IDENTIFIER',
  'cfg!(debug_assertions)',
  'if !debug_build',
  'app.config().identifier',
  'assert_database_is_empty',
  'begin_with("BEGIN IMMEDIATE")',
  'PRAGMA foreign_key_check',
  '.commit()',
  '.rollback()',
];

const REQUIRED_UI_IDENTITY_MARKERS = [
  "const DEMO_APP_IDENTIFIER = 'com.respectabullz.demo'",
  'getIdentifier()',
  'identifier === DEMO_APP_IDENTIFIER',
  '{isSyntheticDemo && (',
];

function withoutComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

export function inspectSqlBoundary(config, permissions, connectionSource, label) {
  const issues = [];
  const preloaded = config.plugins?.sql?.preload ?? [];

  if (
    !Array.isArray(preloaded) ||
    preloaded.length !== 1 ||
    preloaded[0] !== FIXED_DATABASE_URL
  ) {
    issues.push(label + ' must preload only ' + FIXED_DATABASE_URL + '.');
  }

  for (const permission of REQUIRED_SQL_PERMISSIONS) {
    if (!permissions.includes(permission)) {
      issues.push(label + ' is missing required permission ' + permission + '.');
    }
  }

  for (const permission of FORBIDDEN_SQL_PERMISSIONS) {
    if (permissions.includes(permission)) {
      issues.push(label + ' must not grant renderer permission ' + permission + '.');
    }
  }

  if (connectionSource !== undefined) {
    const executableSource = withoutComments(connectionSource);
    if (!executableSource.includes('Database.get(DB_NAME)')) {
      issues.push('Renderer database access must retrieve the fixed pool with Database.get.');
    }
    if (/\bDatabase\.load\s*\(/u.test(executableSource)) {
      issues.push('Renderer database access must not load arbitrary SQLite pools.');
    }
    if (/\bdatabase\.close\s*\(/u.test(executableSource)) {
      issues.push('Renderer database access must not close the Rust-owned pool.');
    }
  }

  return issues;
}

export function inspectDemoSeedSource(source) {
  const issues = [];
  const seedStart = source.indexOf('export async function seedDatabase');

  if (seedStart < 0) {
    return ['The seedDatabase implementation could not be found.'];
  }

  const seedSource = source.slice(seedStart);
  const executableSeedSource = withoutComments(seedSource);

  if (/\bclearDatabase\s*\(/u.test(executableSeedSource)) {
    issues.push('seedDatabase must not call clearDatabase.');
  }

  for (const marker of REQUIRED_SAFETY_MARKERS) {
    if (!seedSource.includes(marker)) {
      issues.push('Seed safety marker is missing: ' + marker + '.');
    }
  }

  if (!seedSource.includes('demo-')) {
    issues.push('Deterministic demo-prefixed IDs are missing.');
  }

  if (!seedSource.includes('DEMO-REG-') || !seedSource.includes('DEMO-CHIP-')) {
    issues.push('Clearly synthetic animal registration and microchip fixtures are missing.');
  }

  if (/\b(?:ABKC|UKC)-/iu.test(seedSource)) {
    issues.push('Seed animal identifiers must not resemble a real registry number.');
  }

  if (/\b\d{15}\b/u.test(seedSource)) {
    issues.push('Seed animal identifiers must not contain a real-looking 15-digit microchip number.');
  }

  const emails = [
    ...seedSource.matchAll(/\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/giu),
  ];
  if (!emails.length) {
    issues.push('No seed contact-email fixtures were found.');
  }

  for (const email of emails) {
    const domain = email[1].toLowerCase();
    if (!domain.endsWith('.test')) {
      issues.push('Seed contact email uses a non-reserved domain: ' + domain + '.');
    }
  }

  const phones = seedSource.match(/\b\d{3}-\d{3}-\d{4}\b/gu) ?? [];
  if (!phones.length) {
    issues.push('No seed phone fixtures were found.');
  }

  for (const phone of phones) {
    if (!/^202-555-01\d{2}$/u.test(phone)) {
      issues.push('Seed phone is outside the reserved 202-555-01xx range: ' + phone + '.');
    }
  }

  return [...new Set(issues)];
}

export function inspectDemoConfig(config) {
  const issues = [];
  const windowTitle = config.app?.windows?.[0]?.title ?? '';
  const assetScopes = config.app?.security?.assetProtocol?.scope ?? [];
  const capabilities = config.app?.security?.capabilities ?? [];
  const serializedCapabilities = JSON.stringify(capabilities);
  const capabilityPaths = capabilities.flatMap((capability) =>
    (capability?.permissions ?? []).flatMap((permission) =>
      typeof permission === 'object'
        ? (permission.allow ?? []).map((entry) => entry.path)
        : []
    )
  );

  if (config.identifier !== DEMO_IDENTIFIER) {
    issues.push('Demo Tauri config must use the dedicated ' + DEMO_IDENTIFIER + ' identifier.');
  }

  if (!/synthetic portfolio demo/iu.test(windowTitle)) {
    issues.push('Demo window title must visibly identify the synthetic portfolio fixture.');
  }

  if (!Array.isArray(capabilities) || capabilities.length !== 1) {
    issues.push('Demo Tauri config must replace production capabilities with one inline demo capability.');
  }

  if (serializedCapabilities.includes(PRODUCTION_IDENTIFIER)) {
    issues.push('Demo capabilities must not grant the production application-data directory.');
  }

  if (
    capabilityPaths.length !== 3 ||
    capabilityPaths.some((scopePath) => scopePath !== '$APPDATA/**')
  ) {
    issues.push('Demo filesystem scopes must be limited to the identifier-resolved $APPDATA directory.');
  }

  if (
    assetScopes.length !== 1 ||
    assetScopes[0] !== '$APPDATA/**'
  ) {
    issues.push('Demo asset protocol scope must be limited to the identifier-resolved $APPDATA directory.');
  }

  if (config.bundle?.active !== false) {
    issues.push('Demo Tauri config must disable bundling so it cannot be mistaken for a release artifact.');
  }

  const demoPermissions = capabilities[0]?.permissions ?? [];
  issues.push(...inspectSqlBoundary(config, demoPermissions, undefined, 'Demo Tauri config'));

  return issues;
}

export function inspectDemoSeedCommandSource(source) {
  return REQUIRED_TRANSACTION_MARKERS
    .filter((marker) => !source.includes(marker))
    .map((marker) => 'Demo transaction safety marker is missing: ' + marker + '.');
}

export function inspectDemoUiSource(source) {
  return REQUIRED_UI_IDENTITY_MARKERS
    .filter((marker) => !source.includes(marker))
    .map((marker) => 'Demo UI identity marker is missing: ' + marker + '.');
}

export function checkDemoData(root = DEFAULT_ROOT) {
  const sourcePath = path.join(root, SEED_PATH);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const demoSeedCommandPath = path.join(root, DEMO_SEED_COMMAND_PATH);
  const demoSeedCommandSource = fs.readFileSync(demoSeedCommandPath, 'utf8');
  const demoConfigPath = path.join(root, DEMO_CONFIG_PATH);
  const demoConfig = JSON.parse(fs.readFileSync(demoConfigPath, 'utf8'));
  const productionConfigPath = path.join(root, PRODUCTION_CONFIG_PATH);
  const productionConfig = JSON.parse(fs.readFileSync(productionConfigPath, 'utf8'));
  const productionCapabilityPath = path.join(root, PRODUCTION_CAPABILITY_PATH);
  const productionCapability = JSON.parse(fs.readFileSync(productionCapabilityPath, 'utf8'));
  const connectionPath = path.join(root, CONNECTION_PATH);
  const connectionSource = fs.readFileSync(connectionPath, 'utf8');
  const settingsPath = path.join(root, SETTINGS_PATH);
  const settingsSource = fs.readFileSync(settingsPath, 'utf8');
  const issues = [
    ...inspectDemoSeedSource(source),
    ...inspectDemoSeedCommandSource(demoSeedCommandSource),
    ...inspectDemoUiSource(settingsSource),
    ...inspectDemoConfig(demoConfig),
    ...inspectSqlBoundary(
      productionConfig,
      productionCapability.permissions ?? [],
      connectionSource,
      'Production Tauri config',
    ),
  ];

  return {
    sourcePath,
    demoConfigPath,
    demoSeedCommandPath,
    productionConfigPath,
    productionCapabilityPath,
    connectionPath,
    settingsPath,
    issues,
    ok: issues.length === 0,
  };
}

function runCli() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;

  try {
    const result = checkDemoData(root);
    if (!result.ok) {
      for (const issue of result.issues) {
        console.error('Demo-data check failed: ' + issue);
      }
      process.exitCode = 1;
      return;
    }

    console.log(
      'Demo-data check passed: deterministic fixtures use reserved contacts and synthetic animal IDs, refuse existing user-created records, run under a dedicated Tauri identity, and can access only the fixed Rust-preloaded SQLite pool.',
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]).toLowerCase() === path.resolve(SCRIPT_PATH).toLowerCase();

if (isMain) {
  runCli();
}
