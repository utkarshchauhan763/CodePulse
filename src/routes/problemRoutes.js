const express = require("express");
const {
    createProblem,
    getProblems,
    getProblemById
} = require("../controllers/problemController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("ADMIN"), createProblem);
router.get("/", getProblems);
router.get("/:id", getProblemById);

module.exports = router;
