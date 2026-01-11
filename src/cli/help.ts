/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CLI_BIN } from '../constants.js'
import type { CommandConfig } from './types.js'

/**
 * Generates help text for a single command
 */
export function generateCommandHelp(config: CommandConfig): string {
  const lines: string[] = []

  // Description
  lines.push(config.description.trim())
  lines.push('')

  // Usage
  lines.push('USAGE')
  const argsStr = config.args.map((a) => (a.required ? `<${a.name}>` : `[${a.name}]`)).join(' ')
  const flagsStr = Object.keys(config.flags).length > 0 ? '[FLAGS]' : ''
  lines.push(`  $ ${CLI_BIN} ${config.name}${argsStr ? ' ' + argsStr : ''}${flagsStr ? ' ' + flagsStr : ''}`)
  lines.push('')

  // Arguments
  if (config.args.length > 0) {
    lines.push('ARGUMENTS')
    for (const arg of config.args) {
      const defaultStr = arg.default ? ` [default: ${arg.default}]` : ''
      lines.push(`  ${arg.name.toUpperCase()}${defaultStr}  ${arg.description}`)
    }

    lines.push('')
  }

  // Flags
  if (Object.keys(config.flags).length > 0) {
    lines.push('FLAGS')
    for (const [name, flag] of Object.entries(config.flags)) {
      const shortStr = flag.short ? `-${flag.short}, ` : '    '
      const valueStr = flag.type === 'string' ? '=<value>' : ''
      lines.push(`  ${shortStr}--${name}${valueStr}  ${flag.description}`)
    }

    lines.push('')
  }

  // Examples
  if (config.examples.length > 0) {
    lines.push('EXAMPLES')
    for (const example of config.examples) {
      lines.push(`  ${example.replace('<%= config.bin %>', CLI_BIN).replace('<%= command.id %>', config.name)}`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Generates global help text showing all available commands
 */
export function generateGlobalHelp(commands: CommandConfig[], version: string): string {
  const lines: string[] = []

  lines.push(`rn-toolbox/${version}`)
  lines.push('')
  lines.push('A set of scripts to simplify React Native development')
  lines.push('')
  lines.push('USAGE')
  lines.push(`  $ ${CLI_BIN} <command> [ARGS] [FLAGS]`)
  lines.push('')
  lines.push('COMMANDS')

  for (const cmd of commands) {
    const desc = cmd.description.split('\n')[0].trim()
    lines.push(`  ${cmd.name.padEnd(10)} ${desc}`)
  }

  lines.push('')
  lines.push('FLAGS')
  lines.push('  -h, --help     Show help')
  lines.push('  -V, --version  Show version')
  lines.push('')
  lines.push(`Run '${CLI_BIN} <command> --help' for more information on a command.`)
  lines.push('')

  return lines.join('\n')
}
