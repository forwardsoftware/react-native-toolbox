/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'

export function checkAssetFile(filePath: string): boolean {
  return existsSync(filePath)
}

export async function mkdirp(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}
