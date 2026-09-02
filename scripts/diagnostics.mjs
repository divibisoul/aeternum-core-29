#!/usr/bin/env node
/**
 * Aeternum Core N01 - execution diagnostics
 *
 * Collects reproducible runner/project facts without exposing secret values.
 * The workflow owns artifact upload; this script owns deterministic collection.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, '.diagnostics');
fs.mkdirSync(outDir, { recursive: true });

function run(command, args = []) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30_000,
      maxBuffer: 4 * 1024 * 1024,
    }).trimEnd();
  } catch (error) {
    const stdout = error.stdout?.toString() ?? '';
    const stderr = error.stderr?.toString() ?? '';
    return `[command failed: ${command} ${args.join(' ')}]\nexit=${error.status ?? 'unknown'}\n${stdout}${stderr}`.trimEnd();
  }
}

function write(name, content) {
  fs.writeFileSync(path.join(outDir, name), `${content}\n`, 'utf8');
}

const envNames = Object.keys(process.env).sort();
const safeEnv = Object.fromEntries(
  envNames.map((name) => [name, name.toLowerCase().includes('token') || name.toLowerCase().includes('secret') || name.toLowerCase().includes('key') || name.toLowerCase().includes('password') ? '[REDACTED]' : process.env[name]])
);

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const files = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'eslint.config.js',
  '.github/workflows',
  'scripts',
  'src',
];

const report = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  npm: run('npm', ['--version']),
  platform: process.platform,
  arch: process.arch,
  os: {
    type: os.type(),
    release: os.release(),
    version: os.version(),
    hostname: os.hostname(),
    cpus: os.cpus().length,
    memoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    loadAverage: os.loadavg(),
  },
  cwd: root,
  package: {
    name: packageJson.name,
    version: packageJson.version,
    packageManager: packageJson.packageManager ?? null,
    scripts: packageJson.scripts ?? {},
  },
  environment: safeEnv,
};

write('environment.json', JSON.stringify(report, null, 2));
write('node-version.txt', `${process.version}\nnpm=${report.npm}`);
write('disk.txt', run('df', ['-hT']));
write('memory.txt', run('free', ['-h']));
write('system.txt', `${run('uname', ['-a'])}\n\n${run('cat', ['/etc/os-release'])}`);
write('processes.txt', run('ps', ['-ef']));
write('git-status.txt', `${run('git', ['status', '--short', '--branch'])}\n\n${run('git', ['log', '-10', '--oneline', '--decorate'])}`);
write('npm-config.txt', run('npm', ['config', 'list', '--location=project']));
write('npm-tree.txt', run('npm', ['ls', '--depth=0']));
write('environment-names.txt', `${envNames.join('\n')}\n`);

for (const relative of files) {
  const target = path.join(root, relative);
  if (!fs.existsSync(target)) {
    write(`missing-${relative.replaceAll('/', '-')}.txt`, `MISSING: ${relative}`);
    continue;
  }
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    write(`file-${relative.replaceAll('/', '-')}.txt`, fs.readFileSync(target, 'utf8').slice(0, 200_000));
  } else if (stat.isDirectory()) {
    write(`tree-${relative.replaceAll('/', '-')}.txt`, run('find', [relative, '-maxdepth', '3', '-type', 'f', '-print']));
  }
}

console.log(`Diagnostics written to ${outDir}`);
console.log(`Collected ${Object.keys(report.environment).length} environment variable names; sensitive values were redacted.`);
