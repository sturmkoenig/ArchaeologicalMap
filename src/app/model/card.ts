import { ICONS } from "@service/icon.service";

export type CardinalDirection = {
  north: number;
  east: number;
  south: number;
  west: number;
};

export type LocationCard = {
  id?: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  regionImageId?: number;
  iconName: keyof typeof ICONS;
  radius: number;
  stackId?: number;
};

export type CardDTO = {
  id?: number;
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  regionImageId?: number;
  iconName?: keyof typeof ICONS;
  radius?: number;
  stackId?: number;
};

export const fromCardDTO = (cardDTO: CardDTO): LocationCard | InfoCard => {
  if (!(cardDTO.longitude && cardDTO.latitude && cardDTO.iconName)) {
    return {
      ...(cardDTO.id ? { id: cardDTO.id } : {}),
      title: cardDTO.title,
      description: cardDTO.description,
      stackId: cardDTO.stackId,
      ...(cardDTO.regionImageId
        ? { regionImageId: cardDTO.regionImageId }
        : {}),
    };
  }
  return {
    ...(cardDTO.id ? { id: cardDTO.id } : {}),
    title: cardDTO.title,
    description: cardDTO.description,
    stackId: cardDTO.stackId,
    latitude: cardDTO.latitude,
    longitude: cardDTO.longitude,
    radius: cardDTO.radius,
    iconName: cardDTO.iconName,
    regionImageId: cardDTO.regionImageId,
  };
};

export const isLocationCard = (
  card: LocationCard | InfoCard,
): card is LocationCard => {
  return (card as LocationCard).longitude !== undefined;
};

export const toCardDTO = (card: InfoCard | LocationCard): CardDTO =>
  isLocationCard(card)
    ? {
        ...(card.id ? { id: card.id } : {}),
        title: card.title,
        description: card.description,
        stackId: card.stackId,
        latitude: card.latitude,
        longitude: card.longitude,
        iconName: card.iconName,
        radius: card.radius,
        ...(card.regionImageId ? { region_image_id: card.regionImageId } : {}),
      }
    : {
        ...(card.id ? { id: card.id } : {}),
        title: card.title,
        description: card.description,
        stackId: card.stackId,
        ...(card.regionImageId ? { region_image_id: card.regionImageId } : {}),
      };

export type Card = InfoCard | LocationCard;
export type InfoCard = Pick<
  LocationCard,
  "id" | "title" | "description" | "regionImageId" | "stackId"
>;

export type LocationData = Pick<
  LocationCard,
  "latitude" | "longitude" | "radius" | "iconName"
>;
