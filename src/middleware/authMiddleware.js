const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            const error = new Error("Authentication required");
            error.statusCode = 401;
            throw error;
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 401;
            throw error;
        }

        if (!user.isActive) {
            const error = new Error("User account is inactive");
            error.statusCode = 403;
            throw error;
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            error.statusCode = 401;
            error.message = "Invalid token";
        } else if (error.name === "TokenExpiredError") {
            error.statusCode = 401;
            error.message = "Token expired";
        }

        next(error);
    }
};

module.exports = authMiddleware;
