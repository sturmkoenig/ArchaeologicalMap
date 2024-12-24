import { Component, Input, OnInit } from "@angular/core";
import Quill, { RangeStatic } from "quill";
import ImageResize from "quill-image-resize-module";
import { CardContentService } from "@service/card-content.service";
import QuillImageDropAndPaste, {
  ImageData as QuillImageData,
} from "quill-image-drop-and-paste";
import { SafeUrl } from "@angular/platform-browser";

interface IImageMeta {
  type: string;
  dataUrl: string;
  blobUrl: SafeUrl;
  file: File | null;
}

Quill.register("modules/imageResize", ImageResize);

const BaseImageFormat = Quill.import("formats/image");
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

const Inline = Quill.import("blots/inline");
class LinkBlot extends Inline {
  static create(url: any) {
    const node = super.create(url);
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
    const formats = super.formats();
    formats["link"] = LinkBlot.formats(this["domNode"]);
    return formats;
  }
}
LinkBlot["blotName"] = "link";
LinkBlot["tagName"] = "A";

Quill.register({ "formats/internal_link": LinkBlot });

@Component({
  selector: "app-editor",
  templateUrl: "./editor.component.html",
  styleUrls: ["./editor.component.scss"],
})
export class EditorComponent implements OnInit {
  toolbarOptions = [
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block"],

    [{ header: 1 }, { header: 2 }], // custom button values
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }], // superscript/subscript
    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    [{ direction: "rtl" }], // text direction

    [{ size: ["small", false, "large", "huge"] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ font: [] }],
    [{ align: [] }],

    ["clean"], // remove formatting button
  ];

  image: IImageMeta = {
    type: "",
    dataUrl: "",
    blobUrl: "",
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
  quill!: Quill;
  @Input()
  searchText: string = "";
  carrotPosition?: RangeStatic | null;

  ngOnInit(): void {
    Quill.register("modules/imageDropAndPaste", QuillImageDropAndPaste);
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
      "/cards/details?id=" + id,
    );
  }
}
