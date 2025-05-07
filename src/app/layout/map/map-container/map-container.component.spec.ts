import { render, screen } from "@testing-library/angular";
import { MapContainerComponent } from "@app/layout/map/map-container/map-container.component";
import { Component } from "@angular/core";
import { StackStore } from "@app/state/stack.store";
import { MatSidenavModule } from "@angular/material/sidenav";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";

import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

@Component({
  selector: "app-overview-map",
  standalone: true,
  template: '<div data-testid="mock-map"></div>',
})
class MockOverviewMapComponent {}

@Component({
  selector: "app-card-list",
  standalone: true,
  template: '<div data-testid="mock-card-list"></div>',
})
class MockCardListComponent {}

@Component({
  selector: "app-stack-display",
  standalone: true,
  template: '<div data-testid="mock-stack-list"></div>',
})
class MockStackDisplayComponent {}

const setup = async () =>
  await render(MapContainerComponent, {
    providers: [StackStore],
    componentImports: [
      MockOverviewMapComponent,
      MatSidenavModule,
      MatIconModule,
      CommonModule,
      MockCardListComponent,
      MockStackDisplayComponent,
    ],
  });

it("should display the cardList Component when clicked", async () => {
  await setup();
  const cardListButton = screen.getByTestId("card-list-button");
  await userEvent.click(cardListButton);
  const cardList = screen.getByTestId("mock-card-list");
  expect(cardList).toBeVisible();
});

it("should display the stackList Component when clicked", async () => {
  await setup();
  const stackListButton = screen.getByTestId("stack-list-button");
  await userEvent.click(stackListButton);
  const stackList = screen.getByTestId("mock-stack-list");
  expect(stackList).toBeVisible();
});

it("should switch display when i first click the stack button and then the list button", async () => {
  await setup();
  const stackListButton = screen.getByTestId("stack-list-button");
  await userEvent.click(stackListButton);
  const cardListButton = screen.getByTestId("card-list-button");
  await userEvent.click(cardListButton);
  const cardList = screen.getByTestId("mock-card-list");
  expect(cardList).toBeVisible();
});
