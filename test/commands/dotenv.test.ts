import { runCommand } from '@oclif/test'
import { expect } from 'chai'

describe('dotenv', () => {
  it('should fail to run dotenv when no environmentName is specified', async () => {
    const { error } = await runCommand(['dotenv'])

    expect(error?.oclif?.exit).to.equal(2)
  })

  it('runs dotenv dev', async () => {
    const { stdout } = await runCommand(['dotenv', 'dev'])

    expect(stdout).to.contain('Generating .env from ./.env.dev file...')
  })

  it('runs dotenv prod', async () => {
    const { stdout } = await runCommand(['dotenv', 'prod'])

    expect(stdout).to.contain('Generating .env from ./.env.prod file...')
  })
});
