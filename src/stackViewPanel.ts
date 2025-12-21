import * as vscode from 'vscode';
import * as path from 'path';

interface CodeFrame {
    uri: vscode.Uri;
    range: vscode.Range;
    content: string;
    fileName: string;
    lineNumber: number;
}

export class StackViewPanel {
    private panel: vscode.WebviewPanel | undefined;
    private frames: CodeFrame[] = [];

    constructor(private extensionUri: vscode.Uri) {}

    async addFrame(uri: vscode.Uri, range: vscode.Range) {
        const document = await vscode.workspace.openTextDocument(uri);
        const startLine = Math.max(0, range.start.line - 20);
        const endLine = Math.min(document.lineCount - 1, range.end.line + 20);
        
        const content = document.getText(new vscode.Range(startLine, 0, endLine, 0));
        const fileName = path.basename(uri.fsPath);
        
        const frame: CodeFrame = {
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

    private showPanel() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'stackView',
            'StackView',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

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
        });
    }

    private updateWebview() {
        if (!this.panel) return;

        this.panel.webview.html = this.getWebviewContent();
    }

    private getWebviewContent(): string {
        const framesHtml = this.frames.map((frame, index) => `
            <div class="frame">
                <div class="frame-header">
                    <span class="file-name">${frame.fileName}:${frame.lineNumber}</span>
                    <button onclick="openFile(${index})" class="open-button">Open in Editor</button>
                </div>
                <div class="frame-body">
                    <pre><code>${this.escapeHtml(frame.content)}</code></pre>
                </div>
            </div>
        `).join('');

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
                pre {
                    margin: 0;
                    padding: 12px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    line-height: var(--vscode-editor-line-height);
                }
                code {
                    color: var(--vscode-editor-foreground);
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
            </script>
        </body>
        </html>`;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}