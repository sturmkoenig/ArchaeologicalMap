import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild,
} from "@angular/core";
import { listen } from "@tauri-apps/api/event";

@Component({
  selector: "app-file-dropzone",
  template: `
    <div class="container" appDnd (fileDropped)="onFileDropped($event)">
      <input
        type="file"
        #fileDropRef
        id="fileDropRef"
        (change)="fileBrowseHandler($event)"
      />
      <img src="assets/dropzone/ic-upload-file.svg" alt="" />
    </div>
  `,
  styles: [
    `
      .container {
        width: 450px;
        height: 200px;
        padding: 2rem;
        text-align: center;
        border: dashed 1px #979797;
        position: relative;
        margin: 0 auto;

        input {
          opacity: 0;
          position: absolute;
          z-index: 2;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        label {
          color: white;
          width: 183px;
          height: 44px;
          border-radius: 21.5px;
          background-color: #db202f;
          padding: 8px 16px;
        }

        h3 {
          font-size: 20px;
          font-weight: 600;
          color: #38424c;
        }
      }

      .fileover {
        animation: shake 1s;
        animation-iteration-count: infinite;
      }

      .files-list {
        margin-top: 1.5rem;

        .single-file {
          display: flex;
          padding: 0.5rem;
          justify-content: space-between;
          align-items: center;
          border: dashed 1px #979797;
          margin-bottom: 1rem;

          img.delete {
            margin-left: 0.5rem;
            cursor: pointer;
            align-self: flex-end;
          }

          display: flex;
          flex-grow: 1;

          .name {
            font-size: 14px;
            font-weight: 500;
            color: #353f4a;
            margin: 0;
          }

          .size {
            font-size: 12px;
            font-weight: 500;
            color: #a4a4a4;
            margin: 0;
            margin-bottom: 0.25rem;
          }

          .info {
            width: 100%;
          }
        }
      }

      /* Shake animation */
      @keyframes shake {
        0% {
          transform: translate(1px, 1px) rotate(0deg);
        }

        10% {
          transform: translate(-1px, -2px) rotate(-1deg);
        }

        20% {
          transform: translate(-3px, 0px) rotate(1deg);
        }

        30% {
          transform: translate(3px, 2px) rotate(0deg);
        }

        40% {
          transform: translate(1px, -1px) rotate(1deg);
        }

        50% {
          transform: translate(-1px, 2px) rotate(-1deg);
        }

        60% {
          transform: translate(-3px, 1px) rotate(0deg);
        }

        70% {
          transform: translate(3px, 1px) rotate(-1deg);
        }

        80% {
          transform: translate(-1px, -1px) rotate(1deg);
        }

        90% {
          transform: translate(1px, 2px) rotate(0deg);
        }

        100% {
          transform: translate(1px, -2px) rotate(-1deg);
        }
      }
    `,
  ],
})
export class FileDropzoneComponent {
  @ViewChild("fileDropRef", { static: false })
  fileDropEl?: ElementRef;
  @Output() fileUrlEmitter: EventEmitter<string> = new EventEmitter();

  files: any[] = [];
  constructor() {}

  onFileDropped(fileUrl: string) {
    console.log("filedropped");
    this.fileUrlEmitter.emit(fileUrl);
  }

  fileBrowseHandler($event: Event) {
    if ($event.target) {
      this.prepareFilesList(($event.target as HTMLInputElement).files);
    }
  }
  /**
   * Convert Files list to normal array list
   * @param files (Files List)
   */
  prepareFilesList(files: FileList | null) {
    if (!files) {
      return;
    }
    let fileList = Array.prototype.forEach.call(files, (file) => {
      this.files.push(file);
    });
  }

  /**
   * Delete file from files list
   * @param index (File index)
   */
  deleteFile(index: number) {
    if (this.files[index].progress < 100) {
      console.log("Upload in progress.");
      return;
    }
    this.files.splice(index, 1);
  }
  /**
   * format bytes
   * @param bytes (File size in bytes)
   * @param decimals (Decimals point)
   */
  formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }
}