import { createAction, props } from "@ngrx/store";
import { Stack, StackPost } from "../model/stack";

export const createStack = createAction(
  "[Stack/API create stack]",
  props<{ newStack: StackPost }>()
);
export const createStackSuccess = createAction(
  "[Stack/API create stack success]",
  props<{ newStack: Stack }>()
);
export const createFailure = createAction(
  "[Stack/API create stack failure]",
  props<{ error: any }>()
);
export const updateStack = createAction(
  "[Stack/Api update Stack]",
  props<{ updatedStack: Stack }>()
);
export const loadStacks = createAction("[Stack/API load stacks]");
export const loadStacksError = createAction(
  "[Stack/API load stacks error]",
  props<{ error: any }>()
);
export const loadStacksSuccess = createAction(
  "[Stack/API load stacks success]",
  props<{ stacks: Stack[] }>()
);
