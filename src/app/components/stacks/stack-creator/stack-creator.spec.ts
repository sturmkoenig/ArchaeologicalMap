import { StackCreatorComponent } from "@app/components/stacks/stack-creator/stack-creator.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StackStore } from "@app/state/stack.store";
import { MatCardModule } from "@angular/material/card";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ImageService } from "@service/image.service";
import { WindowService } from "@service/window.service";

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
        MatCardModule,
        MatDialogModule,
        CommonModule,
        MatFormFieldModule,
        NoopAnimationsModule,
        MatInputModule,
        MatButtonModule,
        FormsModule,
      ],
      providers: [
        { provide: StackStore, useValue: stackStoreMock },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {},
        },
        {
          provide: ImageService,
          useValue: {
            moveImageToAppDir: jest.fn(),
          },
        },
        {
          provide: WindowService,
          useValue: {
            handleDragDropEvent: jest.fn(),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(StackCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("given all information when i press the save button createStack should be called", () => {
    const fileName = "testPicture";
    const stackName = "testName";
    component.fileName.set(fileName);
    component.fileUrl$.next("/path/to/test/image.png");
    component.stackName.set(stackName);
    component.onSaveStack();
    expect(stackStoreMock.createStack).toBeCalledWith({
      name: stackName,
      image_name: fileName,
    });
  });
});
