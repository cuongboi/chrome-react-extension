import { $ } from 'bun';
import chalk from 'chalk';
import { watch, type FSWatcher } from 'fs';
import path from 'path';
import { parseArgs } from 'util';

import './cwd';
import { server, CHANNEL } from './server';

const BUILD_SCRIPT = 'config/build.ts';
const DEFAULT_DIR = './';

interface CliArgs {
  dir?: string;
}

const getDirectoriesToWatch = (dir?: string): string[] =>
  dir?.split(',').map((d) => `${DEFAULT_DIR}${d.trim()}`) || [];

const logMessage = (message: string, color = chalk.bold) =>
  console.log(color(message));

const runBuild = async (): Promise<void> => {
  try {
    await $`bun run ${BUILD_SCRIPT}`;
    logMessage('✔️ Updated build files', chalk.bold.green);
  } catch (error) {
    if (error instanceof Error) {
      logMessage(`Build failed: ${error.message}`, chalk.bold.red);
    }
  }
};

class DirectoryWatcher {
  private watchers: FSWatcher[] = [];

  constructor(private directories: string[]) {}

  async startWatching(): Promise<void> {
    await runBuild();
    this.setupWatchers();
    logMessage(this.getWatchMessage());
  }

  private getWatchMessage(): string {
    const dirs = this.directories.join(', ');
    return `Watching ${dirs} directories for changes...`;
  }

  private setupWatchers(): void {
    this.watchers = this.directories.map((dir) =>
      watch(dir, { recursive: true }, async (_, filename) => {
        logMessage(`Changes detected in ${filename}`, chalk.bold.yellow.dim);
        await runBuild();
        server.publish(CHANNEL, process.env.CHROME_EXTENSION_ID as string);
        logMessage(this.getWatchMessage());
      }),
    );
  }

  cleanup(): void {
    this.watchers.forEach((watcher) => watcher.close());
  }
}

const main = async (): Promise<void> => {
  const {
    values: { dir },
  } = parseArgs({
    args: Bun.argv,
    strict: true,
    allowPositionals: true,
    options: { dir: { type: 'string' } },
  }) as { values: CliArgs };

  const directories = getDirectoriesToWatch(dir);

  if (!directories.length) {
    logMessage('No directories specified to watch', chalk.bold.red);
    process.exit(1);
  }

  const packagesDir = path.resolve(process.cwd(), 'packages');

  const watcher = new DirectoryWatcher([...directories, packagesDir]);
  await watcher.startWatching();

  process.on('SIGINT', () => {
    watcher.cleanup();
    process.exit(0);
  });
};

main().catch((error) => {
  logMessage(`Error: ${error.message}`, chalk.bold.red);
  process.exit(1);
});
