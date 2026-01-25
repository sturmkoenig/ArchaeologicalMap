# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Archaeological Map is a **Tauri 2 + Angular 19** desktop application for managing archaeological site data with interactive maps. The app uses a hybrid architecture with:
- **Frontend**: Angular with NgRx for state management, Leaflet for mapping, and Quill for rich text editing
- **Backend**: Rust (Tauri) with Diesel ORM and SQLite for data persistence
- **Communication**: Tauri's invoke API bridges Angular to Rust backend commands

## Development Commands

### Angular Frontend
```bash
# Development server
npm run start              # or ng serve (runs on http://localhost:4200)
npm run web:serve          # opens browser automatically

# Build
npm run build              # or ng build
npm run web:build          # production build with base href ./
npm run web:prod           # production build

# Testing
npm test                   # run Jest tests
npm run test:watch         # run tests in watch mode
npm run test:coverage      # run tests with coverage report

# Linting
npm run lint              # runs ESLint on TypeScript and HTML files
```

### Tauri Desktop App
```bash
# Development (builds Angular + starts Tauri)
npm run tauri dev         # or: cd src-tauri && cargo tauri dev

# Build desktop app
npm run tauri build       # creates distributable

# Rust-only operations (from src-tauri/)
cd src-tauri
cargo build               # build Rust backend
cargo test                # run Rust tests
cargo fmt                 # format Rust code
```

## Architecture

### Frontend Structure
- `src/app/components/` - UI components organized by domain:
  - `cards/` - Card management (create, list, details)
  - `markers/` - Map marker components
  - `stacks/` - Stack (collection) management
  - `images/` - Image handling
  - `overview-map/` - Main map view and settings
- `src/app/layout/` - Layout components (map container, editor, sidebars)
- `src/app/services/` - Angular services for business logic
- `src/app/state/` - NgRx ComponentStore state management
- `src/app/model/` - TypeScript data models and DTOs
- `src/app/util/` - Utility functions (Quill editor helpers, window utils)

### Backend Structure (src-tauri/)
- `src/main.rs` - Tauri app entry point with command handlers
- `src/models.rs` - Rust data models (Card, Stack, Image, DTOs)
- `src/schema.rs` - Diesel schema definitions
- `src/persistence/` - Database layer:
  - `card.rs` - Card CRUD operations
  - `stacks.rs` - Stack CRUD operations
  - `images.rs` - Image CRUD operations
- `migrations/` - Diesel database migrations

### Core Domain Models

**Cards** (`src/app/model/card.ts`)
- Two types: `LocationCard` (with GPS coordinates) and `InfoCard` (text-only)
- Cards can belong to a Stack
- Cards can have associated images and map markers
- Use `CardDTO` for Tauri communication, with conversion functions `fromCardDTO` and `toCardDTO`

**Stacks** (`src/app/model/stack.ts`)
- Collections/groups of related cards
- Enable navigation between related archaeological sites

**Markers** (`src/app/model/marker.ts`, `src/app/model/markerAM.ts`)
- Visual map markers with custom icons
- Linked to LocationCards via coordinates

### State Management

Uses **NgRx ComponentStore** for local component state:
- `CardDetailsStore` - manages card navigation within stacks (previous/current/next card)
- `StackStore` - handles stack list and operations
- `card-details-signal.store.ts` - signal-based variant of card details store

Pattern:
- Services call Tauri backend via `invoke()`
- ComponentStores manage UI state and orchestrate service calls
- RxJS observables connect state to components

### Frontend-Backend Communication

Angular services use Tauri's `invoke()` API:
```typescript
import { invoke } from "@tauri-apps/api/core";

// Example from CardService
async getAllCardsForStack(stack_id: number): Promise<{ stack: Stack; cards: Card[] }> {
  const [stack, cards] = await invoke<[Stack, CardDTO[]]>(
    "read_cards_in_stack",
    { stackId: stack_id }
  );
  return { stack, cards: cards.map(fromCardDTO) };
}
```

