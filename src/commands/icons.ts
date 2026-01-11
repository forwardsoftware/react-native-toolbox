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

import type { ContentJson } from '../types.js'
import type { CommandConfig, ParsedArgs } from './base.js'

import { ExitCode } from '../cli/errors.js'
import { ICON_SIZES_ANDROID, ICON_SIZES_IOS } from '../constants.js'
import { MaskType } from '../types.js'
import { extractAppName } from '../utils/app.utils.js'
import { cyan, green, red, yellow } from '../utils/color.utils.js'
import { checkAssetFile, mkdirp } from '../utils/file-utils.js'
import { BaseCommand } from './base.js'

export default class Icons extends BaseCommand {
  readonly config: CommandConfig = {
    args: [
      {
        default: './assets/icon.png',
        description: 'Input icon file',
        name: 'file',
        required: false,
      },
    ],
    description: `Generate app icons using a file as template.

The template icon file should be at least 1024x1024px.`,
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
    name: 'icons',
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

    this.log(yellow('≈'), `Generating icons for '${cyan(appName)}' app...`)

    // Run both iOS and Android tasks in parallel
    await Promise.all([
      this.generateAndroidIcons(file, 'android/app/src/main'),
      this.generateIOSIcons(file, `ios/${appName}/Images.xcassets/AppIcon.appiconset`),
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

    this.log(green('✔'), `Generated icons for '${cyan(appName)}' app.`)
  }

  private async generateAndroidIcon(inputPath: string, outputPath: string, size: number, mask: Buffer) {
    this.logVerbose(yellow('≈'), cyan('Android'), `Generating icon '${cyan(outputPath)}'...`)

    try {
      await sharp(inputPath)
        .resize(size)
        .composite([
          {
            blend: 'dest-in',
            gravity: 'center',
            input: mask,
          },
        ])
        .toFile(outputPath)

      this.logVerbose(green('✔'), cyan('Android'), `Icon '${cyan(outputPath)}' generated.`)
    } catch (error) {
      this.errors.push(`Failed to generate: ${outputPath}`)
      this.log(red('✘'), cyan('Android'), `Failed to generate icon '${cyan(outputPath)}':`, error)
    }
  }

  private generateAndroidIconCircle(inputPath: string, outputPath: string, size: number) {
    return this.generateAndroidIcon(inputPath, outputPath, size, this.getMask('circle', size))
  }

  private generateAndroidIconRounded(inputPath: string, outputPath: string, size: number) {
    return this.generateAndroidIcon(inputPath, outputPath, size, this.getMask('roundedCorners', size))
  }

  private async generateAndroidIcons(inputFile: string, baseOutputDir: string) {
    this.log(yellow('≈'), cyan('Android'), 'Generating icons...')

    await mkdirp(baseOutputDir)

    // Web icon
    await this.generateAndroidIconRounded(inputFile, join(baseOutputDir, 'web_hi_res_512.png'), 512)

    // Launcher icons (parallel per density)
    const androidTasks = ICON_SIZES_ANDROID.map(({density, size}) =>
      this.generateAndroidIconsWithDensity(inputFile, join(baseOutputDir, 'res'), density, size),
    )

    await Promise.all(androidTasks)

    this.log(green('✔'), cyan('Android'), 'icons generated.')
  }

  private async generateAndroidIconsWithDensity(inputPath: string, outputDir: string, density: string, size: number) {
    const densityFolderPath = join(outputDir, `mipmap-${density}`)

    await mkdirp(densityFolderPath)

    this.logVerbose(yellow('≈'), cyan('Android'), `Generating icons for density '${density}'...`)

    await Promise.all([
      // Rounded icon
      this.generateAndroidIconRounded(inputPath, join(densityFolderPath, 'ic_launcher.png'), size),
      // Circle icon
      this.generateAndroidIconCircle(inputPath, join(densityFolderPath, 'ic_launcher_round.png'), size),
    ])

    this.logVerbose(green('✔'), cyan('Android'), `Icons generated for density '${density}'.`)
  }

  private async generateIOSIcon(inputPath: string, outputDir: string, filename: string, size: number) {
    this.logVerbose(yellow('≈'), cyan('iOS'), `Generating icon '${cyan(filename)}'...`)

    try {
      await sharp(inputPath).resize(size, size, {fit: 'cover'}).toFile(join(outputDir, filename))

      this.logVerbose(green('✔'), cyan('iOS'), `Icon '${cyan(filename)}' generated.`)
    } catch (error) {
      this.errors.push(`Failed to generate: ${filename}`)
      this.log(red('✘'), cyan('iOS'), `Failed to generate icon '${cyan(filename)}'.`, error)
    }
  }

  private async generateIOSIcons(inputFile: string, outputDir: string) {
    this.log(yellow('≈'), cyan('iOS'), `Generating icons...`)

    await mkdirp(outputDir)

    // Generate Contents.json
    const contentJson: ContentJson = {
      images: [],
      info: {
        author: 'react-native-toolbox',
        version: 1,
      },
    }

    // Generate all iOS icons in parallel
    const iOSTasks = ICON_SIZES_IOS.flatMap(({baseSize, idiom, name, scales}) =>
      scales.map((scale) => {
        const filename = this.getIOSIconName(name, scale)

        // Register icon in content.json file
        contentJson.images.push({
          filename,
          idiom: idiom || 'iphone',
          scale: `${scale}x`,
          size: `${baseSize}x${baseSize}`,
        })

        return this.generateIOSIcon(inputFile, outputDir, filename, baseSize * scale)
      }),
    )

    await Promise.all(iOSTasks)

    // Write Contents.json descriptor file for iconset
    await writeFile(join(outputDir, 'Contents.json'), JSON.stringify(contentJson, null, 2))

    this.log(green('✔'), cyan('iOS'), `Icons generated.`)
  }

  private getIOSIconName(baseName: string, scale: number): string {
    return `${baseName}${scale > 1 ? `@${scale}x` : ''}.png`
  }

  private getMask(type: MaskType, size: number): Buffer {
    if (type === 'roundedCorners') {
      const cornerRadius = Math.floor(size * 0.1) // Calculate 10% corner radius
      return Buffer.from(`<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/></svg>`)
    }

    const radius = Math.floor(size / 2)
    return Buffer.from(`<svg><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`)
  }
}
