import { HttpClient, HttpClientModule } from "@angular/common/http";
import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatCard } from "@angular/material/card";
import { BehaviorSubject, catchError, Observable, throwError } from "rxjs";
import { CardService } from "src/app/services/card.service";
import { invoke } from "@tauri-apps/api";

import { Card, Coordinate } from "src/app/model/card";
import { MatSnackBar } from "@angular/material/snack-bar";
import Quill from "quill";
import { RangeStatic } from "quill";
import { EditorComponent } from "src/app/layout/editor/editor.component";

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

    <div class="container">
      <app-editor [cardTitleMapping]="cardTitleMapping"></app-editor>
      <span class="button-row">
        <button mat-button (click)="onSaveContent()">save content</button>
      </span>
    </div>
  `,
  styles: [
    `
      .container {
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class CardDetailsComponent implements OnInit {
  cardId!: number;
  card$!: Observable<Card>;

  @ViewChild(EditorComponent)
  editor!: EditorComponent;
  cardTitleMapping!: [{ id: number; title: string }];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private _snackBar: MatSnackBar,
    private cardService: CardService
  ) {}

  async ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.cardId = +params["id"];
    });
    // this.card$ = this.cardService.cardGet(this.cardId);
    invoke("read_card_content", { id: this.cardId.toString() }).then(
      (res: any) => {
        let loadedContent: any;
        try {
          this.editor.setContents(JSON.parse(res));
        } catch (error) {
          return;
        }
      }
    );
    this.cardService.readCardTitleMapping().then((ctm) => {
      this.cardTitleMapping = ctm;
    });
  }

  onSaveContent() {
    console.log("write content!");
    invoke("write_card_content", {
      id: this.cardId.toString(),
      content: JSON.stringify(this.editor.getContents()),
    }).then((res) => {
      this._snackBar.open("Gespeichert!", "X");
    });
  }

  createdEditor(editor: any) {}

  goToCard(coordinates: Coordinate) {
    this.router.navigate(["map"], {
      queryParams: {
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
      },
    });
  }
}
