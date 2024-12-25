import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const createCardDetailsWindow = (cardId: number) => {
  const webview = new WebviewWindow(cardId.toString(), {
    url: "/cards/details/" + cardId,
    height: 800,
  });
  webview.once("tauri://error", function (e: unknown) {
    console.error("window creation error: " + JSON.stringify(e));
    webview.emit(`set-focus-to-${cardId}`);
  });
  webview.once("tauri://created", function () {
    webview.emit(`set-focus-to-${cardId}`);
  });
};
