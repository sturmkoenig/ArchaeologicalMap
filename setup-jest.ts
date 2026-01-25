// setup-jest.ts
import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";
import "@testing-library/jest-dom";

setupZoneTestEnv();

jest.mock("@tauri-apps/api", () => ({
  path: {},
}));

jest.mock("@tauri-apps/plugin-fs", () => ({
  __esModule: true,
  default: {},
}));
