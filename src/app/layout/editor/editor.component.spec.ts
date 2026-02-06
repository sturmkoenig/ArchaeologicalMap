import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorComponent } from "./editor.component";
import { CardContentService } from "@service/card-content.service";
import { CardService } from "@service/card.service";
import { BehaviorSubject } from "rxjs";
import Delta from "quill-delta";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { FilterPipe } from "./filter.pipe";

jest.mock("quill-image-resize-module", () => {
  return class {
    hide = jest.fn();
  };
});

jest.mock("quill-image-drop-and-paste", () => {
  return class {};
});

jest.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setFocus: jest.fn(),
    onCloseRequested: jest.fn(),
    label: "test-window",
  }),
}));

jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn().mockResolvedValue(null),
  convertFileSrc: jest.fn((src: string) => src),
}));

jest.mock("@tauri-apps/api/event", () => ({
  emit: jest.fn(),
  listen: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: jest.fn(),
}));

Range.prototype.getBoundingClientRect = jest.fn(() => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  toJSON: jest.fn(),
}));

describe("EditorComponent", () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;
  let cardContentSubject: BehaviorSubject<Delta | undefined>;

  const cardContentServiceMock = {
    cardContent: new BehaviorSubject<Delta | undefined>(undefined),
  };

  const cardServiceMock = {
    readCardByTitle: jest.fn().mockResolvedValue([]),
  };

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    cardContentSubject = new BehaviorSubject<Delta | undefined>(undefined);
    cardContentServiceMock.cardContent = cardContentSubject;

    await TestBed.configureTestingModule({
      declarations: [EditorComponent, FilterPipe],
      imports: [
        MatIconModule,
        MatMenuModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: CardContentService, useValue: cardContentServiceMock },
        { provide: CardService, useValue: cardServiceMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
    component.ngAfterViewInit();
  });

  afterEach(() => {
    fixture.destroy();
  });

  const givenEditorHasContent = (text: string) => {
    component.quill.setText(text, "user");
    jest.advanceTimersByTime(1100);
    (component.quill.getModule("history") as any).clear();
  };

  const givenUserTypesText = (text: string) => {
    const length = component.quill.getLength() - 1;
    component.quill.insertText(length, text, "user");
  };

  const givenTimePasses = () => {
    jest.advanceTimersByTime(1100);
  };

  const whenUndoIsPressed = () => {
    component.undo();
  };

  const whenRedoIsPressed = () => {
    component.redo();
  };

  const whenNavigatingToNewCard = (delta: Delta) => {
    component.setContents(delta);
  };

  const thenEditorTextShouldBe = (text: string) => {
    expect(component.quill.getText().trim()).toBe(text);
  };

  it("should revert to previous text after undo", () => {
    givenEditorHasContent("hello");
    givenUserTypesText(" world");
    givenTimePasses();

    whenUndoIsPressed();

    thenEditorTextShouldBe("hello");
  });

  it("should restore undone edit after redo", () => {
    givenEditorHasContent("hello");
    givenUserTypesText(" world");
    givenTimePasses();

    whenUndoIsPressed();
    whenRedoIsPressed();

    thenEditorTextShouldBe("hello world");
  });

  it("should not undo into previous card content after navigation", () => {
    givenEditorHasContent("card A content");
    givenUserTypesText(" edited");
    givenTimePasses();

    const cardBDelta = new Delta().insert("card B content\n");
    whenNavigatingToNewCard(cardBDelta);
    whenUndoIsPressed();

    thenEditorTextShouldBe("card B content");
  });

  it("should not redo into previous card content after navigation", () => {
    givenEditorHasContent("card A content");
    givenUserTypesText(" edited");
    givenTimePasses();
    whenUndoIsPressed();

    const cardBDelta = new Delta().insert("card B content\n");
    whenNavigatingToNewCard(cardBDelta);
    whenRedoIsPressed();

    thenEditorTextShouldBe("card B content");
  });

  it("should allow undo to base content after navigating and editing", () => {
    const cardBDelta = new Delta().insert("card B base\n");
    whenNavigatingToNewCard(cardBDelta);

    givenUserTypesText(" added");
    givenTimePasses();

    whenUndoIsPressed();

    thenEditorTextShouldBe("card B base");
  });

  it("should revert multiple edits with multiple undos", () => {
    givenEditorHasContent("a");

    givenUserTypesText("b");
    givenTimePasses();
    givenUserTypesText("c");
    givenTimePasses();

    whenUndoIsPressed();
    whenUndoIsPressed();

    thenEditorTextShouldBe("a");
  });

  it("should handle undo-redo-undo cycle correctly", () => {
    givenEditorHasContent("start");
    givenUserTypesText(" edit");
    givenTimePasses();

    whenUndoIsPressed();
    whenRedoIsPressed();
    whenUndoIsPressed();

    thenEditorTextShouldBe("start");
  });
});
