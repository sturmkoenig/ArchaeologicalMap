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
import { StackCreatorComponent } from "@app/components/stacks/stack-creator/stack-creator.component";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatButton } from "@angular/material/button";

@Component({
  selector: "app-map-settings",
  imports: [
    IconSizeSettingsComponent,
    MatSlider,
    FormsModule,
    MatSliderThumb,
    MatCard,
    MatCardContent,
    MatDialogModule,
    MatSliderModule,
    MatButton,
  ],
  templateUrl: "./map-settings.component.html",
  styleUrl: "./map-settings.component.css",
})
export class MapSettingsComponent implements OnInit {
  mapSettings: MapSettings = { maxZoomLevel: 1 };

  @Output()
  iconSizeChange: EventEmitter<IconSizeSetting> = new EventEmitter();
  @Output()
  mapSettingsChanged: EventEmitter<MapSettings> = new EventEmitter();

  constructor(
    private settingsService: SettingService,
    private dialog: MatDialog,
  ) {}

  async ngOnInit() {
    const mapSettings = await this.settingsService.getMapSettings();
    this.mapSettings = { ...this.mapSettings, ...mapSettings };
  }

  onIconSizeChange(iconSizeSetting: IconSizeSetting) {
    this.iconSizeChange.emit(iconSizeSetting);
  }

  async changeMaxClusterRadius() {
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

  onAddStack() {
    this.dialog.open(StackCreatorComponent, {
      enterAnimationDuration: "200ms",
      exitAnimationDuration: "150ms",
    });
  }
}
