import { InitialReturnValue } from "prompts"

interface PromptState {
  value: InitialReturnValue
  aborted: boolean
  exited: boolean
}

export const onPromptState = (state: PromptState) => {
  if (state.aborted) {
    // If we don't re-enable the terminal cursor before exiting
    // the program, the cursor will remain hidden
    process.stdout.write("\x1B[?25h")
    process.stdout.write("\n")
    process.exit(1)
  }
}
