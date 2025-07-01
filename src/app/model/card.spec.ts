import {
  InfoCard,
  LocationCard,
  isLocationCard,
  hasValidLocationData,
} from "./card";

describe("Card Model", () => {
  describe("isLocationCard", () => {
    it("should return true for a card with longitude defined", () => {
      const card: LocationCard = {
        title: "Test Card",
        description: "Test Description",
        latitude: 0,
        longitude: 0,
        iconName: "iconMiscBlack",
        radius: 0,
      };
      expect(isLocationCard(card)).toBe(true);
    });

    it("should return false for a card without longitude defined", () => {
      const card: InfoCard = {
        title: "Test Card",
        description: "Test Description",
      };
      expect(isLocationCard(card)).toBe(false);
    });
  });

  describe("hasValidLocationData", () => {
    it("should return true for a card with valid location data", () => {
      const card: LocationCard = {
        title: "Test Card",
        description: "Test Description",
        latitude: 10.5,
        longitude: 20.5,
        iconName: "iconMiscBlack",
        radius: 0,
      };
      expect(hasValidLocationData(card)).toBe(true);
    });

    it("should return false for a card with null latitude", () => {
      const card = {
        title: "Test Card",
        description: "Test Description",
        latitude: null,
        longitude: 20.5,
        iconName: "iconMiscBlack",
        radius: 0,
      };
      expect(hasValidLocationData(card)).toBe(false);
    });

    it("should return false for a card with null longitude", () => {
      const card = {
        title: "Test Card",
        description: "Test Description",
        latitude: 10.5,
        longitude: null,
        iconName: "iconMiscBlack",
        radius: 0,
      };
      expect(hasValidLocationData(card)).toBe(false);
    });

    it("should return false for a card with undefined latitude", () => {
      const card = {
        title: "Test Card",
        description: "Test Description",
        longitude: 20.5,
        iconName: "iconMiscBlack",
        radius: 0,
      };
      expect(hasValidLocationData(card)).toBe(false);
    });

    it("should return false for a card with undefined longitude", () => {
      const card = {
        title: "Test Card",
        description: "Test Description",
        latitude: 10.5,
        iconName: "iconMiscBlack",
        radius: 0,
      };
      expect(hasValidLocationData(card)).toBe(false);
    });

    it("should return false for an InfoCard", () => {
      const card: InfoCard = {
        title: "Test Card",
        description: "Test Description",
      };
      expect(hasValidLocationData(card)).toBe(false);
    });
  });
});
