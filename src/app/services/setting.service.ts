import { Injectable } from "@angular/core";
import { BaseDirectory } from "@tauri-apps/api/path";
import { LatLng, LatLngBounds, LatLngBoundsExpression } from "leaflet";
import * as fs from "@tauri-apps/plugin-fs";

@Injectable({
  providedIn: "root",
})
export class SettingService {
  mapSettingsFileName: string = "map-settings.json";
  constructor() {}

  async setIconSizeSettings() {}

  async getIconSizeSettings() {}

  async saveMapBoundingBox(latLngBounds: LatLngBoundsExpression) {
    const enc = new TextEncoder();
    await fs.writeFile(
      this.mapSettingsFileName,
      enc.encode(JSON.stringify(latLngBounds)),
      {
        baseDir: BaseDirectory.AppData,
      },
    );
  }

  async loadMapBoundingBox(): Promise<any> {
    const mapSettingsExist: boolean = await fs.exists(
      this.mapSettingsFileName,
      {
        baseDir: BaseDirectory.AppData,
      },
    );
    if (!mapSettingsExist) {
      return undefined;
    }
    return fs
      .readTextFile(this.mapSettingsFileName, {
        baseDir: BaseDirectory.AppData,
      })
      .then((mapSettings) => {
        const response = JSON.parse(mapSettings);
        const southWest: LatLng = new LatLng(
          response._southWest.lat,
          response._southWest.lng,
        );
        const northEast: LatLng = new LatLng(
          response._northEast.lat,
          response._northEast.lng,
        );
        const latLngBounds: LatLngBounds = new LatLngBounds(
          southWest,
          northEast,
        );
        return latLngBounds;
      });
  }
}
