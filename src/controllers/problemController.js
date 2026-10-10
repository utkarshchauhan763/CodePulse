const problemService = require("../services/problemService");

const createProblem = async (req, res, next) => {
    try {
        const problem = await problemService.createProblem(req.body);
        res.status(201).json({
            success: true,
            message: "Problem created successfully",
            data: problem
        });
    } catch (error) {
        next(error);
    }
};

const getProblems = async (req, res, next) => {
    try {
        const problems = await problemService.getProblems(req.query);
        res.status(200).json({
            success: true,
            data: problems
        });
    } catch (error) {
        next(error);
    }
};

const getProblemById = async (req, res, next) => {
    try {
        const result = await problemService.getProblemById(req.params.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createProblem, getProblems, getProblemById };
