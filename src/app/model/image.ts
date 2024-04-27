export interface NewImage {
  id?: number;
  name: string;
  description: string;
  image: string;
}
export interface ImageDB {
  id: number;
  name: string;
  description: string;
  image_source: string;
}

export interface ImageEntity {
  id: number;
  name: string;
  description: string;
  imageSource: string;
}
