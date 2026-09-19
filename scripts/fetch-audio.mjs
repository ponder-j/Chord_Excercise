import { spawn } from 'node:child_process'
import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LAYERS } from 'smplr'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outputDir = path.join(root, 'public', 'audio', 'splendid-grand')
const remoteBase = 'https://smpldsnds.github.io/sfzinstruments-splendid-grand-piano/samples'

await mkdir(outputDir, { recursive: true })

const sampleNames = [...new Set(LAYERS.flatMap((layer) =>
  layer.samples
    .filter(([midi]) => midi >= 48 && midi <= 84)
    .map(([, sample]) => sample),
))]
const jobs = sampleNames.flatMap((sample) =>
  ['ogg', 'm4a'].map((extension) => ({
    name: `${sample.replaceAll('#', 's')}.${extension}`,
    url: `${remoteBase}/${encodeURIComponent(sample)}.${extension}`,
  })),
)

let downloaded = 0
let skipped = 0
let failed = 0
const concurrency = 6
let cursor = 0

async function existsAndHasSize(file) {
  try {
    const info = await stat(file)
    return info.size > 0
  } catch {
    return false
  }
}

async function runCurl(job) {
  const destination = path.join(outputDir, job.name)
  if (await existsAndHasSize(destination)) {
    skipped += 1
    return
  }

  await new Promise((resolve, reject) => {
    const child = spawn(
      'curl',
      ['-fL', '--retry', '3', '--retry-all-errors', '--silent', '--show-error', '-o', destination, job.url],
      { env: process.env, stdio: 'inherit' },
    )
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`curl exited ${code} for ${job.name}`))
    })
  })
  downloaded += 1
}

async function worker() {
  while (cursor < jobs.length) {
    const index = cursor
    cursor += 1
    try {
      await runCurl(jobs[index])
    } catch (error) {
      failed += 1
      console.error(error instanceof Error ? error.message : error)
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()))

const files = await readdir(outputDir)
console.log(`Audio ready: ${files.length} files (${downloaded} downloaded, ${skipped} skipped, ${failed} failed).`)
if (failed > 0) process.exitCode = 1
