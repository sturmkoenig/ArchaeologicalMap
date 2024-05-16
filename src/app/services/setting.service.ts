import { Injectable } from "@angular/core";
import { fs } from "@tauri-apps/api";
import {
  BaseDirectory,
  appConfigDir,
  appDataDir,
  join,
} from "@tauri-apps/api/path";
import { LatLng, LatLngBounds, LatLngBoundsExpression } from "leaflet";

@Injectable({
  providedIn: "root",
})
export class SettingService {
  mapSettingsFileName: string = "map-settings.json";
  constructor() {}

  async setIconSizeSettings() {}

  async getIconSizeSettings() {}

  async saveMapBoundingBox(latLngBounds: LatLngBoundsExpression) {
    await fs.writeFile(this.mapSettingsFileName, JSON.stringify(latLngBounds), {
      dir: BaseDirectory.AppData,
    });
  }

  async loadMapBoundingBox(): Promise<any> {
    let mapSettingsExist: boolean = await fs.exists(this.mapSettingsFileName, {
      dir: BaseDirectory.AppData,
    });
    if (!mapSettingsExist) {
      return undefined;
    }
    return fs
      .readTextFile(this.mapSettingsFileName, { dir: BaseDirectory.AppData })
      .then((mapSettings) => {
        let response = JSON.parse(mapSettings);
        let southWest: LatLng = new LatLng(
          response._southWest.lat,
          response._southWest.lng,
        );
        let northEast: LatLng = new LatLng(
          response._northEast.lat,
          response._northEast.lng,
        );
        let latLngBounds: LatLngBounds = new LatLngBounds(southWest, northEast);
        return latLngBounds;
      });
  }
}
