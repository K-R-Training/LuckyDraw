export interface Prize {
  id: string;
  name: string;
  imageUrl?: string;
  winner?: string;
}

export enum AppState {
  DASHBOARD = 'DASHBOARD',
  SETUP = 'SETUP',
  DRAWING = 'DRAWING',
  FINISHED = 'FINISHED'
}

export enum AppMode {
  STANDARD = 'STANDARD',
  GIFT_EXCHANGE = 'GIFT_EXCHANGE'
}

export interface GeneratedImageResult {
  prizeId: string;
  base64Image: string;
}