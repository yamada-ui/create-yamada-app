import retry from 'async-retry';
import { green } from 'picocolors';
import fs from 'fs';
import path from 'path';
import {
  tryGitInit,
  isFolderEmpty,
  getOnline,
  PackageManager,
  existsInRepo,
  isWriteable,
  getRepoInfo,
  RepoInfo,
  hasRepo,
  downloadAndExtractRepo,
  downloadAndExtractExample,
  install,
  logger,
} from '../../helpers';
import { getTemplateFile, installTemplate } from './templates';

export class DownloadError extends Error {}

export type CreateNextApp = {
  example?: string;
  appPath: string;
  packageManager: PackageManager;
  srcDir: boolean;
  importAlias: string;
  skipInstall: boolean;
};

export async function createNextApp({
  appPath,
  packageManager,
  example,
  srcDir,
  importAlias,
  skipInstall,
}: CreateNextApp): Promise<void> {
  console.log(
    example,
    appPath,
    packageManager,
    srcDir,
    importAlias,
    skipInstall,
  );

  let repoInfo: RepoInfo | undefined;

  if (example) {
    let repoUrl: URL | undefined;

    try {
      repoUrl = new URL(example);
    } catch (error: any) {
      if (error.code !== 'ERR_INVALID_URL') {
        console.error(error);
        process.exit(1);
      }
    }

    if (repoUrl) {
      if (repoUrl.origin !== 'https://github.com') {
        console.error(
          `Invalid URL: ${logger.error(
            `"${example}"`,
          )}. Only GitHub repositories are supported. Please use a GitHub URL and try again.`,
        );
        process.exit(1);
      }

      repoInfo = await getRepoInfo(repoUrl);

      if (!repoInfo) {
        console.error(
          `Found invalid GitHub URL: ${logger.error(
            `"${example}"`,
          )}. Please fix the URL and try again.`,
        );
        process.exit(1);
      }

      const found = await hasRepo(repoInfo);

      if (!found) {
        console.error(
          `Could not locate the repository for ${logger.error(
            `"${example}"`,
          )}. Please check that the repository exists and try again.`,
        );
        process.exit(1);
      }
    } else if (example !== '__internal-testing-retry') {
      const found = await existsInRepo(example);

      if (!found) {
        console.error(
          `Could not locate an example named ${logger.error(
            `"${example}"`,
          )}. It could be due to the following:\n`,
          `1. Your spelling of example ${logger.error(
            `"${example}"`,
          )} might be incorrect.\n`,
          `2. You might not be connected to the internet or you are behind a proxy.`,
        );
        process.exit(1);
      }
    }
  }

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

  const packageJsonPath = path.join(root, 'package.json');
  let hasPackageJson = false;

  if (example) {
    /**
     * If an example repository is provided, clone it.
     */
    try {
      if (repoInfo) {
        const repoInfo2 = repoInfo;
        console.log(
          `Downloading files from repo ${logger.info(
            example,
          )}. This might take a moment.`,
        );
        await retry(() => downloadAndExtractRepo(root, repoInfo2), {
          retries: 3,
        });
      } else {
        console.log(
          `Downloading files for example ${logger.info(
            example,
          )}. This might take a moment.`,
        );
        await retry(() => downloadAndExtractExample(root, example), {
          retries: 3,
        });
      }
    } catch (reason) {
      function isErrorLike(err: unknown): err is { message: string } {
        return (
          typeof err === 'object' &&
          err !== null &&
          typeof (err as { message?: unknown }).message === 'string'
        );
      }
      throw new DownloadError(
        isErrorLike(reason) ? reason.message : reason + '',
      );
    }

    hasPackageJson = fs.existsSync(packageJsonPath);
    if (hasPackageJson) {
      console.log('Installing packages. This might take a couple of minutes.');
      console.log();

      await install(packageManager, isOnline);
      console.log();
    }
  } else {
    /**
     * If an example repository is not provided for cloning, proceed
     * by installing from a template.
     */
    console.log('Installing template.');
    // await installTemplate({
    //   appName,
    //   root,
    //   // template,
    //   // mode,
    //   packageManager,
    //   isOnline,
    //   tailwind,
    //   eslint,
    //   srcDir,
    //   importAlias,
    // });
  }

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
