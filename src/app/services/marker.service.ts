import { Injectable } from "@angular/core";
import { LatLng, LatLngBounds } from "leaflet";
import { isLocationCard, LocationData } from "@app/model/card";
import { CardService } from "./card.service";
import { IconKeys, IconService } from "./icon.service";
import { MarkerAM } from "@app/model/markerAM";
import { NotificationService } from "@service/notification.service";

@Injectable({
  providedIn: "root",
})
export class MarkerService {
  iconSizeMap: Map<IconKeys, number> = new Map();
  constructor(
    private cardService: CardService,
    private iconService: IconService,
    private notificationService: NotificationService,
  ) {
    this.iconService
      .getIconSizeSettings()
      .then((iconSizeMap: Map<IconKeys, number>) => {
        this.iconSizeMap = iconSizeMap;
      });
  }

  async getMarker(cardId: number): Promise<MarkerAM | undefined> {
    return this.cardService
      .readCard(cardId)
      .then((card) => {
        if (!isLocationCard(card)) {
          throw new Error("Karte hat keinen marker!");
        }
        return new MarkerAM([card.latitude, card.longitude], {}, card, {
          iconSize: this.iconSizeMap.get(card.iconName),
        });
      })
      .catch((error: string) => {
        this.notificationService.createNotification({ text: error });
        return undefined;
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
        iconSize: this.iconSizeMap.get(card.iconName),
      });
    });
  }

  /**
   * @deprecated
   */
  getBounds(markers: LocationData[]): LatLngBounds {
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
