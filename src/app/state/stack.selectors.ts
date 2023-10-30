import { createFeatureSelector, createSelector } from "@ngrx/store";
import { StackService } from "../services/stack.service";
import { StackState, allStacksSelector } from "./stack.reducer";

export const selectStackState = createFeatureSelector<StackState>("users");

export const selectAllStacks = createSelector(
  selectStackState,
  allStacksSelector
);
