import { runCommand } from '@oclif/test'
import { expect } from 'chai'

describe('splash', () => {
  it('should fail to run splash when no app.json file exists', async () => {
    const { error } = await runCommand(['splash'])

    expect(error?.oclif?.exit).to.equal(2)
  })


  it('runs splash --appName test', async () => {
    const { stdout } = await runCommand(['splash', '--appName', 'test'])

    expect(stdout).to.contain("Generating splashscreens for 'test' app...")
  })
})
