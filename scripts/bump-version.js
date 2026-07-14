#!/usr/bin/env node

/**
 * Update every release-version source used by Respectabullz.
 *
 * Usage:
 *   node scripts/bump-version.js [major|minor|patch]
 *   node scripts/bump-version.js 1.2.3
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

const FILES = {
  version: 'VERSION',
  packageJson: 'package.json',
  packageLock: 'package-lock.json',
  tauriConfig: 'src-tauri/tauri.conf.json',
  cargoToml: 'src-tauri/Cargo.toml',
  cargoLock: 'src-tauri/Cargo.lock',
  sourceVersion: 'src/lib/version.ts',
  envExample: '.env.example',
};

function readText(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function formatJson(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

function requireReplacement(original, updated, source) {
  if (updated === original) {
    throw new Error('Could not update the version in ' + source + '.');
  }
  return updated;
}

export function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error('Invalid version format: ' + version);
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  };
}

export function bumpVersion(current, type) {
  const { major, minor, patch } = parseVersion(current);

  switch (type) {
    case 'major':
      return String(major + 1) + '.0.0';
    case 'minor':
      return major + '.' + String(minor + 1) + '.0';
    case 'patch':
      return major + '.' + minor + '.' + String(patch + 1);
    default:
      parseVersion(type);
      return type;
  }
}

function updateCargoToml(contents, newVersion) {
  const lines = contents.split(/\r?\n/);
  let inPackageSection = false;
  let replaced = false;

  for (let index = 0; index < lines.length; index += 1) {
    const section = lines[index].match(/^\s*\[([^\]]+)\]\s*$/);
    if (section) {
      inPackageSection = section[1] === 'package';
      continue;
    }

    if (inPackageSection) {
      const versionLine = lines[index].match(
        /^(\s*version\s*=\s*)"[^"]+"(\s*)$/,
      );
      if (versionLine) {
        lines[index] =
          versionLine[1] + '"' + newVersion + '"' + versionLine[2];
        replaced = true;
        break;
      }
    }
  }

  if (!replaced) {
    throw new Error('Could not update [package].version in src-tauri/Cargo.toml.');
  }

  const endOfLine = contents.includes('\r\n') ? '\r\n' : '\n';
  return lines.join(endOfLine);
}

function updateCargoLock(contents, newVersion) {
  const blocks = contents.split(/(?=^\[\[package\]\]\s*$)/m);
  const packageIndex = blocks.findIndex((block) =>
    /^\s*name\s*=\s*"respectabullz"\s*$/m.test(block),
  );

  if (packageIndex < 0) {
    throw new Error(
      'Could not find the respectabullz package in src-tauri/Cargo.lock.',
    );
  }

  const updatedBlock = blocks[packageIndex].replace(
    /^(\s*version\s*=\s*)"[^"]+"(\s*)$/m,
    '$1"' + newVersion + '"$2',
  );
  blocks[packageIndex] = requireReplacement(
    blocks[packageIndex],
    updatedBlock,
    'src-tauri/Cargo.lock',
  );

  return blocks.join('');
}

function updateSourceVersion(contents, newVersion) {
  const updated = contents.replace(
    /(export\s+const\s+VERSION\s*=\s*['"])[^'"]+(['"])/,
    '$1' + newVersion + '$2',
  );
  return requireReplacement(
    contents,
    updated,
    'src/lib/version.ts',
  );
}

function updateEnvExample(contents, newVersion) {
  const updated = contents.replace(
    /^(\s*VITE_APP_VERSION\s*=\s*)(["']?)[^"'#\s]+(["']?)(\s*(?:#.*)?)$/m,
    (_line, prefix, openingQuote, closingQuote, suffix) =>
      prefix +
      openingQuote +
      newVersion +
      (closingQuote || openingQuote) +
      suffix,
  );
  return requireReplacement(contents, updated, '.env.example');
}

export function buildUpdatedFiles(root, newVersion) {
  parseVersion(newVersion);

  const packageJson = JSON.parse(readText(root, FILES.packageJson));
  packageJson.version = newVersion;

  const packageLock = JSON.parse(readText(root, FILES.packageLock));
  if (!packageLock.packages?.['']) {
    throw new Error('package-lock.json is missing the root package entry.');
  }
  packageLock.version = newVersion;
  packageLock.packages[''].version = newVersion;

  const tauriConfig = JSON.parse(readText(root, FILES.tauriConfig));
  tauriConfig.version = newVersion;

  return new Map([
    [FILES.version, newVersion + '\n'],
    [FILES.packageJson, formatJson(packageJson)],
    [FILES.packageLock, formatJson(packageLock)],
    [FILES.tauriConfig, formatJson(tauriConfig)],
    [
      FILES.cargoToml,
      updateCargoToml(readText(root, FILES.cargoToml), newVersion),
    ],
    [
      FILES.cargoLock,
      updateCargoLock(readText(root, FILES.cargoLock), newVersion),
    ],
    [
      FILES.sourceVersion,
      updateSourceVersion(readText(root, FILES.sourceVersion), newVersion),
    ],
    [
      FILES.envExample,
      updateEnvExample(readText(root, FILES.envExample), newVersion),
    ],
  ]);
}

export function updateRepositoryVersion(
  root,
  newVersion,
  { log = console.log } = {},
) {
  const updatedFiles = buildUpdatedFiles(root, newVersion);

  for (const [relativePath, contents] of updatedFiles) {
    fs.writeFileSync(path.join(root, relativePath), contents, 'utf8');
    log('  Updated ' + relativePath + ' to ' + newVersion);
  }

  return [...updatedFiles.keys()];
}

function readVersion(root = DEFAULT_ROOT) {
  return readText(root, FILES.version).trim();
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/bump-version.js [major|minor|patch|x.y.z]');
    console.log('');
    console.log('Current version:', readVersion());
    return;
  }

  const type = args[0];
  const currentVersion = readVersion();
  const newVersion = bumpVersion(currentVersion, type);

  console.log(
    'Bumping version from ' + currentVersion + ' to ' + newVersion,
  );
  console.log('');

  updateRepositoryVersion(DEFAULT_ROOT, newVersion);

  console.log('');
  console.log('Updated 9 version sources across 8 files.');
  console.log('Remember to update CHANGELOG.md before release.');
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]).toLowerCase() === path.resolve(SCRIPT_PATH).toLowerCase();

if (isMain) {
  main();
}
