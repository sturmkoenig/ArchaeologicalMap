import { LocationCard } from "@app/model/card";
import { NotificationService } from "@service/notification.service";
import { CardService } from "@service/card.service";

const testCard: LocationCard = {
  title: "RamboZambo",
  description: "Merziger Schmerz",
  latitude: 0.0,
  longitude: 0.0,
  iconName: "iconMiscBlack",
  radius: 0.0,
  stackId: 1,
};

const createNotificationMock = jest.fn();
const notificationServiceMock = {
  createNotification: createNotificationMock,
} as unknown as NotificationService;

jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn(), // this mock is replaced below
}));

import { invoke } from "@tauri-apps/api/core";

describe("CardService", () => {
  let service: CardService;

  beforeEach(() => {
    service = new CardService(notificationServiceMock);
  });
  it("correctly create a card", () => {
    (invoke as jest.Mock).mockResolvedValue({});

    service.createCard(testCard);
    expect(invoke).toHaveBeenCalledWith("create_unified_card", {
      card: {
        title: testCard.title,
        description: testCard.description,
        latitude: testCard.latitude,
        longitude: testCard.longitude,
        radius: testCard.radius,
        stackId: testCard.stackId,
        iconName: testCard.iconName,
      },
    });
  });

  it("correctly updates a card", () => {
    (invoke as jest.Mock).mockResolvedValue({});

    service.updateCard({ id: 1, ...testCard });
    expect(invoke).toHaveBeenCalledWith("update_card_unified", {
      card: {
        id: 1,
        title: testCard.title,
        description: testCard.description,
        latitude: testCard.latitude,
        longitude: testCard.longitude,
        radius: testCard.radius,
        stackId: testCard.stackId,
        iconName: testCard.iconName,
      },
    });
  });

  it("correctly updates a card", () => {
    (invoke as jest.Mock).mockResolvedValue({});

    service.updateCard({ id: 1, ...testCard });
    expect(invoke).toHaveBeenCalledWith("update_card_unified", {
      card: {
        id: 1,
        title: testCard.title,
        description: testCard.description,
        latitude: testCard.latitude,
        longitude: testCard.longitude,
        radius: testCard.radius,
        stackId: testCard.stackId,
        iconName: testCard.iconName,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
