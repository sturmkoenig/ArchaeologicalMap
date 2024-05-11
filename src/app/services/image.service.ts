import { Injectable } from "@angular/core";
import { invoke, path } from "@tauri-apps/api";
import { ImageDB, ImageEntity, NewImage } from "../model/image";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { appDataDir } from "@tauri-apps/api/path";

@Injectable({
  providedIn: "root",
})
export class ImageService {
  constructor() {}

  async readImages(): Promise<ImageEntity[]> {
    let imagesDB: ImageDB[] = await invoke("read_images", {});
    let images: ImageEntity[] = [];
    for (let image of imagesDB) {
      let imagePath = await path.join(await appDataDir(), image.image_source);
      images.push({
        id: image.id,
        name: image.name,
        imageSource: convertFileSrc(imagePath),
      });
    }
    return images;
  }

  async readImagesPaginated(
    pageIndex: number,
    pageSize: number,
    titleFilter?: string,
  ): Promise<[ImageEntity[], number]> {
    let [imagesDB, numberOfImages] = (await invoke("read_images_paginated", {
      pageNumber: pageIndex,
      entriesPerPage: pageSize,
      titleFilter: titleFilter,
    })) as [ImageDB[], number];
    let images: ImageEntity[] = [];
    for (let image of imagesDB) {
      let imagePath = await path.join(await appDataDir(), image.image_source);
      images.push({
        id: image.id,
        name: image.name,
        imageSource: convertFileSrc(imagePath),
      });
    }
    return [images, numberOfImages];
  }

  async readImage(imageId: number): Promise<ImageEntity> {
    let imageDB: ImageDB = await invoke("read_image", { imageId: imageId });
    let imageSoure = await path.join(await appDataDir(), imageDB.image_source);
    let image = {
      id: imageDB.id,
      name: imageDB.name,
      imageSource: convertFileSrc(imageSoure),
    };
    return image;
  }

  async createImage(newImage: NewImage): Promise<number> {
    return invoke("create_image", {
      imageName: newImage.name,
      imagePath: newImage.image,
    });
  }

  async deleteImage(imageId: number): Promise<void> {
    return invoke("delete_image", { imageId: imageId });
  }
}
