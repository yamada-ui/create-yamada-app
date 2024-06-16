import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Checks if the current directory is in the Git repository.
 */
function isInGitRepository(): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch (_) {}
  return false;
}

/**
 * Checks if the current directory is in the Mercurial repository.
 */
function isInMercurialRepository(): boolean {
  try {
    execSync('hg --cwd . root', { stdio: 'ignore' });
    return true;
  } catch (_) {}
  return false;
}

/**
 * Checks if the default branch is set in the Git configuration.
 */
function isDefaultBranchSet(): boolean {
  try {
    execSync('git config init.defaultBranch', { stdio: 'ignore' });
    return true;
  } catch (_) {}
  return false;
}

/**
 * Tries to initialize a Git repository.
 */
export function tryGitInit(root: string): boolean {
  let didInit = false;
  try {
    execSync('git --version', { stdio: 'ignore' });

    if (isInGitRepository() || isInMercurialRepository()) return false;

    execSync('git init', { stdio: 'ignore' });
    didInit = true;

    if (!isDefaultBranchSet()) {
      execSync('git checkout -b main', { stdio: 'ignore' });
    }

    execSync('git add -A', { stdio: 'ignore' });
    execSync('git commit -m "Initial commit from Create Yamada App"', {
      stdio: 'ignore',
    });
    return true;
  } catch (e) {
    if (didInit) {
      try {
        fs.rmSync(path.join(root, '.git'), { recursive: true, force: true });
      } catch (_) {}
    }
    return false;
  }
}
