import { Injectable } from "@angular/core";
import { DragDropEvent, getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Event } from "@tauri-apps/api/event";

@Injectable({
  providedIn: "root",
})
export class WindowService {
  constructor() {}

  async handleDragDropEvent(
    handler: (event: Event<DragDropEvent>) => Promise<void>,
  ) {
    await getCurrentWebview().onDragDropEvent(handler);
  }

  async setTitle(title: string) {
    await getCurrentWindow().setTitle(title);
  }

  async handleCloseRequested(handler: () => Promise<void>) {
    await getCurrentWindow().onCloseRequested(handler);
  }
}
