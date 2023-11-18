import { Injectable } from "@angular/core";
import { LatLngBounds } from "leaflet";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class MapPositionService {
  mapPosition?: BehaviorSubject<LatLngBounds>;
  constructor() {}
}
