import assert from 'node:assert/strict'
import fs from 'node:fs'
import {afterEach, describe, it} from 'node:test'

import {extractAppName} from '../../../src/utils/app.utils.js'

describe('extractAppName', () => {
  afterEach(() => {
    fs.rmSync('app.json', {force: true})
  })

  it('returns name from valid app.json', async () => {
    fs.writeFileSync('app.json', JSON.stringify({name: 'TestApp'}))
    assert.equal(await extractAppName(), 'TestApp')
  })

  it('returns undefined when app.json is missing', async () => {
    assert.equal(await extractAppName(), undefined)
  })

  it('returns undefined when app.json has invalid JSON', async () => {
    fs.writeFileSync('app.json', 'not valid json')
    assert.equal(await extractAppName(), undefined)
  })

  it('returns undefined when name property is missing', async () => {
    fs.writeFileSync('app.json', JSON.stringify({version: '1.0.0'}))
    assert.equal(await extractAppName(), undefined)
  })

  it('returns undefined when name property is empty string', async () => {
    fs.writeFileSync('app.json', JSON.stringify({name: ''}))
    assert.equal(await extractAppName(), undefined)
  })

  it('returns undefined when name property is whitespace only', async () => {
    fs.writeFileSync('app.json', JSON.stringify({name: '   '}))
    assert.equal(await extractAppName(), undefined)
  })

  it('returns undefined when name property is not a string', async () => {
    fs.writeFileSync('app.json', JSON.stringify({name: 123}))
    assert.equal(await extractAppName(), undefined)
  })
})
