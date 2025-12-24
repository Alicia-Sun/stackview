"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebviewContentProvider = void 0;
const fs = require("fs");
const path = require("path");
class WebviewContentProvider {
    constructor(extensionPath) {
        this.extensionPath = extensionPath;
        this.cssContent = fs.readFileSync(path.join(extensionPath, 'src', 'styles.css'), 'utf8');
        this.jsContent = fs.readFileSync(path.join(extensionPath, 'src', 'webview.js'), 'utf8');
    }
    generateContent(frames) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${this.cssContent}</style>
        </head>
        <body>
            <div style="padding-bottom: 60px;">
                ${frames.length > 0 ? this.renderFrames(frames) : this.renderEmptyState()}
            </div>
            <div style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000; background: var(--vscode-editor-background); border-top: 1px solid var(--vscode-editorWidget-border); pointer-events: none;">
                <button onclick="expandPanel()" style="width: 100%; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px; cursor: pointer; font-size: 12px; pointer-events: auto;">Expand Panel ▼</button>
            </div>
            <script>${this.jsContent}</script>
        </body>
        </html>`;
    }
    renderFrames(frames) {
        return frames.map((frame, index) => this.renderFrame(frame, index)).join('');
    }
    renderFrame(frame, index) {
        const lines = frame.content.split('\n');
        const codeLines = lines.map((line, lineIndex) => {
            const lineNumber = lineIndex + 1;
            const isHighlighted = lineIndex >= frame.range.start.line && lineIndex <= frame.range.end.line;
            const highlightClass = isHighlighted ? ' highlighted' : '';
            return `<div class="code-line"><span class="line-number">${lineNumber}</span><span class="line-content${highlightClass}" data-frame="${index}" data-line="${lineIndex}" tabindex="0" onclick="handleClick(event, ${index}, ${lineIndex})" oncontextmenu="handleRightClick(event, ${index}, ${lineIndex})">${this.escapeHtml(line)}</span></div>`;
        }).join('');
        return `<div class="frame" id="frame-${index}" style="max-height: ${lines.length * 1.2 + 7}em;"><div class="frame-header"><span class="file-name">${frame.fileName}:${frame.lineNumber}</span><div class="header-buttons">${this.renderSearchContainer(index)}<button onclick="openFile(${index})" class="open-button">Open in Editor</button><button onclick="removeFrame(${index})" class="close-button">×</button></div></div><div class="frame-body"><div class="code-container">${codeLines}</div></div></div>`;
    }
    renderFrameHeader(frame, index) {
        return `
        <div class="frame-header">
            <span class="file-name">${frame.fileName}:${frame.lineNumber}</span>
            <div class="header-buttons">
                ${this.renderSearchContainer(index)}
                <button onclick="openFile(${index})" class="open-button">Open in Editor</button>
                <button onclick="removeFrame(${index})" class="close-button">×</button>
            </div>
        </div>`;
    }
    renderSearchContainer(index) {
        return `<div class="search-container"><input type="text" class="search-box" placeholder="Search..." onkeyup="handleSearch(event, ${index})" onkeydown="handleSearchKeydown(event, ${index})" /><div class="search-nav"><button onclick="navigateSearch(${index}, -1)" title="Previous">↑</button><button onclick="navigateSearch(${index}, 1)" title="Next">↓</button><span class="search-count" id="search-count-${index}"></span></div></div>`;
    }
    renderEmptyState() {
        return '<p>No frames yet. Use Alt+Cmd+F12 (Mac) or Alt+Ctrl+F12 (Windows) to add definitions to the stack.</p>';
    }
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
exports.WebviewContentProvider = WebviewContentProvider;
//# sourceMappingURL=webviewContent.js.map