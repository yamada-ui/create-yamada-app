import checkForUpdate from 'update-check';
import packageJson from './package.json';
import path from 'path';
import { Command } from 'commander';
import Conf from 'conf';
import prompts, { InitialReturnValue } from 'prompts';
import fs from 'fs';
import ciInfo from 'ci-info';
import { cyan, green, red, yellow, bold, blue } from 'picocolors';
import {
  PackageManager,
  getPkgManager,
  isFolderEmpty,
  validateNpmName,
} from './helpers';
import { DownloadError, createNextApp } from './framework/next/create-next-app';

let projectPath: string = '';

const handleSigTerm = () => process.exit(0);

process.on('SIGINT', handleSigTerm);
process.on('SIGTERM', handleSigTerm);

const onPromptState = (state: {
  value: InitialReturnValue;
  aborted: boolean;
  exited: boolean;
}) => {
  if (state.aborted) {
    // If we don't re-enable the terminal cursor before exiting
    // the program, the cursor will remain hidden
    process.stdout.write('\x1B[?25h');
    process.stdout.write('\n');
    process.exit(1);
  }
};

const program = new Command(packageJson.name)
  .version(packageJson.version)
  .arguments('[project-directory]')
  .usage(`${green('[project-directory]')} [options]`)
  .action((name) => (projectPath = name))
  .option('--src-dir', `Initialize inside a \`src/\` directory.`)
  .option(
    '-e, --example [name]|[github-url]',
    `
    An example to bootstrap the app with. You can use an example name
    from the official Next.js repo or a GitHub URL. The URL can use
    any branch and/or subdirectory
    `,
  )
  // .option('-h, --help', '')
  .option(
    '--import-alias <alias-to-configure>',
    `Specify import alias to use (default "@/*").`,
  )
  .option(
    '--use-npm',
    `Explicitly tell the CLI to bootstrap the application using npm`,
  )
  .option(
    '--use-pnpm',
    `Explicitly tell the CLI to bootstrap the application using pnpm`,
  )
  .option(
    '--use-yarn',
    `Explicitly tell the CLI to bootstrap the application using Yarn`,
  )
  .option(
    '--reset-preferences',
    `Explicitly tell the CLI to reset any stored preferences`,
  )
  .allowUnknownOption()
  .parse(process.argv)
  .opts();

console.log('program ================== ', program);

const packageManager = selectPackageManager();

