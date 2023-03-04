import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  SimpleChanges,
} from "@angular/core";
import {
  Map,
  latLng,
  MapOptions,
  tileLayer,
  ZoomAnimEvent,
  marker,
  Layer,
  LeafletMouseEvent,
  LatLng,
} from "leaflet";
import { Coordinate } from "src/generated";

@Component({
  selector: "app-map",
  template: `<div
    class="map-container"
    leaflet
    [leafletOptions]="options"
    [leafletLayers]="layers"
    [leafletMarkerCluster]="layers"
    (leafletMapReady)="onMapReady($event)"
    (leafletClick)="click$.emit($event)"
  ></div>`,
  styles: [
    `
      .map-container {
        width: 100%;
        height: 100%;
        position: inherit;
      }
    `,
  ],
})
export class MapComponent {
  @Output() map$: EventEmitter<Map> = new EventEmitter();
  @Output() zoom$: EventEmitter<number> = new EventEmitter();
  @Output() click$: EventEmitter<LeafletMouseEvent> = new EventEmitter();
  @Input() centerCoordinate?: Coordinate;
  @Input() layers: Layer[] = [];
  @Input() options: MapOptions = {
    layers: [
      tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        opacity: 0.7,
        maxZoom: 19,
        detectRetina: true,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }),
    ],
    zoom: 16,
    center: latLng(53.009325188114076, 13.160270365480752),
  };
  public map!: Map;
  public zoom!: number;
  constructor() {}

  setPosition(coordinate: Coordinate) {
    let newLatLng = new LatLng(coordinate.latitude, coordinate.longitude);
    this.map.panTo(newLatLng);
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.map.clearAllEventListeners;
    this.map.remove();
  }

  onMapReady(map: Map) {
    this.map = map;
    this.map$.emit(map);
    this.zoom = map.getZoom();
    this.zoom$.emit(this.zoom);
  }
}
