/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {copyFile, mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {after, afterEach, before, describe, it} from 'node:test'

import {ExitCode} from '../../src/cli/errors.js'
import {runCLI} from '../helpers/run-cli.js'

const testDir = process.cwd()
const tmpDir = join(testDir, 'tmp', 'e2e-tests')

describe('CLI E2E', () => {
  before(async () => {
    await mkdir(tmpDir, {recursive: true})
  })

  after(async () => {
    await rm(tmpDir, {force: true, recursive: true})
  })

  describe('Global flags', () => {
    it('shows help with --help flag', async () => {
      const {stdout, exitCode} = await runCLI(['--help'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('rn-toolbox'))
      assert.ok(stdout.includes('USAGE'))
      assert.ok(stdout.includes('COMMANDS'))
      assert.ok(stdout.includes('icons'))
      assert.ok(stdout.includes('splash'))
      assert.ok(stdout.includes('dotenv'))
      assert.ok(stdout.includes('FLAGS'))
      assert.ok(stdout.includes('--help'))
      assert.ok(stdout.includes('--version'))
    })

    it('shows help with -h flag', async () => {
      const {stdout, exitCode} = await runCLI(['-h'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('USAGE'))
    })

    it('shows version with --version flag', async () => {
      const {stdout, exitCode} = await runCLI(['--version'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.match(stdout, /rn-toolbox\/\d+\.\d+\.\d+/)
      assert.ok(stdout.includes('node-'))
    })

    it('shows version with -V flag', async () => {
      const {stdout, exitCode} = await runCLI(['-V'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.match(stdout, /rn-toolbox\/\d+\.\d+\.\d+/)
      assert.ok(stdout.includes('node-'))
    })

    it('shows help when no command provided', async () => {
      const {stdout, exitCode} = await runCLI([], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('USAGE'))
      assert.ok(stdout.includes('COMMANDS'))
      assert.ok(stdout.includes('icons'))
      assert.ok(stdout.includes('splash'))
      assert.ok(stdout.includes('dotenv'))
    })
  })

  describe('Unknown command', () => {
    it('exits with error for unknown command', async () => {
      const {stderr, exitCode} = await runCLI(['unknown'], {dev: true})

      assert.equal(exitCode, ExitCode.INVALID_ARGUMENT)
      assert.ok(stderr.includes('Unknown command: unknown'))
      assert.ok(stderr.includes('Available commands'))
    })

    it('suggests available commands', async () => {
      const {stderr, exitCode} = await runCLI(['icns'], {dev: true}) // typo

      assert.equal(exitCode, ExitCode.INVALID_ARGUMENT)
      assert.ok(stderr.includes('Unknown command'))
      assert.ok(stderr.includes('icons'))
      assert.ok(stderr.includes('splash'))
      assert.ok(stderr.includes('dotenv'))
    })
  })

  describe('Command help', () => {
    it('shows icons command help', async () => {
      const {stdout, exitCode} = await runCLI(['icons', '--help'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Generate app icons'))
      assert.ok(stdout.includes('USAGE'))
      assert.ok(stdout.includes('ARGUMENTS'))
      assert.ok(stdout.includes('FLAGS'))
      assert.ok(stdout.includes('--appName'))
      assert.ok(stdout.includes('--verbose'))
      assert.ok(stdout.includes('-a'))
      assert.ok(stdout.includes('-v'))
      assert.ok(stdout.includes('EXAMPLES'))
    })

    it('shows splash command help', async () => {
      const {stdout, exitCode} = await runCLI(['splash', '--help'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Generate app splashscreens'))
      assert.ok(stdout.includes('USAGE'))
      assert.ok(stdout.includes('FLAGS'))
      assert.ok(stdout.includes('--appName'))
      assert.ok(stdout.includes('--verbose'))
      assert.ok(stdout.includes('-a'))
      assert.ok(stdout.includes('-v'))
    })

    it('shows dotenv command help', async () => {
      const {stdout, exitCode} = await runCLI(['dotenv', '--help'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Manage .env files'))
      assert.ok(stdout.includes('USAGE'))
      assert.ok(stdout.includes('ARGUMENTS'))
      assert.ok(stdout.includes('ENVIRONMENTNAME'))
      assert.ok(stdout.includes('FLAGS'))
      assert.ok(stdout.includes('--verbose'))
      assert.ok(stdout.includes('-v'))
    })
  })

  describe('Exit codes', () => {
    it('returns FILE_NOT_FOUND for missing source file', async () => {
      const {exitCode, stderr} = await runCLI(['icons', './nonexistent.png', '--appName', 'Test'], {dev: true})

      assert.equal(exitCode, ExitCode.FILE_NOT_FOUND)
      assert.ok(stderr.includes('not found'))
      assert.ok(stderr.includes('nonexistent.png'))
    })

    it('returns INVALID_ARGUMENT for missing required arg', async () => {
      const {exitCode, stderr} = await runCLI(['dotenv'], {dev: true})

      assert.equal(exitCode, ExitCode.INVALID_ARGUMENT)
      assert.ok(stderr.includes('environmentName'))
    })
  })

  describe('Icons command', () => {
    afterEach(async () => {
      await rm(join(tmpDir, 'android'), {force: true, recursive: true})
      await rm(join(tmpDir, 'ios'), {force: true, recursive: true})
    })

    it('generates icons successfully with default file', async () => {
      const iconPath = join(tmpDir, 'assets', 'icon.png')
      await mkdir(join(tmpDir, 'assets'), {recursive: true})
      await copyFile(join(testDir, 'test/assets/icon.png'), iconPath)

      const {stdout, exitCode} = await runCLI(['icons', '--appName', 'TestApp'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes("Generating icons for 'TestApp' app"))
      assert.ok(stdout.includes("Generated icons for 'TestApp' app"))
      assert.ok(stdout.includes('Android'))
      assert.ok(stdout.includes('iOS'))

      // Verify iOS icons exist with all expected files
      const iosIconDir = join(tmpDir, 'ios/TestApp/Images.xcassets/AppIcon.appiconset')
      const contentsJsonPath = join(iosIconDir, 'Contents.json')
      assert.ok(existsSync(contentsJsonPath))
      
      // Parse and validate Contents.json structure
      const contentsJson = JSON.parse(await readFile(contentsJsonPath, 'utf8'))
      assert.ok(contentsJson.images)
      assert.ok(Array.isArray(contentsJson.images))
      assert.ok(contentsJson.images.length > 0)
      assert.ok(contentsJson.info)
      assert.equal(contentsJson.info.author, 'react-native-toolbox')
      
      // Verify specific iOS icon files exist
      const iosIcons = await readdir(iosIconDir)
      const pngIcons = iosIcons.filter((f: string) => f.endsWith('.png'))
      assert.ok(pngIcons.length >= 9) // Should have multiple icons at different scales
      assert.ok(pngIcons.some(f => f.includes('Icon-Notification')))
      assert.ok(pngIcons.some(f => f.includes('Icon-60')))
      assert.ok(pngIcons.some(f => f.includes('iTunesArtwork')))

      // Verify Android icons exist across multiple densities
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/web_hi_res_512.png')))
    })

    it('generates icons with custom file path', async () => {
      const iconPath = join(tmpDir, 'custom-icon.png')
      await copyFile(join(testDir, 'test/assets/icon.png'), iconPath)

      const {stdout, exitCode} = await runCLI(['icons', iconPath, '--appName', 'MyApp'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes("Generating icons for 'MyApp' app"))
      assert.ok(stdout.includes("Generated icons for 'MyApp' app"))
      assert.ok(stdout.includes('Android'))
      assert.ok(stdout.includes('iOS'))

      // Verify output directories and files exist
      const iosIconDir = join(tmpDir, 'ios/MyApp/Images.xcassets/AppIcon.appiconset')
      assert.ok(existsSync(iosIconDir))
      assert.ok(existsSync(join(iosIconDir, 'Contents.json')))
      const iosIcons = await readdir(iosIconDir)
      assert.ok(iosIcons.filter((f: string) => f.endsWith('.png')).length > 0)
      
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/web_hi_res_512.png')))
    })

    it('shows verbose output with -v flag', async () => {
      const iconPath = join(tmpDir, 'icon.png')
      await copyFile(join(testDir, 'test/assets/icon.png'), iconPath)

      const {stdout, exitCode} = await runCLI(['icons', iconPath, '--appName', 'TestApp', '-v'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes("Generating icons for 'TestApp' app"))
      assert.ok(stdout.includes('Android'))
      assert.ok(stdout.includes('iOS'))
      assert.ok(stdout.includes('Generating icon'))
      assert.ok(stdout.includes('Generated icon'))
      assert.ok(stdout.includes('density') || stdout.includes('scale'))
    })

    it('handles corrupt image file gracefully', async () => {
      const corruptFile = join(tmpDir, 'corrupt.png')
      await writeFile(corruptFile, 'not an image')

      const {stdout, exitCode} = await runCLI(['icons', corruptFile, '--appName', 'TestApp'], {
        cwd: tmpDir,
        dev: true,
      })

      // Command completes but reports failures
      assert.equal(exitCode, ExitCode.GENERATION_ERROR)
      assert.ok(stdout.includes('Warning') || stdout.includes('Failed'))
      assert.ok(stdout.includes('asset') || stdout.includes('generate'))
    })
  })

  describe('Splash command', () => {
    afterEach(async () => {
      await rm(join(tmpDir, 'android'), {force: true, recursive: true})
      await rm(join(tmpDir, 'ios'), {force: true, recursive: true})
    })

    it('generates splashscreens successfully', async () => {
      const splashPath = join(tmpDir, 'splash.png')
      await copyFile(join(testDir, 'test/assets/splashscreen.png'), splashPath)

      const {stdout, exitCode} = await runCLI(['splash', splashPath, '--appName', 'TestApp'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes("Generating splashscreens for 'TestApp' app"))
      assert.ok(stdout.includes("Generated splashscreens for 'TestApp' app"))
      assert.ok(stdout.includes('Android'))
      assert.ok(stdout.includes('iOS'))

      // Verify Android splashscreens exist across multiple densities
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/drawable-ldpi/splashscreen.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/drawable-mdpi/splashscreen.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/drawable-hdpi/splashscreen.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/drawable-xhdpi/splashscreen.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/drawable-xxhdpi/splashscreen.png')))
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/drawable-xxxhdpi/splashscreen.png')))

      // Verify iOS splashscreen exists with all files
      const iosSplashDir = join(tmpDir, 'ios/TestApp/Images.xcassets/Splashscreen.imageset')
      const splashContentsPath = join(iosSplashDir, 'Contents.json')
      assert.ok(existsSync(splashContentsPath))
      
      // Parse and validate Contents.json structure
      const splashContents = JSON.parse(await readFile(splashContentsPath, 'utf8'))
      assert.ok(splashContents.images)
      assert.ok(Array.isArray(splashContents.images))
      assert.equal(splashContents.images.length, 3) // 1x, 2x, 3x
      assert.ok(splashContents.info)
      assert.equal(splashContents.info.author, 'react-native-toolbox')
      
      assert.ok(existsSync(join(iosSplashDir, 'splashscreen.png')))
      assert.ok(existsSync(join(iosSplashDir, 'splashscreen@2x.png')))
      assert.ok(existsSync(join(iosSplashDir, 'splashscreen@3x.png')))
    })

    it('uses default file path when not specified', async () => {
      const splashPath = join(tmpDir, 'assets', 'splashscreen.png')
      await mkdir(join(tmpDir, 'assets'), {recursive: true})
      await copyFile(join(testDir, 'test/assets/splashscreen.png'), splashPath)

      const {stdout, exitCode} = await runCLI(['splash', '--appName', 'TestApp'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Generating splashscreens'))
      assert.ok(stdout.includes("Generated splashscreens for 'TestApp' app"))
      
      // Verify files were actually created
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/drawable-mdpi/splashscreen.png')))
      assert.ok(existsSync(join(tmpDir, 'ios/TestApp/Images.xcassets/Splashscreen.imageset/Contents.json')))
    })

    it('shows verbose output', async () => {
      const splashPath = join(tmpDir, 'splash.png')
      await copyFile(join(testDir, 'test/assets/splashscreen.png'), splashPath)

      const {stdout, exitCode} = await runCLI(['splash', splashPath, '--appName', 'TestApp', '--verbose'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Generating splashscreen'))
      assert.ok(stdout.includes('Generated splashscreen'))
      assert.ok(stdout.includes('density') || stdout.includes('iOS') || stdout.includes('Android'))
    })

    it('returns FILE_NOT_FOUND for missing splash file', async () => {
      const {exitCode, stderr} = await runCLI(['splash', './nonexistent.png', '--appName', 'Test'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.FILE_NOT_FOUND)
      assert.ok(stderr.includes('not found'))
    })
  })

  describe('Dotenv command', () => {
    afterEach(async () => {
      await rm(join(tmpDir, '.env'), {force: true})
      await rm(join(tmpDir, '.env.development'), {force: true})
      await rm(join(tmpDir, '.env.production'), {force: true})
    })

    it('copies environment file successfully', async () => {
      const envContent = 'API_URL=https://dev.example.com\nDEBUG=true'
      await writeFile(join(tmpDir, '.env.development'), envContent)

      const {stdout, exitCode} = await runCLI(['dotenv', 'development'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Generating .env from'))
      assert.ok(stdout.includes('Generated new .env file'))

      // Verify .env file was created with correct content
      const dotenvContent = await readFile(join(tmpDir, '.env'), 'utf8')
      assert.equal(dotenvContent, envContent)
    })

    it('replaces existing .env file', async () => {
      await writeFile(join(tmpDir, '.env'), 'OLD_VALUE=old')
      await writeFile(join(tmpDir, '.env.production'), 'API_URL=https://prod.example.com')

      const {exitCode} = await runCLI(['dotenv', 'production'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)

      const dotenvContent = await readFile(join(tmpDir, '.env'), 'utf8')
      assert.ok(dotenvContent.includes('prod.example.com'))
      assert.ok(!dotenvContent.includes('OLD_VALUE'))
    })

    it('shows verbose output', async () => {
      await writeFile(join(tmpDir, '.env.development'), 'TEST=value')

      const {stdout, exitCode} = await runCLI(['dotenv', 'development', '-v'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Source environment file'))
      assert.ok(stdout.includes('.env.development'))
      assert.ok(stdout.includes('Generated new .env file'))
    })

    it('fails when source environment file does not exist', async () => {
      const {stderr, exitCode} = await runCLI(['dotenv', 'nonexistent'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.FILE_NOT_FOUND)
      assert.ok(stderr.includes('.env.nonexistent'))
      assert.ok(stderr.includes('not found'))
    })
  })

  describe('App name resolution', () => {
    afterEach(async () => {
      await rm(join(tmpDir, 'app.json'), {force: true})
      await rm(join(tmpDir, 'android'), {force: true, recursive: true})
      await rm(join(tmpDir, 'ios'), {force: true, recursive: true})
    })

    it('reads app name from app.json when not provided', async () => {
      const iconPath = join(tmpDir, 'icon.png')
      await copyFile(join(testDir, 'test/assets/icon.png'), iconPath)
      await writeFile(join(tmpDir, 'app.json'), JSON.stringify({name: 'MyApp'}))

      const {stdout, exitCode} = await runCLI(['icons', iconPath], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes("Generating icons for 'MyApp' app"))
      assert.ok(stdout.includes("Generated icons for 'MyApp' app"))

      // Verify output was created with correct app name
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png')))
      assert.ok(existsSync(join(tmpDir, 'ios/MyApp/Images.xcassets/AppIcon.appiconset/Contents.json')))
      
      // Verify Contents.json has correct structure
      const contentsJson = JSON.parse(await readFile(join(tmpDir, 'ios/MyApp/Images.xcassets/AppIcon.appiconset/Contents.json'), 'utf8'))
      assert.ok(contentsJson.images.length > 0)
    })

    it('fails when app.json is missing and no --appName provided', async () => {
      const iconPath = join(tmpDir, 'icon.png')
      await copyFile(join(testDir, 'test/assets/icon.png'), iconPath)

      const {stderr, exitCode} = await runCLI(['icons', iconPath], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.CONFIG_ERROR)
      assert.ok(stderr.includes('appName'))
      assert.ok(stderr.includes('app.json') || stderr.includes('Failed to retrieve'))
    })

    it('prioritizes --appName flag over app.json', async () => {
      const iconPath = join(tmpDir, 'icon.png')
      await copyFile(join(testDir, 'test/assets/icon.png'), iconPath)
      await writeFile(join(tmpDir, 'app.json'), JSON.stringify({name: 'OldName'}))

      const {stdout, exitCode} = await runCLI(['icons', iconPath, '--appName', 'NewName'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes("Generating icons for 'NewName' app"))
      assert.ok(!stdout.includes('OldName'))
      assert.ok(stdout.includes('Generated icons'))

      // Verify output uses NewName, not OldName
      const newNameDir = join(tmpDir, 'ios/NewName/Images.xcassets/AppIcon.appiconset')
      assert.ok(existsSync(newNameDir))
      assert.ok(existsSync(join(newNameDir, 'Contents.json')))
      assert.ok(!existsSync(join(tmpDir, 'ios/OldName')))
      
      // Verify Android output also created
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png')))
    })
  })

  describe('Flag variations', () => {
    afterEach(async () => {
      await rm(join(tmpDir, 'android'), {force: true, recursive: true})
      await rm(join(tmpDir, 'ios'), {force: true, recursive: true})
    })

    it('accepts short flag -a for appName', async () => {
      const iconPath = join(tmpDir, 'icon.png')
      await copyFile(join(testDir, 'test/assets/icon.png'), iconPath)

      const {stdout, exitCode} = await runCLI(['icons', iconPath, '-a', 'ShortFlagApp'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes("Generating icons for 'ShortFlagApp' app"))
      assert.ok(stdout.includes('Generated icons'))

      // Verify output was created with correct app name from short flag
      assert.ok(existsSync(join(tmpDir, 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png')))
      const shortFlagIconDir = join(tmpDir, 'ios/ShortFlagApp/Images.xcassets/AppIcon.appiconset')
      assert.ok(existsSync(shortFlagIconDir))
      assert.ok(existsSync(join(shortFlagIconDir, 'Contents.json')))
      
      // Verify actual icon files exist
      const icons = await readdir(shortFlagIconDir)
      assert.ok(icons.filter(f => f.endsWith('.png')).length > 0)
    })

    it('accepts both --verbose and -v flags', async () => {
      const splashPath = join(tmpDir, 'splash.png')
      await copyFile(join(testDir, 'test/assets/splashscreen.png'), splashPath)

      const {stdout: stdout1} = await runCLI(['splash', splashPath, '--appName', 'App1', '--verbose'], {
        cwd: tmpDir,
        dev: true,
      })

      const {stdout: stdout2} = await runCLI(['splash', splashPath, '--appName', 'App2', '-v'], {
        cwd: tmpDir,
        dev: true,
      })

      assert.ok(stdout1.includes('Generating splashscreen'))
      assert.ok(stdout1.includes('Generated splashscreen'))
      assert.ok(stdout2.includes('Generating splashscreen'))
      assert.ok(stdout2.includes('Generated splashscreen'))
      
      // Verify both generated files successfully
      assert.ok(existsSync(join(tmpDir, 'ios/App1/Images.xcassets/Splashscreen.imageset/Contents.json')))
      assert.ok(existsSync(join(tmpDir, 'ios/App2/Images.xcassets/Splashscreen.imageset/Contents.json')))
    })
  })
})

