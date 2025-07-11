import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { LocationData } from "@app/model/card";
import { ICONS, IconService, iconsSorted } from "@service/icon.service";
import { MatSelectChange, MatSelectModule } from "@angular/material/select";
import { MatCheckbox, MatCheckboxChange } from "@angular/material/checkbox";
import { MatSliderModule } from "@angular/material/slider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MarkerButtonToggleComponent } from "@app/components/markers/marker-button-toggle/marker-button-toggle.component";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { KeyValuePipe, NgForOf } from "@angular/common";

@Component({
  selector: "app-marker-input",
  imports: [
    MatCheckbox,
    MatSliderModule,
    MatFormFieldModule,
    MatSelectModule,
    MarkerButtonToggleComponent,
    MatInputModule,
    FormsModule,
    KeyValuePipe,
    NgForOf,
  ],
  template: `
    @if (this.marker) {
      <div>
        <div class="marker-input">
          <mat-checkbox
            [checked]="this.marker.radius === 0.0"
            (change)="onExact($event)"
            >Exakt
          </mat-checkbox>
          <mat-slider
            [disabled]="this.marker.radius === 0.0"
            [max]="1000"
            [min]="100"
          >
            <input
              matSliderThumb
              [ngModel]="this.marker.radius"
              (ngModelChange)="onChangeCircleRadius($event)"
            />
          </mat-slider>
          <mat-form-field>
            <mat-label>Icons</mat-label>
            <mat-select
              [(value)]="this.marker.iconName"
              (selectionChange)="setIcon($event)"
            >
              <mat-option
                *ngFor="let iconOption of iconsSorted | keyvalue"
                [value]="iconOption.key"
              >
                <img
                  class="option-icon"
                  src="{{ iconOption.value[1] }}"
                  alt="icon {{ iconOption.value }}"
                />
              </mat-option>
            </mat-select>
          </mat-form-field>
          @if (this.selectedIconCategory) {
            <app-marker-button-toggle
              [iconCategory]="this.selectedIconCategory"
              (selectedIcon)="this.setIconVariant($event)"
            ></app-marker-button-toggle>
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
    }

    mat-button-toggle-group {
      margin: 0px 20px 50px;
    }
  `,
})
export class MarkerInputComponent implements OnChanges {
  @Input()
  marker?: LocationData;
  @Output()
  markerChange: EventEmitter<LocationData> = new EventEmitter();
  @Output()
  markerMove: EventEmitter<boolean> = new EventEmitter();
  icons = ICONS;
  iconsSorted = iconsSorted;
  icon: keyof typeof ICONS = "iconMiscBlack";
  selectedIconCategory!: keyof typeof iconsSorted;
  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes["marker"]) {
      return;
    }
    const currentIconCategory = changes["marker"].currentValue.iconName;
    if (currentIconCategory.match("Red")) {
      this.selectedIconCategory = currentIconCategory.replace("Red", "");
    } else if (currentIconCategory.match("Black")) {
      this.selectedIconCategory = currentIconCategory.replace("Black", "");
    }
  }

  setIcon(newIcon: MatSelectChange) {
    this.selectedIconCategory = newIcon.value;
    this.marker!.iconName = IconService.getIconNameByPath(
      iconsSorted[this.selectedIconCategory][0],
    );
    this.markerChange.emit(this.marker);
  }
  setIconVariant(iconName: keyof typeof ICONS) {
    this.marker!.iconName = iconName;
    this.markerChange.emit(this.marker);
  }

  setRadius(radius: number) {
    this.marker!.radius = radius;
    this.markerChange.emit(this.marker);
  }

  onChangeCircleRadius(newRadius: number) {
    this.setRadius(newRadius);
  }

  onExact(_: MatCheckboxChange) {
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
