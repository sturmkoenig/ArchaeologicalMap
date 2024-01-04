import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MarkerDB } from "src/app/model/card";
import { Marker } from "leaflet";
import { ICONS, IconService, iconsSorted } from "src/app/services/icon.service";
import { MatSelectChange } from "@angular/material/select";
import { MatCheckboxChange } from "@angular/material/checkbox";

@Component({
  selector: "app-marker-input",
  standalone: false,
  template: `
    @if(this.marker){
    <div>
      <div class="marker-input">
        <mat-checkbox
          [checked]="marker.radius === 0.0"
          (change)="onExact($event)"
          >Exakt</mat-checkbox
        >
        <mat-slider [disabled]="marker.radius === 0.0" [max]="1000" [min]="100">
          <input
            matSliderThumb
            [ngModel]="marker.radius"
            (ngModelChange)="onChangeCircleRadius($event)"
          />
        </mat-slider>
        <mat-form-field>
          <mat-label>Icons</mat-label>
          <mat-select
            [(value)]="marker.icon_name"
            (selectionChange)="setIcon($event)"
          >
            <mat-option
              *ngFor="let iconOption of iconsSorted | keyvalue"
              [value]="iconOption.key"
            >
              <img class="option-icon" src="{{ iconOption.value[1] }}" />
            </mat-option>
          </mat-select>
        </mat-form-field>
        @if(this.selectedIconCategory){
        <mat-button-toggle-group name="fontStyle" aria-label="Font Style">
          <mat-button-toggle
            *ngFor="let icon of iconsSorted[selectedIconCategory]; index as i"
            (click)="setIconVariant(i)"
          >
            <img class="option-icon" src="{{ icon }}" />
          </mat-button-toggle>
        </mat-button-toggle-group>
        }
      </div>
    </div>
    }
  `,
  styles: `
        .marker-input {
          display: flex;
          flex-direction: column;
        }
        .option-icon {
          margin: auto;
          height: 2rem;
          width: 2rem;
        }

mat-button-toggle-group {
  margin-left: 12px;
}
  
  `,
})
export class MarkerInputComponent implements OnChanges {
  @Input()
  marker?: MarkerDB;
  @Output()
  markerChange: EventEmitter<MarkerDB> = new EventEmitter();
  @Output()
  markerMove: EventEmitter<boolean> = new EventEmitter();
  icons = ICONS;
  iconsSorted = iconsSorted;
  icon: keyof typeof ICONS = "iconMiscBlack";
  variant: number = 1;
  selectedIconCategory!: keyof typeof iconsSorted;
  constructor(public iconService: IconService) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    if (!changes["marker"]) {
      return;
    }
    let currentIconCategory = changes["marker"].currentValue.icon_name;
    if (currentIconCategory.match("Red")) {
      this.selectedIconCategory = currentIconCategory.replace("Red", "");
      this.variant = 0;
    } else if (currentIconCategory.match("Black")) {
      this.selectedIconCategory = currentIconCategory.replace("Black", "");
      this.variant = 1;
    }
  }

  getIconNameByPath(iconPath: ICONS) {
    return Object.keys(ICONS)[Object.values(ICONS).indexOf(iconPath)];
  }

  setIcon(newIcon: MatSelectChange) {
    console.log(newIcon);
    this.selectedIconCategory = newIcon.value;
    let iconName: any = this.getIconNameByPath(
      iconsSorted[this.selectedIconCategory][this.variant]
    );
    this.marker!.icon_name = iconName;
    this.markerChange.emit(this.marker);
  }
  setIconVariant(newVariant: number) {
    this.variant = newVariant;
    let iconName: any = this.getIconNameByPath(
      iconsSorted[this.selectedIconCategory][this.variant]
    );
    this.marker!.icon_name = iconName;
    this.markerChange.emit(this.marker);
  }

  setRadius(radius: number) {
    this.marker!.radius = radius;
    this.markerChange.emit(this.marker);
  }

  onChangeCircleRadius(newRadius: number) {
    this.setRadius(newRadius);
  }

  onExact(checked: MatCheckboxChange) {
    if (!this.marker) {
      return;
    }
    if (this.marker.radius === 0.0) {
      this.marker.radius = 100;
    } else {
      this.marker.radius = 0.0;
    }
    this.markerChange.emit(this.marker);
  }

  onMoveMarker() {
    this.markerMove.emit(true);
  }
}
