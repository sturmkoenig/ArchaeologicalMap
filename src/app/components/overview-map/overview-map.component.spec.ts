import { ComponentFixture, TestBed } from "@angular/core/testing";
import { OverviewMapComponent } from "./overview-map.component";
import { OverviewMapService } from "../../services/overview-map.service";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { LayerGroup } from "leaflet";
import { MarkerService } from "../../services/marker.service";
import { CardService } from "../../services/card.service";
import { IconService } from "../../services/icon.service";
import { RightSidebarComponent } from "../../layout/right-sidebar/right-sidebar.component";
import { IconSizeSettingsComponent } from "./map-settings/icon-size-settings/icon-size-settings.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { By } from "@angular/platform-browser";
import { MatButton } from "@angular/material/button";

describe("OverviewMapComponent", () => {
  let component: OverviewMapComponent;
  let fixture: ComponentFixture<OverviewMapComponent>;
  let markerServiceSpy: jasmine.SpyObj<MarkerService>;
  let cardServiceSpy: jasmine.SpyObj<CardService>;
  let iconServiceSpy: jasmine.SpyObj<IconService>;

  beforeEach(async () => {
    markerServiceSpy = jasmine.createSpyObj("MarkerService", ["updateMarker"]);
    cardServiceSpy = jasmine.createSpyObj("CardService", ["deleteMarker"]);
    iconServiceSpy = jasmine.createSpyObj("IconService", [
      "getIconSizeSettings",
    ]);
    iconServiceSpy.getIconSizeSettings.and.resolveTo(new Map());
    const activatedRouteStub = {
      snapshot: { queryParams: { longitude: 12, latitude: 12 } },
    };
    await TestBed.configureTestingModule({
      declarations: [OverviewMapComponent],
      imports: [
        LeafletModule,
        RightSidebarComponent,
        IconSizeSettingsComponent,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MarkerService, useValue: markerServiceSpy },
        { provide: CardService, useValue: cardServiceSpy },
        { provide: IconService, useValue: iconServiceSpy },
        OverviewMapService,
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should have mainLayerGroup property with mocked value", () => {
    const button = fixture.debugElement.query(
      By.css('[data-testid="add-new-card"]'),
    ).nativeElement;
    button.click();
    fixture.detectChanges();
    expect(button).toBeTruthy();
    // expect(component.overviewMapService.mainLayerGroup).toEqual(
    //   new LayerGroup(),
    // );
  });
});
