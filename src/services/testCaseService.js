const mongoose = require("mongoose");
const TestCase = require("../models/TestCase");
const Problem = require("../models/Problem");

const createTestCase = async (problemId, testCaseData) => {
    if (!mongoose.isValidObjectId(problemId)) {
        const error = new Error("Invalid problem ID");
        error.statusCode = 400;
        throw error;
    }

    const problem = await Problem.findById(problemId);

    if (!problem) {
        const error = new Error("Problem not found");
        error.statusCode = 404;
        throw error;
    }

    return TestCase.create({
        problem: problemId,
        input: testCaseData.input,
        expectedOutput: testCaseData.expectedOutput,
        isHidden: testCaseData.isHidden,
        points: testCaseData.points
    });
};

const getTestCases = async (problemId, includeHidden = false) => {
    if (!mongoose.isValidObjectId(problemId)) {
        const error = new Error("Invalid problem ID");
        error.statusCode = 400;
        throw error;
    }

    const problem = await Problem.findById(problemId);

    if (!problem) {
        const error = new Error("Problem not found");
        error.statusCode = 404;
        throw error;
    }

    const query = { problem: problemId };
    if (!includeHidden) query.isHidden = false;

    return TestCase.find(query)
        .select("input expectedOutput points isHidden")
        .sort({ createdAt: 1 })
        .lean();
};

module.exports = { createTestCase, getTestCases };
