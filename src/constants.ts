/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SplashscreenSize } from "./types.js"

/**
 * Android Assets Sizes
 */

export const ICON_SIZES_ANDROID = [
  {
    density: 'mdpi',
    size: 48,
  },
  {
    density: 'hdpi',
    size: 72,
  },
  {
    density: 'xhdpi',
    size: 96,
  },
  {
    density: 'xxhdpi',
    size: 144,
  },
  {
    density: 'xxxhdpi',
    size: 192,
  },
]

export const SPLASHSCREEN_SIZES_ANDROID: Array<SplashscreenSize> = [
  {
    density: 'ldpi',
    height: 320,
    width: 200,
  },
  {
    density: 'mdpi',
    height: 480,
    width: 320,
  },
  {
    density: 'hdpi',
    height: 800,
    width: 480,
  },
  {
    density: 'xhdpi',
    height: 1280,
    width: 720,
  },
  {
    density: 'xxhdpi',
    height: 1600,
    width: 960,
  },
  {
    density: 'xxxhdpi',
    height: 1920,
    width: 1280,
  },
]

/**
 * iOS Assets Sizes
 */

export const ICON_SIZES_IOS = [
  {
    baseSize: 20,
    name: 'Icon-Notification',
    scales: [2, 3],
  },
  {
    baseSize: 29,
    name: 'Icon-Small',
    scales: [2, 3],
  },
  {
    baseSize: 40,
    name: 'Icon-Spotlight-40',
    scales: [2, 3],
  },
  {
    baseSize: 60,
    name: 'Icon-60',
    scales: [2, 3],
  },
  {
    baseSize: 1024,
    idiom: 'ios-marketing',
    name: 'iTunesArtwork',
    scales: [1],
  },
]

export const SPLASHSCREEN_SIZES_IOS: Array<SplashscreenSize> = [
  {
    height: 480,
    width: 320,
  },
  {
    density: '2x',
    height: 1334,
    width: 750,
  },
  {
    density: '3x',
    height: 2208,
    width: 1242,
  },
]
