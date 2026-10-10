const submissionService = require("../services/submissionService");
const submissionQueue = require("../queues/submissionQueue");
const createSubmission = async (req, res, next) => {
    try {
        const submission = await submissionService.createSubmission(
            req.user._id,
            req.body
        );

         await submissionQueue.add(
            "process-submission",
            {
                submissionId: submission._id.toString(),
                userId: req.user._id.toString(),
                problemId: submission.problem.toString()
            },
            {
                jobId: submission._id.toString()
            }
        );

        res.status(202).json({
            success: true,
            message: "Submission queued for processing",
            data: {
                id: submission._id,
                problem: submission.problem,
                language: submission.language,
                status: submission.status,
                score: submission.score,
                createdAt: submission.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

const getMySubmissions = async (req, res, next) => {
    try {
        const parsedPage = Number.parseInt(req.query.page, 10);
        const parsedLimit = Number.parseInt(req.query.limit, 10);

        const page = Number.isFinite(parsedPage) && parsedPage > 0
            ? parsedPage
            : 1;
        const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
            ? Math.min(parsedLimit, 50)
            : 10;

        const result = await submissionService.getMySubmissions(
            req.user._id,
            page,
            limit
        );

        res.status(200).json({
            success: true,
            data: result.submissions,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const getSubmissionById = async (req, res, next) => {
    try {
        const submission = await submissionService.getSubmissionById(
            req.params.id,
            req.user._id
        );

        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSubmission,
    getMySubmissions,
    getSubmissionById
};
