import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PopupService } from './popup.service';
import { DefaultService } from 'src/generated/api/default.service';
import { Circle, circleMarker, LatLng, latLng, Layer, Marker } from 'leaflet';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { Map } from 'leaflet';
import { Card } from 'src/generated/model/card';

@Injectable({
  providedIn: 'root',
})
export class MarkerService {
  capitals: string = '/assets/data/usa-capitals.geojson';

  constructor(
    private amService: DefaultService,
    private http: HttpClient,
    private popupService: PopupService
  ) {}

  static scaledRadius(val: number, maxVal: number): number {
    return 20 * (val / maxVal);
  }

  queryMarkers(): Observable<Layer[]> {
    return this.amService.cardGet().pipe(
      switchMap((cards: Card[]) => {
        let markers: Layer[] = [];
        cards.forEach((card) => {
          let latLng = new LatLng(
            card.coordinate.latitude ?? 0,
            card.coordinate.longitude ?? 0
          );
          let circle = new Circle(latLng, {
            radius: 200,
          });
          console.log(card);
          circle.bindPopup(
            `<div><h3>` +
              card.name +
              `</h1></div><a href="cards/details?id=` +
              card.id +
              `"> click to see details</a>`
          );
          markers.push(circle);
        });
        return of(markers);
      })
    );
  }
}
