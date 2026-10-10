const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        description: { type: String, required: true, trim: true },
        difficulty: {
            type: String,
            enum: ["EASY", "MEDIUM", "HARD"],
            required: true
        },
        inputFormat: { type: String, required: true },
        outputFormat: { type: String, required: true },
        constraints: { type: String, required: true },
        timeLimit: { type: Number, required: true, default: 2000 },
        memoryLimit: { type: Number, required: true, default: 128 },
        supportedLanguages: [{
            type: String,
            enum: ["javascript", "python", "java"]
        }],
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

problemSchema.index({ difficulty: 1 });
problemSchema.index({ isActive: 1 });

module.exports = mongoose.model("Problem", problemSchema);
