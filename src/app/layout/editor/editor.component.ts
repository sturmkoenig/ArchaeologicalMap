import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  OnInit,
  signal,
  ViewChild,
  WritableSignal,
} from "@angular/core";
import Quill, { RangeStatic } from "quill";
import Delta from "quill-delta";
import {
  createNewQuillInstance,
  IImageMeta,
  registerQuillExtensions,
} from "@app/util/quill-util";
import { CardContentService } from "@service/card-content.service";
import { ImageData as QuillImageData } from "quill-image-drop-and-paste";
import { CardService } from "@service/card.service";
import { InfoCard, LocationCard } from "@app/model/card";
import { createCardDetailsWindow } from "@app/util/window-util";

@Component({
  selector: "app-editor",
  templateUrl: "./editor.component.html",
  styleUrls: ["./editor.component.scss"],
  standalone: false,
})
export class EditorComponent implements OnInit, AfterViewInit {
  image: IImageMeta = {
    type: "",
    dataUrl: "",
    blobUrl: "",
    file: null,
  };
  quill!: Quill;
  searchText: WritableSignal<string> = signal("");
  foundCards: WritableSignal<(InfoCard | LocationCard)[]> = signal([]);
  carrotPosition?: RangeStatic | null;
  @ViewChild("editorContainer") editorContainer!: ElementRef;

  constructor(
    cardContentService: CardContentService,
    cardService: CardService,
  ) {
    cardContentService.cardContent.subscribe((content) => {
      if (content !== undefined) {
        this.setContents(content);
      }
    });
    effect(async () => {
      if (this.searchText() !== "")
        this.foundCards.set(
          await cardService.readCardByTitle(this.searchText(), 10),
        );
    });
  }

  async ngOnInit() {
    await registerQuillExtensions();
    this.quill = createNewQuillInstance("#editor-container", () =>
      this.imageHandler.bind(this),
    );
  }

  ngAfterViewInit() {
    const container = this.editorContainer.nativeElement;

    container.addEventListener("click", async (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.tagName === "A") {
        event.preventDefault();
        const cardId = Number(
          target.getAttribute("href")?.replace("http://", ""),
        );

        if (!isNaN(cardId)) {
          await createCardDetailsWindow(cardId);
        }
      }
    });
  }

  imageHandler(dataUrl: string, type: string, imageData: QuillImageData) {
    imageData
      .minify({
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.7,
      })
      .then((miniImageData: unknown) => {
        if (miniImageData instanceof QuillImageData) {
          this.quill.insertEmbed(
            this.quill.getSelection()?.index ?? 0,
            "image",
            imageData.dataUrl,
            "user",
          );
        }
      });
  }

  saveCarrotPosition() {
    this.carrotPosition = this.quill.getSelection();
  }
  stopPropagation($event: MouseEvent) {
    $event.stopPropagation();
  }

  public setContents(delta: Delta): void {
    this.quill.setContents(delta);
  }

  public getContents(): Delta {
    return this.quill.getContents();
  }

  onLink(id: number, title: string) {
    this.quill.insertText(
      this.carrotPosition?.index ?? 0,
      title,
      "link",
      `http://${id}`,
    );
  }
}
