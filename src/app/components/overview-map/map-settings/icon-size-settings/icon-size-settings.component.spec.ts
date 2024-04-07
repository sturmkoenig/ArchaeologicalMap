import { ComponentFixture, TestBed } from "@angular/core/testing";

import { IconSizeSettingsComponent } from "./icon-size-settings.component";
import { By } from "@angular/platform-browser";
import { MarkerButtonToggleComponent } from "src/app/components/markers/marker-button-toggle/marker-button-toggle.component";
import { iconsSorted } from "src/app/services/icon.service";
import { computed } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("IconSizeSettingsComponent", () => {
  let component: IconSizeSettingsComponent;
  let fixture: ComponentFixture<IconSizeSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IconSizeSettingsComponent,
        MarkerButtonToggleComponent,
        MatFormFieldModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IconSizeSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display all iconCategories", () => {
    const markerButtonToggleDebugEl = fixture.debugElement.queryAll(
      By.directive(MarkerButtonToggleComponent),
    );
    const markerButtonToggleComponent =
      markerButtonToggleDebugEl[0].injector.get(MarkerButtonToggleComponent);

    expect(markerButtonToggleDebugEl.length).toBe(
      Object.keys(iconsSorted).length,
    );
  });

  it("should increment/decrement size correctly", () => {});
});
