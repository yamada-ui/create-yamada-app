import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export function isFolderEmpty(root: string, name: string): boolean {
  const validFiles = [
    '.DS_Store',
    '.git',
    '.gitattributes',
    '.gitignore',
    '.gitlab-ci.yml',
    '.hg',
    '.hgcheck',
    '.hgignore',
    '.idea',
    '.npmignore',
    '.travis.yml',
    'LICENSE',
    'Thumbs.db',
    'docs',
    'mkdocs.yml',
    'npm-debug.log',
    'yarn-debug.log',
    'yarn-error.log',
    'yarnrc.yml',
    '.yarn',
  ];

  const conflicts = fs.readdirSync(root).filter(
    (file) =>
      !validFiles.includes(file) &&
      // Support IntelliJ IDEA-based editors
      !/\.iml$/.test(file),
  );

  if (conflicts.length > 0) {
    logger.base(
      `The directory ${logger.info(name)} contains files that could conflict:`,
    );
    logger.break();
    for (const file of conflicts) {
      try {
        const stats = fs.lstatSync(path.join(root, file));
        if (stats.isDirectory()) {
          `${logger.warn(file)}`;
        } else {
          `  ${logger.base(file)}`;
        }
      } catch {
        `  ${logger.base(file)}`;
      }
    }
    logger.break();
    logger.base(
      'Either try using a new directory name, or remove the files listed above.',
    );
    logger.break();
    return false;
  }

  return true;
}
