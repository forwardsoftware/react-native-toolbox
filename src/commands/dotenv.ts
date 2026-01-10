/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { copyFile, unlink } from 'node:fs/promises'

import type { CommandConfig, ParsedArgs } from './base.js'

import { ExitCode } from '../cli/errors.js'
import { cyan, green, red, yellow } from '../utils/color.utils.js'
import { checkAssetFile } from '../utils/file-utils.js'
import { BaseCommand } from './base.js'

export default class Dotenv extends BaseCommand {
  readonly config: CommandConfig = {
    args: [
      {
        description: 'Name of the environment to load .dotenv file for.',
        name: 'environmentName',
        required: true,
      },
    ],
    description: 'Manage .env files for react-native-dotenv for a specific environment (development, production, etc...)',
    examples: ['<%= config.bin %> <%= command.id %> development'],
    flags: {
      help: {
        description: 'Show help',
        short: 'h',
        type: 'boolean',
      },
      verbose: {
        default: false,
        description: 'Print more detailed log messages.',
        short: 'v',
        type: 'boolean',
      },
    },
    name: 'dotenv',
  }

  public async execute(parsed: ParsedArgs): Promise<void> {
    const { args } = parsed
    const environmentName = args.environmentName!

    const sourceEnvFilePath = `./.env.${environmentName}`
    const outputEnvFile = './.env'

    const sourceFilesExists = checkAssetFile(sourceEnvFilePath)
    if (!sourceFilesExists) {
      this.error(`Source file ${cyan(sourceEnvFilePath)} not found! ${red('ABORTING')}`, ExitCode.FILE_NOT_FOUND)
    }

    this.logVerbose(`${yellow('≈')} Source environment file: ${cyan(sourceEnvFilePath)}`)
    this.log(`${yellow('≈')} Generating .env from ${cyan(sourceEnvFilePath)} file...`)

    // Remove existing .env file
    this.logVerbose(`${yellow('≈')} Removing existing .env file (if any)...`)
    try {
      await unlink(outputEnvFile)
      this.logVerbose(`${green('✔')} Removed existing .env file.`)
    } catch {
      this.logVerbose(`${red('✘')} No existing .env file to remove.`)
    }

    // Copy new .env file
    this.logVerbose(`${yellow('≈')} Generating new .env file...`)
    try {
      await copyFile(sourceEnvFilePath, outputEnvFile)
      this.log(`${green('✔')} Generated new .env file.`)
    } catch (err) {
      this.error(`Failed to generate .env file: ${err instanceof Error ? err.message : String(err)}`, ExitCode.GENERATION_ERROR)
    }
  }
}
