/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

import type { ContentJson, SplashscreenSize } from '../types.js'
import type { CommandConfig, ParsedArgs } from './base.js'

import { ExitCode } from '../cli/errors.js'
import { SPLASHSCREEN_SIZES_ANDROID, SPLASHSCREEN_SIZES_IOS } from '../constants.js'
import { extractAppName } from '../utils/app.utils.js'
import { cyan, green, red, yellow } from '../utils/color.utils.js'
import { checkAssetFile, mkdirp } from '../utils/file-utils.js'
import { BaseCommand } from './base.js'

export default class Splash extends BaseCommand {
  readonly config: CommandConfig = {
    args: [
      {
        default: './assets/splashscreen.png',
        description: 'Input splashscreen file',
        name: 'file',
        required: false,
      },
    ],
    description: `Generate app splashscreens using a file as template.

The template splashscreen file should be at least 1242x2208px.`,
    examples: ['<%= config.bin %> <%= command.id %>'],
    flags: {
      appName: {
        default: extractAppName,
        description: "App name used to build output assets path. Default is retrieved from 'app.json' file.",
        short: 'a',
        type: 'string',
      },
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
    name: 'splash',
  }

  private errors: string[] = []

  public async execute(parsed: ParsedArgs): Promise<void> {
    const { args, flags } = parsed
    const file = args.file!
    const appName = typeof flags.appName === 'string' ? flags.appName : undefined

    const sourceFilesExists = checkAssetFile(file)
    if (!sourceFilesExists) {
      this.error(`${red('✘')} Source file ${cyan(file)} not found! ${red('ABORTING')}`, ExitCode.FILE_NOT_FOUND)
    }

    if (!appName) {
      this.error(
        `${red('✘')} Failed to retrieve ${cyan('appName')} value. Please specify it with the ${green('appName')} flag or check that ${cyan('app.json')} file exists. ${red('ABORTING')}`,
        ExitCode.CONFIG_ERROR,
      )
    }

    this.log(yellow('≈'), `Generating splashscreens for '${cyan(appName)}' app...`)

    // Run both iOS and Android tasks in parallel
    await Promise.all([
      this.generateAndroidSplashscreens(file, 'android/app/src/main/res'),
      this.generateIOSSplashscreens(file, `ios/${appName}/Images.xcassets/Splashscreen.imageset`),
    ])

    if (this.errors.length > 0) {
      this.warn(`${yellow('⚠')} ${this.errors.length} asset(s) failed to generate:`)
      for (const err of this.errors) {
        this.log(`  - ${err}`)
      }
      this.error(
        `Failed to generate ${this.errors.length} asset(s)`,
        ExitCode.GENERATION_ERROR
      )
    }

    this.log(green('✔'), `Generated splashscreens for '${cyan(appName)}' app.`)
  }

  private async generateAndroidSplashscreen(inputFile: string, outputDir: string, sizeDef: SplashscreenSize) {
    const {density, height, width} = sizeDef

    const densityFolderPath = join(outputDir, `drawable-${density}`)

    await mkdirp(densityFolderPath)

    this.logVerbose(yellow('≈'), cyan('Android'), `Generating splashscreen for density '${density}'...`)

    await this.generateSplashscreen(inputFile, join(densityFolderPath, 'splashscreen.png'), width, height)

    this.logVerbose(green('✔'), cyan('Android'), `Generated splashscreen for density '${density}'.`)
  }

  private async generateAndroidSplashscreens(inputFile: string, baseOutputDir: string) {
    this.log(yellow('≈'), cyan('Android'), 'Generating splashscreens...')

    await mkdirp(baseOutputDir)

    // Generate all Android splashscreens in parallel
    await Promise.all(
      SPLASHSCREEN_SIZES_ANDROID.map((sizeDefinition) =>
        this.generateAndroidSplashscreen(inputFile, baseOutputDir, sizeDefinition),
      ),
    )

    this.log(green('✔'), cyan('Android'), 'Splashscreens generated.')
  }

  private async generateIOSSplashscreen(inputFile: string, outputPath: string, width: number, height: number) {
    this.logVerbose(yellow('≈'), cyan('iOS'), `Generating splashscreen ${cyan(outputPath)}...`)

    await this.generateSplashscreen(inputFile, outputPath, width, height)

    this.logVerbose(green('✔'), cyan('iOS'), `Generated splashscreen ${cyan(outputPath)}.`)
  }

  private async generateIOSSplashscreens(inputFile: string, outputDir: string) {
    this.log(yellow('≈'), cyan('iOS'), 'Generating splashscreens...')

    await mkdirp(outputDir)

    // Generate Contents.json
    const contentJson: ContentJson = {
      images: [],
      info: {
        author: 'react-native-toolbox',
        version: 1,
      },
    }

    // Generate all iOS splashscreens in parallel
    await Promise.all(
      SPLASHSCREEN_SIZES_IOS.map(({density, height, width}) => {
        const filename = this.getIOSAssetNameForDensity(density)

        contentJson.images.push({
          filename,
          idiom: 'universal',
          scale: `${density || '1x'}`,
        })

        return this.generateIOSSplashscreen(inputFile, join(outputDir, filename), width, height)
      }),
    )

    await writeFile(join(outputDir, 'Contents.json'), JSON.stringify(contentJson, null, 2))

    this.log(green('✔'), cyan('iOS'), 'Splashscreens generated.')
  }

  private async generateSplashscreen(inputFilePath: string, outputPath: string, width: number, height: number) {
    this.logVerbose(yellow('≈'), `Generating splashscreen '${cyan(outputPath)}'...`)

    try {
      await sharp(inputFilePath).resize(width, height, {fit: 'cover'}).toFile(outputPath)

      this.logVerbose(green('✔'), `Splashscreen '${cyan(outputPath)}' generated.`)
    } catch (error) {
      this.errors.push(`Failed to generate: ${outputPath}`)
      this.log(red('✘'), `Failed to generate splashscreen '${cyan(outputPath)}':`, error)
    }
  }

  private getIOSAssetNameForDensity(density?: string): string {
    return `splashscreen${density ? `@${density}` : ''}.png`
  }
}
