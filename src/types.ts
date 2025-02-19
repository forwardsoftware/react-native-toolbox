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
