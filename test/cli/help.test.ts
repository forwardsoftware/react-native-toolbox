/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {generateCommandHelp, generateGlobalHelp} from '../../src/cli/help.js'
import type {CommandConfig} from '../../src/cli/types.js'

describe('help', () => {
  describe('generateCommandHelp', () => {
    it('generates help text with description', () => {
      const config: CommandConfig = {
        args: [],
        description: 'Test command description',
        examples: [],
        flags: {},
        name: 'test',
      }

      const help = generateCommandHelp(config)
      assert.match(help, /Test command description/)
    })

    it('generates USAGE section', () => {
      const config: CommandConfig = {
        args: [],
        description: 'Test command',
        examples: [],
        flags: {},
        name: 'test',
      }

      const help = generateCommandHelp(config)
      assert.match(help, /USAGE/)
      assert.match(help, /\$ rn-toolbox test/)
    })

    it('includes required arguments in usage', () => {
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

      const help = generateCommandHelp(config)
      assert.match(help, /<environment>/)
    })

    it('includes optional arguments in usage', () => {
      const config: CommandConfig = {
        args: [
          {
            description: 'Optional arg',
            name: 'optional',
            required: false,
          },
        ],
        description: 'Test command',
        examples: [],
        flags: {},
        name: 'test',
      }

      const help = generateCommandHelp(config)
      assert.match(help, /\[optional\]/)
    })

    it('generates ARGUMENTS section with defaults', () => {
      const config: CommandConfig = {
        args: [
          {
            default: 'default-value',
            description: 'Argument with default',
            name: 'arg',
            required: false,
          },
        ],
        description: 'Test command',
        examples: [],
        flags: {},
        name: 'test',
      }

      const help = generateCommandHelp(config)
      assert.match(help, /ARGUMENTS/)
      assert.match(help, /\[default: default-value\]/)
    })

    it('generates FLAGS section', () => {
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

      const help = generateCommandHelp(config)
      assert.match(help, /FLAGS/)
      assert.match(help, /-v, --verbose/)
    })

    it('shows string flag value placeholder', () => {
      const config: CommandConfig = {
        args: [],
        description: 'Test command',
        examples: [],
        flags: {
          output: {
            description: 'Output path',
            type: 'string',
          },
        },
        name: 'test',
      }

      const help = generateCommandHelp(config)
      assert.match(help, /--output=<value>/)
    })

    it('generates EXAMPLES section', () => {
      const config: CommandConfig = {
        args: [],
        description: 'Test command',
        examples: [
          '$ <%= config.bin %> <%= command.id %> --verbose',
          '$ <%= config.bin %> <%= command.id %> production',
        ],
        flags: {},
        name: 'test',
      }

      const help = generateCommandHelp(config)
      assert.match(help, /EXAMPLES/)
      assert.match(help, /\$ rn-toolbox test --verbose/)
      assert.match(help, /\$ rn-toolbox test production/)
    })

    it('omits empty sections', () => {
      const config: CommandConfig = {
        args: [],
        description: 'Minimal command',
        examples: [],
        flags: {},
        name: 'minimal',
      }

      const help = generateCommandHelp(config)
      assert.doesNotMatch(help, /ARGUMENTS/)
      assert.doesNotMatch(help, /FLAGS/)
      assert.doesNotMatch(help, /EXAMPLES/)
    })
  })

  describe('generateGlobalHelp', () => {
    it('generates help with version', () => {
      const commands: CommandConfig[] = []
      const help = generateGlobalHelp(commands, '1.0.0')
      assert.match(help, /rn-toolbox\/1\.0\.0/)
    })

    it('includes global description', () => {
      const commands: CommandConfig[] = []
      const help = generateGlobalHelp(commands, '1.0.0')
      assert.match(help, /A set of scripts to simplify React Native development/)
    })

    it('lists all commands', () => {
      const commands: CommandConfig[] = [
        {
          args: [],
          description: 'First command',
          examples: [],
          flags: {},
          name: 'first',
        },
        {
          args: [],
          description: 'Second command with longer description',
          examples: [],
          flags: {},
          name: 'second',
        },
      ]

      const help = generateGlobalHelp(commands, '1.0.0')
      assert.match(help, /COMMANDS/)
      assert.match(help, /first\s+First command/)
      assert.match(help, /second\s+Second command/)
    })

    it('includes global flags', () => {
      const commands: CommandConfig[] = []
      const help = generateGlobalHelp(commands, '1.0.0')
      assert.match(help, /FLAGS/)
      assert.match(help, /-h, --help/)
      assert.match(help, /-V, --version/)
    })

    it('includes usage hint', () => {
      const commands: CommandConfig[] = []
      const help = generateGlobalHelp(commands, '1.0.0')
      assert.match(help, /Run 'rn-toolbox <command> --help' for more information/)
    })
  })
})
