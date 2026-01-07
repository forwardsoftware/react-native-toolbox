/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { readFile } from 'node:fs/promises'
import { arch, platform } from 'node:os'
import { fileURLToPath } from 'node:url'

import type { BaseCommand } from '../commands/base.js'
import type { CommandConfig } from './types.js'

import Dotenv from '../commands/dotenv.js'
import Icons from '../commands/icons.js'
import Splash from '../commands/splash.js'
import { CommandError, ExitCode } from './errors.js'
import { generateGlobalHelp } from './help.js'
import { log } from './output.js'

// Command registry - maps command names to command classes
const commands: Record<string, new () => BaseCommand> = {
  dotenv: Dotenv,
  icons: Icons,
  splash: Splash,
}

/**
 * Get all command configs for help text
 */
function getCommandConfigs(): CommandConfig[] {
  return Object.values(commands).map((Cmd) => {
    const instance = new Cmd()
    return instance.config
  })
}

/**
 * Get package version from package.json
 */
async function getVersion(): Promise<string> {
  try {
    const packagePath = fileURLToPath(new URL('../../package.json', import.meta.url))
    const content = await readFile(packagePath, 'utf8')
    const pkg = JSON.parse(content) as { version: string }
    return pkg.version
  } catch {
    return 'unknown'
  }
}

/**
 * Main CLI entry point
 */
export async function runCLI(argv: string[]): Promise<void> {
  const version = await getVersion()

  // Handle global flags first
  if (argv.includes('--version') || argv.includes('-V')) {
    log(`rn-toolbox/${version} node-${process.version} ${platform()}-${arch()}`)
    return
  }

  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    // Show global help if no command or help flag
    if (argv.length === 0 || argv[0]?.startsWith('-')) {
      log(generateGlobalHelp(getCommandConfigs(), version))
      return
    }
  }

  // Get command name (first non-flag argument)
  const commandName = argv[0]

  if (!commandName || commandName.startsWith('-')) {
    log(generateGlobalHelp(getCommandConfigs(), version))
    return
  }

  // Find the command
  const CommandClass = commands[commandName]

  if (!CommandClass) {
    const availableCommands = Object.keys(commands).join(', ')
    console.error(`Unknown command: ${commandName}`)
    console.error(`Available commands: ${availableCommands}`)
    console.error(`Run 'rn-toolbox --help' for usage information.`)
    process.exit(ExitCode.INVALID_ARGUMENT)
  }

  // Run the command with remaining args
  const command = new CommandClass()

  try {
    await command.run(argv.slice(1))
  } catch (err) {
    if (err instanceof CommandError) {
      console.error(err.message)
      process.exit(err.exitCode)
    }

    throw err
  }
}
