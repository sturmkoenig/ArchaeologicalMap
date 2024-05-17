import { ComponentFixture, TestBed } from "@angular/core/testing";
import { OverviewMapComponent } from "./overview-map.component";
import { OverviewMapService } from "../../services/overview-map.service";
import { ActivatedRoute } from "@angular/router";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { MarkerService } from "../../services/marker.service";
import { CardService } from "../../services/card.service";
import { IconService } from "../../services/icon.service";
import { RightSidebarComponent } from "../../layout/right-sidebar/right-sidebar.component";
import { IconSizeSettingsComponent } from "./map-settings/icon-size-settings/icon-size-settings.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { By } from "@angular/platform-browser";
import { CardDB } from "src/app/model/card";
import { MarkerAM } from "src/app/model/marker";

describe("OverviewMapComponent", () => {
  let component: OverviewMapComponent;
  let fixture: ComponentFixture<OverviewMapComponent>;
  let markerServiceSpy: jasmine.SpyObj<MarkerService>;
  let cardServiceSpy: jasmine.SpyObj<CardService>;
  let iconServiceSpy: jasmine.SpyObj<IconService>;

  beforeEach(async () => {
    markerServiceSpy = jasmine.createSpyObj("MarkerService", ["updateMarker"]);
    cardServiceSpy = jasmine.createSpyObj("CardService", [
      "deleteMarker",
      "createCard",
      "readCard",
      "deleteCard",
    ]);
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

    fixture = TestBed.createComponent(OverviewMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should have mainLayerGroup property with mocked value", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    whenIClickTheMap();
    await fixture.whenStable();
    TestBed.flushEffects();

    expect(cardServiceSpy.createCard).toHaveBeenCalledWith({
      title: "",
      description: "",
      markers: [
        {
          id: undefined,
          card_id: undefined,
          longitude: jasmine.any(Number),
          latitude: jasmine.any(Number),
          radius: 0,
          icon_name: "iconMiscRed",
        },
      ],
    });
    expect(component.selectedLayerGroup.getLayers().length).toBe(1);
  });

  it("should delete selected card", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    whenIClickTheMap();
    await fixture.whenStable();
    TestBed.flushEffects();

    component.onDeleteSelectedCard();
    await fixture.whenStable();
    TestBed.flushEffects();

    expect(cardServiceSpy.deleteCard).toHaveBeenCalledWith(testCard.id!);
    expect(component.selectedLayerGroup.getLayers()).toHaveSize(0);
    expect(component.mainLayerGroup.getLayers()).toHaveSize(0);
  });

  it("should delete marker", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    whenIClickTheMap();
    await fixture.whenStable();
    TestBed.flushEffects();

    component.onDeleteSelectedMarker();
    await fixture.whenStable();
    TestBed.flushEffects();

    expect(cardServiceSpy.deleteMarker).toHaveBeenCalledWith(testCard.id!);
    expect(component.selectedLayerGroup.getLayers()).toHaveSize(0);
    expect(component.mainLayerGroup.getLayers()).toHaveSize(0);
  });

  it("should move existing marker", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    whenIClickTheMap();
    await fixture.whenStable();
    TestBed.flushEffects();

    component.onMoveExistingMarker();
    whenIClickTheMap();
    await fixture.whenStable();
    TestBed.flushEffects();

    expect(markerServiceSpy.updateMarker).toHaveBeenCalled();
  });

  it("should update icon size of selected layer correctly", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    whenIClickTheMap();
    await fixture.whenStable();
    TestBed.flushEffects();

    component.onUpdateIconSize({ iconType: "iconMiscRed", iconSize: 40 });
    const layer: MarkerAM =
      component.selectedLayerGroup.getLayers()[0] as MarkerAM;
    expect(layer.getIcon().options.iconSize).toEqual([40, 40]);
  });

  it("should update icon size of main layer correctly", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    whenIClickTheMap();
    await fixture.whenStable();
    TestBed.flushEffects();

    givenTheCard({ id: 2, ...testCard });
    whenIClickAButton("add-new-card");
    whenIClickTheMap();
    await fixture.whenStable();
    TestBed.flushEffects();

    expect(component.selectedLayerGroup.getLayers()).toHaveSize(1);
    expect(component.mainLayerGroup.getLayers()).toHaveSize(0);

    component.onUpdateIconSize({ iconType: "iconMiscRed", iconSize: 40 });
    const layer: MarkerAM =
      component.selectedLayerGroup.getLayers()[0] as MarkerAM;
    expect(layer.getIcon().options.iconSize).toEqual([40, 40]);
  });

  const testCard: CardDB = {
    id: 1,
    title: "a",
    description: "a",
    markers: [
      {
        latitude: 1,
        longitude: 1,
        id: 1,
        radius: 0,
        icon_name: "iconMiscRed",
      },
    ],
  };

  const givenTheCard = (card: CardDB) => {
    cardServiceSpy.createCard.and.resolveTo(card);
    cardServiceSpy.readCard.withArgs(jasmine.any(Number)).and.resolveTo(card);
  };

  const whenIClickAButton = (testId: string) => {
    const button = fixture.debugElement.query(
      By.css(`[data-testid="${testId}"]`),
    ).nativeElement;
    button.click();
  };

  const whenIClickTheMap = async () => {
    const map = fixture.debugElement.query(
      By.css(".map-container"),
    ).nativeElement;
    map.click();
  };
});
