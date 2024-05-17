import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImageCreateComponent } from "./image-create.component";
import { MatDialogRef } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ImageCreateComponent", () => {
  let component: ImageCreateComponent;
  let fixture: ComponentFixture<ImageCreateComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<any>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj("MatDialogRef", ["close"]);
    await TestBed.configureTestingModule({
      imports: [ImageCreateComponent, NoopAnimationsModule],
      providers: [{ provide: MatDialogRef, useValue: dialogRefSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
