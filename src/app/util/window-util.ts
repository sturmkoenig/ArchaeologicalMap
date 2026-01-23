import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const createOrFocusWebview = async (
  windowName: string,
  url: string,
  eventName: string,
) => {
  try {
    const existingWindow = await WebviewWindow.getByLabel(windowName);

    if (existingWindow) {
      try {
        await existingWindow.setFocus();
        return existingWindow;
      } catch (focusError) {
        console.error(`Failed to focus window ${windowName}:`, focusError);
        return existingWindow;
      }
    }
  } catch (labelError) {
    console.error(`Error checking for window ${windowName}:`, labelError);
    // Fall through to creation
  }

  const webview = new WebviewWindow(windowName, {
    url,
    height: 800,
  });
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
  return await createOrFocusWebview(
    `cardId-${cardId}`,
    `/cards/details/${cardId}`,
    `focus-card-${cardId}`,
  );
};
export const createStackDetailWindow = async (stackId: number) => {
  return await createOrFocusWebview(
    `stackId-${stackId}`,
    `/stacks/details/${stackId}`,
    `focus-stack-${stackId}`,
  );
};

export const setWindowFocus = async () => {
  await getCurrentWindow().setFocus();
};
