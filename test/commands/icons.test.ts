import {expect} from 'chai'
import fs from 'node:fs'
import path from 'node:path'
import {rimrafSync} from 'rimraf'

import {ExitCode} from '../../src/cli/errors.js'
import Icons from '../../src/commands/icons.js'
import {runCommand} from '../helpers/run-command.js'

describe('icons', () => {
  before(() => {
    fs.mkdirSync('assets', {recursive: true})
    fs.copyFileSync('test/assets/icon.png', 'assets/icon.png')
  })

  after(() => {
    rimrafSync('assets')
  })

  afterEach(() => {
    rimrafSync(['android', 'ios'])
  })

  it('should fail to run icons when no app.json file exists', async () => {
    const {error} = await runCommand(Icons, [])

    expect(error?.exitCode).to.equal(ExitCode.CONFIG_ERROR)
  })

  it('runs icons --appName test and generates expected files', async () => {
    const {stdout} = await runCommand(Icons, ['--appName', 'test'])

    expect(stdout).to.contain("Generating icons for 'test' app...")
    expect(stdout).to.contain("Generated icons for 'test' app.")

    // Check for iOS output directory and Contents.json
    const iosDir = path.join('ios', 'test', 'Images.xcassets', 'AppIcon.appiconset')
    expect(fs.existsSync(path.join(iosDir, 'Contents.json'))).to.be.true

    const iosAppIcons = fs.readdirSync(iosDir).filter((f) => f.endsWith('.png'))
    expect(iosAppIcons.length).to.eq(9)

    // Check for Android output directory and at least one icon
    const baseAndroidOutputDir = path.join('android', 'app', 'src', 'main')
    const androidDir = path.join(baseAndroidOutputDir, 'res')
    expect(fs.existsSync(androidDir)).to.be.true

    // Check webicon exists
    expect(fs.existsSync(path.join(baseAndroidOutputDir, 'web_hi_res_512.png'))).to.be.true

    // Count mipmap directories
    const mipmapDirs = fs.readdirSync(androidDir).filter((f) => f.startsWith('mipmap-'))
    expect(mipmapDirs.length).to.eq(5)

    // Count icons in mipmap directories
    let androidPngCount = 0
    for (const mipmapDir of mipmapDirs) {
      const pngFilesInDir = fs.readdirSync(path.join(androidDir, mipmapDir)).filter((f) => f.endsWith('.png'))
      androidPngCount += pngFilesInDir.length
    }

    // Expect 5 densities * 2 launcher icons/density = 10
    expect(androidPngCount).to.eq(10)
  })

  it('runs icons with verbose flag and shows detailed output', async () => {
    const {stdout} = await runCommand(Icons, ['--appName', 'test', '-v'])

    expect(stdout).to.contain("Generating icons for 'test' app...")
    expect(stdout).to.contain('Generating icon')
    expect(stdout).to.contain("Icon '")
    expect(stdout).to.contain("Generated icons for 'test' app.")
  })

  it('handles corrupt image file gracefully', async () => {
    const corruptFile = 'assets/corrupt-icon.png'
    fs.writeFileSync(corruptFile, 'not a valid image')

    try {
      const {stdout} = await runCommand(Icons, ['--appName', 'TestApp', corruptFile])

      // Should handle error gracefully - verify error collection message appears
      // Check if errors were reported (either via warning symbol or "failed to generate" text)
      expect(stdout).to.match(/failed to generate|asset.*failed/i)
    } finally {
      // Cleanup is handled by afterEach
    }
  })
})
