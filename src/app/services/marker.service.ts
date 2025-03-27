import { Injectable } from "@angular/core";
import { LatLng, LatLngBounds, Layer, Marker } from "leaflet";
import { Card, CardDB, MarkerDB } from "src/app/model/card";
import { CardService } from "./card.service";
import { IconKeys, IconService } from "./icon.service";
import { invoke } from "@tauri-apps/api/core";
import { createCardDetailsWindow } from "../util/window-util";
import { MarkerAM } from "@app/model/markerAM";

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

  async updateMarker(marker: MarkerDB): Promise<void> {
    return await invoke("update_marker", { marker: marker });
  }

  async getMarker(markerId: number): Promise<MarkerAM> {
    return this.getMarkerDB(markerId).then((m) => {
      return new MarkerAM(
        [m.latitude, m.longitude],
        {},
        {
          cardId: m.card_id!,
          iconType: m.icon_name,
          radius: m.radius,
          iconSize: this.iconSizeMap.get(m.icon_name),
        },
      );
    });
  }

  getMarkerDB(id: number): Promise<MarkerDB> {
    return invoke("read_marker", { id: id });
  }

  async getMarkerAMInArea(bounds: LatLngBounds): Promise<MarkerAM[]> {
    const markersDB = await this.cardService.readMarkersInArea({
      north: bounds.getNorth(),
      east: bounds.getEast(),
      south: bounds.getSouth(),
      west: bounds.getWest(),
    });
    return markersDB.map((card) => {
      return new MarkerAM(
        [card.latitude, card.longitude],
        {},
        {
          cardId: card.id,
          radius: card.radius,
          iconType: card.icon_name,
          iconSize: this.iconSizeMap.get(card.icon_name),
        },
      );
    });
  }

  createNewMarker(cardId: number, newMarker: MarkerDB): Promise<MarkerDB> {
    return invoke("create_marker", { newMarker: newMarker, cardId: cardId });
  }

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
