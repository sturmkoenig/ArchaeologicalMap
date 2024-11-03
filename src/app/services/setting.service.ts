import { Injectable } from "@angular/core";
import { BaseDirectory } from "@tauri-apps/api/path";
import { LatLng, LatLngBounds } from "leaflet";
import * as fs from "@tauri-apps/plugin-fs";

export type MapSettings = {
  initialMapBounds?: LatLngBounds;
  maxClusterSize?: number;
};

@Injectable({
  providedIn: "root",
})
export class SettingService {
  mapSettingsFileName: string = "map-settings.json";
  constructor() {}

  async getMapSettings(): Promise<MapSettings> {
    return this.readMapSettingsFile();
  }
  async updateMapSettings(mapSettings: Partial<MapSettings>): Promise<void> {
    const enc = new TextEncoder();
    const currentMapSettings = await this.readMapSettingsFile();
    await fs.writeFile(
      this.mapSettingsFileName,
      enc.encode(JSON.stringify({ ...currentMapSettings, ...mapSettings })),
      {
        baseDir: BaseDirectory.AppData,
      },
    );
  }

  async readMapSettingsFile(): Promise<MapSettings> {
    return fs
      .readTextFile(this.mapSettingsFileName, {
        baseDir: BaseDirectory.AppData,
      })
      .then((mapSettings) => {
        const response: any = JSON.parse(mapSettings);
        return {
          initialMapBounds: new LatLngBounds(
            response.initialMapBounds!._southWest,
            response.initialMapBounds!._northEast,
          ),
          maxClusterSize: response.maxClusterSize ?? 80,
        };
      });
  }
}
