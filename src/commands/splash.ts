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

import type { ContentJson } from '../types.js'

import { SPLASHSCREEN_SIZES_ANDROID, SPLASHSCREEN_SIZES_IOS } from '../constants.js'
import { extractAppName } from '../utils/app.utils.js'
import { checkAssetFile, mkdirp } from '../utils/file-utils.js'

export default class Splash extends Command {
  static override args = {
    file: Args.string({ default: './assets/splashscreen.png', description: 'input splashscreen file', required: false }),
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
      description: "the appName used to build output assets path. Default is retrieved from 'app.json' file.",
    }),
    help: Flags.help({ char: 'h' }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Splash)

    const sourceFilesExists = checkAssetFile(args.file)
    if (!sourceFilesExists) {
      this.error(`${red('✘')} Source file ${cyan(args.file)} not found! ${red('ABORTING')}`)
    }

    if (!flags.appName) {
      this.error(`${red('✘')} Failed to retrive ${cyan('appName')} value. Please specify it with the ${green('appName')} flag or check that ${cyan('app.json')} file exists. ${red('ABORTING')}`)
    }

    this.log(`${yellow('≈')} Generating splashscreens for '${cyan(flags.appName)}' app...`)

    const iOSOutputDirPath = `./ios/${flags.appName}/Images.xcassets/Splashscreen.imageset`
    const baseAndroidOutputDirPath = './android/app/src/main/res'

    // Run both iOS and Android tasks in parallel
    await Promise.all([
      this.generateIOSSplashes(args.file, iOSOutputDirPath),
      this.generateAndroidSplashes(args.file, baseAndroidOutputDirPath),
    ])
  }

  private async generateAndroidSplashes(inputFile: string, baseOutputDir: string) {
    this.log(`${yellow('≈')} ${cyan('Android')}: Generating splashscreens...`)
    await mkdirp(baseOutputDir)

    // Generate all Android splashscreens in parallel
    const androidTasks: Promise<unknown>[] = []
    for (const { density, height, width } of SPLASHSCREEN_SIZES_ANDROID) {
      const densityFolderPath = join(baseOutputDir, `drawable-${density}`)
      const outputFile = join(densityFolderPath, 'splashscreen.png')
      androidTasks.push(
        (async () => {
          await mkdirp(densityFolderPath)
          this.log(`${yellow('≈')} ${cyan('Android')}: Generating splashscreen for density '${density}'...`)
          await this.generateSplashscreen(inputFile, outputFile, width, height)
        })(),
      )
    }

    await Promise.all(androidTasks)

    this.log(`${green('✔')} ${cyan('Android')}: splashscreens generated.`)
  }

  private async generateIOSSplashes(inputFile: string, outputDir: string) {
    this.log(`${yellow('≈')} ${cyan('iOS')}: Generating splashscreens...`)
    await mkdirp(outputDir)

    // Generate all iOS splashscreens in parallel
    const iosTasks: Promise<unknown>[] = []
    for (const { density, height, width } of SPLASHSCREEN_SIZES_IOS) {
      const filename = this.getIOSAssetNameForDensity(density)
      const outputFile = join(outputDir, filename)
      this.log(`${yellow('≈')} ${cyan('iOS')}: Generating splashscreen ${cyan(filename)}...`)
      iosTasks.push(this.generateSplashscreen(inputFile, outputFile, width, height))
    }

    await Promise.all(iosTasks)

    // Generate Contents.json
    const images = SPLASHSCREEN_SIZES_IOS.map(({ density }) => ({
      filename: this.getIOSAssetNameForDensity(density),
      idiom: 'universal',
      scale: `${density || '1x'}`,
    }))

    const contentJson: ContentJson = {
      images,
      info: {
        author: 'react-native-toolbox',
        version: 1,
      },
    }

    await writeFile(
      join(outputDir, 'Contents.json'),
      JSON.stringify(contentJson, null, 2),
    )

    this.log(`${green('✔')} ${cyan('iOS')}: splashscreens generated.`)
  }

  private async generateSplashscreen(inputFilePath: string, outputFilePath: string, width: number, height: number) {
    return sharp(inputFilePath)
      .resize(width, height, { fit: 'cover' })
      .toFile(outputFilePath)
  }

  private getIOSAssetNameForDensity(density?: string): string {
    return `splashscreen${density ? `@${density}` : ''}.png`
  }
}
