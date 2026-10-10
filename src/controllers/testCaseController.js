const testCaseService = require("../services/testCaseService");

const createTestCase = async (req, res, next) => {
    try {
        const testCase = await testCaseService.createTestCase(
            req.params.problemId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Test case created successfully",
            data: testCase
        });
    } catch (error) {
        next(error);
    }
};

const getTestCases = async (req, res, next) => {
    try {
        // Public endpoint deliberately never includes hidden test cases.
        const testCases = await testCaseService.getTestCases(req.params.problemId);

        res.status(200).json({
            success: true,
            data: testCases
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTestCase, getTestCases };
