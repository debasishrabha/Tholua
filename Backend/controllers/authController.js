const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db"); // your db.js
require("dotenv").config();

// Generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};


// ========== SIGNUP ==========
exports.signup = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user exists
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const newUser = await pool.query(
            "INSERT INTO users (email,password) VALUES ($1, $2) RETURNING id, email",
            [email, hashedPassword]
        );

        const token = generateToken(newUser.rows[0]);

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: newUser.rows[0],
        });
    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ========== LOGIN ==========
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const user = result.rows[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user);

        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, email: user.email, phone: user.phone },
        });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getMe = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email, phone FROM users WHERE id = $1",
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error("getMe error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ========== FORGOT PASSWORD ==========
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await pool.query(
            "UPDATE users SET resetToken = $1, resetTokenExpiry = $2 WHERE email = $3",
            [resetToken, resetTokenExpiry, email]
        );

        res.json({
            message: "Password reset token generated",
            resetToken,
        });
    } catch (error) {
        console.error("❌ Forgot Password Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ========== RESET PASSWORD ==========
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE resetToken = $1 AND resetTokenExpiry > NOW()",
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            "UPDATE users SET password = $1, resetToken = NULL, resetTokenExpiry = NULL WHERE id = $2",
            [hashedPassword, result.rows[0].id]
        );

        res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error("❌ Reset Password Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
