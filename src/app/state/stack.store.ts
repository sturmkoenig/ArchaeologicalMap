import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { Stack, StackPost } from "../model/stack";
import { from, Observable, switchMap, tap } from "rxjs";
import { StackService } from "@service/stack.service";
import { ImageService } from "@service/image.service";

export type DisplayableStack = Stack & { imageUrl?: string };
export interface StackState {
  stacks: Stack[];
}

const addImageSource = async (
  imageService: ImageService,
  stack: Stack,
): Promise<DisplayableStack> => {
  return await imageService
    .getImageUrl(stack.imageName)
    .then((imageUrl) => ({ ...stack, ...(imageUrl ? { imageUrl } : {}) }));
};

const sortByName = (stacks: DisplayableStack[]) =>
  stacks.toSorted((a, b) => a.name.localeCompare(b.name));

@Injectable()
export class StackStore extends ComponentStore<StackState> {
  readonly stacks$: Observable<DisplayableStack[]> = this.select(
    (state) => state.stacks,
  );

  readonly addStack = this.updater((state, stack: Stack) => ({
    stacks: sortByName([...state.stacks, stack]),
  }));

  readonly setAllStacks = this.updater((_, stacks: Stack[]) => ({
    stacks: sortByName(stacks),
  }));

  readonly setStack = this.updater((state, updateStack: Stack) => ({
    stacks: sortByName(
      state.stacks
        .filter((stack) => stack.id !== updateStack.id)
        .concat([updateStack]),
    ),
  }));

  readonly deleteStackId = this.updater((state, stackIdToDelete: number) => ({
    stacks: state.stacks.filter((stack) => stack.id !== stackIdToDelete),
  }));

  readonly loadStacks = this.effect<void>(() =>
    from(this.stackService.getAll()).pipe(
      tap((stacks: Stack[]) => {
        Promise.all(
          stacks.map(
            async (stack) => await addImageSource(this.imageService, stack),
          ),
        ).then((stacks: DisplayableStack[]) => {
          this.setAllStacks(stacks);
        });
      }),
    ),
  );

  readonly deleteStack = this.effect((deleteStack$: Observable<Stack>) => {
    return deleteStack$.pipe(
      tap((deleteStack: Stack) => {
        this.deleteStackId(deleteStack.id);
      }),
      switchMap((deleteStack: Stack) => {
        return from(this.stackService.deleteStack(deleteStack.id));
      }),
    );
  });

  readonly updateStack = this.effect((updatedStack$: Observable<Stack>) => {
    return updatedStack$.pipe(
      switchMap((stack) => {
        return from(this.stackService.updateStack(stack));
      }),
      tap(async (updatedStack?: Stack) => {
        if (updatedStack) {
          await addImageSource(this.imageService, updatedStack).then(
            (stack) => {
              this.setStack(stack);
            },
          );
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
        next: async (stack?: Stack) => {
          if (!stack) {
            return;
          }
          await addImageSource(this.imageService, stack).then((stack) => {
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
