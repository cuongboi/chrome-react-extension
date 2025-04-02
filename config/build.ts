import { $, Glob } from 'bun';
import path from 'path';

import components from '../components.json';
import './cwd';

const CWD = process.cwd();
const OUT_DIR = path.resolve(CWD, 'build');
const PUBLIC_DIR = path.resolve(CWD, 'public');
const TAILWIND_INPUT = path.resolve(CWD, components.tailwind.css);
const TAILWIND_OUTPUT = path.resolve(CWD, OUT_DIR, 'main.css');
const FILE_EXTENSIONS = {
  html: '.html',
  png: '.png',
  css: '.css',
} as const;

const entrypoints = ['index.tsx', 'background.ts'];

const resolveEntryPoints = (entrypoints: string[]): string[] =>
  entrypoints.map((entrypoint) => `./src/${entrypoint}`);

const buildProject = async (): Promise<void> => {
  await $`rm -rf ${OUT_DIR}`;

  await Promise.all([
    await Bun.build({
      target: 'browser',
      entrypoints: resolveEntryPoints(entrypoints),
      outdir: OUT_DIR,
      format: 'cjs',
    }),

    (async () => {
      if (!(await Bun.file(TAILWIND_INPUT).exists())) {
        throw new Error('Tailwind CSS file not found. Check ./components.json');
      }
      await $`bunx @tailwindcss/cli -i ${TAILWIND_INPUT} -o ${TAILWIND_OUTPUT}`.quiet();
    })(),
  ]);

  const glob = new Glob('**');
  const copyPromises: Promise<unknown>[] = [];

  for await (const filename of glob.scan(PUBLIC_DIR)) {
    const srcPath = `${PUBLIC_DIR}/${filename}`;
    const file = Bun.file(srcPath);

    if (!(await file.exists())) {
      throw new Error(`File ${filename} does not exist`);
    }

    if (
      filename.endsWith(FILE_EXTENSIONS.png) ||
      filename.endsWith(FILE_EXTENSIONS.css)
    ) {
      continue;
    }

    if (filename.endsWith(FILE_EXTENSIONS.html)) {
      const folderName = filename.replace(FILE_EXTENSIONS.html, '');
      const destDir = `${OUT_DIR}/${folderName}`;

      copyPromises.push($`cp ${srcPath} ${destDir}/index.html`.quiet());
    } else {
      copyPromises.push($`cp ${srcPath} ${OUT_DIR}`.quiet());
    }
  }

  await Promise.all([
    ...copyPromises,
    $`cp -R ${PUBLIC_DIR}/icons ${OUT_DIR}`.quiet(),
  ]);
};

// Execute build
buildProject().catch((error) => {
  console.log(error);

  console.error(`Build failed: ${error.message}`);
  process.exit(1);
});
