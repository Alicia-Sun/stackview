// app.js - Main application
import { processUserData, processOrderData } from './dataProcessor.js';
import { formatMessage } from './utils.js';

function initializeApp() {
    const welcomeMessage = formatMessage("Application started", "APP");
    console.log(welcomeMessage);
}

function handleUserRegistration(user) {
    const result = processUserData(user);
    return result;
}

function handleOrderProcessing(orders) {
    const orderResult = processOrderData(orders);
    return orderResult;
}

// Test data and execution
initializeApp();

const testUser = { id: 1, name: "John Doe" };
const userResult = handleUserRegistration(testUser);

const testOrders = [
    { value: 100 },
    { value: 250 },
    { value: 75 }
];
const orderResult = handleOrderProcessing(testOrders);

console.log({ userResult, orderResult });