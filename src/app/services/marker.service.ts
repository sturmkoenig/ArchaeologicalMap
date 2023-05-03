import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Circle, circleMarker, LatLng, Layer, marker, Marker } from "leaflet";
import { catchError, Observable, of, switchMap } from "rxjs";
import { Map } from "leaflet";
import { Card, CardDB } from "src/app/model/card";
import { CardService } from "./card.service";
import { WebviewWindow } from "@tauri-apps/api/window";

@Injectable({
  providedIn: "root",
})
export class MarkerService {
  capitals: string = "/assets/data/usa-capitals.geojson";

  constructor(private cardService: CardService, private http: HttpClient) {}

  static scaledRadius(val: number, maxVal: number): number {
    return 20 * (val / maxVal);
  }

  queryMarkers(): Promise<Layer[]> {
    return this.cardService.readCards().then((cards: CardDB[]) => {
      let markers: Layer[] = [];
      cards.forEach((card) => {
        let circle = new Circle([card.latitude, card.longitude], {
          radius: 200,
        });
        const div: HTMLDivElement = createPopupHTML(card);
        circle.bindPopup(div);
        markers.push(circle);
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
