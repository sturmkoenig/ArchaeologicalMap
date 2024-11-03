import { Injectable } from "@angular/core";
import { BaseDirectory } from "@tauri-apps/api/path";
import { LatLng, LatLngBounds } from "leaflet";
import * as fs from "@tauri-apps/plugin-fs";

export type MapSettings = {
  initialMapBounds?: LatLngBounds;
  maxClusterSize?: number;
  maxZoomLevel?: number;
  showLabels?: boolean;
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
    console.log(
      "json stringify:",
      JSON.stringify({ ...currentMapSettings, ...mapSettings }),
    );
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
      .then((content) => {
        const settings: any = JSON.parse(content);
        return {
          initialMapBounds: settings.initialMapBounds
            ? new LatLngBounds(
                settings.initialMapBounds!._southWest,
                settings.initialMapBounds!._northEast,
              )
            : undefined,
          maxClusterSize: settings.maxClusterSize,
          maxZoomLevel: settings.maxZoomLevel ?? 7,
          showLabels: settings.showLabels,
        };
      });
  }
}
