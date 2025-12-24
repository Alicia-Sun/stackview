import { CodeFrame } from './types';

export class WebviewContentProvider {
    generateContent(frames: CodeFrame[]): string {
        const framesHtml = frames.map((frame, index) => this.generateFrameHtml(frame, index)).join('');
        
        return `<!DOCTYPE html>
        <html>
        <head>
            <style>${this.getStyles()}</style>
        </head>
        <body>
            ${framesHtml.length > 0 ? framesHtml : this.getEmptyStateHtml()}
            <script>${this.getScript()}</script>
        </body>
        </html>`;
    }

    private generateFrameHtml(frame: CodeFrame, index: number): string {
        const lines = frame.content.split('\n');
        const numberedLines = lines.map((line, lineIndex) => {
            const lineNumber = lineIndex + 1;
            const isHighlighted = lineIndex >= frame.range.start.line && lineIndex <= frame.range.end.line;
            const highlightClass = isHighlighted ? ' highlighted' : '';
            return `<div class="code-line"><span class="line-number">${lineNumber}</span><span class="line-content${highlightClass}" data-frame="${index}" data-line="${lineIndex}" tabindex="0" onclick="handleClick(event, ${index}, ${lineIndex})" oncontextmenu="handleRightClick(event, ${index}, ${lineIndex})">${this.escapeHtml(line)}</span></div>`;
        }).join('');
        
        return `
        <div class="frame" id="frame-${index}" style="max-height: ${(lines.length * 1.2 + 3)}em;">
            <div class="frame-header">
                <span class="file-name">${frame.fileName}:${frame.lineNumber}</span>
                <div class="header-buttons">
                    <div class="search-container">
                        <input type="text" class="search-box" placeholder="Search..." onkeyup="handleSearch(event, ${index})" onkeydown="handleSearchKeydown(event, ${index})" />
                        <div class="search-nav">
                            <button onclick="navigateSearch(${index}, -1)" title="Previous">↑</button>
                            <button onclick="navigateSearch(${index}, 1)" title="Next">↓</button>
                            <span class="search-count" id="search-count-${index}"></span>
                        </div>
                    </div>
                    <button onclick="openFile(${index})" class="open-button">Open in Editor</button>
                    <button onclick="removeFrame(${index})" class="close-button">×</button>
                </div>
            </div>
            <div class="frame-body">
                <div class="code-container">${numberedLines}</div>
            </div>
        </div>`;
    }

    private getEmptyStateHtml(): string {
        return '<p>No frames yet. Use Alt+Cmd+F12 (Mac) or Alt+Ctrl+F12 (Windows) to add definitions to the stack.</p>';
    }

    private getStyles(): string {
        return `
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
                resize: vertical;
                min-height: 100px;
                height: 25vh;
                display: flex;
                flex-direction: column;
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
            .header-buttons {
                display: flex;
                gap: 4px;
                align-items: center;
            }
            .search-container {
                display: flex;
                align-items: center;
                gap: 2px;
            }
            .search-box {
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
                width: 120px;
            }
            .search-box:focus {
                outline: 1px solid var(--vscode-focusBorder);
            }
            .search-nav {
                display: flex;
                align-items: center;
                gap: 1px;
            }
            .search-nav button {
                background: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                border: none;
                padding: 2px 4px;
                border-radius: 2px;
                cursor: pointer;
                font-size: 10px;
                min-width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .search-nav button:hover {
                background: var(--vscode-button-secondaryHoverBackground);
            }
            .search-nav button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .search-count {
                font-size: 10px;
                color: var(--vscode-descriptionForeground);
                margin: 0 2px;
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
            .close-button {
                background: transparent;
                color: var(--vscode-foreground);
                border: none;
                padding: 2px 6px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 16px;
                line-height: 1;
            }
            .close-button:hover {
                background: var(--vscode-toolbar-hoverBackground);
                color: var(--vscode-errorForeground);
            }
            .frame-body {
                flex: 1;
                overflow: auto;
                background: var(--vscode-editor-background);
                display: flex;
                flex-direction: column;
            }
            .code-container {
                font-family: var(--vscode-editor-font-family);
                font-size: var(--vscode-editor-font-size);
                line-height: var(--vscode-editor-line-height);
                color: var(--vscode-editor-foreground);
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
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
                position: relative;
                outline: none;
                tabindex: 0;
            }
            .line-content:hover {
                background: var(--vscode-editor-hoverHighlightBackground);
            }
            .line-content.highlighted {
                background: var(--vscode-editor-selectionBackground) !important;
                color: var(--vscode-editor-selectionForeground);
            }
            .search-highlight {
                background: #ffff99 !important;
                color: #000 !important;
            }
            .search-highlight.current {
                background: #ff9900 !important;
                color: #fff !important;
            }
            .caret {
                position: absolute;
                width: 1px;
                height: 1em;
                background: var(--vscode-editorCursor-foreground);
                animation: blink 1s infinite;
                pointer-events: none;
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
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
            }`;
    }

