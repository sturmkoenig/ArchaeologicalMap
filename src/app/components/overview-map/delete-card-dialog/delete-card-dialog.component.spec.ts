import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DeleteCardDialogComponent } from "./delete-card-dialog.component";

describe("DeleteCardDialogComponent", () => {
  let component: DeleteCardDialogComponent;
  let fixture: ComponentFixture<DeleteCardDialogComponent>;
  let dialogRef: MatDialogRef<DeleteCardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteCardDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteCardDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should close the dialog when onNoClick is called", () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it("should close the dialog with deleteMarker when deleteMarker is called", () => {
    component.deleteMarker();
    expect(dialogRef.close).toHaveBeenCalledWith("deleteMarker");
  });

  it("should close the dialog with deleteCard when deleteCard is called", () => {
    component.deleteCard();
    expect(dialogRef.close).toHaveBeenCalledWith("deleteCard");
  });
});
