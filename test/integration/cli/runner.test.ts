/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {runCLI} from '../../../src/cli/runner.js'

describe('runner', () => {
  describe('runCLI', () => {
    it('shows version with --version flag', async () => {
      // Capture console output
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.join(' '))
      }

      try {
        await runCLI(['--version'])
        assert.ok(logs.some((log) => log.includes('rn-toolbox/')))
      } finally {
        console.log = originalLog
      }
    })

    it('shows version with -V flag', async () => {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.join(' '))
      }

      try {
        await runCLI(['-V'])
        assert.ok(logs.some((log) => log.includes('rn-toolbox/')))
      } finally {
        console.log = originalLog
      }
    })

    it('shows global help with --help flag', async () => {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.join(' '))
      }

      try {
        await runCLI(['--help'])
        const output = logs.join('\n')
        assert.match(output, /USAGE/)
        assert.match(output, /COMMANDS/)
      } finally {
        console.log = originalLog
      }
    })

    it('shows global help with -h flag', async () => {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.join(' '))
      }

      try {
        await runCLI(['-h'])
        const output = logs.join('\n')
        assert.match(output, /USAGE/)
      } finally {
        console.log = originalLog
      }
    })

    it('shows global help when no arguments provided', async () => {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.join(' '))
      }

      try {
        await runCLI([])
        const output = logs.join('\n')
        assert.match(output, /COMMANDS/)
      } finally {
        console.log = originalLog
      }
    })

    it('exits with error for unknown command', async () => {
      const errors: string[] = []
      const originalError = console.error
      const originalExit = process.exit

      console.error = (...args: unknown[]) => {
        errors.push(args.join(' '))
      }

      let exitCode = 0
      process.exit = ((code?: number) => {
        exitCode = code ?? 0
        throw new Error('process.exit')
      }) as never

      try {
        await assert.rejects(
          async () => runCLI(['unknown-command']),
          (err: unknown) => {
            assert.ok(err instanceof Error)
            assert.equal(err.message, 'process.exit')
            return true
          },
        )
        assert.ok(errors.some((err) => err.includes('Unknown command')))
        assert.equal(exitCode, 2) // INVALID_ARGUMENT
      } finally {
        console.error = originalError
        process.exit = originalExit
      }
    })
  })
})
