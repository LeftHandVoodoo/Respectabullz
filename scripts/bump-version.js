#!/usr/bin/env node

/**
 * Version Bump Script for Respectabullz
 * 
 * Usage:
 *   node scripts/bump-version.js [major|minor|patch]
 *   node scripts/bump-version.js 1.2.3
 * 
 * Updates version in:
 *   - VERSION
 *   - package.json
 *   - src-tauri/tauri.conf.json
 *   - src-tauri/Cargo.toml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Files to update
const VERSION_FILE = path.join(ROOT, 'VERSION');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const TAURI_CONF = path.join(ROOT, 'src-tauri', 'tauri.conf.json');
const CARGO_TOML = path.join(ROOT, 'src-tauri', 'Cargo.toml');
const VERSION_TS = path.join(ROOT, 'src', 'lib', 'version.ts');

function readVersion() {
  return fs.readFileSync(VERSION_FILE, 'utf-8').trim();
}

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function bumpVersion(current, type) {
  const { major, minor, patch } = parseVersion(current);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      // Assume it's a specific version
      parseVersion(type); // Validate format
      return type;
  }
}

function updateVersionFile(newVersion) {
  fs.writeFileSync(VERSION_FILE, newVersion + '\n');
  console.log(`  Updated VERSION to ${newVersion}`);
}

function updatePackageJson(newVersion) {
  const content = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  content.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(content, null, 2) + '\n');
  console.log(`  Updated package.json to ${newVersion}`);
}

function updateTauriConf(newVersion) {
  const content = JSON.parse(fs.readFileSync(TAURI_CONF, 'utf-8'));
  content.version = newVersion;
  fs.writeFileSync(TAURI_CONF, JSON.stringify(content, null, 2) + '\n');
  console.log(`  Updated tauri.conf.json to ${newVersion}`);
}

function updateCargoToml(newVersion) {
  let content = fs.readFileSync(CARGO_TOML, 'utf-8');
  content = content.replace(
    /^version = "[\d.]+"$/m,
    `version = "${newVersion}"`
  );
  fs.writeFileSync(CARGO_TOML, content);
  console.log(`  Updated Cargo.toml to ${newVersion}`);
}

function updateVersionTs(newVersion) {
  const content = `// Version constant - updated by bump-version script
// This file is auto-generated, do not edit manually
export const VERSION = '${newVersion}';
`;
  fs.writeFileSync(VERSION_TS, content);
  console.log(`  Updated src/lib/version.ts to ${newVersion}`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/bump-version.js [major|minor|patch|x.y.z]');
    console.log('');
    console.log('Current version:', readVersion());
    process.exit(0);
  }
  
  const type = args[0];
  const currentVersion = readVersion();
  const newVersion = bumpVersion(currentVersion, type);
  
  console.log(`Bumping version from ${currentVersion} to ${newVersion}`);
  console.log('');
  
  updateVersionFile(newVersion);
  updatePackageJson(newVersion);
  updateTauriConf(newVersion);
  updateCargoToml(newVersion);
  updateVersionTs(newVersion);
  
  console.log('');
  console.log('Done! Remember to:');
  console.log('  1. Update CHANGELOG.md');
  console.log('  2. Commit: git commit -am "' + newVersion + '"');
  console.log('  3. Tag: git tag v' + newVersion);
}

main();

