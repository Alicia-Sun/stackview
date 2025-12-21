// Test file for StackView extension

function greetUser(name) {
    return `Hello, ${name}!`;
}

function calculateSum(a, b) {
    return a + b;
}

function processData(data) {
    const result = calculateSum(data.x, data.y);
    const greeting = greetUser(data.name);
    return { result, greeting };
}

// Test the functions
const testData = { x: 5, y: 10, name: "Alice" };
const output = processData(testData);
console.log(output);