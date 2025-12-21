// bigFileTest.js - Test file that calls functions from the big file
import { functionA, functionD, functionG, functionJ } from './bigFile.js';

function testBigFileFunctions() {
    // Call functions from the big file to test StackView navigation
    const resultA = functionA();
    const resultD = functionD();
    const resultG = functionG();
    const resultJ = functionJ();
    
    return { resultA, resultD, resultG, resultJ };
}

// Execute the test
const results = testBigFileFunctions();
console.log(results);