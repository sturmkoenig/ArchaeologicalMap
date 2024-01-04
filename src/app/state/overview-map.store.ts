import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";

export interface OverviewMapState {}

@Injectable()
export class OverviewMapStore extends ComponentStore<OverviewMapState> {}
