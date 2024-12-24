import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImageListComponent } from "./image-list.component";
import { MatDialogRef } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ImageListComponent", () => {
  let component: ImageListComponent;
  let fixture: ComponentFixture<ImageListComponent>;
  let dialogRefSpy: jest.Mocked<MatDialogRef<any>>;

  beforeEach(async () => {
    dialogRefSpy = { close: jest.fn() } as unknown as jest.Mocked<
      MatDialogRef<any>
    >;

    await TestBed.configureTestingModule({
      imports: [ImageListComponent, NoopAnimationsModule],
      providers: [{ provide: MatDialogRef, useValue: dialogRefSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
