import { render, screen } from "@testing-library/angular";
import { MatDialog } from "@angular/material/dialog";
import { StackListComponent } from "@app/components/stacks/stack-list/stack-list.component";
import { StackStore } from "@app/state/stack.store";
import { StackService } from "@service/stack.service";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { ImageService } from "@service/image.service";
import { StackCreatorComponent } from "@app/components/stacks/stack-creator/stack-creator.component";
import { WindowService } from "@service/window.service";

const MockStacks = [
  { id: 1, name: "MyStack1", image_name: "/path/to/an/image" },
  { id: 2, name: "MyStack2", image_name: "/path/to/an/image2" },
];

const mockDeleteStack = jest.fn().mockResolvedValue(undefined);
const mockMoveImageToAppDir = jest.fn();
const mockUpdateStack = jest
  .fn()
  .mockImplementation((stack) => new Promise(() => stack));
jest.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setTitle: jest.fn(),
    onCloseRequested: jest.fn(),
    setFocus: jest.fn(),
  }),
}));

jest.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: (_x: string, _y: unknown) => {
    jest.fn();
  },
}));

const tearDownStackList = async () => jest.clearAllMocks();

const setupStackList = async () =>
  await render(StackListComponent, {
    imports: [StackCreatorComponent],
    providers: [
      { provide: MatDialog },
      { provide: StackStore },
      {
        provide: StackService,
        useValue: {
          createStack: jest.fn(),
          getAll: jest.fn().mockResolvedValue(MockStacks),
          getStack: jest.fn(),
          deleteStack: mockDeleteStack,
          updateStack: mockUpdateStack,
        },
      },
      {
        provide: ImageService,
        useValue: {
          getImageUrl: jest.fn().mockResolvedValue("/some/path"),
          convertFileSrc: jest.fn().mockReturnValue("someSrc"),
          moveImageToAppDir: mockMoveImageToAppDir,
        },
      },
      {
        provide: WindowService,
        useValue: {
          handleDragDropEvent: jest.fn(),
        },
      },
    ],
  });

it("should display all given stacks with their title", async () => {
  await setupStackList();
  for (const stack of MockStacks) {
    const title = screen.getByText(stack.name);
    expect(title).toBeVisible();
  }
  await tearDownStackList();
});

it("should delete a stack and remove it from the list after confirming in the dialog", async () => {
  //given
  const givenStack = MockStacks[0];
  await setupStackList();
  let stacks = screen.getAllByTestId(/stack-card/i);
  expect(stacks.length).toBe(2);

  //when
  const deleteButton = screen.getByTestId(`delete-stack-${givenStack.id}`);
  await userEvent.click(deleteButton);
  const confirmDeleteButton = screen.getByText("Löschen");
  await userEvent.click(confirmDeleteButton);

  //then
  expect(mockDeleteStack).toHaveBeenCalled();
  stacks = screen.getAllByTestId(/stack-card/i);
  expect(stacks.length).toBe(1);
  await tearDownStackList();
});

it("should not delete stack when deletion is canceled in the dialog", async () => {
  const givenStack = MockStacks[0];
  await setupStackList();
  const deleteButton = screen.getByTestId(`delete-stack-${givenStack.id}`);
  await userEvent.click(deleteButton);
  const confirmDeleteButton = screen.getByText("Abbrechen");
  await userEvent.click(confirmDeleteButton);
  expect(mockDeleteStack).not.toHaveBeenCalled();
  await tearDownStackList();
});

it("should open an update dialog with all stack properties when clicking the 'update' button", async () => {
  const givenStack = MockStacks[0];
  const fixture = await setupStackList();
  const updateButton = screen.getByTestId(
    `update-stack-button-${givenStack.id}`,
  );
  await userEvent.click(updateButton);
  const input = screen.getByTestId("name-input") as HTMLInputElement;
  expect(input.value).toBe(givenStack.name);
  await userEvent.type(input, "addedTitle");

  const saveButton = screen.getByText("Speichern");
  await userEvent.click(saveButton);
  expect(mockUpdateStack).lastCalledWith({
    id: givenStack.id,
    name: givenStack.name + "addedTitle",
    image_name: givenStack.image_name,
  });
});
