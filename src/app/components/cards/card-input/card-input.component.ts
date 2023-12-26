import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardDB } from "src/app/model/card";
import { StackStore } from "src/app/state/stack.store";
import { Observable } from "rxjs";
import { Stack } from "src/app/model/stack";
import { NgForm } from "@angular/forms";

@Component({
  selector: "app-card-input",
  template: `
    @if(this.card){
    <form class="card-input">
      <mat-form-field>
        <mat-label>Title:</mat-label>
        <input
          matInput
          [ngModel]="card.title"
          (ngModelChange)="onTitleChange($event)"
          [ngModelOptions]="{ standalone: true }"
        />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Beschreibung:</mat-label>
        <input
          matInput
          [ngModel]="card.description"
          (ngModelChange)="onDescriptionChange($event)"
          [ngModelOptions]="{ standalone: true }"
        />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Stapel:</mat-label>
        <mat-select
          [value]="card.stack_id"
          (valueChange)="onStackIdChange($event)"
          name="stack"
        >
          <mat-option *ngFor="let stack of stacks$ | async" [value]="stack.id">
            {{ stack.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </form>
    }
  `,
  styles: `
        .card-input {
        display: flex;
        flex-direction: column;
        }
      `,
})
export class CardInputComponent implements OnChanges {
  @Input()
  card?: CardDB;

  @ViewChild("cardInput")
  cardForm?: NgForm;

  @Output()
  cardChange: EventEmitter<CardDB> = new EventEmitter();
  stacks$: Observable<Stack[]>;

  constructor(private stackStore: StackStore) {
    this.stacks$ = stackStore.stacks$;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.card && this.cardForm) {
      this.cardForm.valueChanges?.subscribe((val) => {
        this.cardChange.emit(this.card);
      });
    }
  }
  onStackIdChange(newStackId: any) {
    this.card!.stack_id = newStackId;
    this.cardChange.emit(this.card);
  }

  onTitleChange(newTitle: string) {
    this.card!.title = newTitle;
    this.cardChange.emit(this.card);
  }

  onDescriptionChange(newDescription: string) {
    this.card!.description = newDescription;
    this.cardChange.emit(this.card);
  }
}
