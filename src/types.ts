/*
 * Copyright (c) 2025 ForWarD Software (https://forwardsoftware.solutions/)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface SplashscreenSize {
  density?: string;
  height: number;
  width: number;
}

export interface IconSizeAndroid {
  density: string;
  size: number;
}

export interface IconSizeIOS {
  baseSize: number;
  idiom?: string;
  name: string;
  scales: number[];
}

export interface ContentJsonImage {
  filename: string;
  idiom: string;
  scale: string;
  size?: string;
}

export interface ContentJsonInfo {
  author: string;
  version: number;
}

export interface ContentJson {
  images: ContentJsonImage[];
  info: ContentJsonInfo;
}

export type MaskType = "circle" | "roundedCorners";
