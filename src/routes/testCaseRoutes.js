const express = require("express");
const {
    createTestCase,
    getTestCases
} = require("../controllers/testCaseController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/:problemId/test-cases",
    authMiddleware,
    roleMiddleware("ADMIN"),
    createTestCase
);

router.get("/:problemId/test-cases", getTestCases);

module.exports = router;
