/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { red } from '../utils/color.utils.js'

import type { ExitCodeValue } from './errors.js'

import { ExitCode } from './errors.js'

export function log(...args: unknown[]): void {
  console.log(...args)
}

export function warn(...args: unknown[]): void {
  console.warn(...args)
}

export function error(message: string, exitCode: ExitCodeValue = ExitCode.GENERAL_ERROR): never {
  console.error(red(message))
  process.exit(exitCode)
}

export function logVerbose(isVerbose: boolean, ...args: unknown[]): void {
  if (isVerbose) {
    console.log(...args)
  }
}
