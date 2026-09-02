import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import process from 'node:process';

const dir = '.diagnostics';
await mkdir(dir, { recursive: true });

const report = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  hostname: os.hostname(),
  cpuCount: os.cpus().length,
  memoryBytes: os.totalmem(),
  cwd: process.cwd(),
  runner: {
    name: process.env.RUNNER_NAME ?? '',
    os: process.env.RUNNER_OS ?? '',
    arch: process.env.RUNNER_ARCH ?? '',
    runId: process.env.GITHUB_RUN_ID ?? '',
    sha: process.env.GITHUB_SHA ?? '',
  },
};

await writeFile(`${dir}/report.json`, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await writeFile(`${dir}/report.txt`, [
  `generatedAt=${report.generatedAt}`,
  `node=${report.node}`,
  `platform=${report.platform}`,
  `arch=${report.arch}`,
  `hostname=${report.hostname}`,
  `cpuCount=${report.cpuCount}`,
  `runnerName=${report.runner.name}`,
  `runnerOS=${report.runner.os}`,
  `runnerArch=${report.runner.arch}`,
  `runId=${report.runner.runId}`,
  `sha=${report.runner.sha}`,
].join('\n') + '\n', 'utf8');

console.log(JSON.stringify(report, null, 2));
