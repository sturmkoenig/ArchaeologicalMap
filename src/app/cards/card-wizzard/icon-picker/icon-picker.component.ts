import { KeyValue } from "@angular/common";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { MatListOption, MatSelectionListChange } from "@angular/material/list";
import { ICONS, IconService } from "src/app/services/icon.service";

@Component({
  selector: "app-icon-picker",
  template: `<div class="h-auto">
    <mat-selection-list
      [multiple]="false"
      [ngModel]="selectedOption"
      (ngModelChange)="onIconChange($event)"
    >
      <ng-container *ngFor="let icon of icons | keyvalue">
        <mat-list-option class="list-option" [value]="icon.key">
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

  selectedOption;
  @Output()
  icon: EventEmitter<keyof typeof ICONS> = new EventEmitter();

  onIconChange(newIcon: string) {
    this.icon.emit(newIcon.toString() as keyof typeof ICONS);
  }
}
