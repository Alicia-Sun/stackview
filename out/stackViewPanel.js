"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackViewPanel = void 0;
const vscode = require("vscode");
const path = require("path");
class StackViewPanel {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.frames = [];
    }
    async addFrame(uri, range) {
        const document = await vscode.workspace.openTextDocument(uri);
        // Get the entire file content instead of just surrounding lines
        const content = document.getText();
        const fileName = path.basename(uri.fsPath);
        const frame = {
            uri,
            range,
            content,
            fileName,
            lineNumber: range.start.line + 1
        };
        this.frames.push(frame);
        this.showPanel();
        this.updateWebview();
    }
    clearFrames() {
        this.frames = [];
        if (this.panel) {
            this.updateWebview();
        }
    }
    showPanel() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }
        this.panel = vscode.window.createWebviewPanel('stackView', 'StackView', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
        this.panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'openFile') {
                const frame = this.frames[message.frameIndex];
                if (frame) {
                    vscode.window.showTextDocument(frame.uri, {
                        selection: frame.range
                    });
                }
            }
            else if (message.command === 'goToDefinition') {
                const frame = this.frames[message.frameIndex];
                if (frame) {
                    this.handleGoToDefinition(frame.uri, message.line, message.character);
                }
            }
        });
    }
    updateWebview() {
        if (!this.panel)
            return;
        this.panel.webview.html = this.getWebviewContent();
    }
    getWebviewContent() {
        const framesHtml = this.frames.map((frame, index) => {
            const lines = frame.content.split('\n');
            const numberedLines = lines.map((line, lineIndex) => {
                const lineNumber = lineIndex + 1;
                return `<div class="code-line"><span class="line-number">${lineNumber}</span><span class="line-content" data-frame="${index}" data-line="${lineIndex}" oncontextmenu="handleRightClick(event, ${index}, ${lineIndex})">${this.escapeHtml(line)}</span></div>`;
            }).join('');
            return `
            <div class="frame">
                <div class="frame-header">
                    <span class="file-name">${frame.fileName}:${frame.lineNumber}</span>
                    <button onclick="openFile(${index})" class="open-button">Open in Editor</button>
                </div>
                <div class="frame-body">
                    <div class="code-container">${numberedLines}</div>
                </div>
            </div>
        `;
        }).join('');
        return `<!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    margin: 0;
                    padding: 16px;
                }
                .frame {
                    border: 1px solid var(--vscode-editorWidget-border);
                    border-radius: 6px;
                    margin-bottom: 16px;
                    overflow: hidden;
                }
                .frame-header {
                    background: var(--vscode-editorWidget-background);
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--vscode-editorWidget-border);
                }
                .file-name {
                    font-size: 12px;
                    font-weight: 500;
                }
                .open-button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                }
                .open-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .frame-body {
                    max-height: 400px;
                    overflow: auto;
                    background: var(--vscode-editor-background);
                }
                .code-container {
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    line-height: var(--vscode-editor-line-height);
                    color: var(--vscode-editor-foreground);
                }
                .code-line {
                    display: flex;
                    white-space: pre;
                }
                .line-number {
                    color: var(--vscode-editorLineNumber-foreground);
                    background: var(--vscode-editor-background);
                    padding: 0 8px;
                    text-align: right;
                    min-width: 40px;
                    user-select: none;
                    border-right: 1px solid var(--vscode-editorLineNumber-foreground);
                    margin-right: 8px;
                }
                .line-content {
                    flex: 1;
                    padding-right: 8px;
                    cursor: text;
                    user-select: text;
                }
                .line-content:hover {
                    background: var(--vscode-editor-hoverHighlightBackground);
                }
                .context-menu {
                    background: var(--vscode-menu-background);
                    border: 1px solid var(--vscode-menu-border);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }
                .menu-item {
                    padding: 6px 12px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .menu-item:hover {
                    background: var(--vscode-menu-selectionBackground);
                    color: var(--vscode-menu-selectionForeground);
                }
            </style>
        </head>
        <body>
            ${framesHtml.length > 0 ? framesHtml : '<p>No frames yet. Use Alt+Cmd+F12 (Mac) or Alt+Ctrl+F12 (Windows) to add definitions to the stack.</p>'}
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function openFile(frameIndex) {
                    vscode.postMessage({
                        command: 'openFile',
                        frameIndex: frameIndex
                    });
                }
                
                function handleRightClick(event, frameIndex, lineIndex) {
                    event.preventDefault();
                    
                    // Get the clicked position within the line
                    const selection = window.getSelection();
                    const range = selection.getRangeAt(0);
                    const character = range.startOffset;
                    
                    // Show context menu and handle go to definition
                    const contextMenu = document.createElement('div');
                    contextMenu.className = 'context-menu';
                    contextMenu.innerHTML = '<div class="menu-item" onclick="goToDefinition(' + frameIndex + ', ' + lineIndex + ', ' + character + ')">Go to Definition (StackView)</div>';
                    contextMenu.style.position = 'absolute';
                    contextMenu.style.left = event.pageX + 'px';
                    contextMenu.style.top = event.pageY + 'px';
                    contextMenu.style.background = 'var(--vscode-menu-background)';
                    contextMenu.style.border = '1px solid var(--vscode-menu-border)';
                    contextMenu.style.borderRadius = '3px';
                    contextMenu.style.padding = '4px 0';
                    contextMenu.style.zIndex = '1000';
                    
                    document.body.appendChild(contextMenu);
                    
                    // Remove menu on click elsewhere
                    setTimeout(() => {
                        document.addEventListener('click', function removeMenu() {
                            if (contextMenu.parentNode) {
                                contextMenu.parentNode.removeChild(contextMenu);
                            }
                            document.removeEventListener('click', removeMenu);
                        });
                    }, 10);
                }
                
                function goToDefinition(frameIndex, line, character) {
                    vscode.postMessage({
                        command: 'goToDefinition',
                        frameIndex: frameIndex,
                        line: line,
                        character: character
                    });
                }
            </script>
        </body>
        </html>`;
    }
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    async handleGoToDefinition(uri, line, character) {
        const definitions = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', uri, new vscode.Position(line, character));
        if (!definitions || definitions.length === 0) {
            vscode.window.showInformationMessage('No definition found');
            return;
        }
        const def = definitions[0];
        const targetUri = 'targetUri' in def ? def.targetUri : def.uri;
        const range = 'targetSelectionRange' in def ? def.targetSelectionRange : def.range;
        if (!range)
            return;
        await this.addFrame(targetUri, range);
    }
}
exports.StackViewPanel = StackViewPanel;
//# sourceMappingURL=stackViewPanel.js.map