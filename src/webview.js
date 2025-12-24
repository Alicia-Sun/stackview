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
        const frameBody = frame.querySelector('.frame-body');
        if (frameBody) {
            frameBody.addEventListener('scroll', saveHeights);
        }
        
        // Add custom resize functionality
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;
        
        frame.addEventListener('mousedown', (e) => {
            const rect = frame.getBoundingClientRect();
            if (e.clientY >= rect.bottom - 10) {
                isResizing = true;
                startY = e.clientY;
                startHeight = frame.offsetHeight;
                e.preventDefault();
                document.body.style.cursor = 'ns-resize';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isResizing) {
                const deltaY = e.clientY - startY;
                const newHeight = Math.max(100, startHeight + deltaY);
                frame.style.height = newHeight + 'px';
                saveHeights();
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
            }
        });
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
    const frameBody = frame.querySelector('.frame-body');
    const codeContainer = frame.querySelector('.code-container');
    
    if (currentMatch && frameBody && codeContainer) {
        const lineElement = currentMatch.closest('.code-line');
        if (lineElement) {
            const lineTop = lineElement.offsetTop - codeContainer.offsetTop;
            frameBody.scrollTop = Math.max(0, lineTop - 10);
        }
    }
}

function selectMatch(frameIndex, matchIndex) {
    const state = searchStates[frameIndex];
    if (!state || matchIndex >= state.matches.length) return;
    
    const currentHighlight = document.querySelector('#frame-' + frameIndex + ' .search-highlight.current');
    if (currentHighlight) {
        currentHighlight.classList.remove('current');
    }
    
    state.currentIndex = matchIndex;
    updateSearchCount(frameIndex, state.matches.length, state.currentIndex + 1);
    highlightCurrentMatch(frameIndex);
    scrollToCurrentMatch(frameIndex);
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

function clearSearch(frameIndex) {
    const frame = document.getElementById('frame-' + frameIndex);
    const searchBox = frame.querySelector('.search-box');
    if (searchBox) {
        searchBox.value = '';
        handleSearch({ target: searchBox }, frameIndex);
    }
}

function expandPanel() {
    const currentContentHeight = document.body.scrollHeight;
    const newHeight = currentContentHeight + 400;
    document.body.style.height = newHeight + 'px';
    window.scrollTo(0, document.body.scrollHeight);
}