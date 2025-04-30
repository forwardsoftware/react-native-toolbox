/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Args, Command, Flags } from '@oclif/core'
import { cyan, green, red } from 'ansis'
import Listr from 'listr'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

import type { ContentJson } from '../types.js'

import { SPLASHSCREEN_SIZES_ANDROID, SPLASHSCREEN_SIZES_IOS } from '../constants.js'
import { extractAppName } from '../utils/app.utils.js'
import { checkAssetFile, mkdirp } from '../utils/file-utils.js'

export default class Splash extends Command {
  static override args = {
    file: Args.string({ default: './assets/splashscreen.png', description: 'input splashscreen file', hidden: false, required: false }),
  }
  static override description = `generate app splashscreen for react-native-splash-screen
Generate app splashscreen using FILE as base to be used with crazycodeboy/react-native-splash-screen module.
The base splashscreen file should be at least 1242x2208px.
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
      this.error(`Source file ${cyan(args.file)} not found! ${red('ABORTING')}`)
    }

    if (!flags.appName) {
      this.error(`Failed to retrive ${cyan('appName')} value. Please specify it with the ${green('appName')} flag or check that ${cyan('app.json')} file exists. ${red('ABORTING')}`)
    }

    this.log(`Generating splashscreens for '${flags.appName}' app...`)

    const iOSOutputDirPath = `./ios/${flags.appName}/Images.xcassets/Splashscreen.imageset`
    const baseAndroidOutputDirPath = './android/app/src/main/res'

    const workflow = new Listr([
      {
        task: () => new Listr([
          {
            task: () => mkdirp(iOSOutputDirPath),
            title: 'Create assets folder',
          },
          {
            task: () => {
              const iOSSplashscreenTasks = SPLASHSCREEN_SIZES_IOS.map(({ density, height, width }) => {
                const filename = this.getIOSAssetNameForDensity(density)
                const outputFile = join(iOSOutputDirPath, this.getIOSAssetNameForDensity(density))

                return {
                  task: () => this.generateSplashscreen(args.file, outputFile, width, height),
                  title: `Generate ${filename}...`,
                }
              })

              return new Listr(iOSSplashscreenTasks)
            },
            title: 'Generate splashscreen',
          },
          {
            task: () => {
              const images = SPLASHSCREEN_SIZES_IOS.map(({ density }) => ({
                filename: this.getIOSAssetNameForDensity(density),
                idiom: 'universal',
                scale: `${density || '1x'}`,
              }))

              // Create Contents.json structure
              const contentJson: ContentJson = {
                images,
                info: {
                  author: 'react-native-toolbox',
                  version: 1,
                },
              }

              return writeFile(join(iOSOutputDirPath, 'Contents.json'), JSON.stringify(contentJson, null, 2))
            },
            title: 'Generate splashscreens manifest',
          },
        ]),
        title: '🍎 iOS splashscreens',
      },
      {
        task: () => new Listr([
          {
            task: () => mkdirp(baseAndroidOutputDirPath),
            title: 'Create assets folder',
          },
          {
            task: () => {
              const androidSplashTasks = SPLASHSCREEN_SIZES_ANDROID.flatMap(({ density, height, width }) => {
                const res: Listr.ListrTask[] = []

                const densityFolderPath = join(baseAndroidOutputDirPath, `drawable-${density}`)
                const densityFolderTask: Listr.ListrTask = {
                  task: () => mkdirp(densityFolderPath),
                  title: `Create Android '${density}' assets folder`,
                }
                res.push(densityFolderTask)

                const outputFile = join(densityFolderPath, 'splashscreen.png')
                const densitySplashscreenTask: Listr.ListrTask = {
                  task: () => this.generateSplashscreen(args.file, outputFile, width, height),
                  title: `Generate ${join(`drawable-${density}`, 'splashscreen.png')}...`,
                }
                res.push(densitySplashscreenTask)

                return res
              })

              return new Listr(androidSplashTasks)
            },
            title: 'Generate splashscreens',
          },
        ]),
        title: '🤖 Android splashscreens',
      },
    ])

    try {
      await workflow.run()
    } catch (error) {
      this.error(error as Error)
    }
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
