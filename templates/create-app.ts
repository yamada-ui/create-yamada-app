import retry from 'async-retry';
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
} from '../helpers';

export class DownloadError extends Error {}

export type CreateNextApp = {
  template: string;
  appPath: string;
  packageManager: PackageManager;
  skipInstall: boolean;
};

export async function createNextApp({
  appPath,
  packageManager,
  template,
  skipInstall,
}: CreateNextApp): Promise<void> {
  let repoInfo: RepoInfo | undefined;
  let repoUrl: URL | undefined;

  try {
    repoUrl = new URL(template);
  } catch (error: any) {
    if (error.code !== 'ERR_INVALID_URL') {
      logger.error(error);
      process.exit(1);
    }
  }

  if (repoUrl) {
    if (repoUrl.origin !== 'https://github.com') {
      console.log(
        `Invalid URL: ${logger.error(
          `"${template}"`,
        )}. Only GitHub repositories are supported. Please use a GitHub URL and try again.`,
      );
      process.exit(1);
    }

    repoInfo = await getRepoInfo(repoUrl);

    if (!repoInfo) {
      console.log(
        `Found invalid GitHub URL: ${logger.error(
          `"${template}"`,
        )}. Please fix the URL and try again.`,
      );
      process.exit(1);
    }

    const found = await hasRepo(repoInfo);

    if (!found) {
      console.error(
        `Could not locate the repository for ${logger.error(
          `"${template}"`,
        )}. Please check that the repository exists and try again.`,
      );
      process.exit(1);
    }
  } else if (template !== '__internal-testing-retry') {
    const found = await existsInRepo(template);

    if (!found) {
      console.error(
        `Could not locate an template named ${logger.error(
          `"${template}"`,
        )}. It could be due to the following:\n`,
        `1. Your spelling of template ${logger.error(
          `"${template}"`,
        )} might be incorrect.\n`,
        `2. You might not be connected to the internet or you are behind a proxy.`,
      );
      process.exit(1);
    }
  }

  const root = path.resolve(appPath);

  if (!(await isWriteable(path.dirname(root)))) {
    logger.error(
      'The application path is not writable, please check folder permissions and try again.',
    );
    logger.error(
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

  console.log(`Creating a new Next.js app in ${logger.success(root)}.`);
  console.log();

  process.chdir(root);

  /**
   * If an template repository is provided, clone it.
   */
  try {
    if (repoInfo) {
      const repoInfo2 = repoInfo;
      console.log(
        `Downloading files from repo ${logger.info(
          template,
        )}. This might take a moment.`,
      );
      await retry(() => downloadAndExtractRepo(root, repoInfo2), {
        retries: 3,
      });
    } else {
      console.log(
        `Downloading files for template ${logger.info(
          template,
        )}. This might take a moment.`,
      );
      await retry(() => downloadAndExtractExample(root, template), {
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
    throw new DownloadError(isErrorLike(reason) ? reason.message : reason + '');
  }

  const packageJsonPath = path.join(root, 'package.json');
  const hasPackageJson = fs.existsSync(packageJsonPath);
  if (hasPackageJson) {
    logger.base('Installing packages. This might take a couple of minutes.');
    logger.break();
    await install(packageManager, isOnline);
    logger.break();
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

  console.log(`${logger.success('Success!')} Created ${appName} at ${appPath}`);
}
