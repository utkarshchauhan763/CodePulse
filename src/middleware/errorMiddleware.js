const errorMiddleware = (err, req, res, next) => {
    console.error(err);

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Server error"
        : (err.message || "Server error");

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorMiddleware;
