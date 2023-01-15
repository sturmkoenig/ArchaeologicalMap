import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuillEditorComponent } from 'ngx-quill';
import Delta from 'quill-delta';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { CardService } from 'src/app/services/card.service';
import { Card, Coordinate } from 'src/generated';

const fs = require('fs');
@Component({
  selector: 'app-card-details',
  template: `
    <ng-container *ngIf="card$ | async as card">
      <mat-card class="example-card">
        <mat-card-header>
          <div mat-card-avatar class="example-header-image"></div>
          <mat-card-title>{{ card.name }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>
            {{ card.text }}
          </p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button (click)="goToCard(card.coordinate)">
            auf karte zeigen
          </button>
        </mat-card-actions>
      </mat-card>
      <div class="grid grid-cols-2">
        <quill-editor
          (onEditorCreated)="createdEditor($event)"
          (onContentChanged)="changedContent($event.content)"
        ></quill-editor>
        <div>
          <quill-view
            (onEditorCreated)="onViewerCreated($event)"
            format="object"
            theme="snow"
          ></quill-view>
        </div>
      </div>
    </ng-container>
  `,
  styles: [],
})
export class CardDetailsComponent implements OnInit {
  cardId!: number;
  card$!: Observable<Card>;
  content: Delta = new Delta();
  editor?: QuillEditorComponent;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cardService: CardService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      console.log(params);
      this.cardId = +params['id'];
    });
    this.card$ = this.cardService.cardGet(this.cardId);
  }

  onViewerCreated(editor: QuillEditorComponent) {
    console.log('viewer is initialized');
    console.log('local content is equal to: ' + JSON.stringify(this.content));
    editor.content = this.content;
  }
  changedContent(newContent: Delta) {
    console.log(this.content);
    this.content = newContent;
    this.http
      .post('http://localhost:3000/api/content/' + this.cardId, this.content)
      .subscribe();
  }

  createdEditor(editor: QuillEditorComponent) {
    this.editor = editor;
    console.log('editor is now initialized');
    this.http
      .get<Delta>('http://localhost:3000/api/content/' + this.cardId)
      .subscribe((res) => {
        console.log(res);
        this.content = res;
      });
  }

  goToCard(coordinates: Coordinate) {
    this.router.navigate(['map'], {
      queryParams: {
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
      },
    });
  }
}
