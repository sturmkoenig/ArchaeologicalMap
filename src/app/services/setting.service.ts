import { Injectable } from "@angular/core";
import { BaseDirectory } from "@tauri-apps/api/path";
import { LatLngBounds } from "leaflet";
import * as fs from "@tauri-apps/plugin-fs";

export type MapSettings = {
  initialMapBounds?: LatLngBounds;
  maxZoomLevel?: number;
  showLabels?: boolean;
};

type MapSettingsWritten = {
  initialMapBounds?: {
    _southWest: [number, number];
    _northEast: [number, number];
  };
  maxZoomLevel?: number;
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
      .readFile(this.mapSettingsFileName, {
        baseDir: BaseDirectory.AppData,
      })
      .catch((_) => {
        return JSON.stringify({ markerClusterGroupOptions: {} });
      })
      .then((content: any) => {
        const decoder = new TextDecoder("utf-8");
        const settings: MapSettingsWritten = JSON.parse(
          decoder.decode(content),
        );
        const returnVal = {
          ...settings,
          initialMapBounds: settings.initialMapBounds
            ? new LatLngBounds(
                settings.initialMapBounds._southWest,
                settings.initialMapBounds._northEast,
              )
            : undefined,
        };
        return returnVal;
      });
  }
}
