import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { Stack, StackPost } from "../model/stack";
import { catchError, EMPTY, from, Observable, switchMap, tap } from "rxjs";
import { StackService } from "@service/stack.service";
import { ImageService } from "@service/image.service";

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

  readonly setStack = this.updater((state, updateStack: Stack) => ({
    stacks: state.stacks
      .filter((stack) => stack.id !== updateStack.id)
      .concat([updateStack]),
  }));

  readonly deleteStackId = this.updater((state, stackIdToDelete: number) => ({
    stacks: state.stacks.filter((stack) => stack.id !== stackIdToDelete),
  }));

  readonly loadStacks = this.effect<void>(() =>
    from(this.stackService.getAll()).pipe(
      tap((stacks: Stack[]) => {
        for (const stack of stacks) {
          this.imageService.getImageUrl(stack.image_name).then((imageUrl) => {
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

  readonly updateStack = this.effect((updatedStack$: Observable<Stack>) => {
    return updatedStack$.pipe(
      switchMap((stack) => {
        console.log("hi from store");
        return from(this.stackService.updateStack(stack));
      }),
      tap((updatedStack?: Stack) => {
        if (updatedStack) {
          this.setStack(updatedStack);
        }
      }),
    );
  });
  readonly createStack = this.effect((newStack$: Observable<StackPost>) => {
    return newStack$.pipe(
      switchMap((newStack: StackPost) =>
        from(this.stackService.createStack(newStack)),
      ),
      tap({
        next: (stack?: Stack) => {
          if (!stack) {
            return;
          }
          this.imageService.getImageUrl(stack.image_name).then((imageUrl) => {
            if (imageUrl !== undefined) {
              stack.image_name = imageUrl.toString();
            }
            this.addStack(stack);
          });
        },
        error: (e) => console.error(e),
      }),
    );
  });

  constructor(
    private stackService: StackService,
    private imageService: ImageService,
  ) {
    super({ stacks: [] });
    this.loadStacks();
  }
}
