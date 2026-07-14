import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');

const BUILT_IN_PATTERNS = [
  {
    label: 'VITE_GITHUB_TOKEN marker',
    pattern: /VITE_GITHUB_TOKEN/u,
  },
  {
    label: 'GitHub fine-grained token shape',
    pattern: /github_pat_[A-Za-z0-9_]{20,}/u,
  },
  {
    label: 'GitHub classic token shape',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/u,
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^{}$()|[\]\\]/g, '\\$&');
}

export function scanBuffer(buffer, { sentinel = '' } = {}) {
  const contents = buffer.toString('latin1');
  const patterns = [...BUILT_IN_PATTERNS];

  if (sentinel) {
    patterns.push({
      label: 'configured build sentinel',
      pattern: new RegExp(escapeRegExp(sentinel), 'u'),
    });
  }

  return patterns
    .filter(({ pattern }) => pattern.test(contents))
    .map(({ label }) => label);
}

async function collectFiles(inputPath) {
  const metadata = await fs.lstat(inputPath);

  if (metadata.isSymbolicLink()) {
    return [];
  }

  if (metadata.isFile()) {
    return [inputPath];
  }

  if (!metadata.isDirectory()) {
    return [];
  }

  const entries = await fs.readdir(inputPath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map((entry) => collectFiles(path.join(inputPath, entry.name))),
  );

  return nestedFiles.flat();
}

export async function scanPaths(
  inputs,
  { sentinel = process.env.BUILD_SECRET_SENTINEL ?? '' } = {},
) {
  if (!inputs.length) {
    throw new Error('At least one build artifact path is required.');
  }

  const resolvedInputs = inputs.map((input) => path.resolve(input));
  const files = (
    await Promise.all(
      resolvedInputs.map(async (input) => {
        try {
          return await collectFiles(input);
        } catch (error) {
          if (error && typeof error === 'object' && error.code === 'ENOENT') {
            throw new Error('Build artifact path does not exist: ' + input);
          }

          throw error;
        }
      }),
    )
  )
    .flat()
    .sort((left, right) => left.localeCompare(right));

  if (!files.length) {
    throw new Error('No build artifact files were found in the supplied paths.');
  }

  const findings = [];
  for (const file of files) {
    const labels = scanBuffer(await fs.readFile(file), { sentinel });
    if (labels.length) {
      findings.push({ file, labels });
    }
  }

  return { filesScanned: files.length, findings };
}

async function runCli() {
  const inputs = process.argv.slice(2);
  const artifactPaths = inputs.length ? inputs : [path.join(DEFAULT_ROOT, 'dist')];

  try {
    const result = await scanPaths(artifactPaths);
    if (result.findings.length) {
      for (const finding of result.findings) {
        const displayPath = path.relative(process.cwd(), finding.file) || finding.file;
        console.error(
          'Potential build secret detected in ' +
            displayPath +
            ' (' +
            finding.labels.join(', ') +
            ').',
        );
      }

      process.exitCode = 1;
      return;
    }

    console.log(
      'Build secret scan passed: ' +
        result.filesScanned +
        ' artifact files contained no configured token markers.',
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
  await runCli();
}
