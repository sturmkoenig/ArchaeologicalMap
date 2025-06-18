import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const createAndFocusWebview = (
  windowName: string,
  url: string,
  eventName: string,
) => {
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
};
export const createCardDetailsWindow = async (cardId: number) => {
  createAndFocusWebview(
    `cardId-${cardId}`,
    `/cards/details/${cardId}`,
    `focus-card-${cardId}`,
  );
};
export const createStackDetailWindow = async (stackId: number) => {
  createAndFocusWebview(
    `stackId-${stackId}`,
    `/stack/details/${stackId}`,
    `focus-stack-${stackId}`,
  );
};

export const setWindowFocus = async () => {
  await getCurrentWindow().setFocus();
};
