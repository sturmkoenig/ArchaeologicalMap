import { Injectable } from "@angular/core";
import { LatLng, LatLngBounds, Layer, Marker } from "leaflet";
import { CardDB, MarkerDB } from "src/app/model/card";
import { CardService } from "./card.service";
import { IconKeys, IconService } from "./icon.service";
import { invoke } from "@tauri-apps/api/core";
import { MarkerAM } from "@app/model/markerAM";

/**
 * @deprecated
 */
export interface CardMarkerLayer {
  card?: CardDB;
  markerDB: MarkerDB;
  markerId: number;
  marker: Marker;
  radius: Layer | null;
}

@Injectable({
  providedIn: "root",
})
export class MarkerService {
  iconSizeMap: Map<IconKeys, number> = new Map();
  constructor(
    private cardService: CardService,
    private iconService: IconService,
  ) {
    this.iconService
      .getIconSizeSettings()
      .then((iconSizeMap: Map<IconKeys, number>) => {
        this.iconSizeMap = iconSizeMap;
      });
  }
  /**
   * @deprecated
   */
  async updateMarker(marker: MarkerDB): Promise<void> {
    return await invoke("update_marker", { marker: marker });
  }

  async getMarker(markerId: number): Promise<MarkerAM> {
    return this.cardService.readCard(markerId).then((card) => {
      return new MarkerAM([card.latitude, card.longitude], {}, card, {
        iconSize: this.iconSizeMap.get(card.icon_name),
      });
    });
  }

  async getMarkerAMInArea(bounds: LatLngBounds): Promise<MarkerAM[]> {
    const markersDB = await this.cardService.readCardsInArea({
      north: bounds.getNorth(),
      east: bounds.getEast(),
      south: bounds.getSouth(),
      west: bounds.getWest(),
    });
    return markersDB.map((card) => {
      return new MarkerAM([card.latitude, card.longitude], {}, card, {
        iconSize: this.iconSizeMap.get(card.icon_name),
      });
    });
  }

  /**
   * @deprecated
   */
  getBounds(markers: MarkerDB[]): LatLngBounds {
    const min_lat = markers.reduce((x, y) => (x.latitude < y.latitude ? x : y));
    const min_lng = markers.reduce((x, y) =>
      x.longitude < y.longitude ? x : y,
    );
    const max_lat = markers.reduce((x, y) => (x.latitude > y.latitude ? x : y));
    const max_lng = markers.reduce((x, y) =>
      x.longitude > y.longitude ? x : y,
    );
    const southWest = new LatLng(min_lat.latitude, min_lng.longitude);
    const northEast = new LatLng(max_lat.latitude, max_lng.longitude);
    return new LatLngBounds(southWest, northEast);
  }
}
