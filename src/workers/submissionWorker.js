
require("dotenv").config();

const { Worker } = require("bullmq");

const redisConnection = require("../config/redis");
const connectDB = require("../config/db");

const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const TestCase = require("../models/TestCase");

const {
    executeJavaScript
} = require("../services/codeExecutionService");

function normalizeOutput(output) {
    return output
        .replace(/\r\n/g, "\n")
        .trim();
}

async function processSubmission(submissionId) {
    const submission = await Submission.findById(submissionId);

    if (!submission) {
        throw new Error(`Submission not found: ${submissionId}`);
    }

    if (submission.status !== "QUEUED") {
        console.log(
            `Skipping submission ${submissionId}; status: ${submission.status}`
        );

        return {
            success: true,
            skipped: true,
            status: submission.status
        };
    }

    try {
        submission.status = "RUNNING";
        submission.errorMessage = null;
        submission.score = 0;
        submission.passedTestCases = 0;
        submission.totalTestCases = 0;
        submission.executionTime = null;

        await submission.save();

        if (submission.language !== "javascript") {
            submission.status = "FAILED";
            submission.errorMessage =
                `Language not supported yet: ${submission.language}`;

            await submission.save();

            return {
                success: false,
                submissionId,
                status: submission.status
            };
        }

        const problem = await Problem.findById(submission.problem);

        if (!problem) {
            throw new Error("Problem not found");
        }

        const testCases = await TestCase.find({
            problem: submission.problem
        }).sort({ _id: 1 });

        if (testCases.length === 0) {
            submission.status = "FAILED";
            submission.errorMessage =
                "No test cases are configured for this problem";

            await submission.save();

            return {
                success: false,
                submissionId,
                status: submission.status
            };
        }

        submission.totalTestCases = testCases.length;
        submission.status = "TESTING";

        await submission.save();

        let passedTestCases = 0;
        let totalExecutionTime = 0;
        let finalStatus = "ACCEPTED";
        let errorMessage = null;

        for (const testCase of testCases) {
            let result;

            try {
                result = await executeJavaScript(
                    submission.sourceCode,
                    testCase.input,
                    problem.timeLimit
                );
            } catch (error) {
                const message = error.message || "Execution failed";

                if (/timed out|timeout/i.test(message)) {
                    finalStatus = "TIME_LIMIT_EXCEEDED";
                } else {
                    finalStatus = "RUNTIME_ERROR";
                }

                errorMessage = message;
                break;
            }

            totalExecutionTime += result.executionTime;

            const actualOutput = normalizeOutput(result.stdout);
            const expectedOutput = normalizeOutput(
                testCase.expectedOutput
            );

            if (actualOutput !== expectedOutput) {
                finalStatus = "WRONG_ANSWER";
                break;
            }

            passedTestCases++;
        }

        submission.passedTestCases = passedTestCases;
        submission.executionTime = totalExecutionTime;

        const totalPoints = testCases.reduce(
            (sum, testCase) => sum + testCase.points,
            0
        );

        const earnedPoints = testCases
            .slice(0, passedTestCases)
            .reduce((sum, testCase) => sum + testCase.points, 0);

        submission.score =
            totalPoints > 0
                ? Math.round((earnedPoints / totalPoints) * 100)
                : 0;

        submission.status = finalStatus;
        submission.errorMessage = errorMessage;

        await submission.save();

        console.log(
            `Submission ${submissionId}: ${submission.status}, ` +
            `${passedTestCases}/${testCases.length} test cases passed`
        );

        return {
            success: true,
            submissionId,
            status: submission.status,
            passedTestCases,
            totalTestCases: testCases.length,
            score: submission.score,
            executionTime: totalExecutionTime
        };
    } catch (error) {
        submission.status = "FAILED";
        submission.errorMessage = error.message;

        await submission.save();

        throw error;
    }
}

async function startWorker() {
    await connectDB();

    const submissionWorker = new Worker(
        "code-submission",
        async (job) => {
            const { submissionId } = job.data;

            console.log("Processing job:", job.name);
            console.log("Submission ID:", submissionId);

            return processSubmission(submissionId);
        },
        {
            connection: redisConnection,
            concurrency: 2
        }
    );

    submissionWorker.on("completed", (job, result) => {
        console.log(`Job ${job.id} completed:`, result);
    });

    submissionWorker.on("failed", (job, error) => {
        console.error(`Job ${job?.id} failed:`, error.message);
    });

    submissionWorker.on("error", (error) => {
        console.error("Worker error:", error.message);
    });

    console.log("CodePulse submission worker is running");
}

startWorker().catch((error) => {
    console.error("Failed to start submission worker:", error.message);
    process.exitCode = 1;
});
