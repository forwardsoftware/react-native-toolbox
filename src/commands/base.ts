/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CommandConfig, ParsedArgs } from '../cli/types.js'
import type { ExitCodeValue } from '../cli/errors.js'

import { CommandError, ExitCode } from '../cli/errors.js'
import { generateCommandHelp } from '../cli/help.js'
import { parseArgs } from '../cli/parser.js'
import { yellow } from '../utils/color.utils.js'

export abstract class BaseCommand {
  protected _isVerbose = false

  abstract readonly config: CommandConfig

  abstract execute(parsed: ParsedArgs): Promise<void>

  async run(argv: string[]): Promise<void> {
    const parsed = await parseArgs(argv, this.config)

    // Handle help flag
    if (parsed.flags.help) {
      this.log(generateCommandHelp(this.config))
      return
    }

    this._isVerbose = Boolean(parsed.flags.verbose)
    await this.execute(parsed)
  }

  protected error(message: string, exitCode: ExitCodeValue = ExitCode.GENERAL_ERROR): never {
    throw new CommandError(message, exitCode)
  }

  protected log(...args: unknown[]): void {
    console.log(...args)
  }

  protected logVerbose(...args: unknown[]): void {
    if (this._isVerbose) {
      console.log(...args)
    }
  }

  protected warn(...args: unknown[]): void {
    console.warn(yellow('Warning:'), ...args)
  }
}

export { CommandError, ExitCode } from '../cli/errors.js'
export type { CommandConfig, ParsedArgs } from '../cli/types.js'
