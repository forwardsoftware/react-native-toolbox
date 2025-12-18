/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Args, Command, Flags } from '@oclif/core'
import { copyFile, unlink } from 'node:fs/promises'

import { cyan, green, red, yellow } from '../utils/color.utils.js'
import { checkAssetFile } from '../utils/file-utils.js'

export default class Dotenv extends Command {
  static override args = {
    environmentName: Args.string({ description: 'name of the environment to load .dotenv file for.', required: true }),
  }
  static override description = `Manage .env files for react-native-dotenv for a specific environment (development, production, etc...)`
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    help: Flags.help({ char: 'h' }),
  }

  public async run(): Promise<void> {
    const { args } = await this.parse(Dotenv)

    const sourceEnvFilePath = `./.env.${args.environmentName}`
    const outputEnvFile = './.env'

    const sourceFilesExists = checkAssetFile(sourceEnvFilePath)
    if (!sourceFilesExists) {
      this.error(`Source file ${cyan(sourceEnvFilePath)} not found! ${red('ABORTING')}`)
    }

    this.log(`${yellow('≈')} Generating .env from ${cyan(sourceEnvFilePath)} file...`)

    // Remove existing .env file
    this.log(`${yellow('≈')} Removing existing .env file (if any)...`)
    try {
      await unlink(outputEnvFile)
      this.log(`${green('✔')} Removed existing .env file.`)
    } catch {
      this.log(`${red('✘')} No existing .env file to remove.`)
    }

    // Copy new .env file
    this.log(`${yellow('≈')} Generating new .env file...`)
    try {
      await copyFile(sourceEnvFilePath, outputEnvFile)
      this.log(`${green('✔')} Generated new .env file.`)
    } catch (error) {
      this.error(error as Error)
    }
  }
}
