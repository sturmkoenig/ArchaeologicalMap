import { render, screen, fireEvent } from "@testing-library/angular";
import "@testing-library/jest-dom";
import { EditCardDialogComponent } from "./edit-card-dialog.component";
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { StackStore } from "@app/state/stack.store";
import { ImageService } from "@service/image.service";
import { Card } from "@app/model/card";
import { StackService } from "@service/stack.service";

const mockCard: Card = {
  id: 1,
  title: "Test Card",
  description: "Test Description",
  stackId: 1,
  regionImageId: undefined,
};

const dialogRefMock = {
  close: jest.fn(),
};

const stackServiceMock = {
  getAll: jest.fn().mockResolvedValue([]),
};

const imageServiceMock = {
  readImage: jest.fn().mockResolvedValue(undefined),
};

const givenCardData = (card: Card) => {
  return { card };
};

const whenDialogIsRendered = async (cardData: { card: Card }) => {
  return render(EditCardDialogComponent, {
    imports: [MatDialogModule, NoopAnimationsModule],
    providers: [
      { provide: MatDialogRef, useValue: dialogRefMock },
      { provide: MAT_DIALOG_DATA, useValue: cardData },
      { provide: StackService, useValue: stackServiceMock },
      { provide: ImageService, useValue: imageServiceMock },
      StackStore,
    ],
  });
};

const thenDialogShouldDisplayTitle = (title: string) => {
  expect(screen.getByText(title)).toBeInTheDocument();
};

const thenInputShouldHaveValue = (label: string, value: string) => {
  const input = screen.getByLabelText(label);
  expect(input).toHaveValue(value);
};

const thenDialogShouldClose = () => {
  expect(dialogRefMock.close).toHaveBeenCalled();
};

const thenDialogShouldCloseWithData = (data: Partial<Card>) => {
  expect(dialogRefMock.close).toHaveBeenCalledWith(
    expect.objectContaining(data),
  );
};

describe("EditCardDialogComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display dialog with pre-populated card data", async () => {
    const cardData = givenCardData(mockCard);

    await whenDialogIsRendered(cardData);

    thenDialogShouldDisplayTitle("Karte bearbeiten");
    thenInputShouldHaveValue("Title:", mockCard.title);
    thenInputShouldHaveValue("Beschreibung:", mockCard.description);
  });

  it("should close dialog with updated data when save is clicked", async () => {
    const cardData = givenCardData(mockCard);

    await whenDialogIsRendered(cardData);

    const titleInput = screen.getByLabelText("Title:");
    fireEvent.input(titleInput, { target: { value: "Updated Title" } });

    const saveButton = screen.getByText("Speichern");
    fireEvent.click(saveButton);

    thenDialogShouldCloseWithData({ title: "Updated Title" });
  });

  it("should close dialog without data when cancel is clicked", async () => {
    const cardData = givenCardData(mockCard);

    await whenDialogIsRendered(cardData);

    const cancelButton = screen.getByText("Abbrechen");
    fireEvent.click(cancelButton);

    thenDialogShouldClose();
  });

  it("should preserve card id when saving", async () => {
    const cardData = givenCardData(mockCard);

    await whenDialogIsRendered(cardData);

    const saveButton = screen.getByText("Speichern");
    fireEvent.click(saveButton);

    thenDialogShouldCloseWithData({ id: mockCard.id });
  });
});
