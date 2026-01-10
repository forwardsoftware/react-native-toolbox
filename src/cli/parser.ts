/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { parseArgs as nodeParseArgs } from 'node:util'

import type { CommandConfig, FlagConfig, ParsedArgs } from './types.js'

import { CommandError, ExitCode } from './errors.js'

/**
 * Resolves flag default value (supports lazy/async defaults)
 */
async function resolveDefault(config: FlagConfig): Promise<boolean | string | undefined> {
  if (typeof config.default === 'function') {
    return config.default()
  }

  return config.default
}

/**
 * Parses command-line arguments based on command configuration
 */
export async function parseArgs(argv: string[], config: CommandConfig): Promise<ParsedArgs> {
  // Build options config for node:util parseArgs
  const options: Record<string, { multiple?: boolean; short?: string; type: 'boolean' | 'string' }> = {}

  for (const [name, flagConfig] of Object.entries(config.flags)) {
    options[name] = {
      type: flagConfig.type,
      ...(flagConfig.short && { short: flagConfig.short }),
    }
  }

  let values: Record<string, boolean | string | (string | boolean)[] | undefined>
  let positionals: string[]

  try {
    const parsed = nodeParseArgs({
      allowPositionals: true,
      args: argv,
      options,
      strict: true,
    })

    values = parsed.values
    positionals = parsed.positionals
  } catch (err) {
    if (err instanceof Error) {
      throw new CommandError(err.message, ExitCode.INVALID_ARGUMENT)
    }

    throw err
  }

  // Build flags object with defaults
  const flags: Record<string, boolean | string | undefined> = {}

  for (const [name, flagConfig] of Object.entries(config.flags)) {
    if (values[name] !== undefined) {
      flags[name] = values[name] as boolean | string
    } else {
      flags[name] = await resolveDefault(flagConfig)
    }
  }

  // Build args object from positionals
  const args: Record<string, string | undefined> = {}

  for (const [index, argConfig] of config.args.entries()) {
    const value = positionals[index]

    if (value !== undefined) {
      args[argConfig.name] = value
    } else if (argConfig.default !== undefined) {
      args[argConfig.name] = argConfig.default
    } else if (argConfig.required) {
      throw new CommandError(
        `Missing required argument: ${argConfig.name}`,
        ExitCode.INVALID_ARGUMENT,
      )
    }
  }

  return { args, flags }
}
