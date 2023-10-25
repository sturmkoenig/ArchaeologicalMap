import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { StackCreatorComponent } from "../stack-creator/stack-creator.component";
import { StackDB } from "src/app/model/stack";
import { StackService } from "src/app/services/stack.service";
import { path } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { dataDir } from "@tauri-apps/api/path";

@Component({
  selector: "app-stack-display",
  template: `
    <!-- <mat-drawer-container class="drawer_container"> -->
    <!-- <mat-drawer #sideNav position="end"> -->
    <!-- </mat-drawer> -->
    <!-- <mat-drawer-content> -->
    <div class="stack-display__container">
      <div class="gridbox">
        <div *ngFor="let stack of stacks" class="card__container">
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
              <button mat-raised-button color="primary">Karten Zeigen</button>
            </mat-card-actions>
          </mat-card>
        </div>
        <div>
          <div class="button-add" (click)="onAddStack()">
            <span class="icon-add material-symbols-outlined"> add </span>
          </div>
        </div>
      </div>
    </div>
    <!-- <button (click)="sideNav.toggle()" mat-button>Toggle SideNav</button> -->
    <!-- </mat-drawer-content> -->
    <!-- </mat-drawer-container> -->
    <!-- </mat-drawer-content> -->
  `,
  styles: [
    `
      .stack-display__container {
        display: flex;
        flex-direction: row;
      }
      .card {
        height: 300px;
        z-index: -1;
        display: flex;

        &__image {
          max-height: 100px;
          object-fit: cover;
        }
        &__actions {
          margin-top: auto;
        }
      }
      .card__container {
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
      .button-add {
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #5e81ac;
        box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
        height: 80px;
        width: 80px;
        border-radius: 50%;
        position: fixed;
        bottom: 50px;
        right: 50px;
        transition: all 1s ease;
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
    `,
  ],
})
export class StackDisplayComponent {
  public stacks?: StackDB[];
  nav_position: string = "start";

  constructor(private dialog: MatDialog, private stackService: StackService) {
    this.stackService.readAllStacks().then((allStacks) => {
      this.stacks = allStacks;
      for (let stack of allStacks) {
        this.getImageUrl(stack.image_name).then((imageUrl) => {
          console.log("HIDEF IMAGE " + imageUrl);
          if (imageUrl !== undefined) {
            stack.image_name = imageUrl.toString();
          }
        });
      }
    });
  }

  onTogglePosition(position: string) {
    this.nav_position = position === "start" ? "end" : "start";
  }

  getImageUrl(image_name: string): Promise<void | String> {
    return path.appDataDir().then((dataDir) => {
      return path
        .join(dataDir, "content", "images", image_name)
        .then((imagePath) => {
          console.log(imagePath);
          return convertFileSrc(imagePath);
        });
    });
  }

  onAddStack() {
    this.dialog.open(StackCreatorComponent, {
      enterAnimationDuration: "200ms",
      exitAnimationDuration: "150ms",
    });
  }
}
