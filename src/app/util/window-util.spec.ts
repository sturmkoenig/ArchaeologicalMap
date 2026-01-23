import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit } from "@tauri-apps/api/event";
import {
  createOrFocusWebview,
  createCardDetailsWindow,
  createStackDetailWindow,
} from "./window-util";

jest.mock("@tauri-apps/api/webviewWindow");
jest.mock("@tauri-apps/api/event");

describe("window-util", () => {
  let mockWebview: jest.Mocked<WebviewWindow>;
  let mockExistingWindow: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWebview = {
      once: jest.fn(),
      emit: jest.fn(),
      setFocus: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockExistingWindow = {
      setFocus: jest.fn().mockResolvedValue(undefined),
    };

    (WebviewWindow as unknown as jest.Mock).mockImplementation(() => mockWebview);
  });

  describe("createOrFocusWebview", () => {
    const givenWindowExists = () => {
      (WebviewWindow.getByLabel as jest.Mock).mockResolvedValue(
        mockExistingWindow,
      );
      return mockExistingWindow;
    };

    const givenWindowDoesNotExist = () => {
      (WebviewWindow.getByLabel as jest.Mock).mockResolvedValue(null);
    };

    const givenGetByLabelFails = () => {
      (WebviewWindow.getByLabel as jest.Mock).mockRejectedValue(
        new Error("getByLabel failed"),
      );
    };

    const givenSetFocusFails = () => {
      mockExistingWindow.setFocus.mockRejectedValue(
        new Error("setFocus failed"),
      );
    };

    const whenCreateOrFocusWebviewIsCalled = async (
      windowName: string,
      url: string,
      eventName: string,
    ) => {
      return await createOrFocusWebview(windowName, url, eventName);
    };

    const thenWindowShouldBeFocused = (window: any) => {
      expect(window.setFocus).toHaveBeenCalledTimes(1);
    };

    const thenNewWindowShouldBeCreated = (windowName: string) => {
      expect(WebviewWindow).toHaveBeenCalledWith(windowName, {
        url: expect.any(String),
        height: 800,
      });
    };

    const thenExistingWindowShouldBeReturned = (
      result: any,
      expectedWindow: any,
    ) => {
      expect(result).toBe(expectedWindow);
    };

    const thenNewWindowShouldBeReturned = (result: any) => {
      expect(result).toBe(mockWebview);
    };

    it("should focus existing window when window already exists", async () => {
      const existingWindow = givenWindowExists();

      const result = await whenCreateOrFocusWebviewIsCalled(
        "test-window",
        "/test",
        "test-event",
      );

      thenWindowShouldBeFocused(existingWindow);
      thenExistingWindowShouldBeReturned(result, existingWindow);
      expect(WebviewWindow).not.toHaveBeenCalled();
    });

    it("should create new window when window does not exist", async () => {
      givenWindowDoesNotExist();

      const result = await whenCreateOrFocusWebviewIsCalled(
        "test-window",
        "/test",
        "test-event",
      );

      thenNewWindowShouldBeCreated("test-window");
      thenNewWindowShouldBeReturned(result);
    });

    it("should handle focus failure gracefully and return existing window", async () => {
      const existingWindow = givenWindowExists();
      givenSetFocusFails();

      const result = await whenCreateOrFocusWebviewIsCalled(
        "test-window",
        "/test",
        "test-event",
      );

      thenExistingWindowShouldBeReturned(result, existingWindow);
      expect(WebviewWindow).not.toHaveBeenCalled();
    });

    it("should fallback to creation when getByLabel fails", async () => {
      givenGetByLabelFails();

      const result = await whenCreateOrFocusWebviewIsCalled(
        "test-window",
        "/test",
        "test-event",
      );

      thenNewWindowShouldBeCreated("test-window");
      thenNewWindowShouldBeReturned(result);
    });

    it("should set up error handler on new window", async () => {
      givenWindowDoesNotExist();

      await whenCreateOrFocusWebviewIsCalled(
        "test-window",
        "/test",
        "test-event",
      );

      expect(mockWebview.once).toHaveBeenCalledWith(
        "tauri://error",
        expect.any(Function),
      );
    });

    it("should set up created handler on new window", async () => {
      givenWindowDoesNotExist();

      await whenCreateOrFocusWebviewIsCalled(
        "test-window",
        "/test",
        "test-event",
      );

      expect(mockWebview.once).toHaveBeenCalledWith(
        "tauri://created",
        expect.any(Function),
      );
    });

    it("should emit event on error", async () => {
      givenWindowDoesNotExist();

      await whenCreateOrFocusWebviewIsCalled(
        "test-window",
        "/test",
        "test-event",
      );

      const errorHandler = (mockWebview.once as jest.Mock).mock.calls.find(
        (call) => call[0] === "tauri://error",
      )[1];
      errorHandler("test error");

      expect(emit).toHaveBeenCalledWith("test-event");
    });

    it("should emit event on created", async () => {
      givenWindowDoesNotExist();

      await whenCreateOrFocusWebviewIsCalled(
        "test-window",
        "/test",
        "test-event",
      );

      const createdHandler = (mockWebview.once as jest.Mock).mock.calls.find(
        (call) => call[0] === "tauri://created",
      )[1];
      createdHandler();

      expect(mockWebview.emit).toHaveBeenCalledWith("test-event");
    });
  });

  describe("wrapper functions", () => {
    beforeEach(() => {
      (WebviewWindow.getByLabel as jest.Mock).mockResolvedValue(null);
    });

    it("should call createOrFocusWebview with correct parameters for stack", async () => {
      await createStackDetailWindow(123);

      expect(WebviewWindow.getByLabel).toHaveBeenCalledWith("stackId-123");
      expect(WebviewWindow).toHaveBeenCalledWith("stackId-123", {
        url: "/stacks/details/123",
        height: 800,
      });
    });

    it("should call createOrFocusWebview with correct parameters for card", async () => {
      await createCardDetailsWindow(456);

      expect(WebviewWindow.getByLabel).toHaveBeenCalledWith("cardId-456");
      expect(WebviewWindow).toHaveBeenCalledWith("cardId-456", {
        url: "/cards/details/456",
        height: 800,
      });
    });
  });
});
