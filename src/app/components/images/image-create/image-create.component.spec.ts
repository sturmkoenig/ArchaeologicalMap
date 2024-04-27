import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImageCreateComponent } from "./image-create.component";

describe("ImageCreateComponent", () => {
  let component: ImageCreateComponent;
  let fixture: ComponentFixture<ImageCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
