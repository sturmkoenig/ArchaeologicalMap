import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  Map,
  latLng,
  MapOptions,
  tileLayer,
  Layer,
  LeafletMouseEvent,
} from "leaflet";

@Component({
  selector: "app-map",
  template: `<div
    class="map-container"
    leaflet
    [leafletOptions]="options"
    [leafletLayers]="layers"
    (leafletMapReady)="onMapReady($event)"
    (leafletMapMoveEnd)="onMapMoveEnd()"
    (leafletClick)="click$.emit($event)"
  ></div>`,
  styles: [
    `
      .map-container {
        width: 100%;
        height: 100%;
      }
    `,
  ],
  standalone: false,
})
export class MapComponent {
  @Output() map$: EventEmitter<Map> = new EventEmitter();
  @Output() zoom$: EventEmitter<number> = new EventEmitter();
  @Output() click$: EventEmitter<LeafletMouseEvent> = new EventEmitter();
  @Output() moveEnd$: EventEmitter<void> = new EventEmitter();
  @Input() layers: Layer[] = [];
  @Input() options: MapOptions = {
    layers: [
      tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        opacity: 0.7,
        maxZoom: 19,
        detectRetina: false,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }),
    ],
    zoom: 5,
    center: latLng(53.009325188114076, 13.160270365480752),
  };
  public map!: Map;
  public zoom!: number;
  constructor() {}

  onMapReady(map: Map) {
    this.map = map;
    this.map$.emit(map);
    this.zoom = map.getZoom();
    this.zoom$.emit(this.zoom);
  }

  onMapMoveEnd() {
    this.moveEnd$.emit();
  }
}
