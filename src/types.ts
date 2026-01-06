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
