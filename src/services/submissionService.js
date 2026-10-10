const mongoose = require("mongoose");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");

const createSubmission = async (userId, submissionData) => {
    const { problemId, language, sourceCode } = submissionData;

    if (!mongoose.isValidObjectId(problemId)) {
        const error = new Error("A valid problemId is required");
        error.statusCode = 400;
        throw error;
    }

    if (typeof sourceCode !== "string" || !sourceCode.trim()) {
        const error = new Error("sourceCode is required");
        error.statusCode = 400;
        throw error;
    }

    if (sourceCode.length > 100000) {
        const error = new Error("sourceCode exceeds the 100000-character limit");
        error.statusCode = 413;
        throw error;
    }

    const problem = await Problem.findOne({
        _id: problemId,
        isActive: true
    });

    if (!problem) {
        const error = new Error("Problem not found or inactive");
        error.statusCode = 404;
        throw error;
    }

    if (!problem.supportedLanguages.includes(language)) {
        const error = new Error("This language is not supported for this problem");
        error.statusCode = 400;
        throw error;
    }

    return Submission.create({
        user: userId,
        problem: problemId,
        language,
        sourceCode,
        status: "QUEUED"
    });
};

const getMySubmissions = async (userId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
        Submission.find({ user: userId })
            .select("-sourceCode")
            .populate("problem", "title slug difficulty")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        Submission.countDocuments({ user: userId })
    ]);

    return {
        submissions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getSubmissionById = async (submissionId, userId) => {
    if (!mongoose.isValidObjectId(submissionId)) {
        const error = new Error("Invalid submission ID");
        error.statusCode = 400;
        throw error;
    }

    const submission = await Submission.findOne({
        _id: submissionId,
        user: userId
    })
        .select("-sourceCode")
        .populate("problem", "title slug difficulty")
        .lean();

    if (!submission) {
        const error = new Error("Submission not found");
        error.statusCode = 404;
        throw error;
    }

    return submission;
};

module.exports = {
    createSubmission,
    getMySubmissions,
    getSubmissionById
};
