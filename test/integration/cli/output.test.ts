/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {ExitCode} from '../../../src/cli/errors.js'
import {error, log, logVerbose, warn} from '../../../src/cli/output.js'

describe('output', () => {
  describe('log', () => {
    it('logs to console', () => {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.join(' '))
      }

      try {
        log('test message')
        assert.equal(logs[0], 'test message')
      } finally {
        console.log = originalLog
      }
    })

    it('logs multiple arguments', () => {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.join(' '))
      }

      try {
        log('message', 123, true)
        assert.equal(logs[0], 'message 123 true')
      } finally {
        console.log = originalLog
      }
    })
  })

  describe('warn', () => {
    it('warns to console', () => {
      const warnings: string[] = []
      const originalWarn = console.warn
      console.warn = (...args: unknown[]) => {
        warnings.push(args.join(' '))
      }

      try {
        warn('warning message')
        assert.equal(warnings[0], 'warning message')
      } finally {
        console.warn = originalWarn
      }
    })
  })

  describe('error', () => {
    it('logs error and exits with default code', () => {
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
        assert.throws(() => {
          error('test error')
        })
        assert.ok(errors[0]?.includes('test error'))
        assert.equal(exitCode, ExitCode.GENERAL_ERROR)
      } finally {
        console.error = originalError
        process.exit = originalExit
      }
    })

    it('logs error and exits with custom code', () => {
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
        assert.throws(() => {
          error('config error', ExitCode.CONFIG_ERROR)
        })
        assert.ok(errors[0]?.includes('config error'))
        assert.equal(exitCode, ExitCode.CONFIG_ERROR)
      } finally {
        console.error = originalError
        process.exit = originalExit
      }
    })
  })

  describe('logVerbose', () => {
    it('logs when verbose is true', () => {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.join(' '))
      }

      try {
        logVerbose(true, 'verbose message')
        assert.equal(logs[0], 'verbose message')
      } finally {
        console.log = originalLog
      }
    })

    it('does not log when verbose is false', () => {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: unknown[]) => {
        logs.push(args.join(' '))
      }

      try {
        logVerbose(false, 'should not appear')
        assert.equal(logs.length, 0)
      } finally {
        console.log = originalLog
      }
    })
  })
})
