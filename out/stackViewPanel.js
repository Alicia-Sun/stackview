"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackViewPanel = void 0;
const vscode = require("vscode");
const path = require("path");
const webviewContent_1 = require("./webviewContent");
const messageHandler_1 = require("./messageHandler");
class StackViewPanel {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.frames = [];
        this.contentProvider = new webviewContent_1.WebviewContentProvider();
    }
    async addFrame(uri, range) {
        const document = await vscode.workspace.openTextDocument(uri);
        const frame = {
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
    clearFrames() {
        this.frames = [];
        if (this.panel) {
            this.updateWebview();
        }
    }
    removeFrame(index) {
        if (index >= 0 && index < this.frames.length) {
            this.frames.splice(index, 1);
            this.updateWebview();
            this.cleanupStoredData();
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
        this.setupPanelListeners();
    }
    setupPanelListeners() {
        if (!this.panel)
            return;
        this.messageHandler = new messageHandler_1.MessageHandler(this.frames, this.panel, (index) => this.removeFrame(index), (uri, line, character) => this.handleGoToDefinition(uri, line, character));
        this.panel.onDidDispose(() => {
            this.panel = undefined;
            this.messageHandler = undefined;
            this.frames = [];
        });
        this.panel.webview.onDidReceiveMessage(message => {
            this.messageHandler?.handleMessage(message);
        });
    }
    updateWebview() {
        if (!this.panel)
            return;
        this.panel.webview.html = this.contentProvider.generateContent(this.frames);
    }
    cleanupStoredData() {
        if (!this.panel || !this.messageHandler)
            return;
        const existingFrameIds = this.frames.map((_, index) => `frame-${index}`);
        this.messageHandler.sendCleanupMessage(existingFrameIds);
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