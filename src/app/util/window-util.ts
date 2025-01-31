import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getAllWebviews } from "@tauri-apps/api/webview";
import { emitTo } from "@tauri-apps/api/event";

export const createCardDetailsWindow = async (cardId: number) => {
  await getAllWebviews().then((views) =>
    views.map((view) => console.log(view.label)),
  );
  const webview = new WebviewWindow(cardId.toString(), {
    url: "/cards/details/" + cardId,
    height: 800,
  });
  webview.once("tauri://error", function (e: unknown) {
    console.error("window creation error: " + JSON.stringify(e));
    emitTo(cardId.toString(), "set-focus-to");
  });
  webview.once("tauri://created", function () {
    console.log("created");
    webview.emit(`set-focus-to-${cardId}`);
  });
};
