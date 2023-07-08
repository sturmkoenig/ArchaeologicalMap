import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  Bounds,
  Circle,
  circleMarker,
  Icon,
  LatLng,
  LatLngBounds,
  LatLngBoundsExpression,
  Layer,
  marker,
  Marker,
} from "leaflet";
import { catchError, Observable, of, switchMap } from "rxjs";
import { Map } from "leaflet";
import { CardDB, CardinalDirection, MarkerDB } from "src/app/model/card";
import { CardService } from "./card.service";
import { WebviewWindow } from "@tauri-apps/api/window";
import { IconService } from "./icon.service";
import { Router } from "@angular/router";
import { v4 as uuidv4 } from "uuid";

export interface CardMarkerLayer {
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

  getMarkersInArea(directions: CardinalDirection): Promise<CardMarkerLayer[]> {
    return this.cardService
      .readMarkersInArea(directions)
      .then((markersDB: MarkerDB[]) => {
        let markers: CardMarkerLayer[] = [];
        markersDB.forEach((markerDB) => {
          markers.push(this.markerToMapLayer(markerDB));
        });
        return markers;
      });
  }

  markerToMapLayer(markerDB: MarkerDB): CardMarkerLayer {
    let icon = new Icon({
      iconUrl: this.iconService.getIconPath(markerDB.icon_name).toString(),
      iconSize: [20, 20],
      popupAnchor: [0, 0],
    });
    let iconMarker = new Marker([markerDB.latitude, markerDB.longitude], {
      icon,
      interactive: true,
    });
    // TODO get card title from cache
    let title: string =
      this.cardTitleMapping.find((obj) => obj.id === markerDB.card_id)?.title ??
      "Kein Titel Vorhanden";
    const div: HTMLDivElement = createPopupHTML(markerDB, title);
    iconMarker.bindPopup(div);
    if (markerDB.radius !== 0.0) {
      let circle = new Circle([markerDB.latitude, markerDB.longitude], {
        className: "fade-in",
        radius: markerDB.radius,
      });
      return { markerId: markerDB.id ?? 0, marker: iconMarker, radius: circle };
    } else {
      return { markerId: markerDB.id ?? 0, marker: iconMarker, radius: null };
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

function createPopupHTML(marker: MarkerDB, title: string): HTMLDivElement {
  const div: HTMLDivElement = document.createElement("div");
  div.innerHTML = `<h3>` + title + `</h3>`;
  const button = document.createElement("button");
  button.innerHTML = "Bearbeiten";
  button.onclick = () => {
    const webview = new WebviewWindow(uuidv4(), {
      url: "cards/details?id=" + marker.card_id,
    });
    webview.once("tauri://error", function (e) {
      console.log("window creation error: " + JSON.stringify(e));
    });
  };
  div.appendChild(button);
  return div;
}
