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
import { Stack } from "@app/model/stack";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

const MockStacks: Stack[] = [
  { id: 1, name: "MyStack1", imageName: "/path/to/an/image" },
  { id: 2, name: "MyStack2", imageName: "/path/to/an/image2" },
];

const mockDeleteStack = jest.fn().mockResolvedValue(undefined);
const mockMoveImageToAppDir = jest.fn();
const mockUpdateStack = jest
  .fn()
  .mockImplementation((stack) => new Promise(() => stack));

const mockDateNow = jest.fn();
Date.now = mockDateNow;
jest.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setTitle: jest.fn(),
    onCloseRequested: jest.fn(),
    setFocus: jest.fn(),
  }),
}));

jest.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: Object.assign(
    jest.fn().mockImplementation((_x: string, _y: unknown) => ({
      once: jest.fn(),
      emit: jest.fn(),
      setFocus: jest.fn().mockResolvedValue(undefined),
    })),
    {
      getByLabel: jest.fn().mockResolvedValue(null),
    },
  ),
}));

jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn().mockResolvedValue(null),
}));

const tearDownStackList = async () => jest.clearAllMocks();

const setupStackList = async () => {
  mockDateNow.mockReturnValue(1674567890123);
  const { fixture } = await render(StackListComponent, {
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
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
};

it("should display all given stacks with their title", async () => {
  await setupStackList();
  for (const stack of MockStacks) {
    const title = screen.getByText(stack.name);
    expect(title).toBeVisible();
  }
  await tearDownStackList();
});

it("should open a new window with the stack when pressing the button", async () => {
  await setupStackList();
  const stackId = MockStacks[0].id;
  const openStackWindowButton = screen.getByTestId(
    `open-stack-button-${stackId}`,
  );
  mockDateNow.mockReturnValueOnce(1674567890456);
  await userEvent.click(openStackWindowButton);

  expect(WebviewWindow).toHaveBeenCalledWith(
    expect.stringMatching(/^card-window-\d+$/),
    {
      url: `/stacks/details/${stackId}`,
      height: 800,
    },
  );
});

it("should delete a stack and remove it from the list after confirming in the dialog", async () => {
  const givenStack = MockStacks[0];
  await setupStackList();
  let stacks = screen.getAllByTestId(/stack-card/i);
  expect(stacks.length).toBe(2);

  const deleteButton = screen.getByTestId(`delete-stack-${givenStack.id}`);
  await userEvent.click(deleteButton);
  const confirmDeleteButton = screen.getByText("Löschen");
  await userEvent.click(confirmDeleteButton);

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
  await setupStackList();
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
    imageName: givenStack.imageName,
  });
});

it("should create new window each time stack is opened (no window reuse)", async () => {
  await setupStackList();
  const stackId = MockStacks[0].id;
  const openStackWindowButton = screen.getByTestId(
    `open-stack-button-${stackId}`,
  );

  // First click - create first window
  mockDateNow.mockReturnValueOnce(1674567890456);
  await userEvent.click(openStackWindowButton);
  expect(WebviewWindow).toHaveBeenCalledTimes(1);

  // Second click - should create a new window
  mockDateNow.mockReturnValueOnce(1674567890789);
  await userEvent.click(openStackWindowButton);
  expect(WebviewWindow).toHaveBeenCalledTimes(2);

  await tearDownStackList();
});
