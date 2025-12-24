# StackView

A simple VS Code extension for displaying code definitions in a stacked view instead of opening multiple tabs.
<img width="1542" height="883" alt="StackViewDemo" src="https://github.com/user-attachments/assets/1274152c-0dd2-4010-8560-12bcc88a8ffb" />


## Features

- Navigate to definitions using `Alt+Cmd+F12` (Mac) or `Alt+Ctrl+F12` (Windows)
- Alternatively, you can click on function call, right-click + "Go to Definition (StackView)" to open the StackView window starting with that function's definition
- View all definitions in a single panel with independently scrollable and resizable sections
- Each section shows the function/method with surrounding context
- Click "Open in Editor" to jump to the full file

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Compile the extension:
   ```
   npm run compile
   ```

3. Press F5 to launch a new VS Code window with the extension loaded

## Usage

1. Click on desired function call
2. Press `Alt+Cmd+F12` (Mac) or `Alt+Ctrl+F12` (Windows), or right click + "Go to Definition (StackView)"
3. The definition will appear in the StackView panel as a scrollable and resizable section
4. Repeat steps 1-2 either in the original file or in a StackView section to build a stack of definitions all displayed cleanly in the same panel
5. Use "StackView: Clear Stack" command to reset or simply close the StackView tab

## Commands

- `StackView: Go to Definition` - Add definition to stack
- `StackView: Clear Stack` - Clear all frames


## Files Overview

### Core Files
- **`extension.ts`** - Main extension entry point, registers commands and activates the extension
- **`stackViewPanel.ts`** - Main panel class that orchestrates the webview and frame management

### Component Files
- **`webviewContent.ts`** - Handles HTML generation and loads CSS/JS for the webview
- **`webview.js`** - Client-side JavaScript for frame interactions, search, and resize functionality
- **`styles.css`** - CSS styles for the webview interface
- **`messageHandler.ts`** - Manages communication between webview and extension
- **`types.ts`** - TypeScript interfaces and type definitions


```
extension.ts
    ↓
stackViewPanel.ts
    ├── webviewContent.ts (HTML generation)
    │   ├── webview.js (client-side functionality)
    │   └── styles.css (styling)
    ├── messageHandler.ts (webview communication)
    └── types.ts (shared interfaces)
```
