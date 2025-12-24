"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const vscode = require("vscode");
class MessageHandler {
    constructor(frames, panel, onRemoveFrame, onGoToDefinition) {
        this.frames = frames;
        this.panel = panel;
        this.onRemoveFrame = onRemoveFrame;
        this.onGoToDefinition = onGoToDefinition;
    }
    handleMessage(message) {
        switch (message.command) {
            case 'openFile':
                this.handleOpenFile(message.frameIndex);
                break;
            case 'goToDefinition':
                this.handleGoToDefinitionMessage(message);
                break;
            case 'removeFrame':
                this.onRemoveFrame(message.frameIndex);
                break;
            case 'cleanupComplete':
                // Cleanup completed in webview
                break;
        }
    }
    handleOpenFile(frameIndex) {
        const frame = this.frames[frameIndex];
        if (!frame)
            return;
        const targetColumn = this.panel.viewColumn === vscode.ViewColumn.One
            ? vscode.ViewColumn.Two
            : vscode.ViewColumn.One;
        vscode.window.showTextDocument(frame.uri, {
            selection: frame.range,
            viewColumn: targetColumn
        });
    }
    handleGoToDefinitionMessage(message) {
        const frame = this.frames[message.frameIndex];
        if (!frame)
            return;
        this.onGoToDefinition(frame.uri, message.line, message.character);
    }
    sendCleanupMessage(existingFrameIds) {
        this.panel.webview.postMessage({
            command: 'cleanupStoredData',
            existingFrameIds
        });
    }
}
exports.MessageHandler = MessageHandler;
//# sourceMappingURL=messageHandler.js.map