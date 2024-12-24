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

export interface NewCard {
  title: string;
  description: string;
  markers: MarkerLatLng[];
  stackId?: number;
}

export interface CardDB {
  id?: number;
  title: string;
  description: string;
  markers: MarkerDB[];
  region_image_id?: number;
  stack_id?: number | null;
}

export interface MarkerDB {
  id?: number;
  card_id?: number;
  card?: CardDB;
  longitude: number;
  latitude: number;
  radius: number;
  icon_name: keyof typeof ICONS;
}
