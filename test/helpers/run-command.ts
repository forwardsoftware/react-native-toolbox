/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { stripVTControlCharacters } from 'node:util'

import type { BaseCommand } from '../../src/commands/base.js'

import { CommandError } from '../../src/cli/errors.js'

export interface CommandResult {
  error?: CommandError
  stderr: string
  stdout: string
}

export async function runCommand(
  CommandClass: new () => BaseCommand,
  args: string[],
): Promise<CommandResult> {
  const stdout: string[] = []
  const stderr: string[] = []

  // Capture console output
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn

  console.log = (...logArgs: unknown[]) => {
    stdout.push(logArgs.map((a) => String(a)).join(' '))
  }

  console.warn = (...warnArgs: unknown[]) => {
    stderr.push(warnArgs.map((a) => String(a)).join(' '))
  }

  console.error = (...errorArgs: unknown[]) => {
    stderr.push(errorArgs.map((a) => String(a)).join(' '))
  }

  let error: CommandError | undefined

  try {
    const command = new CommandClass()
    await command.run(args)
  } catch (err) {
    if (err instanceof CommandError) {
      error = err
    } else {
      // Restore console before re-throwing
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
      throw err
    }
  } finally {
    console.log = originalLog
    console.warn = originalWarn
    console.error = originalError
  }

  return {
    error,
    stderr: stripVTControlCharacters(stderr.join('\n')),
    stdout: stripVTControlCharacters(stdout.join('\n')),
  }
}
