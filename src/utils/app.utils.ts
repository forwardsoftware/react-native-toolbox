/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {readFile} from 'node:fs/promises'

export async function extractAppName(): Promise<string | undefined> {
  try {
    const content = await readFile('./app.json', {encoding: 'utf8'})
    const parsed = JSON.parse(content)

    if (typeof parsed.name !== 'string' || parsed.name.trim() === '') {
      return undefined
    }

    return parsed.name
  } catch {
    return undefined
  }
}
