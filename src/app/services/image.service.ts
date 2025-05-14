import { Injectable } from "@angular/core";
import { path } from "@tauri-apps/api";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { ImageDB, ImageEntity, NewImage } from "../model/image";
import { appDataDir } from "@tauri-apps/api/path";
import { v4 as uuid } from "uuid";
import * as fs from "@tauri-apps/plugin-fs";

@Injectable({
  providedIn: "root",
})
export class ImageService {
  constructor() {}

  async readImages(): Promise<ImageEntity[]> {
    const imagesDB: ImageDB[] = await invoke("read_images", {});
    const images: ImageEntity[] = [];
    for (const image of imagesDB) {
      const imagePath = await path.join(await appDataDir(), image.image_source);
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
    const [imagesDB, numberOfImages] = (await invoke("read_images_paginated", {
      pageNumber: pageIndex,
      entriesPerPage: pageSize,
      titleFilter: titleFilter,
    })) as [ImageDB[], number];
    const images: ImageEntity[] = [];
    for (const image of imagesDB) {
      const imagePath = await path.join(await appDataDir(), image.image_source);
      images.push({
        id: image.id,
        name: image.name,
        imageSource: convertFileSrc(imagePath),
      });
    }
    return [images, numberOfImages];
  }

  async readImage(imageId?: number): Promise<ImageEntity> {
    if (!imageId) {
      return new Promise(() => undefined);
    }
    const imageDB: ImageDB = await invoke("read_image", { imageId: imageId });
    const imageSoure = await path.join(
      await appDataDir(),
      imageDB.image_source,
    );
    return {
      id: imageDB.id,
      name: imageDB.name,
      imageSource: convertFileSrc(imageSoure),
    };
  }

  async createImage(newImage: NewImage): Promise<number> {
    return invoke("create_image", {
      imageName: newImage.name,
      imagePath: newImage.image,
    });
  }

  async moveImageToAppDir(imagePath: string) {
    const dataDir = await path.appDataDir();
    const filePath: string = imagePath;
    const fileEnding = filePath.substring(filePath.lastIndexOf(".") + 1);
    const newFileName = uuid() + "." + fileEnding;

    const copyPath = await path.join(dataDir, "content", "images", newFileName);
    await fs.copyFile(imagePath, copyPath);
    return { imagePath: copyPath, imageName: newFileName };
  }

  convertFileSrc(fileUrl: string) {
    return convertFileSrc(fileUrl);
  }

  async getImageUrl(image_name: string): Promise<void | string> {
    const dataDir = await path.appDataDir();
    const imagePath = await path.join(dataDir, "content", "images", image_name);
    return convertFileSrc(imagePath);
  }
  updateImageName(id: number, newName: string) {
    return invoke("update_image_name", { imageId: id, newName: newName });
  }

  async deleteImage(image: ImageEntity): Promise<void> {
    return invoke("delete_image", { imageName: image.name, imageId: image.id });
  }
}
