import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SEED_PATH = 'src/lib/db/legacy.ts';
const DEMO_SEED_COMMAND_PATH = 'src-tauri/src/demo_seed.rs';
const DEMO_CONFIG_PATH = 'src-tauri/tauri.demo.conf.json';
const PRODUCTION_CONFIG_PATH = 'src-tauri/tauri.conf.json';
const PRODUCTION_CAPABILITY_PATH = 'src-tauri/capabilities/default.json';
const DATABASE_ACCESS_PATH = 'src-tauri/src/database_access.rs';
const RENDERER_DATABASE_DIRECTORY = 'src/lib/db';
const CONNECTION_PATH = 'src/lib/db/connection.ts';
const SETTINGS_PATH = 'src/pages/SettingsPage.tsx';
const PRODUCTION_IDENTIFIER = 'com.respectabullz.app';
const DEMO_IDENTIFIER = 'com.respectabullz.demo';
const FIXED_DATABASE_URL = 'sqlite:respectabullz.db';
const MANAGED_DIRECTORIES = ['photos', 'contracts', 'documents', 'logs'];
const managedRoots = MANAGED_DIRECTORIES.map(
  (directory) => '$APPDATA/' + directory,
);
const managedDirectChildren = MANAGED_DIRECTORIES.map(
  (directory) => '$APPDATA/' + directory + '/*',
);
const hiddenOrRecursiveManagedPaths = MANAGED_DIRECTORIES.flatMap((directory) => [
  '$APPDATA/' + directory + '/.*',
  '$APPDATA/' + directory + '/*/**',
]);
const protectedManagedPaths = MANAGED_DIRECTORIES.flatMap((directory) => [
  '$APPDATA/' + directory,
  '$APPDATA/' + directory + '/.*',
  '$APPDATA/' + directory + '/*/**',
]);
const REQUIRED_FS_POLICIES = {
  'fs:allow-exists': {
    allow: [...managedRoots, ...managedDirectChildren],
    deny: hiddenOrRecursiveManagedPaths,
  },
  'fs:allow-mkdir': {
    allow: ['$APPDATA/photos', '$APPDATA/contracts', '$APPDATA/logs'],
    deny: [],
  },
  'fs:allow-read-file': {
    allow: [
      '$APPDATA/photos/*',
      '$APPDATA/documents/*',
      '$APPDATA/logs/*',
    ],
    deny: protectedManagedPaths,
  },
  'fs:allow-stat': {
    allow: ['$APPDATA/photos/*'],
    deny: protectedManagedPaths,
  },
  'fs:allow-write-file': {
    allow: ['$APPDATA/photos/*', '$APPDATA/contracts/*', '$APPDATA/logs/*'],
    deny: protectedManagedPaths,
  },
  'fs:allow-remove': {
    allow: ['$APPDATA/photos/*', '$APPDATA/contracts/*', '$APPDATA/logs/*'],
    deny: protectedManagedPaths,
  },
  'fs:allow-rename': {
    allow: ['$APPDATA/photos/*', '$APPDATA/contracts/*', '$APPDATA/logs/*'],
    deny: protectedManagedPaths,
  },
};
const REQUIRED_ASSET_SCOPES = ['$APPDATA/photos/*'];

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

const REQUIRED_DATABASE_BOUNDARY_MARKERS = [
  'QUERY_TIMEOUT',
  'MAX_RESULT_ROWS',
  'MAX_RESPONSE_BYTES',
  'MAX_MUTATION_ROWS',
  'set_progress_handler',
  'max_result_rows.saturating_add(1)',
  'transaction.rollback()',
  'PROTECTED_GENERIC_MUTATION_TABLES',
  'has_parameterized_where',
  'insert and replace statements must use VALUES only',
];

function withoutComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function rendererExecuteStatements(source, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const statements = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'execute' &&
      node.arguments.length > 0
    ) {
      const argument = node.arguments[0];
      let sql;
      if (
        ts.isStringLiteral(argument) ||
        ts.isNoSubstitutionTemplateLiteral(argument)
      ) {
        sql = argument.text;
      } else if (ts.isTemplateExpression(argument)) {
        sql = argument.head.text + argument.templateSpans
          .map((span) => ' __DYNAMIC_SQL_FRAGMENT__ ' + span.literal.text)
          .join('');
      }
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      statements.push({ filePath, line, sql });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return statements;
}

export function inspectRendererDatabaseMutations(sources) {
  const issues = [];
  for (const { filePath, source } of sources) {
    for (const statement of rendererExecuteStatements(source, filePath)) {
      const location = statement.filePath + ':' + statement.line;
      if (statement.sql === undefined) {
        issues.push(location + ' passes a dynamic SQL expression to execute().');
        continue;
      }
      const sql = statement.sql.replace(/\s+/gu, ' ').trim().toUpperCase();
      if (!/^(?:INSERT|REPLACE|UPDATE|DELETE)\b/u.test(sql)) {
        issues.push(location + ' uses a non-DML statement through execute().');
        continue;
      }
      if (/^(?:INSERT|REPLACE)\b/u.test(sql)) {
        if (!/\bVALUES\b/u.test(sql) || /\bSELECT\b/u.test(sql)) {
          issues.push(location + ' must use a VALUES-only insert or replace.');
        }
      } else {
        const whereIndex = sql.lastIndexOf(' WHERE ');
        if (whereIndex < 0 || !sql.slice(whereIndex + 7).includes('?')) {
          issues.push(location + ' must use a parameterized WHERE clause.');
        }
      }
      if (
        /\b(?:INTO|UPDATE|FROM)\s+(?:(?:MAIN|TEMP)\s*\.\s*)?["`\[]?(?:_SCHEMA_VERSION|SALES|SALE_PUPPIES|SQLITE_[A-Z0-9_]*)["`\]]?\b/u.test(sql)
      ) {
        issues.push(location + ' targets a native-workflow-protected table.');
      }
    }
  }
  return issues;
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

  for (const permission of permissions) {
    if (typeof permission === 'string' && permission.startsWith('sql:')) {
      issues.push(label + ' must not grant renderer SQL permission ' + permission + '.');
    }
  }

  if (connectionSource !== undefined) {
    const executableSource = withoutComments(connectionSource);
    if (!executableSource.includes("invoke<T>('database_select'")) {
      issues.push('Renderer reads must use the native database_select command.');
    }
    if (!executableSource.includes("invoke<DatabaseExecuteResult>('database_execute'")) {
      issues.push('Renderer writes must use the native database_execute command.');
    }
    if (
      executableSource.includes('@tauri-apps/plugin-sql') ||
      /\bDatabase\s*\./u.test(executableSource) ||
      /\bdatabase\.close\s*\(/u.test(executableSource)
    ) {
      issues.push('Renderer database access must not call the SQL plugin directly.');
    }
  }

  return issues;
}

export function inspectFilesystemBoundary(config, permissions, label) {
  const issues = [];
  const stringPermissions = permissions.filter(
    (permission) => typeof permission === 'string' && permission.startsWith('fs:'),
  );
  if (
    stringPermissions.length !== 1 ||
    stringPermissions[0] !== 'fs:deny-default'
  ) {
    issues.push(label + ' must keep default filesystem denials and scope every command.');
  }

  const operationPermissions = permissions.filter(
    (permission) =>
      typeof permission === 'object' && permission?.identifier?.startsWith('fs:'),
  );
  const operationNames = operationPermissions.map((permission) => permission.identifier);
  const expectedOperationNames = Object.keys(REQUIRED_FS_POLICIES);
  if (
    operationPermissions.length !== expectedOperationNames.length ||
    JSON.stringify([...operationNames].sort()) !==
      JSON.stringify([...expectedOperationNames].sort())
  ) {
    issues.push(label + ' must grant only the reviewed operation-scoped filesystem commands.');
  }

  for (const [identifier, expected] of Object.entries(REQUIRED_FS_POLICIES)) {
    const matches = operationPermissions.filter(
      (permission) => permission.identifier === identifier,
    );
    const actual = matches[0];
    const allow = (actual?.allow ?? []).map((entry) => entry.path).sort();
    const deny = (actual?.deny ?? []).map((entry) => entry.path).sort();
    if (
      matches.length !== 1 ||
      JSON.stringify(allow) !== JSON.stringify([...expected.allow].sort()) ||
      JSON.stringify(deny) !== JSON.stringify([...expected.deny].sort())
    ) {
      issues.push(
        label + ' filesystem permission ' + identifier +
          ' must match its reviewed operation scope.',
      );
    }
  }

  const assetScopes = config.app?.security?.assetProtocol?.scope ?? [];
  if (
    JSON.stringify([...assetScopes].sort()) !==
    JSON.stringify([...REQUIRED_ASSET_SCOPES].sort())
  ) {
    issues.push(label + ' asset scope must contain only direct managed photo files.');
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
  const capabilities = config.app?.security?.capabilities ?? [];
  const serializedCapabilities = JSON.stringify(capabilities);

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

  if (config.bundle?.active !== false) {
    issues.push('Demo Tauri config must disable bundling so it cannot be mistaken for a release artifact.');
  }

  const demoPermissions = capabilities[0]?.permissions ?? [];
  issues.push(...inspectFilesystemBoundary(config, demoPermissions, 'Demo Tauri config'));
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

export function inspectDatabaseAccessSource(source) {
  return REQUIRED_DATABASE_BOUNDARY_MARKERS
    .filter((marker) => !source.includes(marker))
    .map((marker) => 'Database boundary marker is missing: ' + marker + '.');
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
  const databaseAccessPath = path.join(root, DATABASE_ACCESS_PATH);
  const databaseAccessSource = fs.readFileSync(databaseAccessPath, 'utf8');
  const rendererDatabaseDirectory = path.join(root, RENDERER_DATABASE_DIRECTORY);
  const rendererDatabaseSources = fs.readdirSync(rendererDatabaseDirectory, {
    withFileTypes: true,
  })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.ts') &&
        // legacy.ts only collects deterministic fixture statements for the
        // typed, debug-only apply_demo_seed command; it does not invoke the
        // generic database_execute boundary.
        entry.name !== 'legacy.ts',
    )
    .map((entry) => {
      const filePath = path.join(rendererDatabaseDirectory, entry.name);
      return {
        filePath: path.relative(root, filePath).replaceAll('\\', '/'),
        source: fs.readFileSync(filePath, 'utf8'),
      };
    });
  const connectionPath = path.join(root, CONNECTION_PATH);
  const connectionSource = fs.readFileSync(connectionPath, 'utf8');
  const settingsPath = path.join(root, SETTINGS_PATH);
  const settingsSource = fs.readFileSync(settingsPath, 'utf8');
  const issues = [
    ...inspectDemoSeedSource(source),
    ...inspectDemoSeedCommandSource(demoSeedCommandSource),
    ...inspectDemoUiSource(settingsSource),
    ...inspectDemoConfig(demoConfig),
    ...inspectFilesystemBoundary(
      productionConfig,
      productionCapability.permissions ?? [],
      'Production Tauri config',
    ),
    ...inspectSqlBoundary(
      productionConfig,
      productionCapability.permissions ?? [],
      connectionSource,
      'Production Tauri config',
    ),
    ...inspectDatabaseAccessSource(databaseAccessSource),
    ...inspectRendererDatabaseMutations(rendererDatabaseSources),
  ];

  return {
    sourcePath,
    demoConfigPath,
    demoSeedCommandPath,
    productionConfigPath,
    productionCapabilityPath,
    databaseAccessPath,
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
      'Demo-data check passed: deterministic fixtures use reserved contacts and synthetic animal IDs, refuse existing user-created records, run under a dedicated Tauri identity, and access the fixed SQLite pool only through native Rust commands.',
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
