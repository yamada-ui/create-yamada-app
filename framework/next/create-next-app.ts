import fs from 'fs';
import path from 'path';
import { green } from 'picocolors';
import {
  tryGitInit,
  isFolderEmpty,
  getOnline,
  PackageManager,
  isWriteable,
} from '../../helpers';
import { installTemplate } from './templates';
import type { TemplateMode, TemplateType } from './templates/types';

export class DownloadError extends Error {}

export type CreateNextApp = {
  appPath: string;
  packageManager: PackageManager;
  typescript: boolean;
  eslint: boolean;
  appRouter: boolean;
  srcDir: boolean;
  importAlias: string;
  skipInstall: boolean;
  empty: boolean;
  turbo: boolean;
};

export async function createNextApp({
  appPath,
  packageManager,
  typescript,
  eslint,
  appRouter,
  srcDir,
  importAlias,
  skipInstall,
  empty,
  turbo,
}: CreateNextApp): Promise<void> {
  const mode: TemplateMode = typescript ? 'ts' : 'js';
  const template: TemplateType = `${appRouter ? 'app' : 'pages'}${empty ? '-empty' : ''}`;

  const root = path.resolve(appPath);

  if (!(await isWriteable(path.dirname(root)))) {
    console.error(
      'The application path is not writable, please check folder permissions and try again.',
    );
    console.error(
      'It is likely you do not have write permissions for this folder.',
    );
    process.exit(1);
  }

  const appName = path.basename(root);

  fs.mkdirSync(root, { recursive: true });
  if (!isFolderEmpty(root, appName)) {
    process.exit(1);
  }

  const useYarn = packageManager === 'yarn';
  const isOnline = !useYarn || (await getOnline());
  const originalDirectory = process.cwd();

  console.log(`Creating a new Next.js app in ${green(root)}.`);
  console.log();

  process.chdir(root);

  /**
   * If an example repository is not provided for cloning, proceed
   * by installing from a template.
   */
  await installTemplate({
    appName,
    root,
    template,
    mode,
    packageManager,
    isOnline,
    eslint,
    srcDir,
    importAlias,
    skipInstall,
    turbo,
  });

  if (tryGitInit(root)) {
    console.log('Initialized a git repository.');
    console.log();
  }

  let cdpath: string;
  if (path.join(originalDirectory, appName) === appPath) {
    cdpath = appName;
  } else {
    cdpath = appPath;
  }

  console.log(`${green('Success!')} Created ${appName} at ${appPath}`);
}
