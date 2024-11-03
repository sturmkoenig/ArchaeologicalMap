import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { IconSizeSettingsComponent } from "./icon-size-settings/icon-size-settings.component";
import { IconSizeSetting } from "../../../services/icon.service";
import { MapSettings, SettingService } from "../../../services/setting.service";
import { MatSlider, MatSliderThumb } from "@angular/material/slider";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-map-settings",
  standalone: true,
  imports: [IconSizeSettingsComponent, MatSlider, FormsModule, MatSliderThumb],
  templateUrl: "./map-settings.component.html",
  styleUrl: "./map-settings.component.css",
})
export class MapSettingsComponent implements OnInit {
  mapSettings: MapSettings = {};
  @Output()
  iconSizeChange: EventEmitter<IconSizeSetting> = new EventEmitter();
  @Output()
  mapSettingsChanged: EventEmitter<MapSettings> = new EventEmitter();

  constructor(private settingsService: SettingService) {}

  async ngOnInit() {
    this.mapSettings = await this.settingsService.getMapSettings();
  }

  onIconSizeChange(iconSizeSetting: IconSizeSetting) {
    this.iconSizeChange.emit(iconSizeSetting);
  }

  async changeMaxClusterRadius() {
    await this.settingsService.updateMapSettings({
      maxClusterSize: this.mapSettings.maxClusterSize,
    });
    this.mapSettingsChanged.emit(this.mapSettings);
  }
}
