import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { StackCreatorComponent } from "@app/components/stacks/stack-creator/stack-creator.component";
import { Stack, StackPost } from "src/app/model/stack";
import { Observable } from "rxjs";
import { DisplayableStack, StackStore } from "@app/state/stack.store";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { createStackDetailWindow } from "@app/util/window-util";

@Component({
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  selector: "app-stack-display",
  template: `
    <div class="stack-display__container mt-7">
      <div class="gridbox">
        <button
          mat-fab
          aria-label="add a new stack button"
          (click)="onAddStack()"
        >
          <mat-icon>add</mat-icon>
        </button>
        <div
          [attr.data-testid]="'stack-card-' + stack.id"
          *ngFor="let stack of stacks$ | async"
          class="card-container"
        >
          <mat-card class="card">
            <mat-card-header>
              <div mat-card-avatar class="example-header-image"></div>
              <mat-card-title>{{ stack.name }}</mat-card-title>
            </mat-card-header>
            <img
              class="card__image"
              mat-card-image
              src="{{ stack.imageUrl }}"
              alt="image of the stack"
            />
            <mat-card-content></mat-card-content>
            <mat-card-actions class="card__actions gap-[10px]">
              <button
                [attr.data-testid]="'open-stack-button-' + stack.id"
                mat-icon-button
                (click)="onOpenStack(stack)"
              >
                <mat-icon>menu_book</mat-icon>
              </button>
              <button
                [attr.data-testid]="'update-stack-button-' + stack.id"
                mat-icon-button
                (click)="onUpdateStack(stack)"
              >
                <mat-icon>update</mat-icon>
              </button>
              <button
                class=" ml-auto"
                mat-icon-button
                [attr.data-testid]="'delete-stack-' + stack.id"
                (click)="onDeleteStack(stack)"
              >
                <mat-icon class="material-icons color_danger">delete</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .material-icons.color_danger {
        color: #f54257;
      }

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
        width: 100%;
        display: flex;
        flex-flow: column;
        justify-content: center;
        align-items: center;
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
export class StackListComponent {
  public stacks?: StackPost[];
  public stacks$: Observable<DisplayableStack[]>;

  constructor(
    private dialog: MatDialog,
    private stackStore: StackStore,
  ) {
    this.stacks$ = this.stackStore.stacks$;
  }

  onAddStack() {
    this.dialog.open(StackCreatorComponent);
  }
  onDeleteStack(stack: Stack) {
    const dialogRef = this.dialog.open(DeleteStackDialogComponent);
    dialogRef.afterClosed().subscribe((shouldDelete) => {
      if (shouldDelete) {
        this.stackStore.deleteStack(stack);
      }
    });
  }
  async onOpenStack(stack: Stack) {
    await createStackDetailWindow(stack.id);
  }

  onUpdateStack(stack: Stack) {
    this.dialog.open(StackCreatorComponent, {
      data: {
        stack,
      },
    });
  }

  protected readonly console = console;
}

@Component({
  selector: "app-delete-stack-dialog",
  template: `<mat-dialog-content
      ><p>
        Stapel löschen? Alle Karten in diesem Stapel sind danach ohne Stapel.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-button [mat-dialog-close]="true" cdkFocusInitial>
        Löschen
      </button>
    </mat-dialog-actions> `,
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteStackDialogComponent {}
