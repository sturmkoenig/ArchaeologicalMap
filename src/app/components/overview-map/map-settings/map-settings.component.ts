import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { IconSizeSettingsComponent } from "./icon-size-settings/icon-size-settings.component";
import { IconSizeSetting } from "@service/icon.service";
import { MapSettings, SettingService } from "@service/setting.service";
import {
  MatSlider,
  MatSliderModule,
  MatSliderThumb,
} from "@angular/material/slider";
import { FormsModule } from "@angular/forms";
import { MatCard, MatCardContent } from "@angular/material/card";
import { MatSlideToggle } from "@angular/material/slide-toggle";

@Component({
  selector: "app-map-settings",
  standalone: true,
  imports: [
    IconSizeSettingsComponent,
    MatSlider,
    FormsModule,
    MatSliderThumb,
    MatCard,
    MatCardContent,
    MatSlideToggle,
    MatSliderModule,
  ],
  templateUrl: "./map-settings.component.html",
  styleUrl: "./map-settings.component.css",
})
export class MapSettingsComponent implements OnInit {
  mapSettings: MapSettings = { maxZoomLevel: 1, markerClusterGroupOptions: {} };

  @Output()
  iconSizeChange: EventEmitter<IconSizeSetting> = new EventEmitter();
  @Output()
  mapSettingsChanged: EventEmitter<MapSettings> = new EventEmitter();

  constructor(private settingsService: SettingService) {}

  async ngOnInit() {
    const mapSettings = await this.settingsService.getMapSettings();
    this.mapSettings = { ...this.mapSettings, ...mapSettings };
    this.mapSettings.markerClusterGroupOptions = {
      ...{
        maxClusterRadius: 1,
        disableClusteringAtZoom: 1,
      },
      ...mapSettings.markerClusterGroupOptions,
    };
  }

  onIconSizeChange(iconSizeSetting: IconSizeSetting) {
    this.iconSizeChange.emit(iconSizeSetting);
  }

  async changeMaxClusterRadius() {
    await this.settingsService.updateMapSettings({
      markerClusterGroupOptions: this.mapSettings.markerClusterGroupOptions,
    });
    this.mapSettingsChanged.emit(this.mapSettings);
  }

  async changeMaxZoomLevel() {
    await this.settingsService.updateMapSettings({
      maxZoomLevel: this.mapSettings.maxZoomLevel,
    });
    this.mapSettingsChanged.emit(this.mapSettings);
  }

  async changeShowLabels() {
    this.mapSettings.showLabels = !this.mapSettings.showLabels;
    await this.settingsService.updateMapSettings({
      showLabels: this.mapSettings.showLabels,
    });

    this.mapSettingsChanged.emit(this.mapSettings);
  }

  async changeDisableClusteringAtZoomLevel() {
    await this.settingsService.updateMapSettings({
      markerClusterGroupOptions: this.mapSettings.markerClusterGroupOptions,
    });
    this.mapSettingsChanged.emit(this.mapSettings);
  }
}
