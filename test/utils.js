// utils.js - Utility functions

export function formatMessage(message, prefix = "INFO") {
    return `[${prefix}] ${message}`;
}

export function validateInput(input) {
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid input provided');
    }
    return true;
}

export function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.value, 0);
}