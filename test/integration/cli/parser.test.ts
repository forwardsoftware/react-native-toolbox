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
import {parseArgs} from '../../../src/cli/parser.js'
import type {CommandConfig} from '../../../src/cli/types.js'

describe('parser', () => {
  describe('parseArgs', () => {
    it('parses string flags correctly', async () => {
      const config: CommandConfig = {
        args: [],
        description: 'Test command',
        examples: [],
        flags: {
          appName: {
            description: 'App name',
            type: 'string',
          },
        },
        name: 'test',
      }

      const result = await parseArgs(['--appName', 'MyApp'], config)
      assert.equal(result.flags.appName, 'MyApp')
    })

    it('parses boolean flags correctly', async () => {
      const config: CommandConfig = {
        args: [],
        description: 'Test command',
        examples: [],
        flags: {
          verbose: {
            description: 'Verbose output',
            short: 'v',
            type: 'boolean',
          },
        },
        name: 'test',
      }

      const result = await parseArgs(['-v'], config)
      assert.equal(result.flags.verbose, true)
    })

    it('parses short flags correctly', async () => {
      const config: CommandConfig = {
        args: [],
        description: 'Test command',
        examples: [],
        flags: {
          help: {
            description: 'Show help',
            short: 'h',
            type: 'boolean',
          },
        },
        name: 'test',
      }

      const result = await parseArgs(['-h'], config)
      assert.equal(result.flags.help, true)
    })

    it('parses required positional arguments', async () => {
      const config: CommandConfig = {
        args: [
          {
            description: 'Environment name',
            name: 'environment',
            required: true,
          },
        ],
        description: 'Test command',
        examples: [],
        flags: {},
        name: 'test',
      }

      const result = await parseArgs(['development'], config)
      assert.equal(result.args.environment, 'development')
    })

    it('parses optional positional arguments with defaults', async () => {
      const config: CommandConfig = {
        args: [
          {
            default: 'default-value',
            description: 'Optional argument',
            name: 'optional',
            required: false,
          },
        ],
        description: 'Test command',
        examples: [],
        flags: {},
        name: 'test',
      }

      const result = await parseArgs([], config)
      assert.equal(result.args.optional, 'default-value')
    })

    it('uses flag defaults when not provided', async () => {
      const config: CommandConfig = {
        args: [],
        description: 'Test command',
        examples: [],
        flags: {
          output: {
            default: './output',
            description: 'Output directory',
            type: 'string',
          },
        },
        name: 'test',
      }

      const result = await parseArgs([], config)
      assert.equal(result.flags.output, './output')
    })

    it('supports async function defaults for flags', async () => {
      const config: CommandConfig = {
        args: [],
        description: 'Test command',
        examples: [],
        flags: {
          computed: {
            default: async () => 'computed-value',
            description: 'Computed flag',
            type: 'string',
          },
        },
        name: 'test',
      }

      const result = await parseArgs([], config)
      assert.equal(result.flags.computed, 'computed-value')
    })

    it('throws CommandError for missing required arguments', async () => {
      const config: CommandConfig = {
        args: [
          {
            description: 'Required arg',
            name: 'required',
            required: true,
          },
        ],
        description: 'Test command',
        examples: [],
        flags: {},
        name: 'test',
      }

      await assert.rejects(
        async () => parseArgs([], config),
        (err: unknown) => {
          assert.ok(err instanceof CommandError)
          assert.equal(err.exitCode, ExitCode.INVALID_ARGUMENT)
          assert.match(err.message, /Missing required argument/)
          return true
        },
      )
    })

    it('throws CommandError for invalid flags', async () => {
      const config: CommandConfig = {
        args: [],
        description: 'Test command',
        examples: [],
        flags: {
          valid: {
            description: 'Valid flag',
            type: 'boolean',
          },
        },
        name: 'test',
      }

      await assert.rejects(
        async () => parseArgs(['--invalid-flag'], config),
        (err: unknown) => {
          assert.ok(err instanceof CommandError)
          assert.equal(err.exitCode, ExitCode.INVALID_ARGUMENT)
          return true
        },
      )
    })

    it('parses multiple flags and arguments together', async () => {
      const config: CommandConfig = {
        args: [
          {
            description: 'First arg',
            name: 'first',
            required: true,
          },
        ],
        description: 'Test command',
        examples: [],
        flags: {
          output: {
            description: 'Output path',
            type: 'string',
          },
          verbose: {
            description: 'Verbose',
            short: 'v',
            type: 'boolean',
          },
        },
        name: 'test',
      }

      const result = await parseArgs(['value1', '--output', '/tmp', '-v'], config)
      assert.equal(result.args.first, 'value1')
      assert.equal(result.flags.output, '/tmp')
      assert.equal(result.flags.verbose, true)
    })
  })
})
