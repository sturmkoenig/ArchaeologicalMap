import { EntityAdapter, EntityState, createEntityAdapter } from "@ngrx/entity";
import { Stack, StackPost } from "../model/stack";
import { createReducer, on } from "@ngrx/store";
import {
  createStack,
  createStackSuccess,
  loadStacksSuccess,
} from "./stack.actions";

export interface StackState extends EntityState<Stack> {}

export const adapter: EntityAdapter<Stack> = createEntityAdapter<Stack>();

export const initialStackState = adapter.getInitialState();

export const StackReducer = createReducer(
  initialStackState,
  on(createStackSuccess, (state: EntityState<Stack>, { newStack }) => {
    return adapter.addOne(newStack, state);
  }),
  on(loadStacksSuccess, (state: EntityState<Stack>, { stacks }) => {
    return adapter.setAll(stacks, state);
  })
);

// get the selectors
const { selectIds, selectEntities, selectAll, selectTotal } =
  adapter.getSelectors();

// select the array of user ids
export const selectStackIds = selectIds;

// select the dictionary of user entities
export const selectStackEntities = selectEntities;

// select the array of users
export const allStacksSelector = selectAll;

// select the total user count
export const selectTotalNumberOfStacks = selectTotal;
