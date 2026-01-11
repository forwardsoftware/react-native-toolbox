/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'

/**
 * Checks if an asset file exists at the specified path.
 * 
 * @param filePath - The path to the asset file
 * @returns true if the file exists, false otherwise
 */
export function checkAssetFile(filePath: string): boolean {
  return existsSync(filePath)
}

/**
 * Creates a directory and all necessary parent directories.
 * 
 * @param path - The path to create
 */
export async function mkdirp(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}
