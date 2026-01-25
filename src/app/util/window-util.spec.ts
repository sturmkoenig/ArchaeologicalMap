import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import {
  createOrFocusWebview,
  createCardDetailsWindow,
  createStackDetailWindow,
} from "./window-util";

jest.mock("@tauri-apps/api/webviewWindow");
jest.mock("@tauri-apps/api/event");
jest.mock("@tauri-apps/api/core");

const mockDateNow = jest.fn();
Date.now = mockDateNow;

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

    (WebviewWindow as unknown as jest.Mock).mockImplementation(
      () => mockWebview,
    );
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

  describe("createStackDetailWindow", () => {
    beforeEach(() => {
      (invoke as jest.Mock).mockResolvedValue(null);
      (WebviewWindow.getByLabel as jest.Mock).mockResolvedValue(null);
    });

    it("should create new window when no firstCardId is provided", async () => {
      mockDateNow.mockReturnValueOnce(1674567920123);

      await createStackDetailWindow(789);

      expect(WebviewWindow).toHaveBeenCalledWith("card-window-1674567920123", {
        url: "/stacks/details/789",
        height: 800,
      });
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  describe("wrapper functions", () => {
    beforeEach(() => {
      (WebviewWindow.getByLabel as jest.Mock).mockResolvedValue(null);
      (invoke as jest.Mock).mockResolvedValue(null);
    });

    describe("createCardDetailsWindow", () => {
      const givenNoWindowExistsForCard = () => {
        (invoke as jest.Mock).mockResolvedValue(null);
      };

      const givenWindowExistsForCard = (windowLabel: string) => {
        (invoke as jest.Mock).mockResolvedValue(windowLabel);
        (WebviewWindow.getByLabel as jest.Mock).mockResolvedValue(
          mockExistingWindow,
        );
      };

      const whenCreateCardDetailsWindowIsCalled = async (cardId: number) => {
        return await createCardDetailsWindow(cardId);
      };

      const thenGetWindowForCardShouldBeCalledWith = (cardId: number) => {
        expect(invoke).toHaveBeenCalledWith("get_window_for_card", { cardId });
      };

      it("should create new window when no window exists for card", async () => {
        givenNoWindowExistsForCard();
        mockDateNow.mockReturnValueOnce(1674567890123);

        await whenCreateCardDetailsWindowIsCalled(456);

        thenGetWindowForCardShouldBeCalledWith(456);
        expect(WebviewWindow).toHaveBeenCalledWith(
          "card-window-1674567890123",
          {
            url: "/cards/details/456",
            height: 800,
          },
        );
      });

      it("should focus existing window when window exists for card", async () => {
        givenWindowExistsForCard("card-window-1674567890000");

        const result = await whenCreateCardDetailsWindowIsCalled(456);

        thenGetWindowForCardShouldBeCalledWith(456);
        expect(WebviewWindow.getByLabel).toHaveBeenCalledWith(
          "card-window-1674567890000",
        );
        expect(mockExistingWindow.setFocus).toHaveBeenCalled();
        expect(result).toBe(mockExistingWindow);
        expect(WebviewWindow).not.toHaveBeenCalled();
      });

      it("should create new window when existing window cannot be found by label", async () => {
        (invoke as jest.Mock).mockResolvedValue("card-window-1674567890000");
        (WebviewWindow.getByLabel as jest.Mock).mockResolvedValue(null);
        mockDateNow.mockReturnValueOnce(1674567890123);

        await whenCreateCardDetailsWindowIsCalled(456);

        expect(WebviewWindow.getByLabel).toHaveBeenCalledWith(
          "card-window-1674567890000",
        );
        expect(WebviewWindow).toHaveBeenCalledWith(
          "card-window-1674567890123",
          {
            url: "/cards/details/456",
            height: 800,
          },
        );
      });
    });
  });
});
