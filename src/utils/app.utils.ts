/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { readFileSync } from 'node:fs'

export function extractAppName() {
  try {
    const { name } = JSON.parse(readFileSync('./app.json', 'utf8'))
    return name
  } catch {
    return null
  }
}