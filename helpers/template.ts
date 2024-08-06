/* eslint-disable import/no-extraneous-dependencies */
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { x } from "tar"

export type RepoInfo = {
  username: string
  name: string
  branch: string
  filePath: string
}

export type Framework = "next" | "react" | "remix" | "hono" | "gatsby"

export async function isUrlOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" })
    return res.status === 200
  } catch {
    return false
  }
}

export async function getRepoInfo(
  url: URL,
  examplePath?: string,
): Promise<RepoInfo | undefined> {
  let [_, username, name, t, _branch, ...file] = url.pathname.split("/")

  if (!username || !name) {
    return undefined
  }

  if (_branch === "feat") {
    _branch += `/${file[0]}`
    file = file.splice(1, file.length)
  }

  const filePath = examplePath ? examplePath.replace(/^\//, "") : file.join("/")

  if (
    // Support repos whose entire purpose is to be a Next.js example, e.g.
    // https://github.com/:username/:my-cool-nextjs-example-repo-name.
    t === undefined ||
    // Support GitHub URL that ends with a trailing slash, e.g.
    // https://github.com/:username/:my-cool-nextjs-example-repo-name/
    // In this case "t" will be an empty string while the next part "_branch" will be undefined
    (t === "" && _branch === undefined)
  ) {
    try {
      const infoResponse = await fetch(
        `https://api.github.com/repos/${username}/${name}`,
      )
      if (infoResponse.status !== 200) {
        return
      }

      const info = await infoResponse.json()
      return { username, name, branch: info["default_branch"], filePath }
    } catch {
      return
    }
  }

  // If examplePath is available, the branch name takes the entire path
  const branch = examplePath
    ? `${_branch}/${file.join("/")}`.replace(new RegExp(`/${filePath}|/$`), "")
    : _branch

  if (branch && t === "tree") {
    return { username, name, branch, filePath }
  }

  return undefined
}

// repoInfo {
//   username: 'yamada-ui',
//   name: 'create-yamada-app',
//   branch: 'main',
//   filePath: 'framework/next/templates/app/ts'
// }
export function hasRepo({
  username,
  name,
  branch,
  filePath,
}: RepoInfo): Promise<boolean> {
  const contentsUrl = `https://api.github.com/repos/${username}/${name}/contents`
  const packagePath = `${filePath ? `/${filePath}` : ""}/package.json`

  return isUrlOk(contentsUrl + packagePath + `?ref=${branch}`)
}

export function existsInRepo(nameOrUrl: string): Promise<boolean> {
  try {
    const url = new URL(nameOrUrl)
    return isUrlOk(url.href)
  } catch {
    return isUrlOk(
      `https://api.github.com/repos/vercel/next.js/contents/examples/${encodeURIComponent(
        nameOrUrl,
      )}`,
    )
  }
}

async function downloadTarStream(url: string) {
  const res = await fetch(url)

  if (!res.body) {
    throw new Error(`Failed to download: ${url}`)
  }

  return Readable.fromWeb(res.body as import("stream/web").ReadableStream)
}

export async function downloadAndExtractRepo(
  root: string,
  { username, name, branch, filePath }: RepoInfo,
) {
  await pipeline(
    await downloadTarStream(
      `https://codeload.github.com/${username}/${name}/tar.gz/${branch}`,
    ),
    x({
      cwd: root,
      strip: filePath ? filePath.split("/").length + 1 : 1,
      filter: (p) =>
        p.startsWith(
          `${name}-${branch.replace(/\//g, "-")}${
            filePath ? `/${filePath}/` : "/"
          }`,
        ),
    }),
  )
}

export async function downloadAndExtractExample(root: string, name: string) {
  if (name === "__internal-testing-retry") {
    throw new Error("This is an internal example for testing the CLI.")
  }

  await pipeline(
    await downloadTarStream(
      "https://codeload.github.com/vercel/next.js/tar.gz/canary",
    ),
    x({
      cwd: root,
      strip: 2 + name.split("/").length,
      filter: (p) => p.includes(`next.js-canary/examples/${name}/`),
    }),
  )
}

export async function getDefaultTemplate(framework: Framework) {
  // todo: fix correct url
  switch (framework) {
    case "next":
      return "https://github.com/yamada-ui/create-yamada-app/tree/feat/create-template/templates/next/app-router"
    case "react":
      return "https://github.com/yamada-ui/create-yamada-app/tree/main/framework/next/templates/app/ts"
    case "remix":
      return "https://github.com/yamada-ui/create-yamada-app/tree/main/framework/next/templates/app/ts"
    case "hono":
      return "https://github.com/yamada-ui/create-yamada-app/tree/main/framework/next/templates/app/ts"
    case "gatsby":
      return "https://github.com/yamada-ui/create-yamada-app/tree/main/framework/next/templates/app/ts"
  }
}
