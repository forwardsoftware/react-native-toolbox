import { runCommand } from '@oclif/test'
import { expect } from 'chai'

describe('icons', () => {
  it('should fail to run icons when no app.json file exists', async () => {
    const { error } = await runCommand(['icons'])

    expect(error?.oclif?.exit).to.equal(2)
  })

  it('runs icons --appName test', async () => {
    const { stdout } = await runCommand(['icons', '--appName test'])

    expect(stdout).to.contain("Generating icons for 'test' app...")
  })
})
