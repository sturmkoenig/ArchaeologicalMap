import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImageListComponent } from "./image-list.component";
import { MatDialogRef } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ImageEntity } from "@app/model/image";
import { ImageService } from "@service/image.service";
import { MatSnackBar } from "@angular/material/snack-bar";

describe("ImageListComponent", () => {
  let component: ImageListComponent;
  let fixture: ComponentFixture<ImageListComponent>;
  let dialogRefSpy: jest.Mocked<MatDialogRef<ImageListComponent>>;
  let imageServiceSpy: jest.Mocked<ImageService>;
  let snackBarSpy: jest.Mocked<MatSnackBar>;

  const mockImages: ImageEntity[] = [
    {
      id: 1,
      name: "Test Image 1",
      imageSource: "data:image/png;base64,test1",
    },
    {
      id: 2,
      name: "Test Image 2",
      imageSource: "data:image/png;base64,test2",
    },
  ];

  const givenImageServiceReturns = (
    recentImages: ImageEntity[],
    paginatedImages: ImageEntity[],
    total: number,
  ) => {
    imageServiceSpy.readRecentImages.mockResolvedValue(recentImages);
    imageServiceSpy.readImagesPaginated.mockResolvedValue([
      paginatedImages,
      total,
    ]);
  };

  const givenDeleteSucceeds = () => {
    imageServiceSpy.deleteImage.mockResolvedValue(undefined);
  };

  const givenDeleteFails = () => {
    imageServiceSpy.deleteImage.mockRejectedValue(new Error("Delete failed"));
  };

  const whenComponentInitializes = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  const whenImageIsSelected = (image: ImageEntity) => {
    component.onSelectImage(image);
  };

  const whenImageIsDeleted = async (image: ImageEntity) => {
    await component.onDeleteImage(image);
  };

  const whenImageNameIsChanged = (image: ImageEntity, newName: string) => {
    component.changeImageName(image, newName);
  };

  const thenDialogShouldCloseWith = (expectedImage: ImageEntity) => {
    expect(dialogRefSpy.close).toHaveBeenCalledWith(expectedImage);
  };

  const thenRecentImagesShouldBe = (expected: ImageEntity[]) => {
    expect(component.recentImages).toEqual(expected);
  };

  const thenOtherImagesShouldBe = (expected: ImageEntity[]) => {
    expect(component.otherImages).toEqual(expected);
  };

  const thenDefaultPaginationShouldBe = () => {
    expect(component.itemsPerPage).toBe(150);
    expect(component.pageIndex).toBe(0);
  };

  const thenSnackBarShouldShowError = () => {
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      "Fehler beim Löschen des Bildes",
      "OK",
      { duration: 4000 },
    );
  };

  beforeEach(async () => {
    dialogRefSpy = { close: jest.fn() } as unknown as jest.Mocked<
      MatDialogRef<ImageListComponent>
    >;

    imageServiceSpy = {
      readRecentImages: jest.fn(),
      readImagesPaginated: jest.fn(),
      deleteImage: jest.fn(),
      updateImageName: jest.fn(),
    } as unknown as jest.Mocked<ImageService>;

    snackBarSpy = {
      open: jest.fn(),
    } as unknown as jest.Mocked<MatSnackBar>;

    await TestBed.configureTestingModule({
      imports: [ImageListComponent, NoopAnimationsModule],
    })
      .overrideProvider(MatDialogRef, { useValue: dialogRefSpy })
      .overrideProvider(ImageService, { useValue: imageServiceSpy })
      .overrideProvider(MatSnackBar, { useValue: snackBarSpy })
      .compileComponents();

    fixture = TestBed.createComponent(ImageListComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize with default pagination of 150 items per page", async () => {
    givenImageServiceReturns([mockImages[0]], [mockImages[1]], 200);

    await whenComponentInitializes();

    thenDefaultPaginationShouldBe();
  });

  it("should load images on initialization", async () => {
    givenImageServiceReturns([mockImages[0]], [mockImages[1]], 2);

    await whenComponentInitializes();

    thenRecentImagesShouldBe([mockImages[0]]);
    thenOtherImagesShouldBe([mockImages[1]]);
    expect(component.numberOfImages).toBe(2);
  });

  it("should close dialog with selected image when image is clicked", () => {
    whenImageIsSelected(mockImages[0]);

    thenDialogShouldCloseWith(mockImages[0]);
  });

  it("should delete image and refresh list when delete succeeds", async () => {
    givenImageServiceReturns([mockImages[0]], [mockImages[1]], 2);
    await whenComponentInitializes();

    givenDeleteSucceeds();
    givenImageServiceReturns([], [mockImages[1]], 1);

    await whenImageIsDeleted(mockImages[0]);

    expect(imageServiceSpy.deleteImage).toHaveBeenCalledWith(mockImages[0]);
    thenRecentImagesShouldBe([]);
    thenOtherImagesShouldBe([mockImages[1]]);
    expect(component.numberOfImages).toBe(1);
  });

  it("should show error snackbar when delete fails", async () => {
    givenImageServiceReturns([mockImages[0]], [mockImages[1]], 2);
    await whenComponentInitializes();

    givenDeleteFails();

    await whenImageIsDeleted(mockImages[0]);

    thenSnackBarShouldShowError();
  });

  it("should update image name through service", () => {
    const newName = "Updated Image Name";

    whenImageNameIsChanged(mockImages[0], newName);

    expect(imageServiceSpy.updateImageName).toHaveBeenCalledWith(
      mockImages[0].id,
      newName,
    );
  });

  it("should render image items with new compact structure", async () => {
    givenImageServiceReturns([mockImages[0]], [mockImages[1]], 2);

    await whenComponentInitializes();
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const imageItems = compiled.querySelectorAll(".image-item");
    expect(imageItems.length).toBe(2);

    const matCards = compiled.querySelectorAll("mat-card");
    expect(matCards.length).toBe(0);
  });

  it("should have delete button in each image item", async () => {
    givenImageServiceReturns([mockImages[0]], [mockImages[1]], 2);

    await whenComponentInitializes();
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const imageItems = compiled.querySelectorAll(".image-item");
    expect(imageItems.length).toBe(2);

    imageItems.forEach((item: HTMLElement) => {
      const deleteButton = item.querySelector(".delete-button");
      expect(deleteButton).toBeTruthy();
    });
  });

  it("should use outline appearance for name input fields", async () => {
    givenImageServiceReturns([mockImages[0]], [mockImages[1]], 2);

    await whenComponentInitializes();
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const nameInputs = compiled.querySelectorAll(
      'mat-form-field[appearance="outline"]',
    );
    expect(nameInputs.length).toBe(2);
  });

  it("should load recent and other images separately", async () => {
    givenImageServiceReturns([mockImages[0]], [mockImages[1]], 2);

    await whenComponentInitializes();

    expect(component.recentImages).toEqual([mockImages[0]]);
    expect(component.otherImages).toEqual([mockImages[1]]);
  });

  it("should put all images in other category when none are recent", async () => {
    const nonRecentImages: ImageEntity[] = [
      { id: 1, name: "Image 1", imageSource: "test1" },
      { id: 2, name: "Image 2", imageSource: "test2" },
    ];
    givenImageServiceReturns([], nonRecentImages, 2);

    await whenComponentInitializes();

    expect(component.recentImages).toEqual([]);
    expect(component.otherImages).toEqual(nonRecentImages);
  });

  it("should reload images after deletion", async () => {
    givenImageServiceReturns([mockImages[0]], [mockImages[1]], 2);
    await whenComponentInitializes();

    expect(component.recentImages.length).toBe(1);
    expect(component.otherImages.length).toBe(1);

    givenDeleteSucceeds();
    givenImageServiceReturns([], [mockImages[1]], 1);

    await whenImageIsDeleted(mockImages[0]);

    expect(component.recentImages).toEqual([]);
    expect(component.otherImages).toEqual([mockImages[1]]);
  });
});
