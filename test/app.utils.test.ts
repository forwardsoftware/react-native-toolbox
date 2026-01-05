import {expect} from 'chai'
import fs from 'node:fs'
import {rimrafSync} from 'rimraf'

import {extractAppName} from '../src/utils/app.utils.js'

describe('extractAppName', () => {
  afterEach(() => {
    rimrafSync('app.json')
  })

  it('returns name from valid app.json', () => {
    fs.writeFileSync('app.json', JSON.stringify({name: 'TestApp'}))
    expect(extractAppName()).to.equal('TestApp')
  })

  it('returns null when app.json is missing', () => {
    expect(extractAppName()).to.be.null
  })

  it('returns null when app.json has invalid JSON', () => {
    fs.writeFileSync('app.json', 'not valid json')
    expect(extractAppName()).to.be.null
  })

  it('returns null when name property is missing', () => {
    fs.writeFileSync('app.json', JSON.stringify({version: '1.0.0'}))
    expect(extractAppName()).to.be.null
  })

  it('returns null when name property is empty string', () => {
    fs.writeFileSync('app.json', JSON.stringify({name: ''}))
    expect(extractAppName()).to.be.null
  })

  it('returns null when name property is whitespace only', () => {
    fs.writeFileSync('app.json', JSON.stringify({name: '   '}))
    expect(extractAppName()).to.be.null
  })

  it('returns null when name property is not a string', () => {
    fs.writeFileSync('app.json', JSON.stringify({name: 123}))
    expect(extractAppName()).to.be.null
  })
})
