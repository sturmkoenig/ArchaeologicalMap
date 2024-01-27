import { Component, Input, OnInit } from "@angular/core";
import Quill, { RangeStatic } from "quill";
import ImageResize from "quill-image-resize-module";
import { CardContentService } from "src/app/services/card-content.service";
import QuillImageDropAndPaste, { ImageData as QuillImageData } from 'quill-image-drop-and-paste';
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";


interface IImageMeta {
  type: string;
  dataUrl: string;
  blobUrl: SafeUrl;
  file: File | null;
}

Quill.register("modules/imageResize", ImageResize);


var BaseImageFormat = Quill.import("formats/image");
const ImageFormatAttributesList = ["alt", "height", "width", "style"];

class ImageFormat extends BaseImageFormat {
  static formats(domNode: any) {
    return ImageFormatAttributesList.reduce(function(formats: any, attribute) {
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
  <div class="editor-container">
    <div id="toolbar">
      <!-- Add font size dropdown -->
        <span class="ql-formats">
          <button class="ql-bold"></button>
          <button class="ql-italic"></button>
          <button class="ql-underline"></button>
          <button class="ql-strike"></button>
        </span>

        <span class="ql-formats">
          <button class="ql-list" value="ordered"></button>
          <button class="ql-list" value="bullet"></button>
          <select class="ql-size">
          <option value="small"></option>
          <option selected></option>
          <option value="large"></option>
          <option value="huge"></option>
          </select>
        </span>

        <span class="ql-formats">
          <select class="ql-color"></select>
          <select class="ql-background"></select>
          <select class="ql-font"></select>
        </span>

        <span class="ql-formats">
          <button class="ql-clean"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-image" value="super"></button>
          <button [matMenuTriggerFor]="menu" (click)="saveCarrotPosition()">
            <mat-icon
              aria-hidden="false"
              aria-label="Example home icon"
              fontIcon="link"
            ></mat-icon>
          </button>
        </span>

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
  </div>
  `,
  styles: [
    `
      .editor-container{
        background-color: white
      }
      .menu-item-container {
        width: 250px;
        height: auto;
        padding: 10px;
      }
    `,
  ],
})
export class EditorComponent implements OnInit {

  toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    ['blockquote', 'code-block'],

    [{ 'header': 1 }, { 'header': 2 }],               // custom button values
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction

    [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'font': [] }],
    [{ 'align': [] }],

    ['clean']                                         // remove formatting button
  ];

  image: IImageMeta = {
    type: '',
    dataUrl: '',
    blobUrl: '',
    file: null,
  };

  constructor(cardContentService: CardContentService) {
    cardContentService.cardContent.subscribe((content) => {
      if (content !== undefined) {
        this.setContents(content);
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
      .then((miniImageData) => {
        if (miniImageData instanceof QuillImageData) {
          const blob = miniImageData.toBlob();

          console.log(`blob: ${blob}`);
          console.log(imageData)
          console.log(`type: ${type}`);
          this.quill.insertEmbed(this.quill.getSelection()?.index ?? 0, 'image', imageData.dataUrl, 'user');
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
    Quill.register('modules/imageDropAndPaste', QuillImageDropAndPaste);
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
      this.quill.getSelection()?.index ?? 0,
      title,
      "link",
      "/cards/details?id=" + id
    );
  }
}
