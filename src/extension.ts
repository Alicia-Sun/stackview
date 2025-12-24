import * as vscode from 'vscode';
import { StackViewPanel } from './stackViewPanel';
import { COMMANDS } from './constants';

export function activate(context: vscode.ExtensionContext) {
    const stackViewPanel = new StackViewPanel(context.extensionUri);

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.GO_TO_DEFINITION, async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const definitions = await vscode.commands.executeCommand<
                (vscode.Location | vscode.LocationLink)[]
            >('vscode.executeDefinitionProvider', editor.document.uri, editor.selection.active);

            if (!definitions || definitions.length === 0) {
                vscode.window.showInformationMessage('No definition found');
                return;
            }

            const def = definitions[0];
            const uri = 'targetUri' in def ? def.targetUri : def.uri;
            const range = 'targetSelectionRange' in def ? def.targetSelectionRange : (def as vscode.Location).range;
            
            if (!range) return;

            await stackViewPanel.addFrame(uri, range);
        }),

        vscode.commands.registerCommand(COMMANDS.CLEAR_STACK, () => {
            stackViewPanel.clearFrames();
        })
    );
}

export function deactivate() {}