import * as vscode from 'vscode';

export interface CodeFrame {
    uri: vscode.Uri;
    range: vscode.Range;
    content: string;
    fileName: string;
    lineNumber: number;
}

export interface SearchState {
    matches: SearchMatch[];
    currentIndex: number;
    term: string;
}

export interface SearchMatch {
    line: number;
    element: any;
}

export interface WebviewMessage {
    command: string;
    frameIndex?: number;
    line?: number;
    character?: number;
    existingFrameIds?: string[];
}