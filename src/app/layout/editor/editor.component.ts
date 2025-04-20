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
import { IImageMeta, registerQuillExtensions } from "@app/util/quill-util";
import { CardContentService } from "@service/card-content.service";
import { ImageData as QuillImageData } from "quill-image-drop-and-paste";
import { CardService } from "@service/card.service";
import { Card } from "@app/model/card";
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
  foundCards: WritableSignal<Card[]> = signal([]);
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
      .then((miniImageData: any) => {
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

  ngOnInit(): void {
    registerQuillExtensions();
    this.quill = new Quill("#editor-container", {
      modules: {
        toolbar: "#toolbar",
        imageResize: {},
        imageDropAndPaste: {
          handler: this.imageHandler.bind(this),
        },
      },
      placeholder: "noch kein text..",
      theme: "snow",
    });
  }
  public setContents(delta: any): void {
    this.quill.setContents(delta);
  }

  public getContents(): any {
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
