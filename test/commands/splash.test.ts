import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import fs from 'node:fs'
import path from 'node:path'
import {rimrafSync} from 'rimraf'

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
    const {error} = await runCommand(['splash'])

    expect(error?.oclif?.exit).to.equal(2)
  })

  it('runs splash --appName test and generates expected files', async () => {
    const {stdout} = await runCommand(['splash', '--appName', 'test'])

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
})
