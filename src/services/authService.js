const User = require("../models/User");
const jwt = require("jsonwebtoken");

const isValidEmail = (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

const registerUser = async (userData) => {
    const name = userData.name?.trim();
    const email = userData.email?.trim().toLowerCase();
    const password = userData.password;

    if (!name || !isValidEmail(email) || typeof password !== "string" || password.length < 6) {
        const error = new Error("Name, valid email, and password (at least 6 characters) are required");
        error.statusCode = 400;
        throw error;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const error = new Error("User with this email already exists");
        error.statusCode = 409;
        throw error;
    }

    const user = await User.create({ name, email, password });

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };
};

const loginUser = async (email, password) => {
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || typeof password !== "string") {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error("User account is inactive");
        error.statusCode = 403;
        throw error;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        token: generateToken(user)
    };
};

module.exports = { registerUser, loginUser };