    private getScript(): string {
        return `
            const vscode = acquireVsCodeApi();
            let currentCaret = null;
            let frameHeights = {};
            let frameScrollPositions = {};
            let searchStates = {};
            
            function restoreHeights() {
                const state = vscode.getState();
                if (state && state.frameHeights) {
                    frameHeights = state.frameHeights;
                    Object.keys(frameHeights).forEach(frameId => {
                        const frame = document.getElementById(frameId);
                        if (frame) {
                            frame.style.height = frameHeights[frameId];
                        }
                    });
                }
                if (state && state.frameScrollPositions) {
                    frameScrollPositions = state.frameScrollPositions;
                    Object.keys(frameScrollPositions).forEach(frameId => {
                        const frameBody = document.querySelector('#' + frameId + ' .frame-body');
                        if (frameBody) {
                            frameBody.scrollTop = frameScrollPositions[frameId];
                        }
                    });
                }
            }
            
            function saveHeights() {
                const frames = document.querySelectorAll('.frame');
                frames.forEach(frame => {
                    frameHeights[frame.id] = frame.style.height || '25vh';
                    const frameBody = frame.querySelector('.frame-body');
                    if (frameBody) {
                        frameScrollPositions[frame.id] = frameBody.scrollTop;
                    }
                });
                vscode.setState({ frameHeights, frameScrollPositions });
            }
            
            function setupResizeObservers() {
                const frames = document.querySelectorAll('.frame');
                frames.forEach(frame => {
                    const resizeObserver = new ResizeObserver(() => {
                        saveHeights();
                    });
                    resizeObserver.observe(frame);
                    
                    const frameBody = frame.querySelector('.frame-body');
                    if (frameBody) {
                        frameBody.addEventListener('scroll', saveHeights);
                    }
                });
            }
            
            window.addEventListener('load', () => {
                restoreHeights();
                setupResizeObservers();
            });
            
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'cleanupStoredData') {
                    const existingIds = new Set(message.existingFrameIds);
                    
                    Object.keys(frameHeights).forEach(frameId => {
                        if (!existingIds.has(frameId)) {
                            delete frameHeights[frameId];
                        }
                    });
                    
                    Object.keys(frameScrollPositions).forEach(frameId => {
                        if (!existingIds.has(frameId)) {
                            delete frameScrollPositions[frameId];
                        }
                    });
                    
                    vscode.setState({ frameHeights, frameScrollPositions });
                    vscode.postMessage({ command: 'cleanupComplete' });
                }
            });
            
            setTimeout(() => {
                restoreHeights();
                setupResizeObservers();
                scrollToDefinitions();
            }, 10);
            
            function scrollToDefinitions() {
                const frames = document.querySelectorAll('.frame');
                frames.forEach(frame => {
                    const frameBody = frame.querySelector('.frame-body');
                    const frameId = frame.id;
                    
                    if (frameBody && !frameScrollPositions[frameId]) {
                        const highlightedLine = frame.querySelector('.line-content.highlighted');
                        if (highlightedLine) {
                            const lineHeight = parseFloat(getComputedStyle(highlightedLine).lineHeight) || 20;
                            const containerHeight = frameBody.clientHeight;
                            const codeContainer = frame.querySelector('.code-container');
                            const targetScroll = highlightedLine.offsetTop - codeContainer.offsetTop - (containerHeight / 2) + (lineHeight / 2);
                            frameBody.scrollTop = Math.max(0, targetScroll);
                        }
                    }
                });
            }
            
            document.addEventListener('keydown', (event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
                    event.preventDefault();
                    const activeFrame = document.querySelector('.frame:hover') || document.querySelector('.frame');
                    if (activeFrame) {
                        const searchBox = activeFrame.querySelector('.search-box');
                        if (searchBox) {
                            searchBox.focus();
                            searchBox.select();
                        }
                    }
                    return;
                }
                
                if (event.altKey && (event.ctrlKey || event.metaKey) && event.key === 'F12') {
                    event.preventDefault();
                    
                    const activeElement = document.activeElement;
                    let targetElement = null;
                    
                    if (activeElement && activeElement.classList.contains('line-content')) {
                        targetElement = activeElement;
                    } else if (currentCaret && currentCaret.parentElement) {
                        targetElement = currentCaret.parentElement;
                    }
                    
                    if (targetElement) {
                        const frameIndex = parseInt(targetElement.dataset.frame);
                        const lineIndex = parseInt(targetElement.dataset.line);
                        
                        let character = 0;
                        if (currentCaret && currentCaret.parentElement === targetElement) {
                            const textContent = targetElement.textContent || '';
                            const caretLeft = parseFloat(currentCaret.style.left) || 0;
                            
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const computedStyle = window.getComputedStyle(targetElement);
                            ctx.font = computedStyle.fontSize + ' ' + computedStyle.fontFamily;
                            
                            let accumulatedWidth = 0;
                            for (let i = 0; i < textContent.length; i++) {
                                const charWidth = ctx.measureText(textContent[i]).width;
                                if (accumulatedWidth >= caretLeft) {
                                    character = i;
                                    break;
                                }
                                accumulatedWidth += charWidth;
                                character = i + 1;
                            }
                        }
                        
                        goToDefinition(frameIndex, lineIndex, character);
                    }
                }
            });
            
            function handleClick(event, frameIndex, lineIndex) {
                event.target.focus();
                
                if (currentCaret) {
                    currentCaret.remove();
                }
                
                const caret = document.createElement('div');
                caret.className = 'caret';
                
                const textContent = event.target.textContent || '';
                const rect = event.target.getBoundingClientRect();
                const clickX = event.clientX - rect.left;
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const computedStyle = window.getComputedStyle(event.target);
                ctx.font = computedStyle.fontSize + ' ' + computedStyle.fontFamily;
                
                let charPosition = 0;
                let accumulatedWidth = 0;
                
                for (let i = 0; i < textContent.length; i++) {
                    const charWidth = ctx.measureText(textContent[i]).width;
                    if (accumulatedWidth + charWidth / 2 > clickX) {
                        break;
                    }
                    accumulatedWidth += charWidth;
                    charPosition = i + 1;
                }
                
                const finalWidth = charPosition > 0 ? ctx.measureText(textContent.substring(0, charPosition)).width : 0;
                caret.style.left = Math.min(finalWidth, accumulatedWidth) + 'px';
                caret.style.top = '0px';
                
                event.target.appendChild(caret);
                currentCaret = caret;
            }
            
            function openFile(frameIndex) {
                vscode.postMessage({
                    command: 'openFile',
                    frameIndex: frameIndex
                });
            }
            
            function handleRightClick(event, frameIndex, lineIndex) {
                event.preventDefault();
                
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const character = range.startOffset;
                
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
            
            function removeFrame(frameIndex) {
                vscode.postMessage({
                    command: 'removeFrame',
                    frameIndex: frameIndex
                });
            }
            
            function handleSearchKeydown(event, frameIndex) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    navigateSearch(frameIndex, event.shiftKey ? -1 : 1);
                } else if (event.key === 'Escape') {
                    event.target.blur();
                    clearSearch(frameIndex);
                }
            }
            
            function handleSearch(event, frameIndex) {
                const searchTerm = event.target.value;
                const frame = document.getElementById('frame-' + frameIndex);
                const lines = frame.querySelectorAll('.line-content');
                
                lines.forEach(line => {
                    const originalText = line.dataset.originalText || line.textContent;
                    line.dataset.originalText = originalText;
                    line.innerHTML = originalText;
                });
                
                if (!searchTerm) {
                    searchStates[frameIndex] = null;
                    updateSearchCount(frameIndex, 0, 0);
                    return;
                }
                
                const matches = [];
                lines.forEach((line, lineIdx) => {
                    const text = line.dataset.originalText || line.textContent;
                    const lowerText = text.toLowerCase();
                    const lowerSearch = searchTerm.toLowerCase();
                    
                    let highlightedText = text;
                    let lastIndex = 0;
                    let matchIndex = lowerText.indexOf(lowerSearch);
                    
                    if (matchIndex !== -1) {
                        highlightedText = '';
                        while (matchIndex !== -1) {
                            highlightedText += text.substring(lastIndex, matchIndex);
                            highlightedText += '<span class="search-highlight" onclick="selectMatch(' + frameIndex + ', ' + matches.length + ')">' + text.substring(matchIndex, matchIndex + searchTerm.length) + '</span>';
                            matches.push({ line: lineIdx, element: line });
                            lastIndex = matchIndex + searchTerm.length;
                            matchIndex = lowerText.indexOf(lowerSearch, lastIndex);
                        }
                        highlightedText += text.substring(lastIndex);
                        line.innerHTML = highlightedText;
                    }
                });
                
                searchStates[frameIndex] = {
                    matches: matches,
                    currentIndex: matches.length > 0 ? 0 : -1,
                    term: searchTerm
                };
                
                updateSearchCount(frameIndex, matches.length, matches.length > 0 ? 1 : 0);
                
                if (matches.length > 0) {
                    highlightCurrentMatch(frameIndex);
                    scrollToCurrentMatch(frameIndex);
                }
            }
            
            function navigateSearch(frameIndex, direction) {
                const state = searchStates[frameIndex];
                if (!state || state.matches.length === 0) return;
                
                const currentHighlight = document.querySelector('#frame-' + frameIndex + ' .search-highlight.current');
                if (currentHighlight) {
                    currentHighlight.classList.remove('current');
                }
                
                state.currentIndex += direction;
                if (state.currentIndex >= state.matches.length) {
                    state.currentIndex = 0;
                } else if (state.currentIndex < 0) {
                    state.currentIndex = state.matches.length - 1;
                }
                
                updateSearchCount(frameIndex, state.matches.length, state.currentIndex + 1);
                highlightCurrentMatch(frameIndex);
                scrollToCurrentMatch(frameIndex);
            }
            
            function highlightCurrentMatch(frameIndex) {
                const state = searchStates[frameIndex];
                if (!state || state.currentIndex === -1) return;
                
                const frame = document.getElementById('frame-' + frameIndex);
                const highlights = frame.querySelectorAll('.search-highlight');
                
                highlights.forEach((highlight, idx) => {
                    highlight.classList.toggle('current', idx === state.currentIndex);
                });
            }
            
            function scrollToCurrentMatch(frameIndex) {
                const state = searchStates[frameIndex];
                if (!state || state.currentIndex === -1) return;
                
                const frame = document.getElementById('frame-' + frameIndex);
                const currentMatch = frame.querySelectorAll('.search-highlight')[state.currentIndex];
                
                if (currentMatch) {
                    currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            function updateSearchCount(frameIndex, total, current) {
                const countElement = document.getElementById('search-count-' + frameIndex);
                if (countElement) {
                    countElement.textContent = total > 0 ? current + '/' + total : '';
                }
                
                const frame = document.getElementById('frame-' + frameIndex);
                const prevBtn = frame.querySelector('.search-nav button:first-child');
                const nextBtn = frame.querySelector('.search-nav button:nth-child(2)');
                
                if (prevBtn && nextBtn) {
                    prevBtn.disabled = total === 0;
                    nextBtn.disabled = total === 0;
                }
            }
            
            function selectMatch(frameIndex, matchIndex) {
                const state = searchStates[frameIndex];
                if (!state || matchIndex >= state.matches.length) return;
                
                // Remove current highlight
                const currentHighlight = document.querySelector('#frame-' + frameIndex + ' .search-highlight.current');
                if (currentHighlight) {
                    currentHighlight.classList.remove('current');
                }
                
                // Update to clicked match
                state.currentIndex = matchIndex;
                updateSearchCount(frameIndex, state.matches.length, state.currentIndex + 1);
                highlightCurrentMatch(frameIndex);
                scrollToCurrentMatch(frameIndex);
            }
            
            function clearSearch(frameIndex) {
                const frame = document.getElementById('frame-' + frameIndex);
                const searchBox = frame.querySelector('.search-box');
                if (searchBox) {
                    searchBox.value = '';
                    handleSearch({ target: searchBox }, frameIndex);
                }
            }`;
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