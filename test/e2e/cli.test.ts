/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {ExitCode} from '../../src/cli/errors.js'
import {runCLI} from '../helpers/run-cli.js'

describe('CLI E2E', () => {
  describe('Global flags', () => {
    it('shows help with --help flag', async () => {
      const {stdout, exitCode} = await runCLI(['--help'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('rn-toolbox'))
      assert.ok(stdout.includes('icons'))
      assert.ok(stdout.includes('splash'))
      assert.ok(stdout.includes('dotenv'))
    })

    it('shows help with -h flag', async () => {
      const {stdout, exitCode} = await runCLI(['-h'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('USAGE'))
    })

    it('shows version with --version flag', async () => {
      const {stdout, exitCode} = await runCLI(['--version'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.match(stdout, /rn-toolbox\/\d+\.\d+\.\d+/)
      assert.ok(stdout.includes('node-'))
    })

    it('shows version with -V flag', async () => {
      const {stdout, exitCode} = await runCLI(['-V'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.match(stdout, /rn-toolbox\/\d+\.\d+\.\d+/)
    })

    it('shows help when no command provided', async () => {
      const {stdout, exitCode} = await runCLI([], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('COMMANDS'))
    })
  })

  describe('Unknown command', () => {
    it('exits with error for unknown command', async () => {
      const {stderr, exitCode} = await runCLI(['unknown'], {dev: true})

      assert.equal(exitCode, ExitCode.INVALID_ARGUMENT)
      assert.ok(stderr.includes('Unknown command: unknown'))
      assert.ok(stderr.includes('Available commands'))
    })

    it('suggests available commands', async () => {
      const {stderr} = await runCLI(['icns'], {dev: true}) // typo

      assert.ok(stderr.includes('icons'))
      assert.ok(stderr.includes('splash'))
      assert.ok(stderr.includes('dotenv'))
    })
  })

  describe('Command help', () => {
    it('shows icons command help', async () => {
      const {stdout, exitCode} = await runCLI(['icons', '--help'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Generate app icons'))
      assert.ok(stdout.includes('--appName'))
      assert.ok(stdout.includes('--verbose'))
    })

    it('shows splash command help', async () => {
      const {stdout, exitCode} = await runCLI(['splash', '--help'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Generate app splashscreens'))
      assert.ok(stdout.includes('--appName'))
    })

    it('shows dotenv command help', async () => {
      const {stdout, exitCode} = await runCLI(['dotenv', '--help'], {dev: true})

      assert.equal(exitCode, ExitCode.SUCCESS)
      assert.ok(stdout.includes('Manage .env files'))
      assert.ok(stdout.includes('ENVIRONMENTNAME'))
    })
  })

  describe('Exit codes', () => {
    it('returns FILE_NOT_FOUND for missing source file', async () => {
      const {exitCode} = await runCLI(['icons', './nonexistent.png', '--appName', 'Test'], {dev: true})

      assert.equal(exitCode, ExitCode.FILE_NOT_FOUND)
    })

    it('returns INVALID_ARGUMENT for missing required arg', async () => {
      const {exitCode} = await runCLI(['dotenv'], {dev: true})

      assert.equal(exitCode, ExitCode.INVALID_ARGUMENT)
    })
  })
})
