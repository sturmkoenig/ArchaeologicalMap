import { HttpClient, HttpClientModule } from "@angular/common/http";
import { AfterViewInit, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ContentChange, QuillEditorComponent } from "ngx-quill";
import Quill, { DeltaStatic } from "quill";
import { BehaviorSubject, catchError, Observable, throwError } from "rxjs";
import { CardService } from "src/app/services/card.service";
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import { invoke } from "@tauri-apps/api";

import ImageResize from "quill-image-resize-module";
import { Card, Coordinate } from "src/app/model/card";
import { MatSnackBar } from "@angular/material/snack-bar";

Quill.register("modules/imageResize", ImageResize);

var BaseImageFormat = Quill.import("formats/image");
const ImageFormatAttributesList = ["alt", "height", "width", "style"];

class ImageFormat extends BaseImageFormat {
  static formats(domNode) {
    return ImageFormatAttributesList.reduce(function (formats, attribute) {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }
  format(name, value) {
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

@Component({
  selector: "app-card-details",
  template: `
    <ng-container *ngIf="card$ | async as card">
      <mat-card class="example-card">
        <mat-card-header>
          <div mat-card-avatar class="example-header-image"></div>
          <mat-card-title>{{ card.name }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>
            {{ card.description }}
          </p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button (click)="goToCard(card.coordinate)">
            auf karte zeigen
          </button>
        </mat-card-actions>
      </mat-card>
    </ng-container>

    <div>
      <quill-editor
        [ngModel]="this.initialContent"
        [modules]="modules"
        (onContentChanged)="onContentChanged($event)"
        (onEditorCreated)="createdEditor($event)"
      ></quill-editor>
    </div>
    <button mat-button (click)="onSaveContent()">save content</button>
  `,
  styles: [],
})
export class CardDetailsComponent implements OnInit {
  cardId!: number;
  card$!: Observable<Card>;
  initialContent!: string;
  content!: DeltaStatic;
  editor?: QuillEditorComponent;
  modules = {};

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {
    this.modules = {
      imageResize: {},
    };
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.cardId = +params["id"];
    });
    // this.card$ = this.cardService.cardGet(this.cardId);
  }

  onViewerCreated(editor: QuillEditorComponent) {}

  onSaveContent() {
    invoke("write_card_content", {
      id: this.cardId.toString(),
      content: JSON.stringify(this.content),
    }).then((res) => {
      this._snackBar.open("Gespeichert!", "X");
    });
  }

  createdEditor(editor: QuillEditorComponent) {
    invoke("read_card_content", { id: this.cardId.toString() }).then(
      (res: string) => {
        let loadedContent: DeltaStatic;
        try {
          loadedContent = JSON.parse(res);
        } catch (error) {
          return;
        }
        if (loadedContent.ops) {
          this.initialContent = new QuillDeltaToHtmlConverter(
            loadedContent.ops
          ).convert();
        } else {
          this.initialContent = "<h1>Hello?</h1>";
        }
        editor.content = res;
        this.editor = editor;
      }
    );
  }

  goToCard(coordinates: Coordinate) {
    this.router.navigate(["map"], {
      queryParams: {
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
      },
    });
  }

  onContentChanged($event: ContentChange) {
    this.content = $event.content;
  }
}
