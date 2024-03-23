import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MarkerButtonToggleComponent } from "./marker-button-toggle.component";
import { By } from "@angular/platform-browser";
import { ICONS, iconsSorted } from "src/app/services/icon.service";

describe("MarkerButtonToggleComponent", () => {
  let component: MarkerButtonToggleComponent;
  let fixture: ComponentFixture<MarkerButtonToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarkerButtonToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkerButtonToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit a new value when a button is clicked", () => {
    spyOn(component.selectedIcon, "emit");
    const buttonToggles = fixture.debugElement.queryAll(
      By.css("mat-button-toggle-group"),
    );
    if (buttonToggles.length > 0) {
      buttonToggles[0].triggerEventHandler("change", {
        value: ICONS.iconCaveRed,
      });
    }
    expect(component.selectedIcon.emit).toHaveBeenCalledWith("iconCaveRed");
  });
  it("should show the correct icons for the selected icon category", () => {
    for (let cat in iconsSorted) {
      component.iconCategory = cat as keyof typeof iconsSorted;
      fixture.detectChanges();
      const images = fixture.debugElement.queryAll(By.css(".option-icon"));
      expect(images.length > 0).toBeTrue();
      images.forEach((image, index) => {
        const expectedPath =
          component.iconsSorted[component.iconCategory][index];
        const actualPath = new URL(image.nativeElement.src).pathname;
        expect(actualPath).toBe(expectedPath);
      });
    }
  });
});
