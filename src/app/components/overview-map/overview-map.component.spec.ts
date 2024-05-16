import { ComponentFixture, TestBed } from "@angular/core/testing";
import { OverviewMapComponent } from "./overview-map.component";
import { OverviewMapService } from "../../services/overview-map.service";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { LayerGroup } from "leaflet";

describe("OverviewMapComponent", () => {
  let component: OverviewMapComponent;
  let fixture: ComponentFixture<OverviewMapComponent>;
  let overviewMapService: OverviewMapService;

  beforeEach(async () => {
    const overviewMapServiceSpy = jasmine.createSpyObj(
      "OverviewMapService",
      ["addMarkerToSelectedCard"],
      [
        { provide: "mainLayerGroup", useValue: new LayerGroup() },
        { provide: "selectedLayerGroup", useValue: new LayerGroup() },
      ],
    );
    const activatedRouteStub = {
      params: of({ id: "123" }),
    };
    await TestBed.configureTestingModule({
      declarations: [OverviewMapComponent],
      imports: [LeafletModule],
      providers: [
        { provide: OverviewMapService, useValue: overviewMapServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    overviewMapService = TestBed.inject(OverviewMapService);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
