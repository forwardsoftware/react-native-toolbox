/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Args, Command, Flags } from '@oclif/core'
import Listr from 'listr'
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { cyan, green, red } from 'yoctocolors'

import { checkAssetFile, mkdirp } from '../utils/file-utils.js'

interface ContentJsonImage {
  filename: string;
  idiom: string;
  scale: string;
  size?: string;
}

interface ContentJsonInfo {
  author: string;
  version: number;
}

interface ContentJson {
  images: ContentJsonImage[];
  info: ContentJsonInfo;
}

enum MaskType {
  roundedCorners,
  circle,
}


const ICON_SIZES_ANDROID = [
  {
    density: 'mdpi',
    size: 48,
  },
  {
    density: 'hdpi',
    size: 72,
  },
  {
    density: 'xhdpi',
    size: 96,
  },
  {
    density: 'xxhdpi',
    size: 144,
  },
  {
    density: 'xxxhdpi',
    size: 192,
  },
]

const ICON_SIZES_IOS = [
  {
    baseSize: 20,
    name: 'Icon-Notification',
    scales: [2, 3],
  },
  {
    baseSize: 29,
    name: 'Icon-Small',
    scales: [2, 3],
  },
  {
    baseSize: 40,
    name: 'Icon-Spotlight-40',
    scales: [2, 3],
  },
  {
    baseSize: 60,
    name: 'Icon-60',
    scales: [2, 3],
  },
  {
    baseSize: 1024,
    idiom: 'ios-marketing',
    name: 'iTunesArtwork',
    scales: [1],
  },
]

export default class Icons extends Command {
  static override args = {
    file: Args.string({ default: './assets/icon.png', description: 'input icon file', hidden: false, required: false }),
  }
  static override description = `generate app icons
Generate app icons using FILE as base.
The base icon file should be at least 1024x1024px.
`
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    appName: Flags.string({
      char: 'a',
      default() {
        try {
          const { name } = JSON.parse(readFileSync('./app.json', 'utf8'))
          return name
        } catch {
          return null
        }
      },
      description: "the appName used to build output assets path. Default is retrieved from 'app.json' file.",
    }),
    help: Flags.help({ char: 'h' }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Icons)

    const sourceFilesExists = checkAssetFile(args.file)
    if (!sourceFilesExists) {
      this.error(`Source file ${cyan(args.file)} not found! ${red('ABORTING')}`)
    }

    if (!flags.appName) {
      this.error(`Failed to retrive ${cyan('appName')} value. Please specify it with the ${green('appName')} flag or check that ${cyan('app.json')} file exists. ${red('ABORTING')}`)
    }

    this.log(`Generating icons for '${flags.appName}' app...`)

    const iOSOutputDirPath = `./ios/${flags.appName}/Images.xcassets/AppIcon.appiconset`
    const baseAndroidOutputDirPath = './android/app/src/main'

