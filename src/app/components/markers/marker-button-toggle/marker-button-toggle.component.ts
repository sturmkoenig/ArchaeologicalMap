import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import {
  ICONS,
  IconService,
  iconsSorted,
} from "../../../services/icon.service";

@Component({
    selector: "app-marker-button-toggle",
    imports: [CommonModule, MatButtonModule, MatButtonToggleModule],
    template: `
    <mat-button-toggle-group
      name="fontStyle"
      aria-label="Font Style"
      (change)="onSelectIcon($event.value)"
    >
      <mat-button-toggle
        *ngFor="let icon of iconsSorted[iconCategory]; index as i"
        [value]="icon"
      >
        <img class="option-icon" src="{{ icon }}" />
      </mat-button-toggle>
    </mat-button-toggle-group>
  `,
    styles: `
    .option-icon {
      margin: auto;
      height: 2rem;
    }

    mat-button-toggle-group {
      margin: 20px;
      margin-top: 0px;
      margin-bottom: 50px;
    }
  `
})
export class MarkerButtonToggleComponent {
  @Output()
  selectedIcon: EventEmitter<keyof typeof ICONS> = new EventEmitter();
  iconsSorted = iconsSorted;
  @Input()
  iconCategory!: keyof typeof iconsSorted;

  onSelectIcon(selectedIconType: ICONS) {
    let icon: keyof typeof ICONS =
      IconService.getIconNameByPath(selectedIconType);
    this.selectedIcon.emit(icon);
  }
}
