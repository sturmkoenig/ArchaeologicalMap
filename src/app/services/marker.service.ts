import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { WebviewWindow } from "@tauri-apps/api/window";
import { Circle, Icon, LatLng, LatLngBounds, Layer, Marker } from "leaflet";
import { from, Observable, switchMap, zip } from "rxjs";
import { CardDB, CardinalDirection, MarkerDB } from "src/app/model/card";
import { v4 as uuidv4 } from "uuid";
import { CardService } from "./card.service";
import { IconService } from "./icon.service";

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
  cardTitleMapping!: CardTitleMapping[];
  constructor(
    private cardService: CardService,
    private http: HttpClient,
    private iconService: IconService
  ) {
    this.cardService.readCardTitleMapping().then((ctm) => {
      this.cardTitleMapping = ctm;
    });
  }

  getMarkersInArea(
    directions: CardinalDirection
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
              .then((c) => this.markerToMapLayer(m, c))
          )
        );
      })
    );
  }

  markerToMapLayer(markerDB: MarkerDB, cardDB: CardDB): CardMarkerLayer {
    let icon = new Icon({
      iconUrl: this.iconService.getIconPath(markerDB.icon_name).toString(),
      iconSize: [20, 20],
      popupAnchor: [0, 0],
    });
    let iconMarker = new Marker([markerDB.latitude, markerDB.longitude], {
      icon,
      interactive: true,
    });
    const div: HTMLDivElement = createPopupHTML(markerDB, cardDB);
    iconMarker.bindPopup(div);
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
}

function createPopupHTML(marker: MarkerDB, card: CardDB): HTMLDivElement {
  const div: HTMLDivElement = document.createElement("div");
  div.innerHTML =
    `<h3>` + card.title + `</h3>` + `<p>` + card.description + `</p>`;
  const button = document.createElement("button");
  button.innerHTML = "Info-Seite Zeigen";
  button.onclick = () => {
    const webview = new WebviewWindow(uuidv4(), {
      url: "cards/details?id=" + marker.card_id,
    });
    webview.once("tauri://error", function (e) {
      console.error("window creation error: " + JSON.stringify(e));
    });
  };
  div.appendChild(button);
  return div;
}