    const workflow = new Listr([
      {
        task: () => new Listr([
          {
            task: () => mkdirp(iOSOutputDirPath),
            title: 'Create assets folder',
          },
          {
            task: () => {
              const iOSIconsTasks = ICON_SIZES_IOS.flatMap(sizeDef => {
                const { baseSize, name, scales } = sizeDef
                const iOSIconScaleTasks: Listr.ListrTask[] = scales.map(scale => {
                  const filename = this.getIOSIconName(name, scale)
                  const imageSize = baseSize * scale

                  return {
                    task: () => sharp(args.file)
                      .resize(imageSize, imageSize, { fit: 'cover' })
                      .toFile(join(iOSOutputDirPath, filename)),
                    title: `Generate icon ${filename}...`,
                  } as Listr.ListrTask
                })

                return iOSIconScaleTasks
              })

              return new Listr(iOSIconsTasks)
            },
            title: 'Generate icons',
          },
          {
            task: () => {
              const contentJson: ContentJson = {
                images: [],
                info: {
                  author: 'react-native-toolbox',
                  version: 1,
                },
              }

              // Create Contents.json structure
              for (const { baseSize, idiom, name, scales } of ICON_SIZES_IOS) {
                for (const scale of scales) {
                  contentJson.images.push({
                    filename: this.getIOSIconName(name, scale),
                    idiom: idiom || 'iphone',
                    scale: `${scale}x`,
                    size: `${baseSize}x${baseSize}`,
                  })
                }
              }

              return writeFile(
                join(iOSOutputDirPath, 'Contents.json'),
                JSON.stringify(contentJson, null, 2),
              )
            },
            title: 'Generate icons manifest',
          },
        ]),
        title: '🍎 iOS icons',
      },
      {
        task: () => new Listr([
          {
            task: () => mkdirp(baseAndroidOutputDirPath),
            title: 'Create assets folder',
          },
          {
            task: () => {
              const outputFilePath = join(baseAndroidOutputDirPath, 'web_hi_res_512.png')
              return this.generateAndroidIconRounded(args.file, outputFilePath, 512)
            },
            title: 'Create web icon',
          },
          {
            task: () => {
              const androidIconTasks = ICON_SIZES_ANDROID.flatMap(({ density, size }) => {
                const androidIconDensityTasks: Listr.ListrTask[] = []

                const densityFolderPath = join(baseAndroidOutputDirPath, `res/mipmap-${density}`)
                const densityFolderTask: Listr.ListrTask = {
                  task: () => mkdirp(densityFolderPath),
                  title: `Create Android '${density}' assets folder`,
                }
                androidIconDensityTasks.push(densityFolderTask)

                const roundedFileName = 'ic_launcher.png'
                const roundedAndroidIconTask: Listr.ListrTask = {
                  task: () => this.generateAndroidIconRounded(args.file, join(densityFolderPath, roundedFileName), size),
                  title: `Generate icon ${roundedFileName}...`,
                }
                androidIconDensityTasks.push(roundedAndroidIconTask)

                const circleFileName = 'ic_launcher_round.png'
                const circleAndroidIconTask: Listr.ListrTask = {
                  task: () => this.generateAndroidIconCircle(args.file, join(densityFolderPath, circleFileName), size),
                  title: `Generate icon ${circleFileName}...`,
                }
                androidIconDensityTasks.push(circleAndroidIconTask)

                return androidIconDensityTasks
              })

              return new Listr(androidIconTasks)
            },
            title: 'Create launcher icons',
          },
        ]),
        title: '🤖 Android icons',
      },
    ])

    try {
      await workflow.run()
    } catch (error) {
      this.error(error as Error)
    }
  }

  private generateAndroidIcon(inputPath: string, outputPath: string, size: number, mask: Buffer) {
    return sharp(inputPath)
      .resize(size)
      .composite([
        {
          blend: 'dest-in',
          gravity: 'center',
          input: mask,
        },
      ])
      .toFile(outputPath)
  }

  private generateAndroidIconCircle(inputPath: string, outputPath: string, size: number) {
    const circleIconMask = this.getMask(MaskType.circle, size)
    return this.generateAndroidIcon(inputPath, outputPath, size, circleIconMask)
  }

  private generateAndroidIconRounded(inputPath: string, outputPath: string, size: number) {
    const roundedCorners = this.getMask(MaskType.roundedCorners, size)
    return this.generateAndroidIcon(inputPath, outputPath, size, roundedCorners)
  }

  private getIOSIconName(baseName: string, scale: number): string {
    return `${baseName}${scale > 1 ? `@${scale}x` : ''}.png`
  }

  private getMask(type: MaskType, size: number): Buffer {
    if (type === MaskType.roundedCorners) {
      const cornerRadius = Math.floor(size * 0.1) // Calculate 10% corner radius
      return Buffer.from(`<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/></svg>`)
    }

    const radius = Math.floor(size / 2)
    return Buffer.from(`<svg><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`)
  }
}
