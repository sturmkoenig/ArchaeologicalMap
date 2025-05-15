import { ICONS } from "@service/icon.service";

export interface CardinalDirection {
  north: number;
  east: number;
  south: number;
  west: number;
}

export interface Card {
  id?: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  regionImageId?: number;
  iconName: keyof typeof ICONS;
  radius: number;
  stackId?: number;
}

export interface CardDTO {
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

export const fromCardDTO = (cardDTO: CardDTO): Card => ({
  id: cardDTO.id,
  title: cardDTO.title,
  description: cardDTO.description,
  latitude: cardDTO.latitude,
  longitude: cardDTO.longitude,
  regionImageId: cardDTO.region_image_id,
  iconName: cardDTO.icon_name,
  radius: cardDTO.radius,
  stackId: cardDTO.stack_id,
});

export const toCardDTO = (card: Card): CardDTO => ({
  id: card.id,
  title: card.title,
  description: card.description,
  latitude: card.latitude,
  longitude: card.longitude,
  region_image_id: card.regionImageId,
  icon_name: card.iconName,
  radius: card.radius,
  stack_id: card.stackId,
});

export type CardMetaData = Pick<
  Card,
  "title" | "description" | "regionImageId" | "stackId"
>;
export type LocationData = Pick<
  Card,
  "latitude" | "longitude" | "radius" | "iconName"
>;
