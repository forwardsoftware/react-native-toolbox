import {expect} from 'chai'
import fs from 'node:fs'

import {extractAppName} from '../src/utils/app.utils.js'

describe('extractAppName', () => {
  afterEach(() => {
    fs.rmSync('app.json', {force: true})
  })

  it('returns name from valid app.json', async () => {
    fs.writeFileSync('app.json', JSON.stringify({name: 'TestApp'}))
    expect(await extractAppName()).to.equal('TestApp')
  })

  it('returns undefined when app.json is missing', async () => {
    expect(await extractAppName()).to.be.undefined
  })

  it('returns undefined when app.json has invalid JSON', async () => {
    fs.writeFileSync('app.json', 'not valid json')
    expect(await extractAppName()).to.be.undefined
  })

  it('returns undefined when name property is missing', async () => {
    fs.writeFileSync('app.json', JSON.stringify({version: '1.0.0'}))
    expect(await extractAppName()).to.be.undefined
  })

  it('returns undefined when name property is empty string', async () => {
    fs.writeFileSync('app.json', JSON.stringify({name: ''}))
    expect(await extractAppName()).to.be.undefined
  })

  it('returns undefined when name property is whitespace only', async () => {
    fs.writeFileSync('app.json', JSON.stringify({name: '   '}))
    expect(await extractAppName()).to.be.undefined
  })

  it('returns undefined when name property is not a string', async () => {
    fs.writeFileSync('app.json', JSON.stringify({name: 123}))
    expect(await extractAppName()).to.be.undefined
  })
})
