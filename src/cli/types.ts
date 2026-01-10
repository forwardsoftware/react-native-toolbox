/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface ArgConfig {
  default?: string
  description: string
  name: string
  required?: boolean
}

export interface FlagConfig {
  default?: (() => Promise<string | undefined> | string | undefined) | boolean | string
  description: string
  short?: string
  type: 'boolean' | 'string'
}

export interface CommandConfig {
  args: ArgConfig[]
  description: string
  examples: string[]
  flags: Record<string, FlagConfig>
  name: string
}

export interface ParsedArgs {
  args: Record<string, string | undefined>
  flags: Record<string, boolean | string | undefined>
}
