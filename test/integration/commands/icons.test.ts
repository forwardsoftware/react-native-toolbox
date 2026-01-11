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

import {ExitCode} from '../../../src/cli/errors.js'
import Icons from '../../../src/commands/icons.js'
import {runCommand} from '../../helpers/run-command.js'

describe('icons', {concurrency: 1, timeout: 60_000}, () => {
  before(async () => {
    fs.mkdirSync('assets', {recursive: true})
    fs.copyFileSync('test/assets/icon.png', 'assets/icon.png')
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

  it('should fail to run icons when no app.json file exists', async () => {
    const {error} = await runCommand(Icons, [])

    assert.equal(error?.exitCode, ExitCode.CONFIG_ERROR)
  })

  it('runs icons --appName test and generates expected files', async () => {
    const {stdout} = await runCommand(Icons, ['--appName', 'test'])

    assert.ok(stdout.includes("Generating icons for 'test' app..."))
    assert.ok(stdout.includes("Generated icons for 'test' app."))

    // Check for iOS output directory and Contents.json
    const iosDir = path.join('ios', 'test', 'Images.xcassets', 'AppIcon.appiconset')
    assert.ok(fs.existsSync(path.join(iosDir, 'Contents.json')))

    const iosAppIcons = fs.readdirSync(iosDir).filter((f) => f.endsWith('.png'))
    assert.equal(iosAppIcons.length, 9)

    // Check for Android output directory and at least one icon
    const baseAndroidOutputDir = path.join('android', 'app', 'src', 'main')
    const androidDir = path.join(baseAndroidOutputDir, 'res')
    assert.ok(fs.existsSync(androidDir))

    // Check webicon exists
    assert.ok(fs.existsSync(path.join(baseAndroidOutputDir, 'web_hi_res_512.png')))

    // Count mipmap directories
    const mipmapDirs = fs.readdirSync(androidDir).filter((f) => f.startsWith('mipmap-'))
    assert.equal(mipmapDirs.length, 5)

    // Count icons in mipmap directories
    let androidPngCount = 0
    for (const mipmapDir of mipmapDirs) {
      const pngFilesInDir = fs.readdirSync(path.join(androidDir, mipmapDir)).filter((f) => f.endsWith('.png'))
      androidPngCount += pngFilesInDir.length
    }

    // Expect 5 densities * 2 launcher icons/density = 10
    assert.equal(androidPngCount, 10)
  })

  it('runs icons with verbose flag and shows detailed output', async () => {
    const {stdout} = await runCommand(Icons, ['--appName', 'test', '-v'])

    assert.ok(stdout.includes("Generating icons for 'test' app..."))
    assert.ok(stdout.includes('Generating icon'))
    assert.ok(stdout.includes("Icon '"))
    assert.ok(stdout.includes("Generated icons for 'test' app."))
  })

  it('handles corrupt image file gracefully', async () => {
    const corruptFile = 'assets/corrupt-icon.png'
    fs.mkdirSync('assets', {recursive: true})
    fs.writeFileSync(corruptFile, 'not a valid image')

    try {
      const {stdout} = await runCommand(Icons, ['--appName', 'TestApp', corruptFile])

      // Should handle error gracefully - verify error collection message appears
      // Check if errors were reported (either via warning symbol or "failed to generate" text)
      assert.match(stdout, /failed to generate|asset.*failed/i)
    } finally {
      // Cleanup is handled by afterEach
    }
  })

  it('handles missing source file gracefully', async () => {
    const {error} = await runCommand(Icons, ['--appName', 'TestApp', 'nonexistent.png'])

    assert.equal(error?.exitCode, ExitCode.FILE_NOT_FOUND)
  })
})
