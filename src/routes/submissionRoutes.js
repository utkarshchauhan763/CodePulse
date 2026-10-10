const express = require("express");
const {
    createSubmission,
    getMySubmissions,
    getSubmissionById
} = require("../controllers/submissionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createSubmission);
router.get("/", authMiddleware, getMySubmissions);
router.get("/:id", authMiddleware, getSubmissionById);

module.exports = router;
