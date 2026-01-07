import {expect} from 'chai'
import fs from 'node:fs'
import path from 'node:path'
import {rimrafSync} from 'rimraf'

import {ExitCode} from '../../src/cli/errors.js'
import Splash from '../../src/commands/splash.js'
import {runCommand} from '../helpers/run-command.js'

describe('splash', () => {
  before(() => {
    fs.mkdirSync('assets', {recursive: true})
    fs.copyFileSync('test/assets/splashscreen.png', 'assets/splashscreen.png')
  })

  after(() => {
    rimrafSync('assets')
  })

  afterEach(() => {
    rimrafSync(['android', 'ios'])
  })

  it('should fail to run splash when no app.json file exists', async () => {
    const {error} = await runCommand(Splash, [])

    expect(error?.exitCode).to.equal(ExitCode.CONFIG_ERROR)
  })

  it('runs splash --appName test and generates expected files', async () => {
    const {stdout} = await runCommand(Splash, ['--appName', 'test'])

    expect(stdout).to.contain("Generating splashscreens for 'test' app...")
    expect(stdout).to.contain("Generated splashscreens for 'test' app.")

    // Check for iOS output directory and Contents.json
    const iosDir = path.join('ios', 'test', 'Images.xcassets', 'Splashscreen.imageset')
    expect(fs.existsSync(path.join(iosDir, 'Contents.json'))).to.be.true

    // Check for iOS image files (expecting at least one)
    const iosSplashImages = fs.readdirSync(iosDir).filter((f) => f.endsWith('.png'))
    expect(iosSplashImages.length).to.eq(3)

    // Check for Android output directories and image files
    const androidDir = path.join('android', 'app', 'src', 'main', 'res')
    expect(fs.existsSync(androidDir)).to.be.true

    // Count drawable directories
    const drawableDirs = fs.readdirSync(androidDir).filter((f) => f.startsWith('drawable-'))
    expect(drawableDirs.length).to.eq(6)

    // Count icons in drawable directories
    let androidSplashscreensCount = 0
    for (const drawableDir of drawableDirs) {
      const pngFilesInDir = fs.readdirSync(path.join(androidDir, drawableDir)).filter((f) => f.endsWith('.png'))
      androidSplashscreensCount += pngFilesInDir.length
    }

    // Expect 6 densities * 1 splashscreen = 6
    expect(androidSplashscreensCount).to.eq(6)
  })

  it('runs splash with verbose flag and shows detailed output', async () => {
    const {stdout} = await runCommand(Splash, ['--appName', 'test', '-v'])

    expect(stdout).to.contain("Generating splashscreens for 'test' app...")
    expect(stdout).to.contain('Generating splashscreen')
    expect(stdout).to.contain("Generated splashscreens for 'test' app.")
  })

  it('handles corrupt image file gracefully', async () => {
    const corruptFile = 'assets/corrupt-splash.png'
    fs.writeFileSync(corruptFile, 'not a valid image')

    try {
      const {stdout} = await runCommand(Splash, ['--appName', 'TestApp', corruptFile])

      // Should handle error gracefully - verify error collection message appears
      // Check if errors were reported (either via warning symbol or "failed to generate" text)
      expect(stdout).to.match(/failed to generate|asset.*failed/i)
    } finally {
      // Cleanup is handled by afterEach
    }
  })
})
