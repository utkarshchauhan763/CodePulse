require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const problemRoutes = require("./routes/problemRoutes");
const testCaseRoutes = require("./routes/testCaseRoutes");
const authRoutes = require("./routes/authRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CodePulse API is healthy"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/problems", testCaseRoutes);
app.use("/api/submissions", submissionRoutes);

// Keep 404 and error middleware after all routes.
app.use(notFoundMiddleware);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        const server = app.listen(PORT, () => {
            console.log(`CodePulse API running on port ${PORT}`);
        });

        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use. Please stop the existing process or set a different PORT value.`);
                process.exitCode = 1;
                return;
            }

            console.error("Server startup failed:", error.message);
            process.exitCode = 1;
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exitCode = 1;
    }
};

if (require.main === module) {
    startServer();
}

module.exports = app;
module.exports.startServer = startServer;
