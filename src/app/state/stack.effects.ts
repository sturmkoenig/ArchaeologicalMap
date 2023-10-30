import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { StackService } from "../services/stack.service";
import { catchError, exhaustMap, from, map, of, switchMap } from "rxjs";
import {
  createStackSuccess,
  loadStacks,
  loadStacksError,
  loadStacksSuccess,
} from "./stack.actions";

@Injectable()
export class StackEffects {
  constructor(private actions$: Actions, private stackService: StackService) {}
  loadStacks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadStacks),
      switchMap(() =>
        from(this.stackService.getAll()).pipe(
          map((stacks) => {
            return loadStacksSuccess({ stacks });
          }),
          catchError((error) => {
            return of(loadStacksError(error));
          })
        )
      )
    )
  );
}
