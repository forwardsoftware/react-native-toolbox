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

import { ICON_SIZES_ANDROID, ICON_SIZES_IOS } from '../constants.js'
import { MaskType } from '../types.js'
import { extractAppName } from '../utils/app.utils.js'
import { checkAssetFile, mkdirp } from '../utils/file-utils.js'

export default class Icons extends Command {
  static override args = {
    file: Args.string({ default: './assets/icon.png', description: 'input icon file', required: false }),
  }
  static override description = `Generate app icons using a file as template.

The template icon file should be at least 1024x1024px.
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
    const { args, flags } = await this.parse(Icons)

    const sourceFilesExists = checkAssetFile(args.file)
    if (!sourceFilesExists) {
      this.error(`${red('✘')} Source file ${cyan(args.file)} not found! ${red('ABORTING')}`)
    }

    if (!flags.appName) {
      this.error(`${red('✘')} Failed to retrive ${cyan('appName')} value. Please specify it with the ${green('appName')} flag or check that ${cyan('app.json')} file exists. ${red('ABORTING')}`)
    }

    this.log(`${yellow('≈')} Generating icons for '${cyan(flags.appName)}' app...`)

    const iOSOutputDirPath = `./ios/${flags.appName}/Images.xcassets/AppIcon.appiconset`
    const baseAndroidOutputDirPath = './android/app/src/main'

    // Run both iOS and Android tasks in parallel
    await Promise.all([
      this.generateIOSIcons(args.file, iOSOutputDirPath),
      this.generateAndroidIcons(args.file, baseAndroidOutputDirPath),
    ])
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
    const circleIconMask = this.getMask("circle", size)
    return this.generateAndroidIcon(inputPath, outputPath, size, circleIconMask)
  }

  private generateAndroidIconRounded(inputPath: string, outputPath: string, size: number) {
    const roundedCorners = this.getMask("roundedCorners", size)
    return this.generateAndroidIcon(inputPath, outputPath, size, roundedCorners)
  }

  private async generateAndroidIcons(inputFile: string, baseOutputDir: string) {
    this.log(`${yellow('≈')} ${cyan('Android')}: Generating icons...`)
    await mkdirp(baseOutputDir)

    // Web icon
    this.log(`${yellow('≈')} ${cyan('Android')}: Creating web icon...`)
    await this.generateAndroidIconRounded(inputFile, join(baseOutputDir, 'web_hi_res_512.png'), 512)

    // Launcher icons (parallel per density)
    const androidTasks: Promise<unknown>[] = []
    for (const { density, size } of ICON_SIZES_ANDROID) {
      const densityFolderPath = join(baseOutputDir, `res/mipmap-${density}`)
      androidTasks.push(
        (async () => {
          await mkdirp(densityFolderPath)
          this.log(`${yellow('≈')} ${cyan('Android')}: Generating icons for density '${density}'...`)
          // Rounded icon
          await this.generateAndroidIconRounded(inputFile, join(densityFolderPath, 'ic_launcher.png'), size)
          // Circle icon
          await this.generateAndroidIconCircle(inputFile, join(densityFolderPath, 'ic_launcher_round.png'), size)
        })(),
      )
    }

    await Promise.all(androidTasks)

    this.log(`${green('✔')} ${cyan('Android')}: icons generated.`)
  }

  private async generateIOSIcons(inputFile: string, outputDir: string) {
    this.log(`${yellow('≈')} ${cyan('iOS')}: Generating icons...`)
    await mkdirp(outputDir)

    // Generate all iOS icons in parallel
    const iOSTasks: Promise<unknown>[] = []
    for (const sizeDef of ICON_SIZES_IOS) {
      const { baseSize, name, scales } = sizeDef
      for (const scale of scales) {
        const filename = this.getIOSIconName(name, scale)
        const imageSize = baseSize * scale
        this.log(`${yellow('≈')} ${cyan('iOS')}: Generating icon ${cyan(filename)}...`)
        iOSTasks.push(
          sharp(inputFile)
            .resize(imageSize, imageSize, { fit: 'cover' })
            .toFile(join(outputDir, filename))
        )
      }
    }

    await Promise.all(iOSTasks)

    // Generate Contents.json
    const contentJson: ContentJson = {
      images: [],
      info: {
        author: 'react-native-toolbox',
        version: 1,
      },
    }

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

    await writeFile(
      join(outputDir, 'Contents.json'),
      JSON.stringify(contentJson, null, 2),
    )

    this.log(`${green('✔')} ${cyan('iOS')}: icons generated.`)
  }

  private getIOSIconName(baseName: string, scale: number): string {
    return `${baseName}${scale > 1 ? `@${scale}x` : ''}.png`
  }

  private getMask(type: MaskType, size: number): Buffer {
    if (type === "roundedCorners") {
      const cornerRadius = Math.floor(size * 0.1) // Calculate 10% corner radius
      return Buffer.from(`<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/></svg>`)
    }

    const radius = Math.floor(size / 2)
    return Buffer.from(`<svg><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`)
  }
}
