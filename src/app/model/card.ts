import { ICONS } from "../services/icon.service";

export interface CardinalDirection {
  north: number;
  east: number;
  south: number;
  west: number;
}

export interface MarkerLatLng {
  latitude: number;
  longitude: number;
  radius: number;
  icon_name: keyof typeof ICONS;
}

export interface Card {
  id?: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  region_image_id?: number;
  icon_name: keyof typeof ICONS;
  radius: number;
  stack_id?: number;
}
/** @deprecated */
export interface CardDB {
  id?: number;
  title: string;
  description: string;
  markers: MarkerDB[];
  region_image_id?: number;
  stack_id?: number | null;
}

/** @deprecated */
export interface MarkerDB {
  id?: number;
  card_id?: number;
  card?: CardDB;
  longitude: number;
  latitude: number;
  radius: number;
  icon_name: keyof typeof ICONS;
}

export type CardMetaData = Pick<
  Card,
  "title" | "description" | "region_image_id" | "stack_id"
>;
export type LocationData = Pick<
  Card,
  "latitude" | "longitude" | "radius" | "icon_name"
>;
