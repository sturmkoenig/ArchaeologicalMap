import { Injectable, WritableSignal, effect, signal } from "@angular/core";
import { LatLng, LatLngBounds, LatLngExpression, LayerGroup } from "leaflet";
import { MarkerService } from "./marker.service";
import { MarkerAM, RadiusVisibility } from "../model/marker";
import { CardDB } from "../model/card";
import { CardService } from "./card.service";
import { IconKeys, IconService } from "./icon.service";

@Injectable()
export class OverviewMapService {
  public readonly mainLayerGroup: LayerGroup;
  public readonly selectedLayerGroup: LayerGroup;
  iconSizeMap: Map<IconKeys, number> = new Map();
  selectedMarker: WritableSignal<MarkerAM | undefined>;
  editCard: WritableSignal<CardDB | undefined>;

  constructor(
    private markerService: MarkerService,
    private cardService: CardService,
    private iconService: IconService,
  ) {
    this.mainLayerGroup = new LayerGroup();
    this.selectedLayerGroup = new LayerGroup();
    this.selectedMarker = signal<MarkerAM | undefined>(undefined);
    this.editCard = signal<CardDB | undefined>(undefined);
    this.iconService
      .getIconSizeSettings()
      .then((iconSizeMap: Map<IconKeys, number>) => {
        this.iconSizeMap = iconSizeMap;
      });

    effect(() => {
      this.selectedLayerGroup.clearLayers();
      console.log("in effect");
      if (this.selectedMarker()) {
        this.removeLayerFromMainLayerGroup(this.selectedMarker()!);
        this.selectedMarker()!.addTo(this.selectedLayerGroup);
        if (this.selectedMarker()!.radiusLayer) {
          this.selectedLayerGroup.addLayer(this.selectedMarker()!.radiusLayer!);
        }
        this.selectedMarker()!.visibilityOfRadius(RadiusVisibility.always);
        this.cardService.readCard(this.selectedMarker()!.cardId).then((c) => {
          this.editCard.set(c);
          this.selectedMarker()?.bindPopup(
            MarkerService.createPopupHTML(
              this.selectedMarker()!.toMarkerDB(),
              c,
            ),
          );
          this.selectedMarker()!.openPopup();
        });
      }
    });
  }

  resetMainLayerGroup(): void {
    this.mainLayerGroup.clearLayers();
  }

  changeSelectedMarkerAM(markerAM: MarkerAM | undefined): void {
    if (markerAM?.markerId === this.selectedMarker()?.markerId) {
      return;
    }
    this.selectedLayerGroup.clearLayers();
    this.addLayerToMainLayerGroup(this.selectedMarker());
    this.selectedMarker.set(markerAM);
  }

  async addNewCard(latlng: LatLngExpression): Promise<void> {
    let newMarker = new MarkerAM(latlng, {}, { iconType: "iconMiscRed" });
    const newCard = {
      title: "",
      description: "",
      markers: [newMarker.toMarkerDB()],
    };
    await this.cardService.createCard(newCard).then((c) => {
      console.log("in create card return");
      this.editCard.set(c);
      newMarker = new MarkerAM(
        latlng,
        {},
        { cardId: c.id, iconType: "iconMiscRed", markerId: c.markers[0].id },
      );
      this.changeSelectedMarkerAM(newMarker);
    });
  }

  moveSelectedMarker(latlng: LatLng): void {
    this.selectedMarker()?.setLatLng(latlng);
    this.selectedMarker.set(this.selectedMarker());
    this.markerService.updateMarker(this.selectedMarker()!.toMarkerDB());
  }

  async deleteSelectedMarker(): Promise<void> {
    this.selectedLayerGroup.clearLayers();
    await this.cardService.deleteMarker(this.selectedMarker()!.markerId);
    this.selectedMarker.set(undefined);
  }

  async reloadSelectedMarker() {
    await this.markerService
      .getMarker(this.selectedMarker()!.markerId)
      .then((m) => {
        this.selectedLayerGroup.clearLayers();
        this.selectedMarker.set(m);
      });
  }
  updateEditCard(newCard: CardDB) {
    this.editCard.set(newCard);
    this.cardService.updateCard(newCard, []);
  }

  async addMarkerToSelectedCard(latlng: LatLngExpression): Promise<void> {
    let newMarker = new MarkerAM(
      latlng,
      {},
      { cardId: this.editCard()?.id, iconType: "iconMiscRed" },
    );
    await this.markerService
      .createNewMarker(this.selectedMarker()!.cardId, newMarker.toMarkerDB())
      .then((m) => {
        newMarker = new MarkerAM(
          latlng,
          {},
          { markerId: m.id, cardId: m.card_id, iconType: "iconMiscRed" },
        );
        this.changeSelectedMarkerAM(newMarker);
      });
  }

  async deleteEditCard(): Promise<void> {
    const deleteCardId = this.selectedMarker()?.cardId;
    if (deleteCardId === undefined) {
      return;
    }
    await this.cardService.deleteCard(deleteCardId);
    this.editCard.set(undefined);
    this.selectedLayerGroup.clearLayers();
    this.selectedMarker.set(undefined);
    this.mainLayerGroup.eachLayer((l) => {
      if (l instanceof MarkerAM && l.cardId === deleteCardId) {
        this.removeLayerFromMainLayerGroup(l);
      }
    });
  }

  addLayerToMainLayerGroup(marker: MarkerAM | undefined): void {
    if (!marker) {
      return;
    }
    this.mainLayerGroup.addLayer(marker);
    marker.on("click", () => {
      this.changeSelectedMarkerAM(marker);
    });
    this.mainLayerGroup.on("click", () => {
      this.changeSelectedMarkerAM(marker);
    });
    if (marker.radiusLayer) {
      this.mainLayerGroup.addLayer(marker.radiusLayer);
    }
  }

  removeLayerFromMainLayerGroup(marker: MarkerAM): void {
    this.mainLayerGroup.removeLayer(marker);
    if (marker.radiusLayer) {
      this.mainLayerGroup.removeLayer(marker.radiusLayer);
    }
  }

  resetSelectedLayerGroup() {
    this.selectedLayerGroup.clearLayers();
  }

  async updateIconSize(iconKey: IconKeys, newSize: number) {
    this.iconSizeMap.set(iconKey, newSize);
    this.mainLayerGroup.getLayers().forEach((l) => {
      if (l instanceof MarkerAM && l.iconType === iconKey) {
        l.setIconSize(newSize);
      }
    });
    this.selectedLayerGroup.getLayers().forEach((l) => {
      if (l instanceof MarkerAM && l.iconType === iconKey) {
        l.setIconSize(newSize);
      }
    });
  }

  async updateMapBounds(bounds: LatLngBounds) {
    await this.markerService.getMarkerAMInArea(bounds).then((markers) => {
      // remove markers that are not in the new bounds
      this.mainLayerGroup.getLayers().map((l) => {
        if (l instanceof MarkerAM) {
          const wasRemoved = !markers.some((m) => m.markerId === l.markerId);
          if (wasRemoved) {
            this.removeLayerFromMainLayerGroup(l);
          }
        }
      });
      // add new markers
      markers.filter((m) => {
        const wasAdded = !this.mainLayerGroup
          .getLayers()
          .some((l) => l instanceof MarkerAM && l.markerId === m.markerId);
        if (wasAdded && m.markerId !== this.selectedMarker()?.markerId) {
          this.addLayerToMainLayerGroup(m);
        }
      });
    });
  }
}
