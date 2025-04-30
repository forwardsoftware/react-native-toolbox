/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Args, Command, Flags } from '@oclif/core'
import { cyan, green, red, yellow } from 'ansis'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

import type { ContentJson, SplashscreenSize } from '../types.js'

import { SPLASHSCREEN_SIZES_ANDROID, SPLASHSCREEN_SIZES_IOS } from '../constants.js'
import { extractAppName } from '../utils/app.utils.js'
import { checkAssetFile, mkdirp } from '../utils/file-utils.js'

export default class Splash extends Command {
  static override args = {
    file: Args.string({
      default: './assets/splashscreen.png',
      description: 'Input splashscreen file',
      required: false,
    }),
  }
  static override description = `Generate app splashscreens using a file as template.

The template splashscreen file should be at least 1242x2208px.
  `
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    appName: Flags.string({
      char: 'a',
      default: extractAppName,
      description: "App name used to build output assets path. Default is retrieved from 'app.json' file.",
    }),
    help: Flags.help({
      char: 'h',
    }),
    verbose: Flags.boolean({
      char: 'v',
      default: false,
      description: 'Print more detailed log messages.',
    }),
  }
  private _isVerbose: boolean = false

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Splash)

    this._isVerbose = flags.verbose

    const sourceFilesExists = checkAssetFile(args.file)
    if (!sourceFilesExists) {
      this.error(`${red('✘')} Source file ${cyan(args.file)} not found! ${red('ABORTING')}`)
    }

    if (!flags.appName) {
      this.error(`${red('✘')} Failed to retrive ${cyan('appName')} value. Please specify it with the ${green('appName')} flag or check that ${cyan('app.json')} file exists. ${red('ABORTING')}`)
    }

    this.log(yellow('≈'), `Generating splashscreens for '${cyan(flags.appName)}' app...`)

    // Run both iOS and Android tasks in parallel
    await Promise.all([
      this.generateAndroidSplashscreens(args.file, './android/app/src/main/res'),
      this.generateIOSSplashscreens(args.file, `./ios/${flags.appName}/Images.xcassets/Splashscreen.imageset`),
    ])

    this.log(green('✔'), `Generated splashscreens for '${cyan(flags.appName)}' app.`)
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
      this.log(red('✘'), `Failed to generate splashscreen '${cyan(outputPath)}':`, error)
    }
  }

  private getIOSAssetNameForDensity(density?: string): string {
    return `splashscreen${density ? `@${density}` : ''}.png`
  }

  private logVerbose(message?: string, ...args: unknown[]) {
    if (this._isVerbose) {
      this.log(message, ...args)
    }
  }
}
