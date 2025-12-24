import * as vscode from 'vscode';
import * as path from 'path';
import { CodeFrame } from './types';
import { WebviewContentProvider } from './webviewContent';
import { MessageHandler } from './messageHandler';

export class StackViewPanel {
    private panel: vscode.WebviewPanel | undefined;
    private frames: CodeFrame[] = [];
    private contentProvider: WebviewContentProvider;
    private messageHandler: MessageHandler | undefined;

    constructor(private extensionUri: vscode.Uri) {
        this.contentProvider = new WebviewContentProvider(extensionUri.fsPath);
    }

    async addFrame(uri: vscode.Uri, range: vscode.Range): Promise<void> {
        const document = await vscode.workspace.openTextDocument(uri);
        
        const frame: CodeFrame = {
            uri,
            range,
            content: document.getText(),
            fileName: path.basename(uri.fsPath),
            lineNumber: range.start.line + 1
        };

        this.frames.push(frame);
        this.showPanel();
        this.updateWebview();
    }

    clearFrames(): void {
        this.frames = [];
        if (this.panel) {
            this.updateWebview();
        }
    }

    removeFrame(index: number): void {
        if (index >= 0 && index < this.frames.length) {
            this.frames.splice(index, 1);
            this.updateWebview();
            this.cleanupStoredData();
        }
    }

    private showPanel(): void {
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

        this.setupPanelListeners();
    }

    private setupPanelListeners(): void {
        if (!this.panel) return;

        this.messageHandler = new MessageHandler(
            this.frames,
            this.panel,
            (index) => this.removeFrame(index),
            (uri, line, character) => this.handleGoToDefinition(uri, line, character)
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
            this.messageHandler = undefined;
            this.frames = [];
        });

        this.panel.webview.onDidReceiveMessage(message => {
            this.messageHandler?.handleMessage(message);
        });
    }

    private updateWebview(): void {
        if (!this.panel) return;
        this.panel.webview.html = this.contentProvider.generateContent(this.frames);
    }

    private cleanupStoredData(): void {
        if (!this.panel || !this.messageHandler) return;
        
        const existingFrameIds = this.frames.map((_, index) => `frame-${index}`);
        this.messageHandler.sendCleanupMessage(existingFrameIds);
    }

    private async handleGoToDefinition(uri: vscode.Uri, line: number, character: number): Promise<void> {
        const definitions = await vscode.commands.executeCommand<
            (vscode.Location | vscode.LocationLink)[]
        >('vscode.executeDefinitionProvider', uri, new vscode.Position(line, character));

        if (!definitions || definitions.length === 0) {
            vscode.window.showInformationMessage('No definition found');
            return;
        }

        const def = definitions[0];
        const targetUri = 'targetUri' in def ? def.targetUri : def.uri;
        const range = 'targetSelectionRange' in def ? def.targetSelectionRange : (def as vscode.Location).range;
        
        if (!range) return;

        await this.addFrame(targetUri, range);
    }
}