import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {afterEach, describe, it} from 'node:test'

import {checkAssetFile, mkdirp} from '../../../src/utils/file-utils.js'

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

      assert.ok(result)
    })

    it('returns false when file does not exist', () => {
      const result = checkAssetFile(path.join(testDir, 'nonexistent.txt'))

      assert.equal(result, false)
    })

    it('returns true when directory exists', () => {
      fs.mkdirSync(testDir, {recursive: true})

      const result = checkAssetFile(testDir)

      assert.ok(result)
    })

    it('returns false for empty string path', () => {
      const result = checkAssetFile('')

      assert.equal(result, false)
    })
  })

  describe('mkdirp', () => {
    it('creates a single directory', async () => {
      const dirPath = path.join(testDir, 'new-dir')

      await mkdirp(dirPath)

      assert.ok(fs.existsSync(dirPath))
      assert.ok(fs.statSync(dirPath).isDirectory())
    })

    it('creates nested directories', async () => {
      const dirPath = path.join(testDir, 'level1', 'level2', 'level3')

      await mkdirp(dirPath)

      assert.ok(fs.existsSync(dirPath))
      assert.ok(fs.statSync(dirPath).isDirectory())
    })

    it('does not throw error if directory already exists', async () => {
      const dirPath = path.join(testDir, 'existing-dir')
      fs.mkdirSync(dirPath, {recursive: true})

      await mkdirp(dirPath)

      assert.ok(fs.existsSync(dirPath))
    })

    it('creates directory with complex path', async () => {
      const dirPath = path.join(testDir, 'android', 'app', 'src', 'main', 'res')

      await mkdirp(dirPath)

      assert.ok(fs.existsSync(dirPath))
      assert.ok(fs.statSync(dirPath).isDirectory())
    })
  })
})