Rust handlers are registered in `src-tauri/src/main.rs`:
```rust
.invoke_handler(tauri::generate_handler![
  write_card_content,
  read_card_content,
  // ... other commands
])
```

### Testing

- **Frontend**: Jest with `jest-preset-angular`
  - Path aliases: `@app/`, `@service/`, `@components/`
  - Setup file: `setup-jest.ts`
- **Backend**: Rust standard test framework with `serial_test` for database tests

### Key Libraries

**Frontend**:
- `@bluehalo/ngx-leaflet` - Angular Leaflet integration
- `leaflet.markercluster` - Marker clustering on maps
- `quill` + plugins - Rich text editor with image support
- `@ngrx/*` - State management (ComponentStore, Effects, Operators)
- `@tauri-apps/*` - Tauri plugins (fs, dialog, clipboard, notifications, etc.)

**Backend**:
- `diesel` - ORM with SQLite backend
- `diesel_migrations` - Database migration management
- `tauri-plugin-*` - Various Tauri plugins (store, fs, dialog, etc.)

### Database

SQLite database managed by Diesel ORM. Migrations are embedded and run automatically on app startup. Key tables:
- `cards` - Archaeological site cards (unified marker + card model)
- `stacks` - Collections of cards
- `images` - Image metadata and references

## Development Notes

### Path Aliases
Jest and TypeScript use consistent path mappings:
- `@app/*` → `src/app/*`
- `@service/*` → `src/app/services/*`
- `@components/*` → `src/app/components/*`

### Building for Production
The Tauri config (`src-tauri/tauri.conf.json`) specifies:
- `beforeBuildCommand: ng build` - builds Angular before bundling
- Frontend output: `dist/archaological-map/browser`
- App version: currently `2.1.2`

### Running Single Tests
```bash
npm test -- <test-file-pattern>
# Example: npm test -- card.service
```

### Testing Requirements
**IMPORTANT**: When fixing bugs or adding features, always provide tests or adjust existing tests. Every code change should include corresponding test updates to ensure correctness and prevent regressions.

### Testing Style Guide
All tests should follow the **Given/When/Then** pattern with helper functions for improved readability and maintainability.

**Structure**:
```typescript
describe("FeatureName", () => {
  // Helper functions
  const givenSomeState = (data) => {
    // Setup preconditions
  };

  const whenActionIsPerformed = async (params) => {
    // Execute the action being tested
  };

  const thenExpectedOutcome = (expected) => {
    // Assert the result
  };

  it("should do something when condition is met", async () => {
    // Given
    givenSomeState(testData);

    // When
    await whenActionIsPerformed(params);

    // Then
    thenExpectedOutcome(expectedResult);
  });
});
```

**Example** (from `card-details-signal.store.spec.ts`):
```typescript
// Helper functions
const givenStackHasCards = (cards: Card[]) => {
  cardService.getAllCardsForStack.mockResolvedValue({
    stack: mockStack,
    cards,
  });
};

const whenSetStackIsCalled = async (stackId: number, cardId?: number) => {
  await store.setStack(stackId, cardId);
};

const thenCurrentCardShouldBe = (expectedCard: Card | undefined) => {
  expect(store.currentCard()).toEqual(expectedCard);
};

// Test
it("should set index to 0 and select first card when stack has cards and no cardId is provided", async () => {
  // Given
  givenStackHasCards(mockCards);

  // When
  await whenSetStackIsCalled(1);

  // Then
  thenCurrentCardShouldBe(mockCards[0]);
  thenIndexShouldBe(0);
});
```

**Benefits**:
- Tests read like documentation
- Helper functions reduce duplication
- Easy to understand test intent
- Simpler to maintain and extend

**Important Note**: The Given/When/Then structure should be expressed through helper function names, not inline comments. While the examples above show `// Given`, `// When`, `// Then` comments for clarity, avoid using these in actual test code. Let descriptive helper function names convey the test structure instead. Use comments only when they add essential context that cannot be expressed through better naming.

## Code Style

- NEVER use comments to explain the basic flow of a block of code ONLY use comments when they explain important details that can't be expressed in another way.
  add option to edit cards directly in card-details view when no marker is available.
