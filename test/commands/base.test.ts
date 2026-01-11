/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {BaseCommand, CommandError, ExitCode} from '../../src/commands/base.js'
import type {CommandConfig, ParsedArgs} from '../../src/cli/types.js'

// Test implementation of BaseCommand
class TestCommand extends BaseCommand {
  readonly config: CommandConfig = {
    args: [
      {
        description: 'Test argument',
        name: 'testArg',
        required: false,
      },
    ],
    description: 'Test command for unit testing',
    examples: ['$ rn-toolbox test example'],
    flags: {
      help: {
        description: 'Show help',
        short: 'h',
        type: 'boolean',
      },
      verbose: {
        description: 'Verbose output',
        short: 'v',
        type: 'boolean',
      },
    },
    name: 'test',
  }

  executeCalled = false
  executeArgs: ParsedArgs | null = null

  async execute(parsed: ParsedArgs): Promise<void> {
    this.executeCalled = true
    this.executeArgs = parsed
  }
}

describe('base', () => {
  describe('BaseCommand', () => {
    it('runs execute when no help flag', async () => {
      const cmd = new TestCommand()
      await cmd.run([])

      assert.ok(cmd.executeCalled)
    })

    it('shows help when --help flag is passed', async () => {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.join(' '))
      }

      try {
        const cmd = new TestCommand()
        await cmd.run(['--help'])

        // Should not execute
        assert.ok(!cmd.executeCalled)

        // Should show help
        const output = logs.join('\n')
        assert.match(output, /Test command for unit testing/)
        assert.match(output, /USAGE/)
      } finally {
        console.log = originalLog
      }
    })

    it('shows help when -h flag is passed', async () => {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.join(' '))
      }

      try {
        const cmd = new TestCommand()
        await cmd.run(['-h'])

        assert.ok(!cmd.executeCalled)

        const output = logs.join('\n')
        assert.match(output, /USAGE/)
      } finally {
        console.log = originalLog
      }
    })

    it('sets verbose flag correctly', async () => {
      const cmd = new TestCommand()
      await cmd.run(['-v'])

      assert.ok(cmd.executeCalled)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.equal((cmd as any)._isVerbose, true)
    })

    it('passes parsed args to execute', async () => {
      const cmd = new TestCommand()
      await cmd.run(['testValue'])

      assert.ok(cmd.executeCalled)
      assert.equal(cmd.executeArgs?.args.testArg, 'testValue')
    })

    describe('log', () => {
      it('logs to console', () => {
        const logs: string[] = []
        const originalLog = console.log
        console.log = (...args: unknown[]) => {
          logs.push(args.join(' '))
        }

        try {
          const cmd = new TestCommand()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(cmd as any).log('test message')
          assert.equal(logs[0], 'test message')
        } finally {
          console.log = originalLog
        }
      })
    })

    describe('logVerbose', () => {
      it('logs when verbose is true', async () => {
        const logs: string[] = []
        const originalLog = console.log
        console.log = (...args: unknown[]) => {
          logs.push(args.join(' '))
        }

        try {
          const cmd = new TestCommand()
          await cmd.run(['-v'])

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(cmd as any).logVerbose('verbose message')
          assert.ok(logs.some((log) => log.includes('verbose message')))
        } finally {
          console.log = originalLog
        }
      })

      it('does not log when verbose is false', async () => {
        const logs: string[] = []
        const originalLog = console.log
        console.log = (...args: unknown[]) => {
          logs.push(args.join(' '))
        }

        try {
          const cmd = new TestCommand()
          await cmd.run([])

          // Clear logs from execute
          logs.length = 0

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(cmd as any).logVerbose('should not appear')
          assert.equal(logs.length, 0)
        } finally {
          console.log = originalLog
        }
      })
    })

    describe('warn', () => {
      it('warns with colored prefix', () => {
        const warnings: string[] = []
        const originalWarn = console.warn
        console.warn = (...args: unknown[]) => {
          warnings.push(args.join(' '))
        }

        try {
          const cmd = new TestCommand()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(cmd as any).warn('test warning')
          assert.ok(warnings[0]?.includes('Warning:'))
          assert.ok(warnings[0]?.includes('test warning'))
        } finally {
          console.warn = originalWarn
        }
      })
    })

    describe('error', () => {
      it('throws CommandError with message and default code', () => {
        const cmd = new TestCommand()

        assert.throws(
          () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(cmd as any).error('test error')
          },
          (err: unknown) => {
            assert.ok(err instanceof CommandError)
            if (err instanceof CommandError) {
              assert.equal(err.message, 'test error')
              assert.equal(err.exitCode, ExitCode.GENERAL_ERROR)
            }

            return true
          },
        )
      })

      it('throws CommandError with custom exit code', () => {
        const cmd = new TestCommand()

        assert.throws(
          () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(cmd as any).error('file not found', ExitCode.FILE_NOT_FOUND)
          },
          (err: unknown) => {
            assert.ok(err instanceof CommandError)
            if (err instanceof CommandError) {
              assert.equal(err.exitCode, ExitCode.FILE_NOT_FOUND)
            }

            return true
          },
        )
      })
    })
  })
})
