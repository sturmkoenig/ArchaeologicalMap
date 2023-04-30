import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Circle, circleMarker, LatLng, Layer, marker, Marker } from "leaflet";
import { catchError, Observable, of, switchMap } from "rxjs";
import { Map } from "leaflet";
import { Card, CardDB } from "src/app/model/card";
import { CardService } from "./card.service";

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
        circle.bindPopup(
          `<div><h3>` +
            card.title +
            `</h1></div><a href="cards/details?id=` +
            card.id +
            `"> click to see details</a>`
        );
        markers.push(circle);
      });
      return markers;
    });
  }
}
