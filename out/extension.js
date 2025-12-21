"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const stackViewPanel_1 = require("./stackViewPanel");
function activate(context) {
    const stackViewPanel = new stackViewPanel_1.StackViewPanel(context.extensionUri);
    context.subscriptions.push(vscode.commands.registerCommand('stackview.goToDefinition', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const definitions = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', editor.document.uri, editor.selection.active);
        if (!definitions || definitions.length === 0) {
            vscode.window.showInformationMessage('No definition found');
            return;
        }
        const def = definitions[0];
        const uri = 'targetUri' in def ? def.targetUri : def.uri;
        const range = 'targetSelectionRange' in def ? def.targetSelectionRange : def.range;
        if (!range)
            return;
        await stackViewPanel.addFrame(uri, range);
    }), vscode.commands.registerCommand('stackview.clearStack', () => {
        stackViewPanel.clearFrames();
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map