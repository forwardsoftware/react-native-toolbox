import {expect} from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import {checkAssetFile, mkdirp} from '../../src/utils/file-utils.js'

describe('file-utils', () => {
  const testDir = 'test-file-utils-temp'

  afterEach(() => {
    fs.rmSync(testDir, {force: true, recursive: true})
  })

  describe('checkAssetFile', () => {
    it('returns true when file exists', () => {
      const testFile = path.join(testDir, 'test.txt')
      fs.mkdirSync(testDir, {recursive: true})
      fs.writeFileSync(testFile, 'test content')

      const result = checkAssetFile(testFile)

      expect(result).to.be.true
    })

    it('returns false when file does not exist', () => {
      const result = checkAssetFile(path.join(testDir, 'nonexistent.txt'))

      expect(result).to.be.false
    })

    it('returns true when directory exists', () => {
      fs.mkdirSync(testDir, {recursive: true})

      const result = checkAssetFile(testDir)

      expect(result).to.be.true
    })

    it('returns false for empty string path', () => {
      const result = checkAssetFile('')

      expect(result).to.be.false
    })
  })

  describe('mkdirp', () => {
    it('creates a single directory', async () => {
      const dirPath = path.join(testDir, 'new-dir')

      await mkdirp(dirPath)

      expect(fs.existsSync(dirPath)).to.be.true
      expect(fs.statSync(dirPath).isDirectory()).to.be.true
    })

    it('creates nested directories', async () => {
      const dirPath = path.join(testDir, 'level1', 'level2', 'level3')

      await mkdirp(dirPath)

      expect(fs.existsSync(dirPath)).to.be.true
      expect(fs.statSync(dirPath).isDirectory()).to.be.true
    })

    it('does not throw error if directory already exists', async () => {
      const dirPath = path.join(testDir, 'existing-dir')
      fs.mkdirSync(dirPath, {recursive: true})

      await mkdirp(dirPath)

      expect(fs.existsSync(dirPath)).to.be.true
    })

    it('creates directory with complex path', async () => {
      const dirPath = path.join(testDir, 'android', 'app', 'src', 'main', 'res')

      await mkdirp(dirPath)

      expect(fs.existsSync(dirPath)).to.be.true
      expect(fs.statSync(dirPath).isDirectory()).to.be.true
    })
  })
})
