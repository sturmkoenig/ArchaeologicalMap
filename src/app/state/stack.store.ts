import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { Stack, StackPost } from "../model/stack";
import { EMPTY, Observable, catchError, from, switchMap, tap } from "rxjs";
import { StackService } from "@service/stack.service";
import { path } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/core";

export interface StackState {
  stacks: Stack[];
}

@Injectable()
export class StackStore extends ComponentStore<StackState> {
  readonly stacks$: Observable<Stack[]> = this.select((state) => state.stacks);

  readonly addStack = this.updater((state, stack: Stack) => ({
    stacks: [...state.stacks, stack],
  }));

  readonly setAllStacks = this.updater((state, stacks: Stack[]) => ({
    stacks: stacks,
  }));

  readonly deleteStackId = this.updater((state, stackIdToDelete: number) => ({
    stacks: state.stacks.filter((stack) => stack.id !== stackIdToDelete),
  }));

  readonly loadStacks = this.effect<void>(() =>
    from(this.stackService.getAll()).pipe(
      tap((stacks: Stack[]) => {
        for (const stack of stacks) {
          this.getImageUrl(stack.image_name).then((imageUrl) => {
            if (imageUrl !== undefined) {
              stack.image_name = imageUrl.toString();
            }
          });
        }
        this.setAllStacks(stacks);
      }),
    ),
  );
  readonly deleteStack = this.effect((deleteStack$: Observable<Stack>) => {
    return deleteStack$.pipe(
      tap((deleteStack: Stack) => {
        this.deleteStackId(deleteStack.id);
      }),
      switchMap((deleteStack: Stack) => {
        return from(
          this.stackService.deleteStack(deleteStack.id, deleteStack.image_name),
        );
      }),
    );
  });

  readonly createStack = this.effect((newStack$: Observable<StackPost>) => {
    return newStack$.pipe(
      switchMap((newStack: StackPost) =>
        from(this.stackService.createStack(newStack)).pipe(
          tap({
            next: (stack: Stack) => {
              this.getImageUrl(stack.image_name).then((imageUrl) => {
                if (imageUrl !== undefined) {
                  stack.image_name = imageUrl.toString();
                }
                this.addStack(stack);
              });
            },
            error: (e) => console.error(e),
          }),
          catchError(() => EMPTY),
        ),
      ),
    );
  });

  private async getImageUrl(image_name: string): Promise<void | string> {
    const dataDir = await path.appDataDir();
    const imagePath = await path.join(dataDir, "content", "images", image_name);
    return convertFileSrc(imagePath);
  }

  constructor(private stackService: StackService) {
    super({ stacks: [] });
    this.loadStacks();
  }
}
