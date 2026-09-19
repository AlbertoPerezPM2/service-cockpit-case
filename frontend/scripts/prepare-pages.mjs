import { copyFile, mkdir } from 'node:fs/promises'

// GitHub Pages serves directories without SPA rewrites. Give the existing
// case-study route the same built entry point, with Vite's absolute asset URLs.
const output = new URL('../dist/', import.meta.url)
await mkdir(new URL('case-study/', output), { recursive: true })
await copyFile(new URL('index.html', output), new URL('case-study/index.html', output))