async function run(): Promise<void> {
  const conf = new Conf({ projectName: 'create-yamada-app' });

  console.log('conf ================== ', conf);

  if (program.resetPreferences) {
    conf.clear();
    console.log(`Preferences reset successfully`);
    return;
  }

  if (typeof projectPath === 'string') {
    projectPath = projectPath.trim();
  }

  if (!projectPath) {
    const res = await prompts({
      onState: onPromptState,
      type: 'text',
      name: 'path',
      message: 'What is your project named?',
      initial: 'my-app',
      validate: (name) => {
        const validation = validateNpmName(path.basename(path.resolve(name)));

        if (validation.valid) return true;

        return 'Invalid project name: ' + validation.problems[0];
      },
    });

    if (typeof res.path === 'string') {
      projectPath = res.path.trim();
    }
  }

  if (!projectPath) {
    console.log(
      '\nPlease specify the project directory:\n' +
        `  ${cyan(program.name())} ${green('<project-directory>')}\n` +
        'For example:\n' +
        `  ${cyan(program.name())} ${green('my-next-app')}\n\n` +
        `Run ${cyan(`${program.name()} --help`)} to see all options.`,
    );
    process.exit(1);
  }

  const resolvedProjectPath = path.resolve(projectPath);
  const projectName = path.basename(resolvedProjectPath);

  const validation = validateNpmName(projectName);
  if (!validation.valid) {
    console.error(
      `Could not create a project called ${red(
        `"${projectName}"`,
      )} because of npm naming restrictions:`,
    );

    validation.problems.forEach((p) =>
      console.error(`    ${red(bold('*'))} ${p}`),
    );
    process.exit(1);
  }

  if (program.example === true) {
    console.error(
      'Please provide an example name or url, otherwise remove the example option.',
    );
    process.exit(1);
  }

  // /**
  //  * Verify the project dir is empty or doesn't exist
  //  */
  const root = path.resolve(resolvedProjectPath);
  const appName = path.basename(root);
  const folderExists = fs.existsSync(root);

  if (folderExists && !isFolderEmpty(root, appName)) {
    process.exit(1);
  }

  const example = typeof program.example === 'string' && program.example.trim();
  const preferences = (conf.get('preferences') || {}) as Record<
    string,
    boolean | string
  >;

  let isNext;
  let isReact;
  let isRemix;
  if (!example) {
    /**
     * select framework
     */
    const res = await prompts({
      onState: onPromptState,
      type: 'select',
      name: 'framework',
      message: 'Which framework do you use?',
      choices: [
        { title: 'Next.js', value: 'next' },
        { title: 'React', value: 'react' },
        { title: 'Remix', value: 'remix' },
      ],
    });
    isNext = res.framework === 'next';
    isReact = res.framework === 'react';
    isRemix = res.framework === 'remix';
  }

  if (!isNext) {
    console.log(`\nCreating a new Next.js app in ${resolvedProjectPath}.`);

    try {
      await createNextApp({
        appPath: resolvedProjectPath,
        packageManager,
        example: example && example !== 'default' ? example : undefined,
        srcDir: program.srcDir,
        importAlias: program.importAlias,
        skipInstall: program.skipInstall,
      });
    } catch (reason) {
      if (!(reason instanceof DownloadError)) {
        throw reason;
      }
    }
  }

  // /**
  //  * If the user does not provide the necessary flags, prompt them for whether to use TS or JS.
  //  */
  if (!example) {
    // usage: nextjs
    const defaults: typeof preferences = {
      app: true,
      srcDir: false,
      importAlias: '@/*',
      customizeImportAlias: false,
      empty: false,
    };
    const getPrefOrDefault = (field: string) =>
      preferences[field] ?? defaults[field];

    if (!program.typescript && !program.javascript) {
      if (ciInfo.isCI) {
        // default to TypeScript in CI as we can't prompt to prevent breaking setup flows
        program.typescript = getPrefOrDefault('typescript');
      } else {
        const styledTypeScript = blue('TypeScript');
        const { typescript } = await prompts(
          {
            type: 'toggle',
            name: 'typescript',
            message: `Would you like to use ${styledTypeScript}?`,
            initial: getPrefOrDefault('typescript'),
            active: 'Yes',
            inactive: 'No',
          },
          {
            /**
             * User inputs Ctrl+C or Ctrl+D to exit the prompt. We should close the
             * process and not write to the file system.
             */
            onCancel: () => {
              console.error('Exiting.');
              process.exit(1);
            },
          },
        );
        /**
         * Depending on the prompt response, set the appropriate program flags.
         */
        program.typescript = Boolean(typescript);
        program.javascript = !Boolean(typescript);
        preferences.typescript = Boolean(typescript);
      }
    }

    if (
      !process.argv.includes('--eslint') &&
      !process.argv.includes('--no-eslint')
    ) {
      if (ciInfo.isCI) {
        program.eslint = getPrefOrDefault('eslint');
      } else {
        const styledEslint = blue('ESLint');
        const { eslint } = await prompts({
          onState: onPromptState,
          type: 'toggle',
          name: 'eslint',
          message: `Would you like to use ${styledEslint}?`,
          initial: getPrefOrDefault('eslint'),
          active: 'Yes',
          inactive: 'No',
        });
        program.eslint = Boolean(eslint);
        preferences.eslint = Boolean(eslint);
      }
    }

    if (
      !process.argv.includes('--src-dir') &&
      !process.argv.includes('--no-src-dir')
    ) {
      if (ciInfo.isCI) {
        program.srcDir = getPrefOrDefault('srcDir');
      } else {
        const styledSrcDir = blue('`src/` directory');
        const { srcDir } = await prompts({
          onState: onPromptState,
          type: 'toggle',
          name: 'srcDir',
          message: `Would you like your code inside a ${styledSrcDir}?`,
          initial: getPrefOrDefault('srcDir'),
          active: 'Yes',
          inactive: 'No',
        });
        program.srcDir = Boolean(srcDir);
        preferences.srcDir = Boolean(srcDir);
      }
    }

    /**
     * usage: nextjs
     */
    if (
      isNext &&
      !process.argv.includes('--app') &&
      !process.argv.includes('--no-app')
    ) {
      if (ciInfo.isCI) {
        program.app = getPrefOrDefault('app');
      } else {
        const styledAppDir = blue('App Router');
        const { appRouter } = await prompts({
          onState: onPromptState,
          type: 'toggle',
          name: 'appRouter',
          message: `Would you like to use ${styledAppDir}? (recommended)`,
          initial: getPrefOrDefault('app'),
          active: 'Yes',
          inactive: 'No',
        });
        program.app = Boolean(appRouter);
      }
    }

    const importAliasPattern = /^[^*"]+\/\*\s*$/;
    if (
      typeof program.importAlias !== 'string' ||
      !importAliasPattern.test(program.importAlias)
    ) {
      if (ciInfo.isCI) {
        // We don't use preferences here because the default value is @/* regardless of existing preferences
        program.importAlias = defaults.importAlias;
      } else if (process.argv.includes('--no-import-alias')) {
        program.importAlias = defaults.importAlias;
      } else {
        const styledImportAlias = blue('import alias');

        const { customizeImportAlias } = await prompts({
          onState: onPromptState,
          type: 'toggle',
          name: 'customizeImportAlias',
          message: `Would you like to customize the ${styledImportAlias} (${defaults.importAlias} by default)?`,
          initial: getPrefOrDefault('customizeImportAlias'),
          active: 'Yes',
          inactive: 'No',
        });

        if (!customizeImportAlias) {
          // We don't use preferences here because the default value is @/* regardless of existing preferences
          program.importAlias = defaults.importAlias;
        } else {
          const { importAlias } = await prompts({
            onState: onPromptState,
            type: 'text',
            name: 'importAlias',
            message: `What ${styledImportAlias} would you like configured?`,
            initial: getPrefOrDefault('importAlias'),
            validate: (value) =>
              importAliasPattern.test(value)
                ? true
                : 'Import alias must follow the pattern <prefix>/*',
          });
          program.importAlias = importAlias;
          preferences.importAlias = importAlias;
        }
      }
    }
  }

  if (isReact) {
    console.log(`\nCreating a new React app in ${resolvedProjectPath}.`);
    // todo: create-react-app
    console.log('React is not supported yet.');
  }

  if (isRemix) {
    console.log(`\nCreating a new Remix app in ${resolvedProjectPath}.`);
    // todo: create-remix-app
    console.log('Remix is not supported yet.');
  }

  conf.set('preferences', preferences);
}

async function update() {
  return await checkForUpdate(packageJson).catch(() => null);
}

function selectPackageManager(): PackageManager {
  if (program.useNpm) return 'npm';
  if (program.usePnpm) return 'pnpm';
  if (program.useYarn) return 'yarn';
  return getPkgManager();
}

async function notifyUpdate(): Promise<void> {
  try {
    const res = await update();
    if (res?.latest) {
      console.log(`Update available: ${res.latest}`);
    }
  } catch (error) {
    // ignore error
  }
}

run()
  .then(notifyUpdate)
  .catch(async (reason) => {
    console.log();
    console.log('Aborting installation.');
    if (reason.command) {
      console.log(`  ${cyan(reason.command)} has failed.`);
    } else {
      console.log(
        red('Unexpected error. Please report it as a bug:') + '\n',
        reason,
      );
    }
    console.log();

    await notifyUpdate();

    process.exit(1);
  });
