import { StackCreatorComponent } from "@app/components/stacks/stack-creator/stack-creator.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StackStore } from "@app/state/stack.store";
import { MatCardModule } from "@angular/material/card";
import { MatDialogModule } from "@angular/material/dialog";
import { of } from "rxjs";
import { BrowserModule } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";

jest.mock("@tauri-apps/api/webview", () => ({
  getCurrentWebview: () => ({
    onDragDropEvent: jest.fn(),
  }),
}));

jest.mock("@tauri-apps/api", () => ({
  path: jest.fn(),
}));

describe("StackCreatorComponent", () => {
  let component: StackCreatorComponent;
  let fixture: ComponentFixture<StackCreatorComponent>;
  let stackStoreMock: StackStore;

  beforeEach(async () => {
    stackStoreMock = {
      createStack: jest.fn(),
    } as unknown as StackStore;
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatDialogModule,
      ],
      providers: [{ provide: StackStore, useValue: stackStoreMock }],
    }).compileComponents();
    fixture = TestBed.createComponent(StackCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should display original stacks", () => {
    const cards = fixture.nativeElement.querySelectorAll(".card__container"); // Get all stack containers
    expect(cards.length).toBe(2); // Check if there are 2 card containers shown
    expect(cards[0].textContent).toContain("Stack 1"); // Check contents of the first stack
    expect(cards[1].textContent).toContain("Stack 2"); // Check contents of the second stack
  });
});
