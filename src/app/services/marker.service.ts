import { ComponentFactoryResolver, Injectable, Injector } from "@angular/core";
import { WebviewWindow } from "@tauri-apps/api/window";
import {
  Circle,
  Icon,
  LatLng,
  LatLngBounds,
  LatLngBoundsExpression,
  Layer,
  Marker,
} from "leaflet";
import { from, Observable, switchMap, zip } from "rxjs";
import { CardDB, CardinalDirection, MarkerDB } from "src/app/model/card";
import { CardService } from "./card.service";
import { ICONS, IconKeys, IconService } from "./icon.service";
import { invoke } from "@tauri-apps/api";
import { MarkerAM } from "../model/marker";
import { createCardDetailsWindow } from "../util/window-util";

export interface CardMarkerLayer {
  card?: CardDB;
  markerDB: MarkerDB;
  markerId: number;
  marker: Marker;
  radius: Layer | null;
}

interface CardTitleMapping {
  id: number;
  title: string;
}

@Injectable({
  providedIn: "root",
})
export class MarkerService {
  iconSizeMap: Map<IconKeys, number> = new Map();
  cardTitleMapping!: CardTitleMapping[];
  constructor(
    private cardService: CardService,
    private iconService: IconService,
  ) {
    this.cardService.readCardTitleMapping().then((ctm) => {
      this.cardTitleMapping = ctm;
    });
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
      const newMarker = new MarkerAM(
        [m.latitude, m.longitude],
        {},
        {
          markerId: m.id!,
          cardId: m.card_id!,
          iconType: m.icon_name,
          radius: m.radius,
          iconSize: this.iconSizeMap.get(m.icon_name),
        },
      );
      return newMarker;
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
    return markersDB.map((m) => {
      const newMarker = new MarkerAM(
        [m.latitude, m.longitude],
        {},
        {
          markerId: m.id!,
          cardId: m.card_id!,
          iconType: m.icon_name,
          radius: m.radius,
          iconSize: this.iconSizeMap.get(m.icon_name),
        },
      );
      return newMarker;
    });
  }

  /**
   * @deprecated
   */
  getCardMarkerLayersInArea(
    directions: CardinalDirection,
  ): Observable<CardMarkerLayer[]> {
    return from(this.cardService.readMarkersInArea(directions)).pipe(
      switchMap((markersDB: MarkerDB[]) => {
        return zip(
          /* TODO refactor: 
            1. filter unique marker.card_id
            2. fetch all cards
            3. set  m.card_i==card.id 
            */
          markersDB.map((m) =>
            this.cardService
              .readCard(m.card_id!)
              .then((c) => this.markerToMapLayer(m, c)),
          ),
        );
      }),
    );
  }

  createNewMarker(cardId: number, newMarker: MarkerDB): Promise<MarkerDB> {
    return invoke("create_marker", { newMarker: newMarker, cardId: cardId });
  }

  markerToMapLayer(markerDB: MarkerDB, cardDB: CardDB): CardMarkerLayer {
    let icon: Icon = new Icon({
      iconUrl: ICONS[markerDB.icon_name].toString(),
      iconSize: [20, 20],
      popupAnchor: [0, 0],
    });
    let iconMarker: Marker = new Marker(
      [markerDB.latitude, markerDB.longitude],
      {
        icon,
        interactive: true,
      },
    );

    iconMarker.bindPopup(MarkerService.createPopupHTML(markerDB, cardDB));

    if (markerDB.radius !== 0.0) {
      let circle = new Circle([markerDB.latitude, markerDB.longitude], {
        className: "fade-in",
        radius: markerDB.radius,
      });
      return {
        card: cardDB,
        markerDB: markerDB,
        markerId: markerDB.id ?? 0,
        marker: iconMarker,
        radius: circle,
      };
    } else {
      return {
        card: cardDB,
        markerDB: markerDB,
        markerId: markerDB.id ?? 0,
        marker: iconMarker,
        radius: null,
      };
    }
  }

  getBounds(markers: MarkerDB[]): LatLngBounds {
    let min_lat = markers.reduce((x, y) => (x.latitude < y.latitude ? x : y));
    let min_lng = markers.reduce((x, y) => (x.longitude < y.longitude ? x : y));
    let max_lat = markers.reduce((x, y) => (x.latitude > y.latitude ? x : y));
    let max_lng = markers.reduce((x, y) => (x.longitude > y.longitude ? x : y));
    let southWest = new LatLng(min_lat.latitude, min_lng.longitude);
    let northEast = new LatLng(max_lat.latitude, max_lng.longitude);
    let bounds: LatLngBounds = new LatLngBounds(southWest, northEast);
    return bounds;
  }

  static createPopupHTML(marker: MarkerDB, card: CardDB): HTMLDivElement {
    const div: HTMLDivElement = document.createElement("div");
    div.innerHTML =
      `<h4>` + card.title + `</h4>` + `<p>` + card.description + `</p>`;
    const button = document.createElement("button");
    button.innerHTML = "Info-Seite Zeigen";
    button.onclick = () => {
      createCardDetailsWindow(marker.card_id!);
    };
    div.appendChild(button);
    return div;
  }
}
