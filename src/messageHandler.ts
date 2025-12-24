import * as vscode from 'vscode';
import { CodeFrame, WebviewMessage } from './types';

export class MessageHandler {
    constructor(
        private frames: CodeFrame[],
        private panel: vscode.WebviewPanel,
        private onRemoveFrame: (index: number) => void,
        private onGoToDefinition: (uri: vscode.Uri, line: number, character: number) => Promise<void>
    ) {}

    handleMessage(message: WebviewMessage): void {
        switch (message.command) {
            case 'openFile':
                this.handleOpenFile(message.frameIndex!);
                break;
            case 'goToDefinition':
                this.handleGoToDefinitionMessage(message);
                break;
            case 'removeFrame':
                this.onRemoveFrame(message.frameIndex!);
                break;
            case 'cleanupComplete':
                // Cleanup completed in webview
                break;
        }
    }

    private handleOpenFile(frameIndex: number): void {
        const frame = this.frames[frameIndex];
        if (!frame) return;

        const targetColumn = this.panel.viewColumn === vscode.ViewColumn.One 
            ? vscode.ViewColumn.Two 
            : vscode.ViewColumn.One;

        vscode.window.showTextDocument(frame.uri, {
            selection: frame.range,
            viewColumn: targetColumn
        });
    }

    private handleGoToDefinitionMessage(message: WebviewMessage): void {
        const frame = this.frames[message.frameIndex!];
        if (!frame) return;

        this.onGoToDefinition(frame.uri, message.line!, message.character!);
    }

    sendCleanupMessage(existingFrameIds: string[]): void {
        this.panel.webview.postMessage({
            command: 'cleanupStoredData',
            existingFrameIds
        });
    }
}