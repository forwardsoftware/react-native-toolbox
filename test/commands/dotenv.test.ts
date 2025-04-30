import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {randomUUID} from 'node:crypto'
import fs from 'node:fs'
import {rimrafSync} from 'rimraf'

describe('dotenv', () => {
  afterEach(() => {
    rimrafSync(['.env', '.env.dev', '.env.prod'])
  })

  it('should fail to run dotenv when no environmentName is specified', async () => {
    const {error} = await runCommand(['dotenv'])

    expect(error?.oclif?.exit).to.equal(2)
  })

  it('runs dotenv dev', async () => {
    // Arrange

    const testID = randomUUID()
    fs.writeFileSync('.env.dev', `TEST=${testID}`)

    // Act

    const {stdout} = await runCommand(['dotenv', 'dev'])

    // Assert

    expect(stdout).to.contain('Generating .env from ./.env.dev file...')

    const envContent = fs.readFileSync('.env', 'utf8')
    expect(envContent).to.eq(`TEST=${testID}`)
  })

  it('runs dotenv prod', async () => {
    // Arrange

    const testID = randomUUID()
    fs.writeFileSync('.env.prod', `TEST=${testID}`)

    // Act

    const {stdout} = await runCommand(['dotenv', 'prod'])

    // Assert
    expect(stdout).to.contain('Generating .env from ./.env.prod file...')

    const envContent = fs.readFileSync('.env', 'utf8')
    expect(envContent).to.contain(`TEST=${testID}`)
  })
})
