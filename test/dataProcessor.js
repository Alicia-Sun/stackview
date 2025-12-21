// dataProcessor.js - Data processing functions
import { formatMessage, validateInput, calculateTotal } from './utils.js';

export function processUserData(userData) {
    validateInput(userData);
    
    const message = formatMessage(`Processing user: ${userData.name}`);
    console.log(message);
    
    return {
        id: userData.id,
        name: userData.name,
        processed: true
    };
}

export function processOrderData(orders) {
    const total = calculateTotal(orders);
    const summary = formatMessage(`Total orders value: $${total}`, "ORDER");
    
    return {
        orderCount: orders.length,
        totalValue: total,
        summary: summary
    };
}