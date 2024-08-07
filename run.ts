import checkForUpdate from "update-check"
import packageJson from "./package.json"
import path from "path"
import { Command } from "commander"
import fs from "fs"
import { bold } from "picocolors"

import {
  c,
  getDefaultTemplate,
  getPkgManager,
  isFolderEmpty,
  isString,
  validateNpmName,
} from "./helpers"
import { DownloadError, createApp } from "./templates/create-app"
import { promptProjectName } from "./prompt/project-name"
import { promptPackageManager } from "./prompt/package-manager"
import { promptFramework } from "./prompt/framework"

let projectPath: string = ""

const handleSigTerm = () => process.exit(0)

process.on("SIGINT", handleSigTerm)
process.on("SIGTERM", handleSigTerm)

async function run(): Promise<void> {
  const program = new Command(packageJson.name)
    .name("create-yamada-app")
    .description("Create a new app with yamada-ui in the specified directory.")
    .version(packageJson.version)
    .arguments("[project-directory]")
    .usage(`${c.success("[project-directory]")} [options]`)
    .action((name) => (projectPath = name))
    .option(
      "--template [name]|[github-url]",
      `
    An template to bootstrap the app with. You can use an template name
    from the official Next.js repo or a GitHub URL. The URL can use
    any branch and/or subdirectory
    `,
    )
    .option(
      "--use-npm",
      `Explicitly tell the CLI to bootstrap the application using npm`,
    )
    .option(
      "--use-pnpm",
      `Explicitly tell the CLI to bootstrap the application using pnpm`,
    )
    .option(
      "--use-yarn",
      `Explicitly tell the CLI to bootstrap the application using Yarn`,
    )
    .option(
      "--skip-install",
      `Explicitly tell the CLI to skip installing packages`,
    )
    .allowUnknownOption()
    .parse(process.argv)
    .opts()

  console.log(`program ================== ${c.error("program")}`, program)

  const packageManager = !!program.useNpm
    ? "npm"
    : !!program.usePnpm
      ? "pnpm"
      : !!program.useYarn
        ? "yarn"
        : getPkgManager()

  if (isString(projectPath)) {
    projectPath = projectPath.trim()
  }

  if (!projectPath) {
    const res = await promptProjectName()

    if (isString(res.path)) {
      projectPath = res.path.trim()
    }
  }

  if (!projectPath) {
    console.log(
      "\nPlease specify the project directory:\n" +
        `  ${c.info(program.name())} ${c.success("<project-directory>")}\n` +
        "For example:\n" +
        `  ${c.info(program.name())} ${c.success("my-next-app")}\n\n` +
        `Run ${c.info(`${program.name()} --help`)} to see all options.`,
    )
    process.exit(1)
  }

  const resolvedProjectPath = path.resolve(projectPath)
  const projectName = path.basename(resolvedProjectPath)

  const validation = validateNpmName(projectName)
  if (!validation.valid) {
    c.error(
      `Could not create a project called ${c.error(
        `"${projectName}"`,
      )} because of npm naming restrictions:`,
    )

    validation.problems.forEach((p) => `${c.error(bold("*"))} ${p}`)
    process.exit(1)
  }

  if (!program.template || !isString(program.template)) {
    const { framework } = await promptFramework()
    program.template = await getDefaultTemplate(framework)
  }

  if (!program.skipInstall) {
    const { deps } = await promptPackageManager(packageManager)
    program.skipInstall = deps
  }

  /** Verify the project dir is empty or doesn't exist */
  const root = path.resolve(resolvedProjectPath)
  const appName = path.basename(root)
  const folderExists = fs.existsSync(root)

  if (folderExists && !isFolderEmpty(root, appName)) {
    process.exit(1)
  }

  console.log(
    `\nCreating a new Next.js app in ${c.primary(resolvedProjectPath)}.`,
  )

  console.log(program.template)

  try {
    await createApp({
      appPath: resolvedProjectPath,
      packageManager,
      template: program.template.trim(),
      skipInstall: program.skipInstall,
    })
  } catch (reason) {
    if (!(reason instanceof DownloadError)) {
      throw reason
    }
  }
}

async function update() {
  return await checkForUpdate(packageJson).catch(() => null)
}

async function notifyUpdate(): Promise<void> {
  try {
    const res = await update()
    if (res?.latest) {
      console.log(`Update available: ${res.latest}`)
    }
  } catch (error) {
    // ignore error
  }
}

run()
  .then(notifyUpdate)
  .catch(async (reason) => {
    console.log()
    console.log("Aborting installation.")
    if (reason.command) {
      ;`  ${c.info(reason.command)} has failed.`
    } else {
      console.log(
        c.info("Unexpected error. Please report it as a bug:") + "\n",
        reason,
      )
    }
    console.log()

    await notifyUpdate()

    process.exit(1)
  })
