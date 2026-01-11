/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {after, afterEach, before, describe, it} from 'node:test'

import {ExitCode} from '../../src/cli/errors.js'
import Splash from '../../src/commands/splash.js'
import {runCommand} from '../helpers/run-command.js'

describe('splash', {concurrency: 1, timeout: 60_000}, () => {
  before(async () => {
    fs.mkdirSync('assets', {recursive: true})
    fs.copyFileSync('test/assets/splashscreen.png', 'assets/splashscreen.png')
  })

  after(async () => {
    fs.rmSync('assets', {force: true, recursive: true})
  })

  afterEach(async () => {
    for (const dir of ['android', 'ios']) {
      try {
        fs.rmSync(dir, {force: true, maxRetries: 3, recursive: true})
      } catch {
        // Ignore errors - directory may have been removed by another test
      }
    }
  })

  it('should fail to run splash when no app.json file exists', async () => {
    const {error} = await runCommand(Splash, [])

    assert.equal(error?.exitCode, ExitCode.CONFIG_ERROR)
  })

  it('runs splash --appName test and generates expected files', async () => {
    const {stdout} = await runCommand(Splash, ['--appName', 'test'])

    assert.ok(stdout.includes("Generating splashscreens for 'test' app..."))
    assert.ok(stdout.includes("Generated splashscreens for 'test' app."))

    // Check for iOS output directory and Contents.json
    const iosDir = path.join('ios', 'test', 'Images.xcassets', 'Splashscreen.imageset')
    assert.ok(fs.existsSync(path.join(iosDir, 'Contents.json')))

    // Check for iOS image files (expecting at least one)
    const iosSplashImages = fs.readdirSync(iosDir).filter((f) => f.endsWith('.png'))
    assert.equal(iosSplashImages.length, 3)

    // Check for Android output directories and image files
    const androidDir = path.join('android', 'app', 'src', 'main', 'res')
    assert.ok(fs.existsSync(androidDir))

    // Count drawable directories
    const drawableDirs = fs.readdirSync(androidDir).filter((f) => f.startsWith('drawable-'))
    assert.equal(drawableDirs.length, 6)

    // Count icons in drawable directories
    let androidSplashscreensCount = 0
    for (const drawableDir of drawableDirs) {
      const pngFilesInDir = fs.readdirSync(path.join(androidDir, drawableDir)).filter((f) => f.endsWith('.png'))
      androidSplashscreensCount += pngFilesInDir.length
    }

    // Expect 6 densities * 1 splashscreen = 6
    assert.equal(androidSplashscreensCount, 6)
  })

  it('runs splash with verbose flag and shows detailed output', async () => {
    const {stdout} = await runCommand(Splash, ['--appName', 'test', '-v'])

    assert.ok(stdout.includes("Generating splashscreens for 'test' app..."))
    assert.ok(stdout.includes('Generating splashscreen'))
    assert.ok(stdout.includes("Generated splashscreens for 'test' app."))
  })

  it('handles corrupt image file gracefully', async () => {
    const corruptFile = 'assets/corrupt-splash.png'
    fs.mkdirSync('assets', {recursive: true})
    fs.writeFileSync(corruptFile, 'not a valid image')

    try {
      const {stdout} = await runCommand(Splash, ['--appName', 'TestApp', corruptFile])

      // Should handle error gracefully - verify error collection message appears
      // Check if errors were reported (either via warning symbol or "failed to generate" text)
      assert.match(stdout, /failed to generate|asset.*failed/i)
    } finally {
      // Cleanup is handled by afterEach
    }
  })

  it('handles missing source file gracefully', async () => {
    const {error} = await runCommand(Splash, ['--appName', 'TestApp', 'nonexistent.png'])

    assert.equal(error?.exitCode, ExitCode.FILE_NOT_FOUND)
  })
})
