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
  latLng,
  Layer,
  LayerGroup,
  LeafletMouseEvent,
  Map,
  marker,
  Marker,
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
      <app-map
        #childmap
        (map$)="mapChanged($event)"
        (moveEnd$)="mapMoveEnded($event)"
      ></app-map>
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
    `,
  ],
})
export class OverviewMapComponent implements OnInit, AfterViewInit {
  @Output()
  clickedPosition = new EventEmitter<number[]>();
  @ViewChild("childmap")
  mapComponent!: MapComponent;
  map!: Map;
  position?: Coordinate;
  layerGroup: LayerGroup = new LayerGroup();

  mapChanged(emittedMap: Map) {
    this.map = emittedMap;
  }

  constructor(
    private markerService: MarkerService,
    private route: ActivatedRoute
  ) {
    listen("panTo", (event: any) => {
      this.panToLatLng(event.payload.lat, event.payload.lng);
    });
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
      this.position = {
        longitude: this.route.snapshot.queryParams["longitude"],
        latitude: this.route.snapshot.queryParams["latitude"],
      };
      this.mapComponent.setPosition(this.position);
    }
  }

  ngOnInit(): void {
    appWindow.setTitle("map");
  }
  panToLatLng(lat: number, lng: number) {
    this.map.flyTo({ lat: lat, lng: lng });
  }
}
