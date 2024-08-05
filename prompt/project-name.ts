import path from "path"
import prompts from "prompts"
import { validateNpmName } from "../helpers"
import { onPromptState } from "./base"

export async function promptProjectName() {
  return await prompts({
    onState: onPromptState,
    type: "text",
    name: "path",
    message: "What is your project named?",
    initial: "my-app",
    validate: (name) => {
      const validation = validateNpmName(path.basename(path.resolve(name)))

      if (validation.valid) return true

      return "Invalid project name: " + validation.problems[0]
    },
  })
}
