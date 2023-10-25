import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  SimpleChange,
  SimpleChanges,
  OnChanges,
} from "@angular/core";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { MatSelectChange } from "@angular/material/select";
import {
  Circle,
  Icon,
  LatLng,
  LayerGroup,
  LeafletMouseEvent,
  Map as LeafletMap,
  Marker,
  Layer,
  marker,
  LatLngBounds,
} from "leaflet";
import { Leaf } from "parchment/dist/typings/blot/abstract/blot";
import { MarkerDB, MarkerLatLng } from "src/app/model/card";
import { ICONS, IconService } from "src/app/services/icon.service";
import {
  CardMarkerLayer,
  MarkerService,
} from "src/app/services/marker.service";

interface MarkerLayer {
  marker: Marker;
  radius: Layer | undefined;
}
@Component({
  selector: "app-position-picker",
  template: `
    <div class="container">
      <div
        class="overview-map-container rounded-xl shadow-xl hover:shadow-2xl ease-in duration-300"
      >
        <div class="overview-map">
          <app-map
            (map$)="onMapChanged($event)"
            [layers]="[]"
            (click$)="onClick($event)"
          ></app-map>
        </div>
        <button
          [hidden]="!this.editable"
          mat-raised-button
          color="accent"
          (click)="onAdd()"
        >
          + Neuer Marker
        </button>
      </div>
      <ng-container *ngIf="this.editable">
        <div class="controlls-container">
          <div>
            <mat-checkbox (change)="onExact($event)">Exakt</mat-checkbox>
            <mat-slider
              [disabled]="radius === 0.0 || selectedMarker === undefined"
              [max]="1000"
              [min]="100"
            >
              <input
                matSliderThumb
                [ngModel]="radius"
                (ngModelChange)="changeCircleRadius($event)"
              />
            </mat-slider>
          </div>

          <mat-form-field>
            <mat-label>Icons</mat-label>
            <mat-select
              [(value)]="icon"
              (selectionChange)="setIcon($event)"
              [disabled]="this.selectedMarker === undefined"
            >
              <mat-option
                *ngFor="let iconOption of icons | keyvalue"
                [value]="iconOption.key"
              >
                <img class="option-icon" src="{{ iconOption.value }}" />
              </mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-raised-button color="warn" (click)="onDeleteMarker()">
            Marker Entfernen
          </button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .container {
        display: flex;
      }
      .controlls-container {
        height: auto;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        margin-top: 2rem;
        margin-left: 1rem;
        margin-right: 1rem;
      }
      .overview-map {
        height: 400px;
        width: 400px;
        flex-shrink: 0;
        flex-grow: 1;
      }
      .overview-map-container {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .option-icon {
        margin: auto;
        height: 2rem;
        width: 2rem;
      }
    `,
  ],
})
export class PositionPickerComponent implements OnInit {
  @Input()
  markers: MarkerDB[] = [];
  @Output()
  markersChange: EventEmitter<MarkerDB[]> = new EventEmitter();

  markersMap: Map<MarkerDB, MarkerLayer> = new Map();
  selectedCoordinate: LatLng = new LatLng(0, 0);
  circle!: Circle;
  layerGroup: LayerGroup = new LayerGroup();
  map!: LeafletMap;
  selectedMarker?: MarkerDB;
  radius: number = 100;
  icons = ICONS;
  icon: keyof typeof ICONS = "iconMiscBlack";
  @Input()
  editable: boolean = false;

  constructor(
    public iconService: IconService,
    private markerService: MarkerService
  ) {}

  ngOnInit(): void {
    console.log("ng init called");
    console.log(this.markers);
    this.markersMap = new Map();
    this.markers.forEach((marker: MarkerDB) => {
      let markerLayer = this.createLayerFromMarker(marker);
      this.markersMap.set(marker, markerLayer);
      this.layerGroup.addLayer(markerLayer.marker);
      if (markerLayer.radius) {
        this.layerGroup.addLayer(markerLayer.radius);
      }
    });
  }

  setSelectedMarker(marker: MarkerDB) {
    this.selectedMarker = marker;
    this.icon = this.selectedMarker.icon_name;
  }

