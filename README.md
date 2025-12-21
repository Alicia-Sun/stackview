# StackView

A VS Code extension that displays code definitions in a stacked view instead of opening multiple tabs.

## Features

- Navigate to definitions using `Alt+Cmd+F12` (Mac) or `Alt+Ctrl+F12` (Windows)
- View all definitions in a single panel with independently scrollable sections
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

1. Place cursor on any function call or symbol
2. Press `Alt+Cmd+F12` (Mac) or `Alt+Ctrl+F12` (Windows)
3. The definition will appear in the StackView panel
4. Repeat to build a stack of definitions
5. Use "StackView: Clear Stack" command to reset

## Commands

- `StackView: Go to Definition` - Add definition to stack
- `StackView: Clear Stack` - Clear all frames