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
    <form #cardInput class="card-input">
      <mat-form-field>
        <mat-label>Title:</mat-label>
        <input matInput [(ngModel)]="card.title" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Beschreibung:</mat-label>
        <input matInput [(ngModel)]="card.description" />
      </mat-form-field>
      <mat-form-field>
        <mat-label>Stapel:</mat-label>
        <mat-select [(ngModel)]="card.stack_id" name="food">
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
        gap: 1rem;
        padding: 1rem;
      }`,
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
}
