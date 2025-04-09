import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit } from "@tauri-apps/api/event";

export const createCardDetailsWindow = async (cardId: number) => {
  const webview = new WebviewWindow(cardId.toString(), {
    url: "/cards/details/" + cardId,
    height: 800,
  });
  webview.once("tauri://error", function (e: unknown) {
    console.error("window creation error: " + JSON.stringify(e));
    emit(`set-focus-to-${cardId}`);
  });
  webview.once("tauri://created", function () {
    console.log("created");
    webview.emit(`set-focus-to-${cardId}`);
  });
};
