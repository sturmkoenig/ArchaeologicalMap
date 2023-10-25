import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Output,
} from "@angular/core";
import { listen } from "@tauri-apps/api/event";

@Directive({
  selector: "[appDnd]",
})
export class DndDirective {
  @HostBinding("class.fileover") fileOver: boolean = false;
  @Output() fileDropped = new EventEmitter<string>();

  constructor() {
    listen("tauri://file-drop", (evt: any) => {
      this.fileOver = false;
      let fileURL = evt.payload;
      if (fileURL) {
        this.fileDropped.emit(fileURL);
      }
    });
  }

  @HostListener("dragover", ["$event"])
  public onDragOver(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener("dragleave", ["$event"])
  public onDragLeave(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
  }

  // Drop listener
  @HostListener("drop", ["$event"])
  public ondrop(evt: any) {}
}
