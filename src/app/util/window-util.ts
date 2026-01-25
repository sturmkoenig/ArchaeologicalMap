import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

export const generateUniqueWindowLabel = (prefix: string): string => {
  return `${prefix}-${Date.now()}`;
};

const focusExistingWindow = async (
  windowLabel: string,
): Promise<WebviewWindow | null> => {
  try {
    const existingWindow = await WebviewWindow.getByLabel(windowLabel);
    if (existingWindow) {
      try {
        await existingWindow.setFocus();
        return existingWindow;
      } catch (error) {
        console.error(`Failed to focus window ${windowLabel}:`, error);
        return existingWindow;
      }
    }
  } catch (error) {
    console.error(`Error getting window ${windowLabel}:`, error);
  }
  return null;
};

const createNewWindow = (
  windowLabel: string,
  url: string,
  setupDefaultErrorHandler: boolean = true,
): WebviewWindow => {
  const webview = new WebviewWindow(windowLabel, {
    url,
    height: 800,
  });

  if (setupDefaultErrorHandler) {
    webview.once("tauri://error", (e) => {
      console.error("Window creation error:", e);
    });
  }

  return webview;
};

export const createOrFocusWebview = async (
  windowName: string,
  url: string,
  eventName: string,
) => {
  const existingWindow = await focusExistingWindow(windowName);
  if (existingWindow) {
    return existingWindow;
  }

  const webview = createNewWindow(windowName, url, false);
  webview.once("tauri://error", function (e: unknown) {
    console.error("window creation error: " + JSON.stringify(e));
    emit(eventName);
  });
  webview.once("tauri://created", function () {
    console.log("created");
    webview.emit(eventName);
  });
  return webview;
};

export const createCardDetailsWindow = async (cardId: number) => {
  const existingWindowLabel = await invoke<string | null>(
    "get_window_for_card",
    { cardId },
  );

  if (existingWindowLabel) {
    const existingWindow = await focusExistingWindow(existingWindowLabel);
    if (existingWindow) {
      return existingWindow;
    }
  }

  const windowLabel = generateUniqueWindowLabel("card-window");
  return createNewWindow(windowLabel, `/cards/details/${cardId}`);
};

export const createStackDetailWindow = async (stackId: number) => {
  const windowLabel = generateUniqueWindowLabel("card-window");
  return createNewWindow(windowLabel, `/stacks/details/${stackId}`);
};

export const setWindowFocus = async () => {
  await getCurrentWindow().setFocus();
};
