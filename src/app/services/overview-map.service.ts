import { effect, Injectable, signal, WritableSignal } from "@angular/core";
import {
  LatLng,
  LatLngBounds,
  LatLngExpression,
  Layer,
  LayerGroup,
  MarkerClusterGroup,
} from "leaflet";
import { MarkerService } from "./marker.service";
import { MarkerAM, RadiusVisibility } from "../model/marker";
import { CardDB } from "../model/card";
import { CardService } from "./card.service";
import { IconKeys, IconService } from "./icon.service";

@Injectable()
export class OverviewMapService {
  public readonly mainLayerGroup: LayerGroup;
  public clusterGroup!: MarkerClusterGroup;
  public readonly selectedLayerGroup: LayerGroup;
  public readonly radiusLayerGroup: LayerGroup;
  public showLabels?: boolean;
  iconSizeMap: Map<IconKeys, number> = new Map();
  selectedMarker: WritableSignal<MarkerAM | undefined>;
  editCard: WritableSignal<CardDB | undefined>;

  setMarkerClusterLayerGroup(markerClusterLayerGroup: MarkerClusterGroup) {
    this.clusterGroup = markerClusterLayerGroup;
  }
  constructor(
    private markerService: MarkerService,
    private cardService: CardService,
    private iconService: IconService,
  ) {
    this.mainLayerGroup = new LayerGroup();
    this.selectedLayerGroup = new LayerGroup();
    this.radiusLayerGroup = new LayerGroup();
    this.selectedMarker = signal<MarkerAM | undefined>(undefined);
    this.editCard = signal<CardDB | undefined>(undefined);
    this.iconService
      .getIconSizeSettings()
      .then((iconSizeMap: Map<IconKeys, number>) => {
        this.iconSizeMap = iconSizeMap;
      });

    effect(() => {
      this.selectedLayerGroup.clearLayers();
      if (this.selectedMarker()) {
        this.removeLayerFromMainLayerGroup(this.selectedMarker()!);
        this.selectedMarker()!.addTo(this.selectedLayerGroup);
        if (this.selectedMarker()?.radiusLayer) {
          this.radiusLayerGroup.addLayer(this.selectedMarker()!.radiusLayer!);
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
    if (!this.clusterGroup) {
      return;
    }
    this.mainLayerGroup.clearLayers();
    this.clusterGroup.clearLayers();
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
    let newMarker = new MarkerAM(
      (id: number) => this.cardService.readCard(id),
      latlng,
      {},
      { iconType: "iconMiscRed", loadCard: false },
    );
    const newCard = {
      title: "",
      description: "",
      markers: [newMarker.toMarkerDB()],
    };
    await this.cardService.createCard(newCard).then((c) => {
      this.editCard.set(c);
      newMarker = new MarkerAM(
        (id: number) => this.cardService.readCard(id),
        latlng,
        {},
        {
          cardId: c.id,
          iconType: "iconMiscRed",
          markerId: c.markers[0].id,
        },
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
      .getMarker(this.selectedMarker()!.markerId, !!this.showLabels)
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
      (id: number) => this.cardService.readCard(id),
      latlng,
      {},
      {
        cardId: this.editCard()?.id,
        iconType: "iconMiscRed",
        loadCard: this.showLabels,
      },
    );
    await this.markerService
      .createNewMarker(this.selectedMarker()!.cardId, newMarker.toMarkerDB())
      .then((m) => {
        newMarker = new MarkerAM(
          (id: number) => this.cardService.readCard(id),
          latlng,
          {},
          {
            markerId: m.id,
            cardId: m.card_id,
            iconType: "iconMiscRed",
            loadCard: this.showLabels,
          },
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
    this.clusterGroup.addLayer(marker);
    marker.on("click", () => {
      this.changeSelectedMarkerAM(marker);
    });

    if (marker.radiusLayer) {
      marker.visibilityOfRadius(RadiusVisibility.onHover);
      this.radiusLayerGroup.addLayer(marker.radiusLayer);
      if (!this.radiusLayerGroup.hasLayer(marker.radiusLayer)) {
        console.log("added");
      }
    }
  }

  removeLayerFromMainLayerGroup(marker: MarkerAM): void {
    this.mainLayerGroup.removeLayer(marker);
    this.clusterGroup.removeLayer(marker);
    if (marker.radiusLayer) {
      this.radiusLayerGroup.removeLayer(marker.radiusLayer);
    }
  }

  async updateIconSize(iconKey: IconKeys, newSize: number) {
    this.iconSizeMap.set(iconKey, newSize);
    this.mainLayerGroup.getLayers().forEach((l) => {
      if (l instanceof MarkerAM && l.iconType === iconKey) {
        l.setIconSize(newSize);
      }
    });
    this.clusterGroup.getLayers().forEach((l) => {
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
    await this.markerService
      .getMarkerAMInArea(bounds, !!this.showLabels)
      .then((markers) => {
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

  hightlightMarker(highlightedMarkerIds: number[]) {
    this.clusterGroup
      .getLayers()
      .filter(
        (marker: Layer) =>
          marker instanceof MarkerAM &&
          highlightedMarkerIds.find((id) => id === marker.markerId) !==
            undefined,
      )
      .forEach((marker: Layer) => {
        marker.bindTooltip("searched marker");
        marker.toggleTooltip();
      });
  }
}
