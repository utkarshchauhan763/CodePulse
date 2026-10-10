
const {
    executeJavaScript
} = require("../src/services/codeExecutionService");

async function testExecution() {
    try {
        const sourceCode = `
            const fs = require("fs");

            const input = fs.readFileSync(0, "utf8").trim();

            console.log("Received input:", input);
        `;

        const input = "Hello CodePulse";

        const result = await executeJavaScript(
            sourceCode,
            input,
            2000
        );

        console.log("Execution successful!");
        console.log("Program output:", result.stdout);
        console.log("Execution time:", result.executionTime, "ms");
        console.log("Exit code:", result.exitCode);
    } catch (error) {
        console.error("Execution failed:", error.message);
    }
}

testExecution();
