/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {CommandError, ExitCode} from '../../../src/cli/errors.js'

describe('errors', () => {
  describe('ExitCode', () => {
    it('defines SUCCESS as 0', () => {
      assert.equal(ExitCode.SUCCESS, 0)
    })

    it('defines GENERAL_ERROR as 1', () => {
      assert.equal(ExitCode.GENERAL_ERROR, 1)
    })

    it('defines INVALID_ARGUMENT as 2', () => {
      assert.equal(ExitCode.INVALID_ARGUMENT, 2)
    })

    it('defines FILE_NOT_FOUND as 3', () => {
      assert.equal(ExitCode.FILE_NOT_FOUND, 3)
    })

    it('defines CONFIG_ERROR as 4', () => {
      assert.equal(ExitCode.CONFIG_ERROR, 4)
    })

    it('defines GENERATION_ERROR as 5', () => {
      assert.equal(ExitCode.GENERATION_ERROR, 5)
    })
  })

  describe('CommandError', () => {
    it('creates error with message and default exit code', () => {
      const err = new CommandError('Test error')
      assert.equal(err.message, 'Test error')
      assert.equal(err.exitCode, ExitCode.GENERAL_ERROR)
      assert.equal(err.name, 'CommandError')
    })

    it('creates error with custom exit code', () => {
      const err = new CommandError('File not found', ExitCode.FILE_NOT_FOUND)
      assert.equal(err.message, 'File not found')
      assert.equal(err.exitCode, ExitCode.FILE_NOT_FOUND)
    })

    it('extends Error class', () => {
      const err = new CommandError('Test')
      assert.ok(err instanceof Error)
      assert.ok(err instanceof CommandError)
    })

    it('can be caught and inspected', () => {
      try {
        throw new CommandError('Invalid argument', ExitCode.INVALID_ARGUMENT)
      } catch (err) {
        assert.ok(err instanceof CommandError)
        if (err instanceof CommandError) {
          assert.equal(err.exitCode, ExitCode.INVALID_ARGUMENT)
        }
      }
    })
  })
})
