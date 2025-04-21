import { SafeUrl } from "@angular/platform-browser";
import ImageResize from "quill-image-resize-module";
import QuillImageDropAndPaste from "quill-image-drop-and-paste";
import Quill from "quill";

export interface IImageMeta {
  type: string;
  dataUrl: string;
  blobUrl: SafeUrl;
  file: File | null;
}

export const createNewQuillInstance = (
  containerName: string,
  imageHandler: () => any,
) =>
  new Quill(containerName, {
    modules: {
      toolbar: "#toolbar",
      imageResize: {},
      imageDropAndPaste: {
        handler: imageHandler(),
      },
    },
    placeholder: "noch kein text..",
    theme: "snow",
  });

export const registerQuillExtensions = async () => {
  const Quill = (await import("quill")).default;
  Quill.register("modules/imageResize", ImageResize);

  const BaseImageFormat = Quill.import("formats/image");
  const ImageFormatAttributesList = ["alt", "height", "width", "style"];

  class ImageFormat extends BaseImageFormat {
    static formats(domNode: any) {
      return ImageFormatAttributesList.reduce(function (
        formats: any,
        attribute,
      ) {
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
      node.setAttribute("routerLink", url);
      node.setAttribute("href", url);
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
  Quill.register("modules/imageDropAndPaste", QuillImageDropAndPaste);
};
