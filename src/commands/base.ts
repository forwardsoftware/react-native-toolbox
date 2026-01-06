/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Command } from '@oclif/core'

export abstract class BaseCommand extends Command {
  protected _isVerbose: boolean = false

  protected logVerbose(message?: string, ...args: unknown[]) {
    if (this._isVerbose) {
      this.log(message, ...args)
    }
  }
}
