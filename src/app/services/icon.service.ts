import { Injectable } from "@angular/core";
import {} from "@tauri-apps/api";
import { BaseDirectory } from "@tauri-apps/api/path";
import * as fs from "@tauri-apps/plugin-fs";

const ICON_SIZE_SETTINGS_FILE = "icon-size.settings.json";

export type IconKeys = keyof typeof ICONS;
export type IconCategoriesKeys = keyof typeof iconsSorted;

export interface IconSizeSetting {
  iconType: keyof typeof ICONS;
  iconSize: number;
}

export enum ICONS {
  iconCaveBlack = "/assets/icons/cave_black.svg",
  iconCaveRed = "/assets/icons/cave_red.svg",
  iconCaveSpecial = "/assets/icons/cave_special.svg",
  iconPaintedCaveBlack = "/assets/icons/painted_cave_black.svg",
  iconPaintedCaveRed = "/assets/icons/painted_cave_red.svg",
  iconPaintedCaveSpecial = "/assets/icons/painted_cave_special.svg",
  iconMegalithicTombstoneBlack = "/assets/icons/megalithic_tombstone_black.svg",
  iconMegalithicTombstoneRed = "/assets/icons/megalithic_tombstone_red.svg",
  iconMegalithicTombstoneSpecial = "/assets/icons/megalithic_tombstone_special.svg",
  iconBurialMoundBlack = "/assets/icons/burial_mound_black.svg",
  iconBurialMoundRed = "/assets/icons/burial_mound_red.svg",
  iconBurialMoundSpecial = "/assets/icons/burial_mound_special.svg",
  iconFieldOfBurialMoundsBlack = "/assets/icons/field_of_burial_mounds_black.svg",
  iconFieldOfBurialMoundsRed = "/assets/icons/field_of_burial_mounds_red.svg",
  iconFieldOfBurialMoundsSpecial = "/assets/icons/field_of_burial_mounds_special.svg",
  iconMiscBlack = "/assets/icons/misc_black.svg",
  iconMiscRed = "/assets/icons/misc_red.svg",
  iconMiscSpecial = "/assets/icons/misc_special.png",
  iconMiscCarvedBlack = "/assets/icons/misc_carved_black.svg",
  iconMiscCarvedRed = "/assets/icons/misc_carved_red.svg",
  iconMiscCarvedSpecial = "/assets/icons/misc_carved_special.svg",
  iconRomanBlack = "/assets/icons/roman_black.svg",
  iconRomanRed = "/assets/icons/roman_red.svg",
  iconRomanSpecial = "/assets/icons/roman_special.svg",
  iconRuneStoneBlack = "/assets/icons/rune_stone_black.svg",
  iconRuneStoneRed = "/assets/icons/rune_stone_red.svg",
  iconRuneStoneSpecial = "/assets/icons/rune_stone_special.svg",
  iconChristianChurchRed = "/assets/icons/christian_church_red.svg",
  iconChristianChurchBlack = "/assets/icons/christian_church_black.svg",
  iconChristianChurchSpecial = "/assets/icons/christian_church_special.svg",
  iconPetroglyphBlack = "/assets/icons/petroglyph_black.svg",
  iconPetroglyphRed = "/assets/icons/petroglyph_red.svg",
  iconPetroglyphSpecial = "/assets/icons/petroglyph_special.svg",
  iconFortifiedSettlementBlack = "/assets/icons/fortified_settlement_black.svg",
  iconFortifiedSettlementRed = "/assets/icons/fortified_settlement_red.svg",
  iconFortifiedSettlementSpecial = "/assets/icons/fortified_settlement_special.svg",
  iconRomanSettlementMilitaryBlack = "/assets/icons/roman_settlement_military_black.svg",
  iconRomanSettlementMilitaryRed = "/assets/icons/roman_settlement_military_red.svg",
  iconRomanSettlementMilitarySpecial = "/assets/icons/roman_settlement_military_special.svg",
  iconRomanSettlementBlack = "/assets/icons/roman_settlement_black.svg",
  iconRomanSettlementRed = "/assets/icons/roman_settlement_red.svg",
  iconRomanSettlementSpecial = "/assets/icons/roman_settlement_special.svg",
  iconBorderLimesBlack = "/assets/icons/border_limes_black.svg",
  iconBorderLimesRed = "/assets/icons/border_limes_red.svg",
  iconBorderLimesSpecial = "/assets/icons/border_limes_special.svg",
  iconChurchBlack = "/assets/icons/church_black.svg",
  iconChurchRed = "/assets/icons/church_red.svg",
  iconSingleMonumentBlack = "/assets/icons/single_monument_black.svg",
  iconSingleMonumentRed = "/assets/icons/single_monument_red.svg",
  iconSingleMonumentSpecial = "/assets/icons/single_monument_special.svg",
  iconMonumentMiscBlack = "/assets/icons/monument_misc_black.svg",
  iconMonumentMiscRed = "/assets/icons/monument_misc_red.svg",
  iconMonumentMiscSpecial = "/assets/icons/monument_misc_special.svg",
  iconMonumentBlack = "/assets/icons/monument_black.svg",
  iconMonumentRed = "/assets/icons/monument_red.svg",
  iconMonumentSpecial = "/assets/icons/monument_special.svg",
  iconChristianBlack = "/assets/icons/christian_black.svg",
  iconChristianRed = "/assets/icons/christian_red.svg",
  iconChristianSpecial = "/assets/icons/christian_special.svg",
  iconMuseumBlack = "/assets/icons/museum_black.svg",
  iconMuseumRed = "/assets/icons/museum_red.svg",
  iconMuseumSpecial = "/assets/icons/museum_special.svg",
}

