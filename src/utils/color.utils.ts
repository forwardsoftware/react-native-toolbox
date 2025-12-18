/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { styleText } from 'node:util'

/**
 * Color helper functions using util.styleText
 * These functions provide a simple API for terminal text styling
 */

export const cyan = (text: string) => styleText('cyan', text)
export const green = (text: string) => styleText('green', text)
export const red = (text: string) => styleText('red', text)
export const yellow = (text: string) => styleText('yellow', text)
