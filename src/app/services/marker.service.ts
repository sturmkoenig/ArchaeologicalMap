import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  Circle,
  circleMarker,
  Icon,
  LatLng,
  Layer,
  marker,
  Marker,
} from "leaflet";
import { catchError, Observable, of, switchMap } from "rxjs";
import { Map } from "leaflet";
import { Card, CardDB } from "src/app/model/card";
import { CardService } from "./card.service";
import { WebviewWindow } from "@tauri-apps/api/window";
import { IconService } from "./icon.service";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class MarkerService {
  capitals: string = "/assets/data/usa-capitals.geojson";

  constructor(
    private cardService: CardService,
    private http: HttpClient,
    private iconService: IconService
  ) {}

  queryMarkers(): Promise<[Marker, Layer | null][]> {
    return this.cardService.readCards().then((cards: CardDB[]) => {
      let markers: [Marker, Layer | null][] = [];
      cards.forEach((card) => {
        let icon = new Icon({
          iconUrl: this.iconService.getIconPath(card.icon_name).toString(),
          iconSize: [20, 20],
          popupAnchor: [0, 0],
        });
        let iconMarker = new Marker([card.latitude, card.longitude], {
          icon,
          interactive: true,
        });
        const div: HTMLDivElement = createPopupHTML(card);

        iconMarker.bindPopup(div);
        if (card.coordinate_radius !== 0.0) {
          let circle = new Circle([card.latitude, card.longitude], {
            className: "fade-in",
            radius: card.coordinate_radius,
          });
          markers.push([iconMarker, circle]);
        } else {
          markers.push([iconMarker, null]);
        }
      });
      return markers;
    });
  }
}
function createPopupHTML(card: CardDB): HTMLDivElement {
  const div: HTMLDivElement = document.createElement("div");
  div.innerHTML =
    `<h3>` + card.title + `</h3>` + "<p>" + card.description + "</p>";
  const button = document.createElement("button");
  button.innerHTML = "Bearbeiten";
  button.onclick = () => {
    const webview = new WebviewWindow(card.id.toString(), {
      url: "cards/details?id=" + card.id,
    });
    webview.once("tauri://error", function (e) {
      console.log("window creation error: " + JSON.stringify(e));
    });
  };
  div.appendChild(button);
  return div;
}
