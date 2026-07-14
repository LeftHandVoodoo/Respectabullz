import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function readText(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(root, relativePath) {
  return JSON.parse(readText(root, relativePath));
}

function requireCapturedValue(contents, pattern, source) {
  const match = contents.match(pattern);
  if (!match) {
    throw new Error('Could not find a version in ' + source + '.');
  }

  return match[1].trim();
}

function parseCargoPackageVersion(contents, source) {
  let inPackageSection = false;

  for (const line of contents.split(/\r?\n/)) {
    const section = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (section) {
      inPackageSection = section[1] === 'package';
      continue;
    }

    if (inPackageSection) {
      const version = line.match(/^\s*version\s*=\s*"([^"]+)"\s*$/);
      if (version) {
        return version[1];
      }
    }
  }

  throw new Error('Could not find [package].version in ' + source + '.');
}

function parseCargoLockVersion(contents, source) {
  const packageBlock = contents
    .split(/(?=^\[\[package\]\]\s*$)/m)
    .find((block) => /^\s*name\s*=\s*"respectabullz"\s*$/m.test(block));

  if (!packageBlock) {
    throw new Error('Could not find the respectabullz package in ' + source + '.');
  }

  return requireCapturedValue(
    packageBlock,
    /^\s*version\s*=\s*"([^"]+)"\s*$/m,
    source,
  );
}

export function collectVersions(root = DEFAULT_ROOT) {
  const packageJson = readJson(root, 'package.json');
  const packageLock = readJson(root, 'package-lock.json');
  const cargoToml = readText(root, 'src-tauri/Cargo.toml');
  const cargoLock = readText(root, 'src-tauri/Cargo.lock');
  const tauriConfig = readJson(root, 'src-tauri/tauri.conf.json');
  const sourceVersion = readText(root, 'src/lib/version.ts');
  const envExample = readText(root, '.env.example');

  return [
    {
      source: 'VERSION',
      version: readText(root, 'VERSION').trim(),
    },
    {
      source: 'package.json#version',
      version: String(packageJson.version ?? ''),
    },
    {
      source: 'package-lock.json#version',
      version: String(packageLock.version ?? ''),
    },
    {
      source: 'package-lock.json#packages[""].version',
      version: String(packageLock.packages?.['']?.version ?? ''),
    },
    {
      source: 'src-tauri/Cargo.toml#[package].version',
      version: parseCargoPackageVersion(cargoToml, 'src-tauri/Cargo.toml'),
    },
    {
      source: 'src-tauri/Cargo.lock#respectabullz.version',
      version: parseCargoLockVersion(cargoLock, 'src-tauri/Cargo.lock'),
    },
    {
      source: 'src-tauri/tauri.conf.json#version',
      version: String(tauriConfig.version ?? ''),
    },
    {
      source: 'src/lib/version.ts#VERSION',
      version: requireCapturedValue(
        sourceVersion,
        /export\s+const\s+VERSION\s*=\s*['"]([^'"]+)['"]/,
        'src/lib/version.ts',
      ),
    },
    {
      source: '.env.example#VITE_APP_VERSION',
      version: requireCapturedValue(
        envExample,
        /^\s*VITE_APP_VERSION\s*=\s*["']?([^"'#\s]+)["']?\s*(?:#.*)?$/m,
        '.env.example',
      ),
    },
  ];
}

export function checkVersions(root = DEFAULT_ROOT) {
  const entries = collectVersions(root);
  const canonical = entries.find((entry) => entry.source === 'VERSION')?.version ?? '';
  const mismatches = entries.filter((entry) => entry.version !== canonical);

  return {
    canonical,
    entries,
    mismatches,
    validSemver: SEMVER_PATTERN.test(canonical),
    ok: mismatches.length === 0 && SEMVER_PATTERN.test(canonical),
  };
}

function runCli() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;

  try {
    const result = checkVersions(root);

    if (!result.validSemver) {
      console.error('VERSION is not a valid semantic version.');
    }

    for (const mismatch of result.mismatches) {
      console.error(
        'Version mismatch: ' +
          mismatch.source +
          ' is ' +
          mismatch.version +
          '; expected ' +
          result.canonical +
          '.',
      );
    }

    if (!result.ok) {
      process.exitCode = 1;
      return;
    }

    console.log(
      'Version check passed: ' +
        result.canonical +
        ' is consistent across ' +
        result.entries.length +
        ' sources.',
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
