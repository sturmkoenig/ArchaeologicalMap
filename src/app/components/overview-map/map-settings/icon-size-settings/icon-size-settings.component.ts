import { Component, EventEmitter, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ICONS,
  IconService,
  iconsSorted as IconCategories,
  IconCategoriesKeys,
  IconKeys,
  IconSizeSetting,
} from "src/app/services/icon.service";
import { MarkerButtonToggleComponent } from "src/app/components/markers/marker-button-toggle/marker-button-toggle.component";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-icon-size-settings",
  standalone: true,
  imports: [
    CommonModule,
    MarkerButtonToggleComponent,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
  ],
  template: `
    <div class="icons-settings">
      @for (iconCategory of iconsSorted | keyvalue; track iconCategory) {
        <div class="icon-setting">
          <div class="selected-icon-configurator">
            <img
              class="selected-icon-configurator__img"
              [src]="getIconPath(getSelectedIcon(iconCategory.key))"
            />
            <div class="selected-icon-configurator__form">
              <mat-form-field appearance="outline">
                <mat-label>Value</mat-label>
                <input
                  matInput
                  type="number"
                  [value]="
                    getPixelSizeForIcon(
                      asIconKey(getSelectedIcon(iconCategory.key))
                    )
                  "
                  (change)="
                    onPixelSizeChange(
                      asIconKey(getSelectedIcon(iconCategory.key)),
                      $event
                    )
                  "
                  [min]="5"
                  [max]="40"
                />
              </mat-form-field>
            </div>
          </div>
          <app-marker-button-toggle
            (selectedIcon)="
              selectIconforCategory(asCategory(iconCategory.key), $event)
            "
            [iconCategory]="typeCastToIconCategory(iconCategory.key)"
          ></app-marker-button-toggle>
        </div>
      }
    </div>
  `,
  styles: `
    .selected-icon-configurator {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: row;
      gap: 10px;

      &__img {
        height: 50px;
      }
    }

    .icons-settings {
      margin: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 20px;
    }
  `,
})
export class IconSizeSettingsComponent {
  icons = ICONS;
  iconsSorted = IconCategories;
  selectedIconsMap: Map<IconCategoriesKeys, IconKeys> = new Map();
  iconSizeMap: Map<IconKeys, number> = new Map();
  @Output()
  iconSizeChange: EventEmitter<IconSizeSetting> = new EventEmitter();

  constructor(private iconService: IconService) {
    iconService
      .getIconSizeSettings()
      .then((oldIconSizeSettings: Map<IconKeys, number>) => {
        for (let iconCat of Object.keys(IconCategories)) {
          this.selectedIconsMap.set(
            iconCat as IconCategoriesKeys,
            IconService.getIconNameByPath(
              IconCategories[iconCat as IconCategoriesKeys][1],
            ),
          );
        }
        for (let icon of Object.keys(ICONS)) {
          this.iconSizeMap.set(
            icon as IconKeys,
            oldIconSizeSettings.get(icon as IconKeys) ?? 20,
          );
        }
      });
  }

  typeCastToIconCategory(key: string): keyof typeof IconCategories {
    return key as keyof typeof IconCategories;
  }

  selectIconforCategory(
    iconCategory: IconCategoriesKeys,
    selectedIcon: IconKeys,
  ) {
    this.selectedIconsMap.set(iconCategory, selectedIcon);
  }

  asCategory(iconCategory: string) {
    return iconCategory as IconCategoriesKeys;
  }

  asIconKey(iconKey: string) {
    return iconKey as IconKeys;
  }

  getSelectedIcon(iconCategory: any) {
    let selectedIcon = this.selectedIconsMap.get(iconCategory);
    return selectedIcon ?? ICONS.iconMiscBlack;
  }

  getIconPath(iconName: string) {
    return ICONS[iconName as IconKeys];
  }

  onPixelSizeChange(iconKey: IconKeys, newSize: Event) {
    const inputValue = (newSize.target as HTMLInputElement).value;
    const numberValue = parseInt(inputValue);
    this.iconService.writeIconSizeSetting(iconKey, numberValue);
    this.iconSizeChange.emit({
      iconType: iconKey,
      iconSize: numberValue,
    });
  }

  getPixelSizeForIcon(x: IconKeys): number {
    return this.iconSizeMap.get(x) ?? 20;
  }
}
