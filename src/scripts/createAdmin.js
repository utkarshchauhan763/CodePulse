
require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/User");

const createAdmin = async () => {
    await connectDB();

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "CodePulseAdmin";

    if (!email || !password) {
        throw new Error(
            "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running this script."
        );
    }

    let admin = await User.findOne({ email });

    if (admin) {
        // Update the existing account instead of creating a duplicate.
        admin.name = name;
        admin.role = "ADMIN";
        admin.isActive = true;
        admin.password = password;

        await admin.save();

        console.log("Existing account updated to ADMIN successfully.");
    } else {
        admin = await User.create({
            name,
            email,
            password,
            role: "ADMIN",
            isActive: true
        });

        console.log("Admin user created successfully.");
    }
};

createAdmin()
    .catch((error) => {
        console.error("Could not configure admin:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        const mongoose = require("mongoose");
        await mongoose.disconnect().catch(() => {});
    });
