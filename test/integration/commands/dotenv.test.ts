/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import fs from 'node:fs'
import {afterEach, describe, it} from 'node:test'

import {ExitCode} from '../../../src/cli/errors.js'
import Dotenv from '../../../src/commands/dotenv.js'
import {runCommand} from '../../helpers/run-command.js'

describe('dotenv', () => {
  afterEach(() => {
    for (const file of ['.env', '.env.dev', '.env.prod']) {
      fs.rmSync(file, {force: true})
    }
  })

  it('should fail to run dotenv when no environmentName is specified', async () => {
    const {error} = await runCommand(Dotenv, [])

    assert.equal(error?.exitCode, ExitCode.INVALID_ARGUMENT)
  })

  it('runs dotenv dev', async () => {
    // Arrange

    const testID = randomUUID()
    fs.writeFileSync('.env.dev', `TEST=${testID}`)

    // Act

    const {stdout} = await runCommand(Dotenv, ['dev'])

    // Assert

    assert.ok(stdout.includes('Generating .env from ./.env.dev file...'))

    const envContent = fs.readFileSync('.env', 'utf8')
    assert.equal(envContent, `TEST=${testID}`)
  })

  it('runs dotenv prod', async () => {
    // Arrange

    const testID = randomUUID()
    fs.writeFileSync('.env.prod', `TEST=${testID}`)

    // Act

    const {stdout} = await runCommand(Dotenv, ['prod'])

    // Assert
    assert.ok(stdout.includes('Generating .env from ./.env.prod file...'))

    const envContent = fs.readFileSync('.env', 'utf8')
    assert.ok(envContent.includes(`TEST=${testID}`))
  })

  it('runs dotenv with verbose flag and shows detailed output', async () => {
    // Arrange
    const testID = randomUUID()
    fs.writeFileSync('.env.dev', `TEST=${testID}`)

    // Act
    const {stdout} = await runCommand(Dotenv, ['dev', '-v'])

    // Assert
    assert.ok(stdout.includes('Generating .env from ./.env.dev file...'))
    assert.ok(stdout.includes('Source environment file:'))
    assert.ok(stdout.includes('Removing existing .env file'))
    assert.ok(stdout.includes('Generated new .env file.'))
  })

  it('handles missing environment file gracefully', async () => {
    const {error} = await runCommand(Dotenv, ['nonexistent'])

    assert.equal(error?.exitCode, ExitCode.FILE_NOT_FOUND)
  })

  it('overwrites existing .env file', async () => {
    // Arrange
    fs.writeFileSync('.env', 'OLD_VAR=old_value')
    fs.writeFileSync('.env.dev', 'NEW_VAR=new_value')

    // Act
    const {stdout} = await runCommand(Dotenv, ['dev'])

    // Assert
    assert.ok(stdout.includes('Generated new .env file.'))

    const envContent = fs.readFileSync('.env', 'utf8')
    assert.equal(envContent, 'NEW_VAR=new_value')
    assert.ok(!envContent.includes('OLD_VAR'))
  })

  it('preserves multiline environment variables', async () => {
    // Arrange
    const multilineContent = `VAR1=value1
VAR2=value2
VAR3=line1\\nline2\\nline3`
    fs.writeFileSync('.env.dev', multilineContent)

    // Act
    await runCommand(Dotenv, ['dev'])

    // Assert
    const envContent = fs.readFileSync('.env', 'utf8')
    assert.equal(envContent, multilineContent)
  })
})
