import { Injectable } from "@angular/core";
import { BaseDirectory } from "@tauri-apps/api/path";
import {
  latLng,
  LatLng,
  LatLngBounds,
  MarkerClusterGroupOptions,
} from "leaflet";
import * as fs from "@tauri-apps/plugin-fs";

export type MapSettings = {
  initialMapBounds?: LatLngBounds;
  maxZoomLevel?: number;
  markerClusterGroupOptions: MarkerClusterGroupOptions;
  showLabels?: boolean;
};

@Injectable({
  providedIn: "root",
})
export class SettingService {
  mapSettingsFileName: string = "map-settings.json";

  async getMapSettings(): Promise<MapSettings> {
    return this.readMapSettingsFile();
  }
  async updateMapSettings(mapSettings: Partial<MapSettings>): Promise<void> {
    const currentMapSettings = await this.readMapSettingsFile();
    await fs.writeTextFile(
      this.mapSettingsFileName,
      JSON.stringify({ ...currentMapSettings, ...mapSettings }),
      {
        baseDir: BaseDirectory.AppData,
      },
    );
  }

  async readMapSettingsFile(): Promise<MapSettings> {
    return await fs
      .readTextFile(this.mapSettingsFileName, {
        baseDir: BaseDirectory.AppData,
      })
      .then((content) => {
        const settings: any = JSON.parse(content);
        return {
          ...settings,
          initialMapBounds: settings.initialMapBounds
            ? new LatLngBounds(
                settings.initialMapBounds._southWest,
                settings.initialMapBounds._northEast,
              )
            : undefined,
        };
      });
  }
}
