/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {spawn} from 'node:child_process'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface CLIResult {
  stdout: string
  stderr: string
  exitCode: number
}

export interface CLIOptions {
  /** Use dev entry point (TypeScript) instead of production build */
  dev?: boolean
  /** Environment variables to pass to subprocess */
  env?: Record<string, string>
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Current working directory for the subprocess */
  cwd?: string
}

/**
 * Spawns the CLI as a subprocess and captures output
 */
export function runCLI(args: string[], options: CLIOptions = {}): Promise<CLIResult> {
  const {dev = false, env = {}, timeout = 30000, cwd} = options

  return new Promise((resolve, reject) => {
    let child

    if (dev) {
      // For dev mode, use tsx directly instead of relying on shebang
      child = spawn(
        'node',
        ['--import', 'tsx', '--no-warnings', join(__dirname, '../../bin/dev.js'), ...args],
        {
          cwd,
          env: {
            ...process.env,
            ...env,
            NO_COLOR: '1', // Disable colors for easier assertion
          },
        }
      )
    } else {
      const binPath = join(__dirname, '../../bin/run.js')
      child = spawn('node', [binPath, ...args], {
        cwd,
        env: {
          ...process.env,
          ...env,
          NO_COLOR: '1', // Disable colors for easier assertion
        },
      })
    }

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(`CLI timed out after ${timeout}ms`))
    }, timeout)

    child.on('close', (exitCode) => {
      clearTimeout(timer)
      resolve({
        exitCode: exitCode ?? 0,
        stderr,
        stdout,
      })
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}
