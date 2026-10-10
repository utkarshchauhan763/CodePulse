const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        problem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem",
            required: true
        },
        language: {
            type: String,
            enum: ["javascript", "python", "java"],
            required: true
        },
        sourceCode: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: [
                "QUEUED",
                "COMPILING",
                "RUNNING",
                "TESTING",
                "ACCEPTED",
                "WRONG_ANSWER",
                "TIME_LIMIT_EXCEEDED",
                "MEMORY_LIMIT_EXCEEDED",
                "COMPILE_ERROR",
                "RUNTIME_ERROR",
                "FAILED"
            ],
            default: "QUEUED"
        },
        score: { type: Number, default: 0 },
        passedTestCases: { type: Number, default: 0 },
        totalTestCases: { type: Number, default: 0 },
        executionTime: { type: Number, default: null },
        memoryUsed: { type: Number, default: null },
        errorMessage: { type: String, default: null },
        attempts: { type: Number, default: 0 }
    },
    { timestamps: true }
);

submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ problem: 1, createdAt: -1 });
submissionSchema.index({ status: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
