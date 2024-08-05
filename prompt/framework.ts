import prompts from "prompts"
import { onPromptState } from "./base"

export type Framework = "next" | "react" | "remix"

export async function promptFramework() {
  return await prompts<"framework">({
    onState: onPromptState,
    type: "select",
    name: "framework",
    message: "Which framework do you use?",
    choices: [
      { title: "Next.js", value: "next" },
      { title: "React", value: "react" },
      { title: "Remix", value: "remix" },
    ],
  })
}
