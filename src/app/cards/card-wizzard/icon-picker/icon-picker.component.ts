import { Component } from "@angular/core";
import { ICONS, IconService } from "src/app/services/icon.service";

@Component({
  selector: "app-icon-picker",
  template: `<div class="h-auto">
    <mat-selection-list [multiple]="false">
      <ng-container *ngFor="let icon of icons | keyvalue">
        <mat-list-option class="list-option">
          <img
            class="option-icon"
            src="{{ icon.value }}"
            alt="Photo of a Shiba Inu"
          />
        </mat-list-option>
      </ng-container>
    </mat-selection-list>
  </div> `,
  styles: [
    `
      .list-option {
        height: auto;
      }
      .option-icon {
        height: 4rem;
        width: 4rem;
        margin: 1rem;
      }
    `,
  ],
})
export class IconPickerComponent {
  constructor() {}

  icons = ICONS;
}
