/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGUMENT: 2,
  FILE_NOT_FOUND: 3,
  CONFIG_ERROR: 4,
  GENERATION_ERROR: 5,
} as const

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode]

export class CommandError extends Error {
  constructor(
    message: string,
    public readonly exitCode: ExitCodeValue = ExitCode.GENERAL_ERROR,
  ) {
    super(message)
    this.name = 'CommandError'
  }
}
