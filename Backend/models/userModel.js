// models/userModel.js
const pool = require("../config/db");

const User = {
    async create(email, phone, password) {
        const result = await pool.query(
            `INSERT INTO users (name, email, password) 
       VALUES ($1, $2, $3) RETURNING *`,
            [email, phone, password]
        );
        return result.rows[0];
    },

    async findByEmail(email) {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        return result.rows[0];
    }
};

module.exports = User;