export const iconsSorted = {
  iconCave: [ICONS.iconCaveRed, ICONS.iconCaveBlack, ICONS.iconCaveSpecial],
  iconPaintedCave: [
    ICONS.iconPaintedCaveRed,
    ICONS.iconPaintedCaveBlack,
    ICONS.iconPaintedCaveSpecial,
  ],
  iconMegalithicTombstone: [
    ICONS.iconMegalithicTombstoneRed,
    ICONS.iconMegalithicTombstoneBlack,
    ICONS.iconMegalithicTombstoneSpecial,
  ],
  iconBurialMound: [
    ICONS.iconBurialMoundRed,
    ICONS.iconBurialMoundBlack,
    ICONS.iconBurialMoundSpecial,
  ],
  iconFieldOfBurialMounds: [
    ICONS.iconFieldOfBurialMoundsRed,
    ICONS.iconFieldOfBurialMoundsBlack,
    ICONS.iconFieldOfBurialMoundsSpecial,
  ],
  iconMisc: [ICONS.iconMiscRed, ICONS.iconMiscBlack, ICONS.iconMiscSpecial],
  iconMiscCarved: [
    ICONS.iconMiscCarvedRed,
    ICONS.iconMiscCarvedBlack,
    ICONS.iconMiscCarvedSpecial,
  ],
  iconRoman: [ICONS.iconRomanRed, ICONS.iconRomanBlack, ICONS.iconRomanSpecial],
  iconRuneStone: [
    ICONS.iconRuneStoneRed,
    ICONS.iconRuneStoneBlack,
    ICONS.iconRuneStoneSpecial,
  ],
  iconChristianChurch: [
    ICONS.iconChristianChurchRed,
    ICONS.iconChristianChurchBlack,
    ICONS.iconChristianChurchSpecial,
  ],
  iconPetroglyph: [
    ICONS.iconPetroglyphRed,
    ICONS.iconPetroglyphBlack,
    ICONS.iconPetroglyphSpecial,
  ],
  iconFortifiedSettlement: [
    ICONS.iconFortifiedSettlementRed,
    ICONS.iconFortifiedSettlementBlack,
    ICONS.iconFortifiedSettlementSpecial,
  ],
  iconRomanSettlementMilitary: [
    ICONS.iconRomanSettlementMilitaryRed,
    ICONS.iconRomanSettlementMilitaryBlack,
    ICONS.iconRomanSettlementMilitarySpecial,
  ],
  iconRomanSettlement: [
    ICONS.iconRomanSettlementRed,
    ICONS.iconRomanSettlementBlack,
    ICONS.iconRomanSettlementSpecial,
  ],
  iconBorderLimes: [
    ICONS.iconBorderLimesRed,
    ICONS.iconBorderLimesBlack,
    ICONS.iconBorderLimesSpecial,
  ],
  iconChurch: [
    ICONS.iconChurchRed,
    ICONS.iconChurchBlack,
    // ICONS.iconChurchSpecial,
  ],
  iconSingleMonument: [
    ICONS.iconSingleMonumentRed,
    ICONS.iconSingleMonumentBlack,
    ICONS.iconSingleMonumentSpecial,
  ],
  iconChristian: [
    ICONS.iconChristianRed,
    ICONS.iconChristianBlack,
    ICONS.iconChristianSpecial,
  ],
  iconMonumentMisc: [
    ICONS.iconMonumentMiscRed,
    ICONS.iconMonumentMiscBlack,
    ICONS.iconMonumentMiscSpecial,
  ],
  iconMonument: [
    ICONS.iconMonumentRed,
    ICONS.iconMonumentBlack,
    ICONS.iconMonumentSpecial,
  ],
  iconMuseum: [
    ICONS.iconMuseumRed,
    ICONS.iconMuseumBlack,
    ICONS.iconMuseumSpecial,
  ],
};

