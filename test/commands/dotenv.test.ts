/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {expect} from 'chai'
import {randomUUID} from 'node:crypto'
import fs from 'node:fs'

import {ExitCode} from '../../src/cli/errors.js'
import Dotenv from '../../src/commands/dotenv.js'
import {runCommand} from '../helpers/run-command.js'

describe('dotenv', () => {
  afterEach(() => {
    for (const file of ['.env', '.env.dev', '.env.prod']) {
      fs.rmSync(file, {force: true})
    }
  })

  it('should fail to run dotenv when no environmentName is specified', async () => {
    const {error} = await runCommand(Dotenv, [])

    expect(error?.exitCode).to.equal(ExitCode.INVALID_ARGUMENT)
  })

  it('runs dotenv dev', async () => {
    // Arrange

    const testID = randomUUID()
    fs.writeFileSync('.env.dev', `TEST=${testID}`)

    // Act

    const {stdout} = await runCommand(Dotenv, ['dev'])

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

    const {stdout} = await runCommand(Dotenv, ['prod'])

    // Assert
    expect(stdout).to.contain('Generating .env from ./.env.prod file...')

    const envContent = fs.readFileSync('.env', 'utf8')
    expect(envContent).to.contain(`TEST=${testID}`)
  })

  it('runs dotenv with verbose flag and shows detailed output', async () => {
    // Arrange
    const testID = randomUUID()
    fs.writeFileSync('.env.dev', `TEST=${testID}`)

    // Act
    const {stdout} = await runCommand(Dotenv, ['dev', '-v'])

    // Assert
    expect(stdout).to.contain('Generating .env from ./.env.dev file...')
    expect(stdout).to.contain('Source environment file:')
    expect(stdout).to.contain('Removing existing .env file')
    expect(stdout).to.contain('Generated new .env file.')
  })
})
