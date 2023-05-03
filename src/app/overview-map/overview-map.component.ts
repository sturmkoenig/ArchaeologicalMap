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
  latLng,
  Layer,
  LeafletMouseEvent,
  Marker,
} from "leaflet";
import { Observable } from "rxjs";
import { MarkerService } from "../services/marker.service";
import { MapComponent } from "../layout/map/map.component";
import { Coordinate } from "../model/card";

@Component({
  selector: "app-overview-map",
  template: `
    <div class="overview-map">
      <app-map #childmap [layers]="mapLayers"></app-map>
    </div>
  `,
  styles: [
    `
      .overview-map {
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
    `,
  ],
})
export class OverviewMapComponent implements OnInit, AfterViewInit {
  @Output()
  clickedPosition = new EventEmitter<number[]>();
  @ViewChild("childmap")
  mapComponent!: MapComponent;

  position?: Coordinate;
  mapLayers: Layer[] = [];

  constructor(
    private markerService: MarkerService,
    private route: ActivatedRoute
  ) {
    this.markerService.queryMarkers().then((cardMarkers) => {
      cardMarkers.forEach((marker) => {
        this.mapLayers.push(marker);
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
