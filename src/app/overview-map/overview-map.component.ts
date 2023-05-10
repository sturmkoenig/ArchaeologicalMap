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

@Component({
  selector: "app-overview-map",
  template: `
    <div class="overview-map">
      <app-map
        #childmap
        (map$)="mapChanged($event)"
        [layers]="mapLayers"
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
  mapLayers: Layer[] = [];

  mapChanged(emittedMap: Map) {
    console.log(emittedMap);
    this.map = emittedMap;
  }

  constructor(
    private markerService: MarkerService,
    private route: ActivatedRoute
  ) {
    this.markerService.queryMarkers().then((cardMarkers) => {
      cardMarkers.forEach((marker) => {
        marker[0].on("mouseover", (e) => {
          if (marker[1] != null) {
            console.log("hover mouse!");
            if (marker[1] != null) {
              this.map.addLayer(marker[1]);
            }
          }
        });
        marker[0].on("mouseout", (e) => {
          console.log("mouse out");
          if (marker[1] !== null) {
            this.map.removeLayer(marker[1]);
          }
        });
        this.map.addLayer(marker[0]);
      });
    });
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

  ngOnInit(): void {}
}
