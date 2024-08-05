import prompts from "prompts"
import { onPromptState } from "./base"

export async function promptPackageManager(pkgManager: string) {
  return await prompts({
    onState: onPromptState,
    type: "confirm",
    name: "deps",
    message: `Install dependencies with ${pkgManager}?`,
    hint: "recommended",
    initial: true,
  })
}
