import { listen } from "@tauri-apps/api/event";
import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  circle,
  Circle,
  icon,
  Icon,
  LatLng,
  latLng,
  Layer,
  LayerGroup,
  LeafletMouseEvent,
  Map,
  MapOptions,
  marker,
  Marker,
  tileLayer,
} from "leaflet";
import { Observable } from "rxjs";
import { MarkerService } from "../services/marker.service";
import { MapComponent } from "../layout/map/map.component";
import { Coordinate } from "../model/card";
import { resolveResource } from "@tauri-apps/api/path";
import { appWindow } from "@tauri-apps/api/window";
import { s } from "@tauri-apps/api/app-5190a154";
import { P } from "@tauri-apps/api/event-30ea0228";

export interface Compas {
  north: number;
  south: number;
  west: number;
  east: number;
}
@Component({
  selector: "app-overview-map",
  template: `
    <div class="overview-map">
      <div
        class="map-container"
        leaflet
        [leafletOptions]="options"
        [leafletLayers]="layers"
        [leafletMarkerCluster]="layers"
        (leafletMapReady)="onMapReady($event)"
        (leafletMapMoveEnd)="mapMoveEnded($event)"
        (leafletClick)="click$.emit($event)"
      ></div>
    </div>
  `,
  styles: [
    `
      .overview-map {
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
      .fade-in {
        animation: ease-in 1s;
      }
      .map-container {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class OverviewMapComponent implements OnInit, AfterViewInit {
  zoom$: EventEmitter<number> = new EventEmitter();
  click$: EventEmitter<LeafletMouseEvent> = new EventEmitter();
  moveEnd$: EventEmitter<any> = new EventEmitter();
  centerCoordinate?: Coordinate;
  layers: Layer[] = [];
  @Output()
  clickedPosition = new EventEmitter<number[]>();
  position?: LatLng;
  layerGroup: LayerGroup = new LayerGroup();
  options: MapOptions = {
    layers: [
      tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
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

  constructor(
    private markerService: MarkerService,
    private route: ActivatedRoute
  ) {
    listen("panTo", (event: any) => {
      this.panToLatLng(event.payload.lat, event.payload.lng);
    });
  }

  setPosition(coordinate: Coordinate) {
    let newLatLng = new LatLng(coordinate.latitude, coordinate.longitude);
    this.map.panTo(newLatLng);
  }

  onMapReady(map: Map) {
    this.map = map;
    this.zoom = map.getZoom();
    this.zoom$.emit(this.zoom);
  }

  mapChanged(emittedMap: Map) {
    this.map = emittedMap;
  }

  createHoverCoordinateRadius(marker: Marker, radius: Layer | null) {
    marker.on("mouseover", (e) => {
      if (radius != null) {
        this.layerGroup.addLayer(radius);
      }
    });
    marker.on("mouseout", (e) => {
      if (radius !== null) {
        this.layerGroup.removeLayer(radius);
      }
    });
  }

  mapMoveEnded($event: any) {
    let bounds = this.map.getBounds();

    if (this.map.getZoom() < 8) {
      this.map.removeLayer(this.layerGroup);
      return;
    }
    this.markerService
      .queryMarkersInArea(
        bounds.getNorth(),
        bounds.getEast(),
        bounds.getSouth(),
        bounds.getWest()
      )
      .then((cardMarkers) => {
        this.map.removeLayer(this.layerGroup);
        this.layerGroup = new LayerGroup();
        cardMarkers.forEach((marker) => {
          this.layerGroup.addLayer(marker[0]);
          this.createHoverCoordinateRadius(marker[0], marker[1]);
        });
        this.map.addLayer(this.layerGroup);
      });
    // this.markerService.queryMarkers().then(())
  }
  ngAfterViewInit(): void {
    if (
      this.route.snapshot.queryParams["longitude"] &&
      this.route.snapshot.queryParams["latitude"]
    ) {
      this.position = new LatLng(
        this.route.snapshot.queryParams["latitude"],
        this.route.snapshot.queryParams["longitude"]
      );
      this.map.panTo(this.position);
    }
  }

  ngOnInit(): void {
    appWindow.setTitle("map");
  }
  panToLatLng(lat: number, lng: number) {
    this.map.flyTo({ lat: lat, lng: lng });
  }
}
