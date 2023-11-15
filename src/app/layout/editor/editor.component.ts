import { Component, Input, OnInit } from "@angular/core";
import Quill, { RangeStatic } from "quill";
import ImageResize from "quill-image-resize-module";
import { CardContentService } from "src/app/services/card-content.service";

Quill.register("modules/imageResize", ImageResize);

var BaseImageFormat = Quill.import("formats/image");
const ImageFormatAttributesList = ["alt", "height", "width", "style"];

class ImageFormat extends BaseImageFormat {
  static formats(domNode: any) {
    return ImageFormatAttributesList.reduce(function (formats: any, attribute) {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }
  format(name: any, value: any) {
    if (ImageFormatAttributesList.indexOf(name) > -1) {
      if (value) {
        this["domNode"].setAttribute(name, value);
      } else {
        this["domNode"].removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}

Quill.register(ImageFormat, true);

var Inline = Quill.import("blots/inline");
class LinkBlot extends Inline {
  static create(url: any) {
    let node = super.create(url);
    // node.setAttribute("routerLink", url);
    node.setAttribute("href", url);
    if (url.match("http")) {
      node.setAttribute("target", "_self");
    } else {
      node.setAttribute("target", "_self");
    }
    node.setAttribute("title", node.textContent);
    return node;
  }

  static formats(domNode: any) {
    return domNode.getAttribute("href") || true;
  }

  format(name: any, value: any) {
    if (name === "link" && value) {
      this["domNode"].setAttribute("href", value);
    } else {
      super.format(name, value);
    }
  }

  formats() {
    let formats = super.formats();
    formats["link"] = LinkBlot.formats(this["domNode"]);
    return formats;
  }
}
LinkBlot["blotName"] = "link";
LinkBlot["tagName"] = "A";

Quill.register({ "formats/internal_link": LinkBlot });

@Component({
  selector: "app-editor",
  template: `
    <div id="toolbar">
      <!-- Add font size dropdown -->
      <select class="ql-size">
        <option value="small"></option>
        <!-- Note a missing, thus falsy value, is used to reset to default -->
        <option selected></option>
        <option value="large"></option>
        <option value="huge"></option>
      </select>
      <!-- Add a bold button -->
      <button class="ql-bold"></button>
      <!-- Add subscript and superscript buttons -->
      <button class="ql-script" value="sub"></button>
      <button class="ql-script" value="super"></button>
      <button class="ql-image" value="super"></button>
      <button [matMenuTriggerFor]="menu" (click)="saveCarrotPosition()">
        <mat-icon
          aria-hidden="false"
          aria-label="Example home icon"
          fontIcon="link"
        ></mat-icon>
      </button>
    </div>
    <mat-menu #menu="matMenu">
      <div class="menu-item-container">
        <!-- do not close menu when menu is clicked-->
        <form (click)="stopPropagation($event)">
          <mat-form-field class="example-form-field">
            <mat-label>Suche</mat-label>
            <input
              matInput
              type="text"
              [(ngModel)]="searchText"
              name="searchTextInput"
            />
          </mat-form-field>
        </form>
        <ng-container
          *ngFor="let opt of cardTitleMapping | filter : searchText"
        >
          <button mat-menu-item (click)="onLink(opt.id, opt.title)">
            {{ opt.title }}
          </button>
        </ng-container>
      </div>
    </mat-menu>
    <div id="editor-container"></div>
  `,
  styles: [
    `
      .menu-item-container {
        width: 250px;
        height: auto;
        padding: 10px;
      }
    `,
  ],
})
export class EditorComponent implements OnInit {
  constructor(cardContentService: CardContentService) {
    cardContentService.cardContent.subscribe((content) => {
      if (content !== undefined) {
        this.setContents(content);
      }
    });
  }
  saveCarrotPosition() {
    this.carrotPosition = this.quill.getSelection();
  }
  stopPropagation($event: MouseEvent) {
    $event.stopPropagation();
  }
  quill!: Quill;
  // TODO this is kind of ugly since cardtitlemapping is specialiced. It would be better to extract the titlebar
  @Input()
  cardTitleMapping!: [{ id: number; title: string }];
  searchText: string = "";
  carrotPosition?: RangeStatic | null;

  ngOnInit(): void {
    this.quill = new Quill("#editor-container", {
      modules: {
        toolbar: "#toolbar",
        imageResize: {},
      },
      placeholder: "noch kein text..",
      theme: "snow", // or 'bubble'
    });
  }
  public setContents(delta: any): void {
    this.quill.setContents(delta);
  }

  public getContents(): any {
    return this.quill.getContents();
  }

  onLink(id: number, title: string) {
    let selection: RangeStatic | undefined;
    if (this.carrotPosition) {
      selection = this.carrotPosition;
    }
    this.quill.insertText(
      selection?.index ?? 0,
      title,
      "link",
      "/cards/details?id=" + id
    );
  }
}