@Injectable({
  providedIn: "root",
})
export class IconService {
  constructor() {}

  getIconPath(iconType: keyof typeof ICONS): string {
    if (ICONS[iconType]) {
      return ICONS[iconType];
    }
    return ICONS.iconMiscBlack;
  }

  static getIconNameByPath(iconPath: ICONS): keyof typeof ICONS {
    return Object.keys(ICONS)[
      Object.values(ICONS).indexOf(iconPath)
    ] as keyof typeof ICONS;
  }

  async readIconSizeSettings(): Promise<IconSizeSetting[]> {
    let iconSizeSettings: IconSizeSetting[] = [];
    const iconSizeSettingsExist: boolean = await fs.exists(
      ICON_SIZE_SETTINGS_FILE,
      {
        baseDir: BaseDirectory.AppData,
      },
    );

    if (iconSizeSettingsExist) {
      await fs
        .readTextFile(ICON_SIZE_SETTINGS_FILE, {
          baseDir: BaseDirectory.AppData,
        })
        .then((iconSettings) => {
          iconSizeSettings = JSON.parse(iconSettings);
        });
    }

    return iconSizeSettings;
  }

  async writeIconSizeSetting(
    iconKey: IconKeys,
    iconSize: number,
  ): Promise<void> {
    // read existing settings
    const iconSizeSettings: Map<IconKeys, number> =
      await this.getIconSizeSettings();
    // add new setting
    iconSizeSettings.set(iconKey, iconSize);
    const iconSizeSettingsArray: IconSizeSetting[] = [];
    for (const [key, value] of iconSizeSettings) {
      iconSizeSettingsArray.push({ iconType: key, iconSize: value });
    }
    const iconSettingString = JSON.stringify(iconSizeSettingsArray);
    // write new settings
    const enc = new TextEncoder(); // always utf-8
    await fs
      .writeFile(ICON_SIZE_SETTINGS_FILE, enc.encode(iconSettingString), {
        baseDir: BaseDirectory.AppData,
      })
      .catch((e) => {
        console.error("error writing icon size settings", e);
      });
  }

  async getIconSizeSettings(): Promise<Map<IconKeys, number>> {
    const iconSizeSettingMap: Map<IconKeys, number> = new Map();
    const iconSizeSettings: IconSizeSetting[] =
      await this.readIconSizeSettings();
    iconSizeSettings.forEach((iconSizeSetting) => {
      iconSizeSettingMap.set(
        iconSizeSetting.iconType,
        iconSizeSetting.iconSize,
      );
    });
    return iconSizeSettingMap;
  }
}
