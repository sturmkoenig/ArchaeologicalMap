import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { StackCreatorComponent } from "@app/components/stacks/stack-creator/stack-creator.component";
import { Stack, StackPost } from "src/app/model/stack";
import { Observable } from "rxjs";
import { StackStore } from "@app/state/stack.store";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

/**
 * @deprecated
 */

@Component({
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  selector: "app-stack-display",
  template: `
    <div class="stack-display__container">
      <div class="gridbox">
        <div *ngFor="let stack of stacks$ | async" class="card-container">
          <mat-card class="card">
            <mat-card-header>
              <div mat-card-avatar class="example-header-image"></div>
              <mat-card-title>{{ stack.name }}</mat-card-title>
            </mat-card-header>
            <img
              class="card__image"
              mat-card-image
              src="{{ stack.image_name }}"
            />
            <mat-card-content> </mat-card-content>
            <mat-card-actions class="card__actions">
              <button
                mat-raised-button
                color="primary"
                (click)="onDeleteStack(stack)"
              >
                Loeschen
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
        <div>
          <div class="example-button-container button-add">
            <button
              mat-fab
              color="primary"
              aria-label="Example icon button with a delete icon"
              (click)="onAddStack()"
            >
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .stack-display__container {
        display: flex;
        flex-direction: row;
      }
      .card {
        height: 300px;
        width: 200px;
        display: flex;

        &__image {
          max-height: 100px;
          object-fit: cover;
        }
        &__actions {
          margin-top: auto;
        }
      }
      .card-container {
        width: 200px;
        height: 300px;
      }
      .gridbox {
        display: flex;
        flex-flow: row;
        flex-wrap: wrap;
      }
      .gridbox > div {
        margin: 6px;
      }

      .button-add:hover {
        box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 20px;
      }
      .icon-add {
        color: white;
      }
      .drawer_container {
        height: 100%;
      }
      .button-add {
        width: 60px;
        position: fixed;
        bottom: 50px;
        right: 50px;
      }
    `,
  ],
})
export class StackDisplayComponent {
  public stacks?: StackPost[];
  public stacks$: Observable<Stack[]>;

  constructor(
    private dialog: MatDialog,
    private stackStore: StackStore,
  ) {
    this.stacks$ = this.stackStore.stacks$;
  }

  onAddStack() {
    this.dialog.open(StackCreatorComponent, {
      enterAnimationDuration: "200ms",
      exitAnimationDuration: "150ms",
    });
  }
  onDeleteStack(stack: Stack) {
    this.stackStore.deleteStack(stack);
  }
}