  onExact(checked: MatCheckboxChange): void {
    if (this.selectedMarker) {
      this.setRadius(0.0);
    } else {
      this.radius = 100;
    }
  }

  onAdd(): void {
    this.selectedMarker = undefined;
  }

  createLayerFromMarker(marker: MarkerDB): MarkerLayer {
    let icon = new Icon({
      iconUrl: this.iconService.getIconPath(marker.icon_name).toString(),
      iconSize: [20, 20],
    });
    let circle: Circle | undefined = undefined;
    if (marker.radius !== 0.0) {
      circle = new Circle(
        {
          lat: marker.latitude,
          lng: marker.longitude,
        },
        {
          radius: marker.radius,
        }
      );
    }
    let markerLayers = new Marker(
      { lat: marker.latitude, lng: marker.longitude },
      { icon }
    ).on("click", () => {
      this.setSelectedMarker(marker);
    });
    return {
      marker: markerLayers,
      radius: circle,
    };
  }
  refreshMarker(marker: MarkerDB, markerLayer: MarkerLayer) {
    this.layerGroup.removeLayer(markerLayer.marker);
    if (markerLayer.radius) {
      this.layerGroup.removeLayer(markerLayer.radius);
    }

    let newMarkerGroup = this.createLayerFromMarker(marker);
    markerLayer.marker = newMarkerGroup.marker;
    markerLayer.radius = newMarkerGroup.radius;
    this.layerGroup.addLayer(markerLayer.marker);
    if (markerLayer.radius) {
      this.layerGroup.addLayer(markerLayer.radius);
    }
    this.markersChange.emit(Array.from(this.markersMap.keys()));
  }

  onDeleteMarker() {
    if (this.selectedMarker) {
      let removedMarkerLayer = this.markersMap.get(this.selectedMarker)!;
      this.layerGroup.removeLayer(removedMarkerLayer.marker);
      if (removedMarkerLayer.radius) {
        this.layerGroup.removeLayer(removedMarkerLayer.radius);
      }
      this.markersMap.delete(this.selectedMarker);
      this.markersChange.emit(Array.from(this.markersMap.keys()));
    }
  }
  createMarker(marker: MarkerDB) {
    let newMarkerGroup = this.createLayerFromMarker(marker);
    this.markersMap.set(marker, newMarkerGroup);
    this.layerGroup.addLayer(newMarkerGroup.marker);
    if (newMarkerGroup.radius) {
      this.layerGroup.addLayer(newMarkerGroup.radius);
    }
    this.markersChange.emit(Array.from(this.markersMap.keys()));
  }

  setCoordinate(marker: MarkerDB, latlng: LatLng) {
    // get coorrect marker
    let markerLayer = this.markersMap.get(this.selectedMarker!)!;
    marker.latitude = latlng.lat;
    marker.longitude = latlng.lng;
    this.refreshMarker(marker, markerLayer);
    this.markersChange.emit(this.markers);
  }

  setRadius(radius: number) {
    let markerLayer = this.markersMap.get(this.selectedMarker!)!;
    this.selectedMarker!.radius = radius;
    this.refreshMarker(this.selectedMarker!, markerLayer);
    this.markersChange.emit(this.markers);
  }

  setIcon($event: MatSelectChange) {
    let markerLayer = this.markersMap.get(this.selectedMarker!)!;
    this.selectedMarker!.icon_name = $event.value;
    this.refreshMarker(this.selectedMarker!, markerLayer);
  }

  onClick(event: LeafletMouseEvent) {
    if (!this.editable) {
      return;
    }
    if (this.selectedMarker) {
      this.setCoordinate(this.selectedMarker, event.latlng);
    } else {
      let marker: MarkerDB = {
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
        radius: this.radius,
        icon_name: this.icon,
      };
      this.createMarker(marker);
      this.selectedMarker = marker;
    }
  }

  centerView() {
    let bounds = this.markerService.getBounds(this.markers);
    this.map.fitBounds(bounds);
  }

  changeCircleRadius(newRadius: number) {
    this.setRadius(newRadius);
  }

  onMapChanged(map$: LeafletMap) {
    this.map = map$;
    this.map.addLayer(this.layerGroup);
    this.centerView();
  }
}
