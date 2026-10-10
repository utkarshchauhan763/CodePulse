const mongoose = require("mongoose");
const Problem = require("../models/Problem");
const TestCase = require("../models/TestCase");

const createProblem = async (problemData) => {
    const existingProblem = await Problem.findOne({ slug: problemData.slug });

    if (existingProblem) {
        const error = new Error("A problem with this slug already exists");
        error.statusCode = 409;
        throw error;
    }

    return Problem.create(problemData);
};

const getProblems = async (filters = {}) => {
    const query = { isActive: true };

    if (filters.difficulty) {
        const difficulty = String(filters.difficulty).toUpperCase();
        if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
            const error = new Error("Invalid difficulty filter");
            error.statusCode = 400;
            throw error;
        }
        query.difficulty = difficulty;
    }

    return Problem.find(query)
        .select("-description -inputFormat -outputFormat -constraints")
        .sort({ createdAt: -1 })
        .lean();
};

const getProblemById = async (problemId) => {
    if (!mongoose.isValidObjectId(problemId)) {
        const error = new Error("Invalid problem ID");
        error.statusCode = 400;
        throw error;
    }

    const problem = await Problem.findOne({
        _id: problemId,
        isActive: true
    });

    if (!problem) {
        const error = new Error("Problem not found");
        error.statusCode = 404;
        throw error;
    }

    const testCases = await TestCase.find({
        problem: problemId,
        isHidden: false
    }).select("input expectedOutput points").lean();

    return { problem, testCases };
};

module.exports = { createProblem, getProblems, getProblemById };
